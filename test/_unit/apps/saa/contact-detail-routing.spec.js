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

test('home address includes the required letter-delivery radio question', () => {
  const field = 'send-letters-to-home-address';
  expect(app.steps['/home-address'].fields).toContain(field);
  expect(fields[field]).toMatchObject({
    mixin: 'radio-group',
    options: ['yes', 'no'],
    validate: ['required']
  });
  expect(fieldTranslations[field]).toEqual({
    legend: 'Can we send letters to this address?',
    options: {
      yes: { label: 'Yes' },
      no: { label: 'No' }
    }
  });
});

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
    fieldsConfig: fields,
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

describe('change UK address question', () => {
  test('includes a Yes/No radio question and personal details caption', () => {
    expect(app.steps['/change-uk-address'].fields).toEqual(['change-uk-address']);
    expect(fields['change-uk-address']).toMatchObject({
      mixin: 'radio-group',
      options: ['yes', 'no'],
      validate: ['required'],
      isPageHeading: true
    });
    expect(pages['change-uk-address'].captionHeading).toBe('Update personal details');
    expect(fieldTranslations['change-uk-address']).toEqual({
      legend: 'Have you moved to a new address in the UK?',
      options: {
        yes: { label: 'Yes' },
        no: { label: 'No' }
      }
    });
  });

  test.each([
    ['yes', undefined],
    ['no', undefined],
    ['', 'required']
  ])('validates "%s" with error %s', (value, errorType) => {
    const field = 'change-uk-address';
    const req = buildRequest(['address']);
    req.form.values = { [field]: value };
    const controller = buildController('/change-uk-address', req);

    const error = controller.validateField(field, req);

    if (errorType) {
      expect(error).toMatchObject({ key: field, type: errorType });
    } else {
      expect(error).toBeUndefined();
    }
  });
});

describe('change contact address question', () => {
  test('includes a Yes/No radio question and personal details caption', () => {
    expect(app.steps['/change-contact-address'].fields).toEqual(['change-contact-address']);
    expect(fields['change-contact-address']).toMatchObject({
      mixin: 'radio-group',
      options: ['yes', 'no'],
      validate: ['required']
    });
    expect(pages['change-contact-address'].captionHeading).toBe('Update personal details');
    expect(fieldTranslations['change-contact-address']).toEqual({
      legend: 'Do you need to change the address we send your letters to?',
      options: {
        yes: { label: 'Yes' },
        no: { label: 'No' }
      }
    });
  });

  test.each([
    ['yes', undefined],
    ['no', undefined],
    ['', 'required']
  ])('validates "%s" with error %s', (value, errorType) => {
    const field = 'change-contact-address';
    const req = buildRequest(['address']);
    req.form.values = { [field]: value };
    const controller = buildController('/change-contact-address', req);

    const error = controller.validateField(field, req);

    if (errorType) {
      expect(error).toMatchObject({ key: field, type: errorType });
    } else {
      expect(error).toBeUndefined();
    }
  });
});

describe('contact address change reason', () => {
  const field = 'reason-contact-address-change';

  test('includes a textarea heading and personal details caption', () => {
    expect(app.steps['/reason-contact-address-change'].fields).toEqual([field]);
    expect(fields[field]).toMatchObject({
      mixin: 'textarea',
      isPageHeading: true
    });
    expect(pages[field].captionHeading).toBe('Update personal details');
    expect(fieldTranslations[field].label)
      .toBe('Why do you need us to send letters to a different address?');
  });

  test.each([
    ['a', undefined],
    ['Please send letters to my family.', undefined],
    ['a'.repeat(500), undefined],
    ['a'.repeat(501), 'maxlength'],
    ['https://example.com', 'notUrl'],
    ['Please use www.example.com', 'notUrl'],
    ['', 'required']
  ])('validates "%s" with error %s', (value, errorType) => {
    const req = buildRequest(['address']);
    req.form.values = { [field]: value };
    const controller = buildController('/reason-contact-address-change', req);

    const error = controller.validateField(field, req);

    if (errorType) {
      expect(error).toMatchObject({ key: field, type: errorType });
    } else {
      expect(error).toBeUndefined();
    }
  });
});

describe('contact address fields', () => {
  test('includes the recipient and address fields in order with the requested caption and hint', () => {
    expect(app.steps['/contact-address'].fields).toEqual([
      'contact-address-full-name',
      'contact-address-line-1',
      'contact-address-line-2',
      'contact-address-town-or-city',
      'contact-address-county',
      'contact-address-postcode'
    ]);
    expect(pages['contact-address'].captionHeading).toBe('Update personal details');
    expect(fieldTranslations['contact-address-full-name']).toEqual({
      label: 'Full name',
      hint: 'The name of the person you want to receive your letters'
    });
    expect(app.steps['/contact-address'].fields.map(field => fieldTranslations[field].label))
      .toEqual([
        'Full name', 'Address line 1', 'Address line 2 (optional)',
        'Town or city', 'County (optional)', 'Postcode'
      ]);
  });

  test.each([
    ['contact-address-full-name', '', 'required'],
    ['contact-address-full-name', 'Alex Smith', undefined],
    ['contact-address-line-1', '', 'required'],
    ['contact-address-line-1', '1 High Street', undefined],
    ['contact-address-line-1', 'a'.repeat(60), undefined],
    ['contact-address-line-1', 'a'.repeat(61), 'maxlength'],
    ['contact-address-line-1', 'https://example.com', 'notUrl'],
    ['contact-address-line-2', '', undefined],
    ['contact-address-line-2', 'a'.repeat(60), undefined],
    ['contact-address-line-2', 'a'.repeat(61), 'maxlength'],
    ['contact-address-line-2', 'https://example.com', 'notUrl'],
    ['contact-address-town-or-city', '', 'required'],
    ['contact-address-town-or-city', 'a'.repeat(60), undefined],
    ['contact-address-town-or-city', 'a'.repeat(61), 'maxlength'],
    ['contact-address-town-or-city', 'https://example.com', 'notUrl'],
    ['contact-address-county', '', undefined],
    ['contact-address-county', 'a'.repeat(60), undefined],
    ['contact-address-county', 'a'.repeat(61), 'maxlength'],
    ['contact-address-county', 'https://example.com', 'notUrl'],
    ['contact-address-postcode', '', 'required'],
    ['contact-address-postcode', 'SW1A 1AA', undefined],
    ['contact-address-postcode', 'invalid', 'postcode']
  ])('validates %s value "%s" with error %s', (field, value, errorType) => {
    const req = buildRequest(['address']);
    req.form.values = { [field]: value };
    const controller = buildController('/contact-address', req);

    const error = controller.validateField(field, req);

    if (errorType) {
      expect(error).toMatchObject({ key: field, type: errorType });
    } else {
      expect(error).toBeFalsy();
    }
  });

  test.each(
    ['contact-address-line-1', 'contact-address-town-or-city'].flatMap(field =>
      ['(', ')', ',', '.', '/', '&', '-'].map(character => [field, character])
    )
  )('rejects %s containing "%s"', (field, character) => {
    const req = buildRequest(['address']);
    req.form.values = { [field]: `Some ${character} place` };
    const controller = buildController('/contact-address', req);

    expect(controller.validateField(field, req)).toMatchObject({
      key: field,
      type: 'regex'
    });
  });

  test.each(['contact-address-line-1', 'contact-address-town-or-city'])(
    'allows unlisted characters and counts spaces towards the limit in %s',
    field => {
      const req = buildRequest(['address']);
      const controller = buildController('/contact-address', req);
      for (const value of ["St John's", 'Caf\u00e9', `${'a'.repeat(29)} ${'b'.repeat(30)}`]) {
        req.form.values = { [field]: value };
        expect(controller.validateField(field, req)).toBeFalsy();
      }
      req.form.values = { [field]: `${'a'.repeat(30)} ${'b'.repeat(30)}` };
      expect(controller.validateField(field, req)).toMatchObject({
        key: field,
        type: 'maxlength'
      });
    }
  );
});

describe.each([
  ['home-address-town-or-city', 'required'],
  ['home-address-county', undefined]
])('home address %s validation', (field, emptyError) => {
  test.each([
    ['London', undefined],
    ['Newcastle upon Tyne', undefined],
    [`${'a'.repeat(29)} ${'b'.repeat(30)}`, undefined],
    [`${'a'.repeat(30)} ${'b'.repeat(30)}`, 'maxlength'],
    ['https://example.com', 'notUrl'],
    ['London www.example.com', 'notUrl'],
    ['', emptyError]
  ])('validates "%s" with error %s', (value, errorType) => {
    const req = buildRequest(['address']);
    req.form.values = { [field]: value };
    const controller = buildController('/home-address', req);

    const error = controller.validateField(field, req);

    if (errorType) {
      expect(error).toMatchObject({ key: field, type: errorType });
    } else {
      expect(error).toBeUndefined();
    }
  });
});

describe('home address postcode validation', () => {
  test.each([
    ['SW1A 1AA', undefined],
    ['sw1a 1aa', undefined],
    ['SW1A1AA', undefined],
    ['M1 1AE', undefined],
    ['not a postcode', 'postcode'],
    ['12345', 'postcode'],
    ['SW1A', 'postcode'],
    ['', 'required']
  ])('validates "%s" with error %s', (value, errorType) => {
    const field = 'home-address-postcode';
    const req = buildRequest(['address']);
    req.form.values = { [field]: value };
    const controller = buildController('/home-address', req);

    const error = controller.validateField(field, req);

    if (errorType) {
      expect(error).toMatchObject({ key: field, type: errorType });
    } else {
      expect(error).toBeUndefined();
    }
  });
});

describe('home address moved date validation', () => {
  test.each([
    ['1899-12-31', 'after'],
    ['1900-01-01', 'after'],
    ['1900-01-02', undefined],
    ['2020-03-27', undefined],
    ['2020-02-30', 'date'],
    ['', 'required']
  ])('validates "%s" with error %s', (value, errorType) => {
    const field = 'home-address-moved-date';
    const req = buildRequest(['address']);
    req.form.values = { [field]: value };
    const controller = buildController('/home-address', req);

    const error = controller.validateField(field, req);

    if (errorType) {
      expect(error).toMatchObject({ key: field, type: errorType });
    } else {
      expect(error).toBeUndefined();
    }
  });
});

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
        someoneelsenewname: { aggregatedValues: [] },
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
        'edit-return-path': edit ? `${app.baseUrl}/confirm` : undefined,
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

  test('unanswered Nationality placeholders complete before collecting Email and shared identity', () => {
    const nationality = sections.find(section => section.id === 'nationality');
    const req = buildRequest(['nationality', 'email-address'], edit, {
      steps: [config.entryPoint],
      'edit-return-path': edit ? `${app.baseUrl}/confirm` : undefined
    });

    nationality.routes.slice(0, -1).forEach((route, index) => {
      expect(post(route, req, {}, true).url)
        .toBe(`${app.baseUrl}${nationality.routes[index + 1]}${suffix}`);
      expect(req.sessionModel.get(config.stateKey).completedSections).toEqual([]);
    });
    expect(post('/check-your-answers-someone-else-nationality', req, {}, true).url)
      .toBe(`${app.baseUrl}/new-email-address${suffix}`);
    expect(req.sessionModel.get(config.stateKey).completedSections).toEqual(['nationality']);
    expect(req.sessionModel.get('change-your-nationality')).toBeUndefined();
    expect(req.sessionModel.get('change-someone-else-nationality')).toBeUndefined();

    post('/new-email-address', req, {
      'old-email-address': 'old@example.com',
      'new-email-address': 'new@example.com',
      'confirm-new-email-address': 'new@example.com'
    }, true);
    expect(post('/check-your-answers-email', req, {}, true).url)
      .toBe(`${app.baseUrl}/provide-photo-identity${suffix}`);
    expect(post('/provide-photo-identity', req, {}, true).url)
      .toBe(`${app.baseUrl}${edit ? '/confirm' : config.exitPoint}`);
    expect(req.sessionModel.get(config.stateKey).completedSections)
      .toEqual(['nationality', 'email-address', 'photo-identity']);
  });

  test.each(['yes', 'no'])(
    'declining a contact address goes to address CYA when UK address change is %s',
    changeUkAddress => {
      const req = buildRequest(['address'], edit, { 'change-uk-address': changeUkAddress });
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
    }
  );

  test('email and phone CYA defer EditRouteReturn until the shared identity section completes', () => {
    const req = buildRequest(['email-address', 'phone-number'], edit, {
      'edit-return-path': edit ? `${app.baseUrl}/confirm` : undefined
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

describe('someone-else name summary integration', () => {
  const route = '/check-your-answers-someone-else-name';
  const nameFields = {
    'relationship-name-change': 'child',
    'reason-someone-else-name-change': 'spelling-error',
    'someone-else-old-given-name': 'Old',
    'someone-else-old-family-name': 'Name',
    'someone-else-new-given-name': 'New',
    'someone-else-new-family-name': 'Name',
    'documents-someone-else-new-name': [{ id: 'existing-upload', name: 'evidence.pdf' }]
  };
  const visitSummary = req => {
    const controller = buildController(route, req);
    const res = { locals: {}, redirect: jest.fn() };
    controller.getValues(req, res, jest.fn());
    return { controller, res };
  };

  test.each([
    [false, undefined],
    [true, '/confirm'],
    [false, '/information-given']
  ])(
    'aggregating names preserves selected follow-ups (edit=%s, return=%s)',
    (edit, returnPath) => {
      const req = buildRequest(['name', 'phone-number'], edit, {
        ...nameFields,
        steps: [config.entryPoint, '/someone-else-new-name-evidence'],
        'do-you-need-to-change-your-name': 'no',
        'change-someone-elses-name': 'yes',
        'edit-return-path': returnPath ? `${app.baseUrl}${returnPath}` : undefined
      });
      req.translate = keys => [].concat(keys)[0];
      expect(visitSummary(req).res.redirect).toHaveBeenCalledWith(
        `${app.baseUrl}${route}`
      );
      expect(req.sessionModel.get('someoneelsenewname').aggregatedValues).toEqual([
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              field: 'documents-someone-else-new-name',
              value: nameFields['documents-someone-else-new-name']
            })
          ])
        })
      ]);
      Object.keys(nameFields).forEach(field => {
        expect(req.sessionModel.get(field)).toBeUndefined();
      });
      expect(req.sessionModel.get(config.stateKey).completedSections).toEqual([]);

      const summary = visitSummary(req);
      expect(summary.res.redirect).not.toHaveBeenCalled();
      expect(summary.controller.options.backLink).toBe(false);
      expect(summary.controller.locals(req, summary.res)).toMatchObject({
        hasItems: true,
        addStep: 'relationship-name-change'
      });
      const suffix = edit ? '/edit' : '';
      expect(post(route, req, {}, true).url)
        .toBe(`${app.baseUrl}/your-phone-number${suffix}`);
      expect(req.sessionModel.get(config.stateKey).completedSections).toEqual(['name']);
      const phone = buildController('/your-phone-number', req);
      expect(phone.locals(req, { locals: {} }).backLink)
        .toBe(`${app.baseUrl}${route}${suffix}`);
      post('/your-phone-number', req, { 'your-phone-number': 'yes' }, true);
      post('/new-phone-number', req, {
        'new-phone-number': '07700900001',
        'confirm-new-phone-number': '07700900001'
      }, true);
      expect(post('/check-your-answers-phone-number', req, {}, true).url)
        .toBe(`${app.baseUrl}/provide-photo-identity${suffix}`);
      expect(post('/provide-photo-identity', req, {}, true).url)
        .toBe(`${app.baseUrl}${returnPath || config.exitPoint}`);
    }
  );

  test('adding and editing a saved name preserves the collection until Continue', () => {
    const req = buildRequest(['name'], true, {
      ...nameFields,
      steps: [config.entryPoint, '/someone-else-new-name-evidence'],
      'change-someone-elses-name': 'yes',
      'edit-return-path': `${app.baseUrl}/confirm`
    });
    visitSummary(req);
    expect(post('/relationship-name-change', req, {
      'relationship-name-change': 'child'
    }).url).toBe(`${app.baseUrl}/reason-someone-else-name-change/edit`);
    req.sessionModel.set({ ...nameFields, 'someone-else-new-given-name': 'Another' });
    visitSummary(req);
    expect(req.sessionModel.get('someoneelsenewname').aggregatedValues).toHaveLength(2);

    req.params = { action: 'edit', id: '0' };
    expect(visitSummary(req).res.redirect).toHaveBeenCalledWith(
      `${app.baseUrl}/relationship-name-change`
    );
    expect(req.sessionModel.get('someone-else-new-given-name')).toBe('New');
    req.sessionModel.set('someone-else-new-given-name', 'Corrected');
    req.params = {};
    visitSummary(req);
    const items = req.sessionModel.get('someoneelsenewname').aggregatedValues;
    expect(items).toHaveLength(2);
    expect(items.map(item => item.fields.find(
      field => field.field === 'someone-else-new-given-name'
    ).value)).toEqual(['Corrected', 'Another']);
    expect(post(route, req, {}, true).url).toBe(`${app.baseUrl}/confirm`);
  });

  test.each(['checkboxes', 'no-changes'])(
    'removing Name via %s clears saved names and session upload references',
    removal => {
      const req = buildRequest(['name', 'phone-number'], true, nameFields);
      visitSummary(req);
      expect(req.sessionModel.get('someoneelsenewname').aggregatedValues).toHaveLength(1);
      if (removal === 'checkboxes') {
        post(config.entryPoint, req, { [config.field]: ['phone-number'] });
      } else {
        const section = noChangesSections.find(item => item.id === 'name');
        post(section.noChanges.route, req, answerNo(section));
        post('/no-changes-made', req, { 'no-changes-made': 'yes' });
      }
      expect(req.sessionModel.get('someoneelsenewname')).toBeUndefined();
      expect(req.sessionModel.get('documents-someone-else-new-name')).toBeUndefined();
      expect(req.sessionModel.get(config.field)).toEqual(['phone-number']);
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

describe.each([false, true])('claimant Name summary edits (edit URL=%s)', edit => {
  const route = '/check-your-answers-name';
  const savedPeople = {
    aggregatedValues: [{
      fields: [
        { field: 'someone-else-new-given-name', value: 'Saved' },
        { field: 'documents-someone-else-new-name', value: [{ id: 'existing-upload' }] }
      ]
    }]
  };
  const buildNameRequest = (selections, returnRoute) =>
    buildRequest(selections, edit, {
      steps: [config.entryPoint, '/reason-name-change', '/new-name', '/new-name-evidence'],
      'do-you-need-to-change-your-name': 'yes',
      'change-someone-elses-name': 'yes',
      'documents-new-name': [],
      someoneelsenewname: savedPeople,
      'edit-return-path': returnRoute ? `${app.baseUrl}${returnRoute}` : undefined
    });

  test.each([
    ['/confirm', true],
    ['/confirm', false],
    ['/information-given', true],
    ['/information-given', false]
  ])('completed claimant Name edits return to %s with saved people=%s', (returnRoute, hasPeople) => {
    const req = buildNameRequest(['name'], returnRoute);
    if (!hasPeople) {
      req.sessionModel.unset('someoneelsenewname');
      req.sessionModel.set('change-someone-elses-name', 'no');
    }
    completeSelectedSections(req);
    const peopleBefore = req.sessionModel.get('someoneelsenewname');
    post('/new-name', req, { 'given-name': 'Updated', 'family-name': 'Name' }, true);
    post('/new-name-evidence', req, {}, true);

    expect(post(route, req, {}, true).url).toBe(`${app.baseUrl}${returnRoute}`);
    expect(req.sessionModel.get('given-name')).toBe('Updated');
    expect(req.sessionModel.get('someoneelsenewname')).toEqual(peopleBefore);
    expect(req.sessionModel.get('documents-new-name')).toEqual([]);
    expect(req.sessionModel.get(config.stateKey).completedSections).toContain('name');
  });

  test.each(['/confirm', '/information-given'])(
    'completed Name edits preserve saved people and still collect unfinished Phone before %s',
    returnRoute => {
      const req = buildNameRequest(['name', 'phone-number'], returnRoute);
      const state = req.sessionModel.get(config.stateKey);
      req.sessionModel.set(config.stateKey, { ...state, completedSections: ['name'] });

      expect(post(route, req, {}, true).url)
        .toBe(`${app.baseUrl}/your-phone-number${edit ? '/edit' : ''}`);
      expect(req.sessionModel.get('someoneelsenewname')).toEqual(savedPeople);
      expect(req.sessionModel.get(config.stateKey).completedSections).toEqual(['name']);
    }
  );

  test.each([undefined, '/confirm', '/information-given'])(
    'an incomplete Name section still asks about someone else (return=%s)',
    returnRoute => {
      const req = buildNameRequest(['name'], returnRoute);

      expect(post(route, req, {}, true).url)
        .toBe(`${app.baseUrl}/do-you-need-to-change-someone-elses-name${edit ? '/edit' : ''}`);
      expect(req.sessionModel.get(config.stateKey).completedSections).toEqual([]);
      expect(req.sessionModel.get('someoneelsenewname')).toEqual(savedPeople);
    }
  );
});

describe.each([false, true])('claimant DOB summary edits (edit URL=%s)', edit => {
  const route = '/check-your-answers-date-of-birth';
  const savedPeople = {
    aggregatedValues: [{
      fields: [
        { field: 'someone-else-correct-date-of-birth-given-name', value: 'Saved' },
        { field: 'someone-else-correct-date-of-birth', value: '2000-01-01' },
        { field: 'documents-someone-else-new-dob', value: [{ id: 'existing-upload' }] }
      ]
    }]
  };
  const buildDobRequest = (selections, returnRoute) =>
    buildRequest(selections, edit, {
      steps: [
        config.entryPoint,
        '/change-your-date-of-birth',
        '/correct-date-of-birth',
        '/new-date-of-birth-evidence'
      ],
      'change-your-date-of-birth': 'yes',
      'change-someone-else-date-of-birth': 'yes',
      someoneelsenewdob: savedPeople,
      'edit-return-path': returnRoute ? `${app.baseUrl}${returnRoute}` : undefined
    });

  test.each([
    ['/confirm', true],
    ['/confirm', false],
    ['/information-given', true],
    ['/information-given', false]
  ])(
    'completed claimant DOB edits return to %s with saved people=%s',
    (returnRoute, hasPeople) => {
      const req = buildDobRequest(['date-of-birth'], returnRoute);
      if (!hasPeople) {
        req.sessionModel.unset('someoneelsenewdob');
        req.sessionModel.set('change-someone-else-date-of-birth', 'no');
      }
      completeSelectedSections(req);
      const peopleBefore = req.sessionModel.get('someoneelsenewdob');
      post('/correct-date-of-birth', req, { 'correct-date-of-birth': '1990-02-02' }, true);

      expect(post(route, req, {}, true).url).toBe(`${app.baseUrl}${returnRoute}`);
      expect(req.sessionModel.get('correct-date-of-birth')).toBe('1990-02-02');
      expect(req.sessionModel.get('someoneelsenewdob')).toEqual(peopleBefore);
      expect(req.sessionModel.get(config.stateKey).completedSections).toContain('date-of-birth');
    }
  );

  test.each(['/confirm', '/information-given'])(
    'completed DOB edits preserve saved people and still collect unfinished Phone before %s',
    returnRoute => {
      const req = buildDobRequest(['date-of-birth', 'phone-number'], returnRoute);
      const state = req.sessionModel.get(config.stateKey);
      req.sessionModel.set(config.stateKey, { ...state, completedSections: ['date-of-birth'] });

      expect(post(route, req, {}, true).url)
        .toBe(`${app.baseUrl}/your-phone-number${edit ? '/edit' : ''}`);
      expect(req.sessionModel.get('someoneelsenewdob')).toEqual(savedPeople);
      expect(req.sessionModel.get(config.stateKey).completedSections).toEqual(['date-of-birth']);
    }
  );

  test.each([undefined, '/confirm', '/information-given'])(
    'an incomplete DOB section still asks about someone else (return=%s)',
    returnRoute => {
      const req = buildDobRequest(['date-of-birth'], returnRoute);

      expect(post(route, req, {}, true).url)
        .toBe(`${app.baseUrl}/change-someone-else-date-of-birth${edit ? '/edit' : ''}`);
      expect(req.sessionModel.get(config.stateKey).completedSections).toEqual([]);
      expect(req.sessionModel.get('someoneelsenewdob')).toEqual(savedPeople);
    }
  );
});

describe('contact-detail edit completion', () => {
  test.each([
    ['/check-your-answers-email', '/confirm'],
    ['/check-your-answers-phone-number', '/confirm'],
    ['/check-your-answers-email', '/information-given'],
    ['/check-your-answers-phone-number', '/information-given']
  ])('%s honours the summary return path %s without an edit URL', (route, returnRoute) => {
    const req = buildRequest(['email-address', 'phone-number'], false);
    completeSelectedSections(req);
    req.originalUrl = `${app.baseUrl}${returnRoute}`;
    const summary = buildController(returnRoute, req);
    const next = jest.fn();
    summary.getValues(req, {}, next);
    expect(next).toHaveBeenCalledWith(null, expect.any(Object));
    expect(req.sessionModel.get('edit-return-path')).toBe(req.originalUrl);
    expect(req.params.action).toBeUndefined();

    expect(post(route, req).url).toBe(req.originalUrl);
    expect(req.form.options.continueOnEdit).toBe(true);
  });

  test('a summary return path without an edit URL still collects incomplete selected follow-ups', () => {
    const req = buildRequest(['email-address', 'phone-number'], false, {
      'edit-return-path': `${app.baseUrl}/confirm`
    });
    expect(post('/check-your-answers-email', req).url)
      .toBe(`${app.baseUrl}/your-phone-number`);
    expect(post('/check-your-answers-phone-number', req).url)
      .toBe(`${app.baseUrl}/provide-photo-identity`);
    expect(post('/provide-photo-identity', req).url).toBe(`${app.baseUrl}/confirm`);
  });

  test('a newly added Name section cannot complete merely from an unanswered someone-else follow-up', () => {
    const req = buildRequest(['email-address'], true, {
      steps: ['/personal-details', config.entryPoint],
      'edit-return-path': `${app.baseUrl}/confirm`
    });
    completeSelectedSections(req);
    expect(post(config.entryPoint, req, {
      [config.field]: ['name', 'email-address']
    }, true).url).toBe(`${app.baseUrl}/do-you-need-to-change-your-name/edit`);
    post('/do-you-need-to-change-your-name', req, {
      'do-you-need-to-change-your-name': 'yes'
    }, true);
    expect(post('/do-you-need-to-change-someone-elses-name', req, {
      'change-someone-elses-name': 'yes'
    }).url).toBe(`${app.baseUrl}/relationship-name-change/edit`);

    expect(post('/do-you-need-to-change-your-name', req, {
      'do-you-need-to-change-your-name': 'no'
    }, true).url).toBe(`${app.baseUrl}/do-you-need-to-change-someone-elses-name/edit`);
    expect(req.sessionModel.get(config.stateKey).completedSections).not.toContain('name');
    expect(req.sessionModel.get('someone-else-new-given-name')).toBeUndefined();
    expect(req.sessionModel.get('documents-someone-else-new-name')).toBeUndefined();
    expect(post('/do-you-need-to-change-someone-elses-name', req, {
      'change-someone-elses-name': 'yes'
    }, true).url).toBe(`${app.baseUrl}/relationship-name-change/edit`);
    expect(post('/check-your-answers-someone-else-name', req).url)
      .toBe(`${app.baseUrl}/confirm`);
    expect(req.sessionModel.get(config.stateKey).completedSections).toContain('name');
  });

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
        'edit-return-path': edit ? `${app.baseUrl}/confirm` : undefined
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
  test.each(noChangesSections.flatMap(section =>
    ['/confirm', '/information-given'].flatMap(summary =>
      ['no', 'yes'].map(dependants => ({ section, summary, dependants }))
    )
  ))(
    '$section.id removal returning to $summary with dependants=$dependants respects remaining selections',
    ({ section, summary, dependants }) => {
      const req = buildRequest([section.value], true, {
        'edit-return-path': `${app.baseUrl}${summary}`,
        'add-remove-dependant': dependants
      });
      post(section.noChanges.route, req, answerNo(section));

      expect(
        post('/no-changes-made', req, { 'no-changes-made': 'yes' }).url
      ).toBe(`${app.baseUrl}${dependants === 'yes' ? summary : '/something-else'}`);
      expect(req.sessionModel.get('change-personal-details')).toBe('no');
      expect(req.sessionModel.get(config.field)).toBeUndefined();
    }
  );

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
