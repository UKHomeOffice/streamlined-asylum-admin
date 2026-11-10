'use strict';

jest.mock(
  '../../../../apps/saa/behaviours/check-email-token',
  () => superclass => superclass
);

const app = require('../../../../apps/saa');
const Controller = require('hof/controller/controller');
const Session = require('hof/controller/behaviour-session');
const Model = require('hof/model');
const checkProgress = require('hof/wizard/middleware/check-progress');
const fields = require('../../../../apps/saa/fields');
const followUps = require('../../../../apps/saa/behaviours/multi-select-follow-ups');
const config = require('../../../../apps/saa/config/multi-select-follow-ups-config');
const pages = require('../../../../apps/saa/translations/src/en/pages.json');
const fieldTranslations = require('../../../../apps/saa/translations/src/en/fields.json');
const nameSummary =
  require('../../../../apps/saa/sections/summary-data-sections').name.steps;
const Summary = require('hof').components.summary(class {});

const sections = followUps.getActiveSections(
  config,
  config.options.map(option => option.value)
);
const noChangesSections = sections.filter(section => section.noChanges);

const buildRequest = (selections, edit = false, values = {}) => ({
  baseUrl: app.baseUrl,
  params: edit ? { action: 'edit' } : {},
  body: {},
  form: { values: {} },
  translate: key =>
    key
      .split('.')
      .reduce((value, part) => value?.[part], {
        pages,
        fields: fieldTranslations
      }) || key,
  sessionModel: new Model({
    [config.field]: selections,
    [config.stateKey]: followUps.createState(config, {}, selections),
    'change-personal-details': 'yes',
    ...values
  })
});

const buildController = (route, req) => {
  const step = app.steps[route];
  const options = {
    ...step,
    route,
    fields: Object.fromEntries(
      (step.fields || []).map(field => [field, fields[field]])
    )
  };
  req.form.options = { ...options };
  const Composed = (step.behaviours || []).reduce(
    (Base, behaviour) => behaviour(Base),
    Session(Controller)
  );
  return new Composed(options);
};

const post = (route, req, values = {}, complete = false) => {
  req.form.values = values;
  const controller = buildController(route, req);
  const res = { locals: {}, redirect: jest.fn() };
  const next = jest.fn();
  if (complete) {
    req.method = 'POST';
    req.path = `${route}${req.params.action === 'edit' ? '/edit' : ''}`;
    checkProgress(route, controller, app.steps)(req, res, err => {
      expect(err).toBeUndefined();
    });
  }
  controller.saveValues(req, res, next);
  expect(next).toHaveBeenCalledWith();
  expect(res.redirect).not.toHaveBeenCalled();
  if (complete) {
    controller.successHandler(req, res);
    return { controller, res, url: res.redirect.mock.calls[0][0] };
  }
  return { controller, res, url: controller.getNextStep(req, res) };
};

const answerNo = section =>
  Object.fromEntries(
    section.noChanges.when.map(condition => [condition.field, condition.value])
  );

const completeSelectedSections = req => {
  const state = req.sessionModel.get(config.stateKey);
  req.sessionModel.set(config.stateKey, {
    ...state,
    completedSections: state.activeSections.slice()
  });
};

describe.each([false, true])('contact-detail routing (edit=%s)', edit => {
  const suffix = edit ? '/edit' : '';

  test.each(noChangesSections)(
    '$id asks before removing an unchanged section and cancel restarts it',
    section => {
      const req = buildRequest([section.value, 'phone-number'], edit);
      const { url } = post(section.noChanges.route, req, answerNo(section));

      expect(url).toBe(`${app.baseUrl}/no-changes-made${suffix}`);
      expect(req.sessionModel.get(config.stateKey).completedSections).toEqual(
        []
      );
      expect(req.sessionModel.get(config.field)).toContain(section.value);

      const controller = buildController('/no-changes-made', req);
      const locals = controller.locals(req, { locals: {} });
      expect(locals.noChangesHeader).toBe(
        pages['no-changes-made'].headers[section.id]
      );
      expect(locals.title).toBe(locals.noChangesHeader);
      expect(locals.backLink).toBe(
        `${app.baseUrl}${section.noChanges.route}${suffix}`
      );

      const cancelled = post('/no-changes-made', req, {
        'no-changes-made': 'no'
      });
      expect(cancelled.url).toBe(`${app.baseUrl}${section.start}${suffix}`);
      expect(req.sessionModel.get(config.field)).toContain(section.value);
      expect(req.sessionModel.get('no-changes-made')).toBeUndefined();

      post(section.start, req, { [section.noChanges.when[0].field]: 'yes' });
      expect(
        req.sessionModel.get(config.stateKey).noChangesSection
      ).toBeUndefined();
    }
  );

  test.each(noChangesSections)(
    '$id continue unticks the option, clears its data and advances',
    section => {
      const req = buildRequest([section.value, 'phone-number'], edit, {
        ...Object.fromEntries(
          section.fieldsToUnset.map(field => [field, 'stale'])
        ),
        someoneelsenewdob: { aggregatedValues: [] },
        'new-phone-number': '07700900001',
        steps: [section.start, section.noChanges.route, '/your-phone-number']
      });
      post(section.noChanges.route, req, answerNo(section));
      const continued = post('/no-changes-made', req, {
        'no-changes-made': 'yes'
      });

      const nextRoute = '/your-phone-number';
      expect(continued.url).toBe(`${app.baseUrl}${nextRoute}${suffix}`);
      expect(req.sessionModel.get(config.field)).toEqual(['phone-number']);
      section.fieldsToUnset.forEach(field => {
        expect(req.sessionModel.get(field)).toBeUndefined();
      });
      expect(req.sessionModel.get('new-phone-number')).toBe('07700900001');
      expect(req.sessionModel.get('change-personal-details')).toBe('yes');
      expect(req.sessionModel.get('steps')).toEqual(['/your-phone-number']);
      expect(req.sessionModel.get(config.stateKey)).toMatchObject({
        activeSections: ['phone-number', 'photo-identity'],
        completedSections: []
      });
      const next = buildController(nextRoute, req);
      expect(next.locals(req, { locals: {} }).backLink).toBe(
        `${app.baseUrl}${config.entryPoint}${suffix}`
      );
    }
  );

  test.each(noChangesSections)(
    '$id removal of the last selection revisits something-else in edit mode',
    section => {
      const req = buildRequest([section.value], edit, {
        'edit-return-path': `${app.baseUrl}/confirm`,
        'add-remove-dependant': 'no',
        'send-evidence-for-your-claim': 'no',
        'report-a-death': 'no',
        'something-else': 'no'
      });
      post(section.noChanges.route, req, answerNo(section));
      const { url } = post('/no-changes-made', req, {
        'no-changes-made': 'yes'
      });

      expect(url).toBe(
        `${app.baseUrl}${edit ? '/something-else' : config.exitPoint}`
      );
      expect(req.sessionModel.get('change-personal-details')).toBe('no');
      expect(req.sessionModel.get(config.field)).toBeUndefined();
      expect(req.sessionModel.get(config.stateKey).activeSections).toEqual([]);
    }
  );

  test.each(noChangesSections.filter(section => section.id !== 'address'))(
    '$id completes only after the someone-else question when own answer is yes',
    section => {
      const req = buildRequest([section.value, 'phone-number'], edit, {
        [section.noChanges.when[0].field]: 'yes'
      });
      const { url } = post(section.noChanges.route, req, {
        [section.noChanges.when[1].field]: 'no'
      });
      expect(url).toBe(`${app.baseUrl}/your-phone-number${suffix}`);
      expect(req.sessionModel.get(config.stateKey).completedSections).toEqual([
        section.id
      ]);
    }
  );

  test.each(noChangesSections.filter(section => section.id !== 'address'))(
    '$id someone-else CYA completes the section',
    section => {
      const req = buildRequest([section.value, 'phone-number'], edit, {
        'edit-return-path': `${app.baseUrl}/confirm`
      });
      const { url } = post(section.completeOn[1], req);
      expect(url).toBe(`${app.baseUrl}/your-phone-number${suffix}`);
      expect(req.sessionModel.get(config.stateKey).completedSections).toEqual([
        section.id
      ]);
    }
  );

  test.each([
    [
      '/nationality-change',
      { 'change-your-nationality': 'yes' },
      '/correct-nationality'
    ],
    [
      '/nationality-change',
      { 'change-your-nationality': 'no' },
      '/change-someone-else-nationality'
    ],
    ['/correct-nationality', {}, '/reason-nationality-change'],
    ['/reason-nationality-change', {}, '/upload-nationality-evidence'],
    ['/upload-nationality-evidence', {}, '/check-your-answers-nationality'],
    ['/check-your-answers-nationality', {}, '/change-someone-else-nationality'],
    [
      '/change-someone-else-nationality',
      { 'change-someone-else-nationality': 'yes' },
      '/relationship-nationality-change'
    ],
    [
      '/relationship-nationality-change',
      {},
      '/someone-else-correct-nationality'
    ],
    [
      '/someone-else-correct-nationality',
      {},
      '/reason-someone-else-nationality-change'
    ],
    [
      '/reason-someone-else-nationality-change',
      {},
      '/upload-someone-else-nationality-evidence'
    ],
    [
      '/upload-someone-else-nationality-evidence',
      {},
      '/check-your-answers-someone-else-nationality'
    ],
    ['/change-uk-address', { 'change-uk-address': 'yes' }, '/home-address'],
    [
      '/change-uk-address',
      { 'change-uk-address': 'no' },
      '/change-contact-address'
    ],
    [
      '/home-address',
      { 'send-letters-to-home-address': 'yes' },
      '/check-your-answers-address'
    ],
    [
      '/home-address',
      { 'send-letters-to-home-address': 'no' },
      '/change-contact-address'
    ],
    [
      '/change-contact-address',
      { 'change-contact-address': 'yes' },
      '/reason-contact-address-change'
    ],
    ['/reason-contact-address-change', {}, '/contact-address'],
    ['/contact-address', {}, '/check-your-answers-address'],
    [
      '/check-your-answers-date-of-birth',
      {},
      '/change-someone-else-date-of-birth'
    ]
  ])(
    '%s keeps internal navigation inside the section',
    (route, values, target) => {
      const req = buildRequest(
        ['date-of-birth', 'nationality', 'address'],
        edit,
        {
          'edit-return-path': `${app.baseUrl}/confirm`,
          steps: [target]
        }
      );
      const { url } = post(route, req, values);
      expect(url).toBe(`${app.baseUrl}${target}${suffix}`);
      expect(req.sessionModel.get(config.stateKey).completedSections).toEqual(
        []
      );
    }
  );

  test('changing the UK address then declining a contact address still needs address CYA', () => {
    const req = buildRequest(['address'], edit, { 'change-uk-address': 'yes' });
    expect(
      post('/change-contact-address', req, { 'change-contact-address': 'no' })
        .url
    ).toBe(`${app.baseUrl}/check-your-answers-address${suffix}`);
    expect(req.sessionModel.get(config.stateKey).completedSections).toEqual([]);
    expect(post('/check-your-answers-address', req).url).toBe(
      `${app.baseUrl}/provide-photo-identity${suffix}`
    );
    expect(req.sessionModel.get(config.stateKey).completedSections).toEqual([
      'address'
    ]);
  });

  test('email and phone CYA defer EditRouteReturn until the shared identity section completes', () => {
    const req = buildRequest(['email-address', 'phone-number'], edit, {
      'edit-return-path': `${app.baseUrl}/confirm`
    });
    expect(post('/check-your-answers-email', req).url).toBe(
      `${app.baseUrl}/your-phone-number${suffix}`
    );
    expect(post('/check-your-answers-phone-number', req).url).toBe(
      `${app.baseUrl}/provide-photo-identity${suffix}`
    );
    expect(post('/provide-photo-identity', req).url).toBe(
      `${app.baseUrl}${edit ? '/confirm' : config.exitPoint}`
    );
    expect(req.sessionModel.get(config.stateKey).completedSections).toEqual([
      'email-address',
      'phone-number',
      'photo-identity'
    ]);
  });

  test.each([[['name']], [['name', 'phone-number']]])(
    'resuming a saved no-changes confirmation continues safely with selections %p',
    selections => {
      const section = noChangesSections[0];
      const req = buildRequest(selections, edit);
      post(section.noChanges.route, req, answerNo(section));
      const { url } = post('/no-changes-made', req, {
        'no-changes-made': 'yes'
      });

      req.form.values = {};
      const controller = buildController('/no-changes-made', req);
      const res = { redirect: jest.fn() };
      controller.configure(req, res, jest.fn());
      expect(res.redirect).toHaveBeenCalledWith(url);
    }
  );
});

describe.each([false, true])('own-name decision routing (edit=%s)', edit => {
  const route = '/do-you-need-to-change-your-name';
  const someoneElseRoute = '/do-you-need-to-change-someone-elses-name';
  const suffix = edit ? '/edit' : '';

  test.each(['yes', 'no', undefined])(
    'changing Yes to No with someone else answered %p preserves the correct path',
    someoneElse => {
      const req = buildRequest(['name'], edit, {
        steps: [
          config.entryPoint,
          ...sections.find(section => section.id === 'name').routes
        ],
        'edit-return-path': `${app.baseUrl}/confirm`,
        'do-you-need-to-change-your-name': 'yes',
        'change-someone-elses-name': someoneElse,
        'reason-name-change': 'spelling-error',
        'given-name': 'Old',
        'family-name': 'Name',
        'someone-else-new-given-name': 'Kept',
        'someone-else-new-family-name': 'Name',
        'documents-someone-else-new-name': [{ id: 'existing-upload' }]
      });
      const state = req.sessionModel.get(config.stateKey);
      state.completedSections = ['name'];
      req.sessionModel.set(config.stateKey, state);

      const { url } = post(
        route,
        req,
        { 'do-you-need-to-change-your-name': 'no' },
        true
      );
      let expected = `${someoneElseRoute}${suffix}`;
      if (edit && someoneElse === 'yes') {
        expected = '/confirm';
      } else if (edit && someoneElse === 'no') {
        expected = `/no-changes-made${suffix}`;
      }
      expect(url).toBe(`${app.baseUrl}${expected}`);
      expect(req.sessionModel.get('do-you-need-to-change-your-name')).toBe(
        'no'
      );
      expect(req.sessionModel.get('change-someone-elses-name')).toBe(
        someoneElse
      );
      ['reason-name-change', 'given-name', 'family-name'].forEach(field => {
        expect(req.sessionModel.get(field)).toBeUndefined();
      });
      expect(req.sessionModel.get('someone-else-new-given-name')).toBe('Kept');
      expect(req.sessionModel.get('documents-someone-else-new-name')).toEqual([
        { id: 'existing-upload' }
      ]);
      expect(req.sessionModel.get(config.stateKey).completedSections).toEqual(
        edit && someoneElse === 'yes' ? ['name'] : []
      );

      const rows = new Summary().getFieldsForRow(
        nameSummary.map(row => ({ ...row, useOriginalValue: true })),
        {
          ...req,
          translate: keys => [].concat(keys)[0],
          form: { options: { fieldsConfig: fields, steps: app.steps } }
        }
      );
      expect(rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'do-you-need-to-change-your-name',
            value: 'no'
          })
        ])
      );
      expect(rows.some(row => row.field === 'given-name')).toBe(false);
      expect(
        rows.some(row => row.field === 'someone-else-new-given-name')
      ).toBe(someoneElse === 'yes');

      if (edit && someoneElse === 'no') {
        expect(req.sessionModel.get(config.stateKey)).toMatchObject({
          noChangesSection: 'name',
          noChangesFrom: route
        });
        const page = buildController('/no-changes-made', req);
        expect(page.locals(req, { locals: {} }).backLink).toBe(
          `${app.baseUrl}${route}/edit`
        );
        expect(
          post('/no-changes-made', req, { 'no-changes-made': 'no' }).url
        ).toBe(`${app.baseUrl}${route}/edit`);
      }
    }
  );

  test('changing No to Yes continues to the reason even when that page was previously completed', () => {
    const req = buildRequest(['name'], edit, {
      steps: [config.entryPoint, route, '/reason-name-change'],
      'do-you-need-to-change-your-name': 'no',
      'change-someone-elses-name': 'no'
    });
    expect(
      post(route, req, { 'do-you-need-to-change-your-name': 'yes' }, true).url
    ).toBe(`${app.baseUrl}/reason-name-change${suffix}`);
  });
});

describe('contact-detail edit completion', () => {
  test.each([
    [['name'], '/something-else'],
    [['name', 'phone-number'], '/confirm']
  ])(
    'confirming no changes from the own-name edit handles remaining selections %p',
    (selections, target) => {
      const req = buildRequest(selections, true, {
        steps: [
          config.entryPoint,
          ...sections.flatMap(section => section.routes)
        ],
        'edit-return-path': `${app.baseUrl}/confirm`,
        'do-you-need-to-change-your-name': 'yes',
        'change-someone-elses-name': 'no',
        'something-else': 'no'
      });
      completeSelectedSections(req);
      expect(
        post(
          '/do-you-need-to-change-your-name',
          req,
          {
            'do-you-need-to-change-your-name': 'no'
          },
          true
        ).url
      ).toBe(`${app.baseUrl}/no-changes-made/edit`);
      expect(
        post('/no-changes-made', req, { 'no-changes-made': 'yes' }).url
      ).toBe(`${app.baseUrl}${target}`);
      expect(req.sessionModel.get(config.field)).toEqual(
        selections.length > 1 ? ['phone-number'] : undefined
      );
    }
  );

  test.each([
    ['name', '/check-your-answers-someone-else-name'],
    ['date-of-birth', '/check-your-answers-someone-else-date-of-birth'],
    ['nationality', '/check-your-answers-someone-else-nationality'],
    ['address', '/check-your-answers-address'],
    ['email-address', '/check-your-answers-email'],
    ['phone-number', '/check-your-answers-phone-number']
  ])(
    '%s returns to confirm without repeating previously completed sections',
    (selection, route) => {
      const selections = [...new Set([selection, 'phone-number'])];
      const req = buildRequest(selections, true, {
        steps: sections.flatMap(section => section.routes),
        'edit-return-path': `${app.baseUrl}/confirm`
      });
      completeSelectedSections(req);
      expect(post(route, req).url).toBe(`${app.baseUrl}/confirm`);
      expect(req.sessionModel.get(config.field)).toEqual(selections);
    }
  );

  test('checkbox edits still complete newly selected sections and their identity dependency', () => {
    const req = buildRequest(['name'], true, {
      steps: sections.find(section => section.id === 'name').routes,
      'edit-return-path': `${app.baseUrl}/confirm`
    });
    const state = req.sessionModel.get(config.stateKey);
    state.completedSections = ['name'];
    req.sessionModel.set(config.stateKey, state);

    expect(
      post(config.entryPoint, req, {
        [config.field]: ['name', 'email-address', 'phone-number']
      }).url
    ).toBe(`${app.baseUrl}/new-email-address/edit`);
    expect(post('/check-your-answers-email', req).url).toBe(
      `${app.baseUrl}/your-phone-number/edit`
    );
    expect(post('/check-your-answers-phone-number', req).url).toBe(
      `${app.baseUrl}/provide-photo-identity/edit`
    );
    expect(post('/provide-photo-identity', req).url).toBe(
      `${app.baseUrl}/confirm`
    );
  });

  test.each([false, true])(
    'returning to Email CYA after starting Phone does not skip the unfinished update (edit=%s)',
    edit => {
      const suffix = edit ? '/edit' : '';
      const req = buildRequest(['name'], edit, {
        steps: ['/personal-details', config.entryPoint, ...sections.find(section => section.id === 'name').routes],
        'edit-return-path': `${app.baseUrl}/confirm`
      });
      completeSelectedSections(req);
      expect(post(config.entryPoint, req, {
        [config.field]: ['name', 'email-address', 'phone-number']
      }, true).url).toBe(`${app.baseUrl}/new-email-address${suffix}`);
      post('/new-email-address', req, {
        'new-email-address': 'updated@example.com',
        'confirm-new-email-address': 'updated@example.com'
      }, true);
      expect(post('/check-your-answers-email', req, {}, true).url)
        .toBe(`${app.baseUrl}/your-phone-number${suffix}`);
      expect(post('/your-phone-number', req, {
        'your-phone-number': 'yes',
        'whose-phone-number': 'mine'
      }, true).url).toBe(`${app.baseUrl}/new-phone-number${suffix}`);
      expect(req.sessionModel.get('steps')).toContain('/your-phone-number');
      expect(req.sessionModel.get(config.stateKey).completedSections).not.toContain('phone-number');

      expect(post('/check-your-answers-email', req, {}, true).url)
        .toBe(`${app.baseUrl}/your-phone-number${suffix}`);
      expect(req.sessionModel.get('new-phone-number')).toBeUndefined();
      expect(req.sessionModel.get(config.stateKey).completedSections).not.toContain('phone-number');

      post('/new-phone-number', req, {
        'new-phone-number': '07700900001',
        'confirm-new-phone-number': '07700900001'
      }, true);
      expect(post('/check-your-answers-phone-number', req, {}, true).url)
        .toBe(`${app.baseUrl}/provide-photo-identity${suffix}`);
      expect(req.sessionModel.get(config.stateKey).completedSections).toContain('phone-number');
      expect(post('/provide-photo-identity', req, {}, true).url)
        .toBe(`${app.baseUrl}${edit ? '/confirm' : config.exitPoint}`);
    }
  );

  test('confirming no Name changes returns to confirm when the remaining sections were completed', () => {
    const req = buildRequest(['name', 'phone-number'], true, {
      steps: sections.flatMap(section => section.routes),
      'edit-return-path': `${app.baseUrl}/confirm`
    });
    completeSelectedSections(req);
    const name = noChangesSections.find(section => section.id === 'name');
    expect(post(name.noChanges.route, req, answerNo(name)).url).toBe(
      `${app.baseUrl}/no-changes-made/edit`
    );
    expect(
      post('/no-changes-made', req, { 'no-changes-made': 'yes' }).url
    ).toBe(`${app.baseUrl}/confirm`);
    expect(req.sessionModel.get(config.field)).toEqual(['phone-number']);
  });
});

describe('contact-detail selection cleanup', () => {
  test.each([
    ['yes', 'no', '/no-options'],
    ['no', 'yes', '/contact-us-by-email']
  ])(
    'last removal revisits the previous something-else answer %s before submitting %s',
    (previousAnswer, answer, target) => {
      const req = buildRequest(['name'], true, {
        'edit-return-path': `${app.baseUrl}/confirm`,
        'something-else': previousAnswer
      });
      const section = noChangesSections[0];
      post(section.noChanges.route, req, answerNo(section));
      expect(
        post('/no-changes-made', req, { 'no-changes-made': 'yes' }).url
      ).toBe(`${app.baseUrl}/something-else`);

      req.params = {};
      expect(
        post('/something-else', req, { 'something-else': answer }).url
      ).toBe(`${app.baseUrl}${target}`);
      expect(app.steps[target].backLink).toBe('something-else');
    }
  );

  test('something-else No still returns to confirm when another main section remains selected', () => {
    const req = buildRequest([], false, {
      'change-personal-details': 'no',
      'add-remove-dependant': 'yes'
    });
    expect(post('/something-else', req, { 'something-else': 'no' }).url).toBe(
      `${app.baseUrl}/confirm`
    );
  });

  test.each([
    ['no', 'no', '/something-else'],
    ['no', 'yes', '/something-else'],
    ['yes', 'no', '/confirm']
  ])(
    'last removal respects other top-level selections %s and something-else %s',
    (dependants, somethingElse, target) => {
      const section = noChangesSections[0];
      const req = buildRequest(['name'], true, {
        'add-remove-dependant': dependants,
        'something-else': somethingElse
      });
      post(section.noChanges.route, req, answerNo(section));
      expect(
        post('/no-changes-made', req, { 'no-changes-made': 'yes' }).url
      ).toBe(`${app.baseUrl}${target}`);
    }
  );

  test('deselection preserves shared identity data until its last owner is removed', () => {
    const req = buildRequest(['address', 'email-address'], true, {
      'documents-update-contact': [{ id: 'identity' }]
    });
    const state = req.sessionModel.get(config.stateKey);
    state.completedSections = ['photo-identity'];
    state.sectionStartBackLinks = {
      '/change-uk-address': config.entryPoint,
      '/new-email-address': '/check-your-answers-address',
      '/provide-photo-identity': '/check-your-answers-email'
    };
    req.sessionModel.set(config.stateKey, state);

    post(config.entryPoint, req, { [config.field]: ['email-address'] });
    expect(req.sessionModel.get('documents-update-contact')).toEqual([
      { id: 'identity' }
    ]);
    expect(req.sessionModel.get(config.stateKey)).toMatchObject({
      completedSections: ['photo-identity'],
      sectionStartBackLinks: {
        '/new-email-address': config.entryPoint,
        '/provide-photo-identity': '/check-your-answers-email'
      }
    });

    post(config.entryPoint, req, { [config.field]: ['name'] });
    expect(req.sessionModel.get('documents-update-contact')).toBeUndefined();
    expect(req.sessionModel.get(config.stateKey).completedSections).toEqual([]);
    expect(req.sessionModel.get(config.stateKey).sectionStartBackLinks).toEqual(
      {
        '/do-you-need-to-change-your-name': config.entryPoint
      }
    );
  });

  test.each(sections)(
    '$id lists every existing page field and aggregate for deselection',
    section => {
      const ownedFields = section.routes.flatMap(route => {
        const step = app.steps[route];
        return [
          ...(step.fields || []).filter(field => field !== 'file-upload'),
          ...(step.aggregateTo ? [step.aggregateTo] : [])
        ];
      });
      expect(section.fieldsToUnset).toEqual(
        expect.arrayContaining(ownedFields)
      );
    }
  );

  test('posting a no-changes decision without a pending section reports an error', () => {
    const req = buildRequest(['name']);
    const controller = buildController('/no-changes-made', req);
    const next = jest.fn();
    controller.saveValues(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(req.sessionModel.get(config.field)).toEqual(['name']);
  });
});
