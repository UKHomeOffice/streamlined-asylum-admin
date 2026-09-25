'use strict';

const MultiSelectFollowUps = require('../../../../../apps/saa/behaviours/multi-select-follow-ups');

const { createState, getActiveRoutes, getActiveSections } = MultiSelectFollowUps;

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
          completeOn: '/second-end',
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

const buildController = route => {
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
  }

  const Controller = MultiSelectFollowUps(BaseController);

  return new Controller({
    route,
    next: '/fallback',
    multiSelectFollowUps: config
  });
};

describe('multi-select follow-ups behaviour', () => {
  test('builds active sections and routes using configured order', () => {
    expect(getActiveSections(config, ['second', 'first']).map(section => section.id)).toEqual([
      'first',
      'second'
    ]);

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
    const state = createState(config, {
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
    }, ['first']);

    expect(state.activeSections).toEqual(['first']);
    expect(state.activeRoutes).toEqual(['/first-start', '/first-middle', '/first-end']);
    expect(state.completedSections).toEqual(['first']);
    expect(state.inactiveSections).toEqual(['second']);
    expect(state.fieldsToUnset).toEqual(['second-answer']);
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
      expect(req.sessionModel.get('second-answer')).toBeUndefined();
      expect(req.sessionModel.get('changes-follow-ups').activeSections).toEqual(['first']);
      expect(req.sessionModel.get('changes-follow-ups').activeRoutes).toEqual([
        '/first-start',
        '/first-middle',
        '/first-end'
      ]);
      expect(controller.getNextStep(req, {})).toBe('/updates/first-start/edit');
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
      expect(req.sessionModel.get('changes-follow-ups').completedSections).toEqual(['first']);
      expect(controller.getNextStep(req, {})).toBe('/updates/second-start');
      done();
    });
  });
});
