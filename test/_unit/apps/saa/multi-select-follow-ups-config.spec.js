'use strict';

const app = require('../../../../apps/saa');
const MultiSelectFollowUps = require('../../../../apps/saa/behaviours/multi-select-follow-ups');
const multiSelectFollowUpsConfig = require('../../../../apps/saa/config/multi-select-follow-ups-config');

const uniqueSectionStartRoutes = multiSelectFollowUpsConfig.options
  .reduce(
    (routes, option) =>
      routes.concat((option.sections || []).map(section => section.start)),
    []
  )
  .filter((route, index, routes) => routes.indexOf(route) === index);

describe('SAA multi-select follow-up route config', () => {
  test('allows each dynamic section start to be reached from the multi-select entry point', () => {
    uniqueSectionStartRoutes.forEach(route => {
      expect(app.steps[route].prereqs).toContain(
        multiSelectFollowUpsConfig.entryPoint
      );
    });
  });

  test('allows the multi-select entry point as a fallback back link for each dynamic section start', () => {
    uniqueSectionStartRoutes.forEach(route => {
      expect(app.steps[route].backLinks).toContain(
        multiSelectFollowUpsConfig.entryPoint
      );
    });
  });

  test('attaches the multi-select behaviour to each dynamic section start', () => {
    uniqueSectionStartRoutes.forEach(route => {
      expect(app.steps[route].behaviours).toEqual(
        expect.arrayContaining([expect.any(Function)])
      );
    });
  });

  test('does not force later dynamic section starts back to the multi-select entry point', () => {
    expect(app.steps['/your-phone-number'].backLink).toBeUndefined();
  });

  test('attaches the multi-select behaviour to the configured exit point', () => {
    expect(app.steps[multiSelectFollowUpsConfig.exitPoint].behaviours).toEqual(
      expect.arrayContaining([expect.any(Function)])
    );
  });

  test.each([
    ['name', '/updates/do-you-need-to-change-your-name'],
    ['date-of-birth', '/updates/whose-date-of-birth'],
    ['nationality', '/updates/whose-nationality-to-change'],
    ['address', '/updates/change-uk-address'],
    ['email-address', '/updates/new-email-address'],
    ['phone-number', '/updates/your-phone-number'],
    [['nationality', 'address'], '/updates/whose-nationality-to-change'],
    [['address', 'nationality'], '/updates/whose-nationality-to-change']
  ])(
    'routes selection %p to the expected first section',
    (selection, expectedRoute) => {
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

      const Controller = MultiSelectFollowUps(multiSelectFollowUpsConfig)(
        BaseController
      );
      const controller = new Controller({
        route: multiSelectFollowUpsConfig.entryPoint,
        next: multiSelectFollowUpsConfig.exitPoint
      });
      const sessionValues = {};
      const req = {
        baseUrl: app.baseUrl,
        params: {},
        form: {
          values: {
            [multiSelectFollowUpsConfig.field]: selection
          }
        },
        sessionModel: {
          get(key) {
            return sessionValues[key];
          },
          set(key, value) {
            if (typeof key === 'object') {
              Object.assign(sessionValues, key);
              return;
            }

            sessionValues[key] = value;
          },
          unset() {}
        }
      };

      controller.saveValues(req, {}, err => {
        expect(err).toBeUndefined();
      });

      expect(controller.getNextStep(req, {})).toBe(expectedRoute);
    }
  );

  test('routes unchanged selections to the next incomplete selected section', () => {
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

    const Controller = MultiSelectFollowUps(multiSelectFollowUpsConfig)(
      BaseController
    );
    const controller = new Controller({
      route: multiSelectFollowUpsConfig.entryPoint,
      next: multiSelectFollowUpsConfig.exitPoint
    });
    const sessionValues = {
      [multiSelectFollowUpsConfig.stateKey]: {
        selections: ['email-address', 'phone-number'],
        activeSections: ['email-address', 'phone-number'],
        activeRoutes: [
          '/new-email-address',
          '/check-your-answers-email',
          '/your-phone-number',
          '/new-phone-number',
          '/check-your-answers-phone-number'
        ],
        completedSections: ['email-address']
      }
    };
    const req = {
      baseUrl: app.baseUrl,
      params: {},
      form: {
        values: {
          [multiSelectFollowUpsConfig.field]: ['email-address', 'phone-number']
        }
      },
      sessionModel: {
        get(key) {
          return sessionValues[key];
        },
        set(key, value) {
          if (typeof key === 'object') {
            Object.assign(sessionValues, key);
            return;
          }

          sessionValues[key] = value;
        },
        unset() {}
      }
    };

    controller.saveValues(req, {}, err => {
      expect(err).toBeUndefined();
    });

    expect(controller.getNextStep(req, {})).toBe('/updates/your-phone-number');
  });

  test('completes the name section when someone else name change is answered no', () => {
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

    const Controller = MultiSelectFollowUps(multiSelectFollowUpsConfig)(
      BaseController
    );
    const controller = new Controller({
      route: '/do-you-need-to-change-someone-elses-name',
      next: '/relationship-name-change'
    });
    const sessionValues = {
      [multiSelectFollowUpsConfig.stateKey]: {
        selections: ['name', 'date-of-birth'],
        activeSections: ['name', 'date-of-birth'],
        activeRoutes: [
          '/do-you-need-to-change-your-name',
          '/do-you-need-to-change-someone-elses-name',
          '/whose-date-of-birth'
        ],
        completedSections: []
      }
    };
    const req = {
      baseUrl: app.baseUrl,
      params: {},
      form: {
        values: {
          'do-you-need-to-change-someone-elses-name': 'no'
        }
      },
      sessionModel: {
        get(key) {
          return sessionValues[key];
        },
        set(key, value) {
          if (typeof key === 'object') {
            Object.assign(sessionValues, key);
            return;
          }

          sessionValues[key] = value;
        },
        unset() {}
      }
    };

    controller.saveValues(req, {}, err => {
      expect(err).toBeUndefined();
    });

    expect(
      sessionValues[multiSelectFollowUpsConfig.stateKey].completedSections
    ).toEqual(['name']);
    expect(controller.getNextStep(req, {})).toBe(
      '/updates/whose-date-of-birth'
    );
  });
});
