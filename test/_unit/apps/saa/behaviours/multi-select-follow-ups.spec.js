'use strict';

const MultiSelectFollowUps = require('../../../../../apps/saa/behaviours/multi-select-follow-ups');

const { createState, getActiveRoutes, getActiveSections } =
  MultiSelectFollowUps;

const config = {
  field: 'changes',
  entryPoint: '/changes',
  exitPoint: '/exit',
  stateKey: 'changes-follow-ups',
  options: [
    {
      value: 'second',
      order: 20,
      sections: [
        {
          id: 'second',
          start: '/second-start',
          completeOn: [
            '/second-end',
            {
              route: '/second-question',
              condition: {
                field: 'second-question',
                value: 'no'
              }
            }
          ],
          routes: ['/second-start', '/second-middle', '/second-end'],
          fieldsToUnset: ['second-answer']
        }
      ]
    },
    {
      value: 'first',
      order: 10,
      sections: [
        {
          id: 'first',
          start: '/first-start',
          completeOn: '/first-end',
          routes: ['/first-start', '/first-middle', '/first-end'],
          fieldsToUnset: ['first-answer']
        }
      ]
    }
  ]
};

const buildSessionModel = values => ({
  values: Object.assign({}, values),
  get(key) {
    return this.values[key];
  },
  set(key, value) {
    if (typeof key === 'object') {
      Object.assign(this.values, key);
      return;
    }

    this.values[key] = value;
  },
  unset(keys) {
    [].concat(keys).forEach(key => delete this.values[key]);
  }
});

const buildController = (route, behaviourConfig = config) => {
  class BaseController {
    constructor(options) {
      this.options = options;
    }

    saveValues(req, res, callback) {
      req.sessionModel.set(req.form.values);
      callback();
    }

    getNextStep(req) {
      return req.baseUrl + this.options.next;
    }

    locals() {
      return {};
    }
  }

  const Controller = MultiSelectFollowUps(behaviourConfig)(BaseController);

  return new Controller({
    route,
    next: '/fallback'
  });
};

describe('multi-select follow-ups behaviour', () => {
  test('builds active sections and routes using configured order', () => {
    expect(
      getActiveSections(config, ['second', 'first']).map(section => section.id)
    ).toEqual(['first', 'second']);

    expect(
      getActiveSections(config, 'second, first').map(section => section.id)
    ).toEqual(['first', 'second']);

    expect(getActiveRoutes(config, ['second', 'first'])).toEqual([
      '/first-start',
      '/first-middle',
      '/first-end',
      '/second-start',
      '/second-middle',
      '/second-end'
    ]);
  });

  test('keeps completion only for sections that remain active', () => {
    const state = createState(
      config,
      {
        selections: ['first', 'second'],
        activeSections: ['first', 'second'],
        activeRoutes: [
          '/first-start',
          '/first-middle',
          '/first-end',
          '/second-start',
          '/second-middle',
          '/second-end'
        ],
        completedSections: ['first', 'second']
      },
      ['first']
    );

    expect(state.activeSections).toEqual(['first']);
    expect(state.activeRoutes).toEqual([
      '/first-start',
      '/first-middle',
      '/first-end'
    ]);
    expect(state.completedSections).toEqual(['first']);
    expect(state.inactiveSections).toEqual(['second']);
    expect(state.fieldsToUnset).toEqual(['second-answer']);
  });

  test('does not unset shared section fields while another selected option keeps the section active', () => {
    const sharedConfig = {
      field: 'changes',
      entryPoint: '/changes',
      exitPoint: '/exit',
      stateKey: 'changes-follow-ups',
      options: [
        {
          value: 'first-shared-option',
          order: 10,
          fieldsToUnset: ['first-option-answer'],
          sections: [
            {
              id: 'shared-section',
              start: '/shared-start',
              completeOn: '/shared-end',
              routes: ['/shared-start', '/shared-end'],
              fieldsToUnset: ['shared-section-answer']
            }
          ]
        },
        {
          value: 'second-shared-option',
          order: 20,
          fieldsToUnset: ['second-option-answer'],
          sections: [
            {
              id: 'shared-section',
              start: '/shared-start',
              completeOn: '/shared-end',
              routes: ['/shared-start', '/shared-end'],
              fieldsToUnset: ['shared-section-answer']
            }
          ]
        }
      ]
    };

    const state = createState(
      sharedConfig,
      {
        selections: ['first-shared-option', 'second-shared-option'],
        activeSections: ['shared-section'],
        completedSections: ['shared-section']
      },
      ['second-shared-option']
    );

    expect(state.activeSections).toEqual(['shared-section']);
    expect(state.completedSections).toEqual(['shared-section']);
    expect(state.fieldsToUnset).toEqual(['first-option-answer']);
  });

  test('entry route stores state, unsets inactive fields and routes to first added section', done => {
    const controller = buildController('/changes');
    const req = {
      baseUrl: '/updates',
      params: { action: 'edit' },
      form: {
        options: { exitPoint: '/exit' },
        values: { changes: ['first'] }
      },
      sessionModel: buildSessionModel({
        'changes-follow-ups': {
          selections: ['second'],
          activeSections: ['second'],
          activeRoutes: ['/second-start', '/second-middle', '/second-end'],
          completedSections: ['second']
        },
        'second-answer': 'stale answer'
      })
    };

    controller.saveValues(req, {}, err => {
      expect(err).toBeUndefined();
      expect(req.sessionModel.get('changes-follow-ups').sectionStartRoute).toBe(
        '/first-start'
      );
      expect(
        req.sessionModel.get('changes-follow-ups').sectionStartBackLink
      ).toBe('/changes');
      expect(req.sessionModel.get('second-answer')).toBeUndefined();
      expect(req.sessionModel.get('changes-follow-ups').activeSections).toEqual(
        ['first']
      );
      expect(req.sessionModel.get('changes-follow-ups').activeRoutes).toEqual([
        '/first-start',
        '/first-middle',
        '/first-end'
      ]);
      expect(controller.getNextStep(req, {})).toBe('/updates/first-start/edit');
      done();
    });
  });

  test('entry route follows configured order in non-edit journeys when a later section is newly added', done => {
    const controller = buildController('/changes');
    const req = {
      baseUrl: '/updates',
      params: {},
      form: {
        options: { exitPoint: '/exit' },
        values: { changes: ['first', 'second'] }
      },
      sessionModel: buildSessionModel({
        'changes-follow-ups': {
          selections: ['first'],
          activeSections: ['first'],
          activeRoutes: ['/first-start', '/first-middle', '/first-end'],
          completedSections: []
        }
      })
    };

    controller.saveValues(req, {}, err => {
      expect(err).toBeUndefined();
      expect(req.sessionModel.get('changes-follow-ups').addedSections).toEqual([
        'second'
      ]);
      expect(req.sessionModel.get('changes-follow-ups').sectionStartRoute).toBe(
        '/first-start'
      );
      expect(
        req.sessionModel.get('changes-follow-ups').sectionStartBackLink
      ).toBe('/changes');
      expect(controller.getNextStep(req, {})).toBe('/updates/first-start');
      done();
    });
  });

  test('entry route joins base URL without duplicating slashes', done => {
    const controller = buildController('/changes');
    const req = {
      baseUrl: '/updates/',
      params: {},
      form: {
        options: { exitPoint: '/exit' },
        values: { changes: ['first'] }
      },
      sessionModel: buildSessionModel({})
    };

    controller.saveValues(req, {}, err => {
      expect(err).toBeUndefined();
      expect(controller.getNextStep(req, {})).toBe('/updates/first-start');
      done();
    });
  });

  test('completed follow-up section advances to next incomplete section', done => {
    const controller = buildController('/first-end');
    const req = {
      baseUrl: '/updates',
      params: {},
      form: {
        options: { exitPoint: '/exit' },
        values: {}
      },
      sessionModel: buildSessionModel({
        'changes-follow-ups': {
          selections: ['first', 'second'],
          activeSections: ['first', 'second'],
          activeRoutes: [
            '/first-start',
            '/first-middle',
            '/first-end',
            '/second-start',
            '/second-middle',
            '/second-end'
          ],
          completedSections: []
        }
      })
    };

    controller.saveValues(req, {}, err => {
      expect(err).toBeUndefined();
      expect(
        req.sessionModel.get('changes-follow-ups').completedSections
      ).toEqual(['first']);
      expect(
        req.sessionModel.get('changes-follow-ups').lastCompletionRoute
      ).toBe('/first-end');
      expect(req.sessionModel.get('changes-follow-ups').sectionStartRoute).toBe(
        '/second-start'
      );
      expect(
        req.sessionModel.get('changes-follow-ups').sectionStartBackLink
      ).toBe('/first-end');
      expect(controller.getNextStep(req, {})).toBe('/updates/second-start');
      done();
    });
  });

  test('exit page back link returns to the last completed section route', () => {
    const controller = buildController('/exit');
    const req = {
      baseUrl: '/updates',
      sessionModel: buildSessionModel({
        'changes-follow-ups': {
          selections: ['first'],
          activeSections: ['first'],
          completedSections: ['first'],
          lastCompletionRoute: '/first-end'
        }
      })
    };

    expect(controller.locals(req, {})).toEqual({
      backLink: '/updates/first-end'
    });
  });

  test('exit page back link falls back to the entry page when no section has completed', () => {
    const controller = buildController('/exit');
    const req = {
      baseUrl: '/updates',
      sessionModel: buildSessionModel({
        'changes-follow-ups': {
          selections: [],
          activeSections: [],
          completedSections: []
        }
      })
    };

    expect(controller.locals(req, {})).toEqual({
      backLink: '/updates/changes'
    });
  });

  test('section start page back link falls back to the entry page', () => {
    const controller = buildController('/second-start');
    const req = {
      baseUrl: '/updates',
      sessionModel: buildSessionModel({
        'changes-follow-ups': {
          selections: ['second'],
          activeSections: ['second'],
          completedSections: [],
          sectionStartRoute: '/second-start',
          sectionStartBackLink: '/changes'
        }
      })
    };

    expect(controller.locals(req, {})).toEqual({
      backLink: '/updates/changes'
    });
  });

  test('section start page back link preserves edit mode for the entry page', () => {
    const controller = buildController('/second-start');
    const req = {
      baseUrl: '/updates',
      params: { action: 'edit' },
      sessionModel: buildSessionModel({
        'changes-follow-ups': {
          selections: ['second'],
          activeSections: ['second'],
          completedSections: [],
          sectionStartRoute: '/second-start',
          sectionStartBackLink: '/changes'
        }
      })
    };

    expect(controller.locals(req, {})).toEqual({
      backLink: '/updates/changes/edit'
    });
  });

  test('section start page back link returns to the previous completion route', () => {
    const controller = buildController('/second-start');
    const req = {
      baseUrl: '/updates',
      sessionModel: buildSessionModel({
        'changes-follow-ups': {
          selections: ['first', 'second'],
          activeSections: ['first', 'second'],
          completedSections: ['first'],
          lastCompletionRoute: '/first-end',
          sectionStartRoute: '/second-start',
          sectionStartBackLink: '/first-end'
        }
      })
    };

    expect(controller.locals(req, {})).toEqual({
      backLink: '/updates/first-end'
    });
  });

  test('section start page back link preserves edit mode for a previous completion route', () => {
    const controller = buildController('/second-start');
    const req = {
      baseUrl: '/updates',
      params: { action: 'edit' },
      sessionModel: buildSessionModel({
        'changes-follow-ups': {
          selections: ['first', 'second'],
          activeSections: ['first', 'second'],
          completedSections: ['first'],
          lastCompletionRoute: '/first-end',
          sectionStartRoute: '/second-start',
          sectionStartBackLink: '/first-end'
        }
      })
    };

    expect(controller.locals(req, {})).toEqual({
      backLink: '/updates/first-end/edit'
    });
  });

  test('section start page keeps its back link after a later section is reached', done => {
    const threeSectionConfig = {
      ...config,
      options: config.options.concat({
        value: 'third',
        order: 30,
        sections: [
          {
            id: 'third',
            start: '/third-start',
            completeOn: '/third-end',
            routes: ['/third-start', '/third-end']
          }
        ]
      })
    };
    const firstCompletionController = buildController(
      '/first-end',
      threeSectionConfig
    );
    const secondCompletionController = buildController(
      '/second-end',
      threeSectionConfig
    );
    const secondStartController = buildController(
      '/second-start',
      threeSectionConfig
    );
    const req = {
      baseUrl: '/updates',
      params: {},
      form: {
        options: { exitPoint: '/exit' },
        values: {}
      },
      sessionModel: buildSessionModel({
        'changes-follow-ups': {
          selections: ['first', 'second', 'third'],
          activeSections: ['first', 'second', 'third'],
          completedSections: []
        }
      })
    };

    firstCompletionController.saveValues(req, {}, firstErr => {
      expect(firstErr).toBeUndefined();
      secondCompletionController.saveValues(req, {}, secondErr => {
        expect(secondErr).toBeUndefined();
        expect(req.sessionModel.get('changes-follow-ups')).toMatchObject({
          sectionStartRoute: '/third-start',
          sectionStartBackLink: '/second-end',
          sectionStartBackLinks: {
            '/second-start': '/first-end',
            '/third-start': '/second-end'
          }
        });
        expect(secondStartController.locals(req, {})).toEqual({
          backLink: '/updates/first-end'
        });
        done();
      });
    });
  });

  test('section start page save does not change orchestration state', done => {
    const controller = buildController('/second-start');
    const previousState = {
      selections: ['first', 'second'],
      activeSections: ['first', 'second'],
      completedSections: ['first'],
      lastCompletionRoute: '/first-end',
      sectionStartRoute: '/second-start',
      sectionStartBackLink: '/first-end'
    };
    const req = {
      baseUrl: '/updates',
      params: {},
      form: {
        options: { exitPoint: '/exit' },
        values: { 'second-answer': 'yes' }
      },
      sessionModel: buildSessionModel({
        'changes-follow-ups': previousState
      })
    };

    controller.saveValues(req, {}, err => {
      expect(err).toBeUndefined();
      expect(req.sessionModel.get('changes-follow-ups')).toEqual(previousState);
      done();
    });
  });

  test('conditional completion route only completes section when condition is met', done => {
    const controller = buildController('/second-question');
    const req = {
      baseUrl: '/updates',
      params: {},
      form: {
        options: { exitPoint: '/exit' },
        values: { 'second-question': 'no' }
      },
      sessionModel: buildSessionModel({
        'changes-follow-ups': {
          selections: ['second'],
          activeSections: ['second'],
          activeRoutes: ['/second-start', '/second-middle', '/second-end'],
          completedSections: []
        }
      })
    };

    controller.saveValues(req, {}, err => {
      expect(err).toBeUndefined();
      expect(
        req.sessionModel.get('changes-follow-ups').completedSections
      ).toEqual(['second']);
      expect(controller.getNextStep(req, {})).toBe('/updates/exit');
      done();
    });
  });
});
