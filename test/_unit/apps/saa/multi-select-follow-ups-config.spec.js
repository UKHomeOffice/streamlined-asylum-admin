'use strict';

// Route configuration tests do not need a Redis connection.
jest.mock(
  '../../../../apps/saa/behaviours/check-email-token',
  () => superclass => superclass
);

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
  test('attaches the name-change navigation behaviour to the relevant page', () => {
    const step = app.steps['/do-you-need-to-change-someone-elses-name'];

    expect(step.behaviours).toContain(
      require('../../../../apps/saa/behaviours/change-someone-elses-name-fork')
    );
    expect(step.forks).toBeUndefined();
    expect(step.next).toBe('/relationship-name-change');
  });

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
    ['name', '/changes/do-you-need-to-change-your-name'],
    ['date-of-birth', '/changes/change-your-date-of-birth'],
    ['nationality', '/changes/whose-nationality-to-change'],
    ['address', '/changes/change-uk-address'],
    ['email-address', '/changes/new-email-address'],
    ['phone-number', '/changes/your-phone-number'],
    [['nationality', 'address'], '/changes/whose-nationality-to-change'],
    [['address', 'nationality'], '/changes/whose-nationality-to-change']
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

    expect(controller.getNextStep(req, {})).toBe('/changes/your-phone-number');
  });

  test('clears saved phone answers when phone number is deselected', () => {
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

    const phoneFields = [
      'your-phone-number',
      'whose-phone-number',
      'old-phone-number',
      'new-phone-number',
      'confirm-new-phone-number'
    ];
    const Controller = MultiSelectFollowUps(multiSelectFollowUpsConfig)(
      BaseController
    );
    const controller = new Controller({
      route: multiSelectFollowUpsConfig.entryPoint,
      next: multiSelectFollowUpsConfig.exitPoint
    });
    const sessionValues = {
      'your-phone-number': 'yes',
      'whose-phone-number': 'mine',
      'old-phone-number': '07700900000',
      'new-phone-number': '07700900001',
      'confirm-new-phone-number': '07700900001',
      'new-email-address': 'new@example.com',
      [multiSelectFollowUpsConfig.field]: ['email-address', 'phone-number'],
      [multiSelectFollowUpsConfig.stateKey]: MultiSelectFollowUps.createState(
        multiSelectFollowUpsConfig,
        {},
        ['email-address', 'phone-number']
      )
    };
    const req = {
      baseUrl: app.baseUrl,
      params: {},
      form: {
        values: {
          [multiSelectFollowUpsConfig.field]: ['email-address']
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
        unset(keys) {
          [].concat(keys).forEach(key => delete sessionValues[key]);
        }
      }
    };

    controller.saveValues(req, {}, err => {
      expect(err).toBeUndefined();
    });

    phoneFields.forEach(field => {
      expect(sessionValues).not.toHaveProperty(field);
    });
    expect(sessionValues['new-email-address']).toBe('new@example.com');
  });

  test('clears saved email answers when email address is deselected', () => {
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

    const emailFields = [
      'old-email-address',
      'new-email-address',
      'confirm-new-email-address'
    ];
    const Controller = MultiSelectFollowUps(multiSelectFollowUpsConfig)(
      BaseController
    );
    const controller = new Controller({
      route: multiSelectFollowUpsConfig.entryPoint,
      next: multiSelectFollowUpsConfig.exitPoint
    });
    const sessionValues = {
      'old-email-address': 'old@example.com',
      'new-email-address': 'new@example.com',
      'confirm-new-email-address': 'new@example.com',
      'new-phone-number': '07700900001',
      [multiSelectFollowUpsConfig.field]: ['email-address', 'phone-number'],
      [multiSelectFollowUpsConfig.stateKey]: MultiSelectFollowUps.createState(
        multiSelectFollowUpsConfig,
        {},
        ['email-address', 'phone-number']
      )
    };
    const req = {
      baseUrl: app.baseUrl,
      params: {},
      form: {
        values: {
          [multiSelectFollowUpsConfig.field]: ['phone-number']
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
        unset(keys) {
          [].concat(keys).forEach(key => delete sessionValues[key]);
        }
      }
    };

    controller.saveValues(req, {}, err => {
      expect(err).toBeUndefined();
    });

    emailFields.forEach(field => {
      expect(sessionValues).not.toHaveProperty(field);
    });
    expect(sessionValues['new-phone-number']).toBe('07700900001');
  });

  test.each([
    [['name', 'date-of-birth'], 'yes', 'no', '/change-your-date-of-birth'],
    [['name', 'nationality'], 'yes', 'no', '/whose-nationality-to-change'],
    [['name', 'address'], 'yes', 'no', '/change-uk-address'],
    [['name', 'email-address'], 'yes', 'no', '/new-email-address'],
    [['name', 'phone-number'], 'yes', 'no', '/your-phone-number'],
    [
      ['nationality', 'name', 'date-of-birth'],
      'yes',
      'no',
      '/change-your-date-of-birth'
    ],
    [['name'], 'yes', 'no', '/do-you-need-add-remove-dependant'],
    [['name'], 'no', 'no', '/no-changes-made'],
    [['name', 'date-of-birth'], 'no', 'no', '/change-your-date-of-birth'],
    [['name', 'nationality'], 'no', 'no', '/whose-nationality-to-change'],
    [['name', 'address'], 'no', 'no', '/change-uk-address'],
    [['name', 'email-address'], 'no', 'no', '/new-email-address'],
    [['name', 'phone-number'], 'no', 'no', '/your-phone-number'],
    [['name', 'nationality'], 'no', 'yes', '/relationship-name-change'],
    [['name', 'nationality'], 'yes', 'yes', '/relationship-name-change']
  ])(
    'routes selections %p with name answers %s/%s to %s',
    (selections, ownNameAnswer, someoneElsesNameAnswer, nextRoute) => {
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

      const route = '/do-you-need-to-change-someone-elses-name';
      const step = app.steps[route];
      const Controller = step.behaviours.reduce(
        (Superclass, behaviour) => behaviour(Superclass),
        BaseController
      );
      const controller = new Controller({
        ...step,
        route
      });
      const sessionValues = {
        'do-you-need-to-change-your-name': ownNameAnswer,
        [multiSelectFollowUpsConfig.field]: selections,
        [multiSelectFollowUpsConfig.stateKey]: MultiSelectFollowUps.createState(
          multiSelectFollowUpsConfig,
          {},
          selections
        )
      };
      const req = {
        baseUrl: app.baseUrl,
        params: {},
        form: {
          values: {
            'change-someone-elses-name': someoneElsesNameAnswer
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
      ).toEqual(someoneElsesNameAnswer === 'no' ? ['name'] : []);
      expect(controller.getNextStep(req, {})).toBe(app.baseUrl + nextRoute);
    }
  );
});
