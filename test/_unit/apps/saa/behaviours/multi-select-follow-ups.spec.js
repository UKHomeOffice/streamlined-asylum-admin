'use strict';

const MultiSelectFollowUps = require('../../../../../apps/saa/behaviours/multi-select-follow-ups');

const { createState, getActiveRoutes } = MultiSelectFollowUps;

const config = {
  field: 'changes',
  entryPoint: '/changes',
  exitPoint: '/exit',
  stateKey: 'changes-follow-ups',
  options: [
    {
      value: 'second',
      order: 20,
      routes: ['/second-start', '/second-end'],
      fieldsToUnset: ['second-answer']
    },
    {
      value: 'first',
      order: 10,
      routes: ['/first-start', '/first-end'],
      fieldsToUnset: ['first-answer']
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
  test('builds active routes using configured order rather than selection order', () => {
    expect(getActiveRoutes(config, ['second', 'first'])).toEqual([
      '/first-start',
      '/first-end',
      '/second-start',
      '/second-end'
    ]);
  });

  test('keeps completion only for routes that remain active', () => {
    const state = createState(config, {
      selections: ['first', 'second'],
      activeRoutes: ['/first-start', '/first-end', '/second-start', '/second-end'],
      completedRoutes: ['/first-start', '/second-start']
    }, ['first']);

    expect(state.activeRoutes).toEqual(['/first-start', '/first-end']);
    expect(state.completedRoutes).toEqual(['/first-start']);
    expect(state.inactiveRoutes).toEqual(['/second-start', '/second-end']);
    expect(state.fieldsToUnset).toEqual(['second-answer']);
  });

  test('entry route stores state, unsets inactive fields and routes to first added route', done => {
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
          activeRoutes: ['/second-start', '/second-end'],
          completedRoutes: ['/second-start']
        },
        'second-answer': 'stale answer'
      })
    };

    controller.saveValues(req, {}, err => {
      expect(err).toBeUndefined();
      expect(req.sessionModel.get('second-answer')).toBeUndefined();
      expect(req.sessionModel.get('changes-follow-ups').activeRoutes).toEqual([
        '/first-start',
        '/first-end'
      ]);
      expect(controller.getNextStep(req, {})).toBe('/updates/first-start/edit');
      done();
    });
  });

  test('completed follow-up route advances to next incomplete route', done => {
    const controller = buildController('/first-start');
    const req = {
      baseUrl: '/updates',
      params: {},
      form: {
        options: { exitPoint: '/exit' },
        values: {}
      },
      sessionModel: buildSessionModel({
        'changes-follow-ups': {
          selections: ['first'],
          activeRoutes: ['/first-start', '/first-end'],
          completedRoutes: []
        }
      })
    };

    controller.saveValues(req, {}, err => {
      expect(err).toBeUndefined();
      expect(req.sessionModel.get('changes-follow-ups').completedRoutes).toEqual(['/first-start']);
      expect(controller.getNextStep(req, {})).toBe('/updates/first-end');
      done();
    });
  });
});
