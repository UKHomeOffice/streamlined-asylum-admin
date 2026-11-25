'use strict';

jest.mock(
  '../../../apps/saa/behaviours/check-email-token',
  () => superclass => superclass
);
jest.mock(
  '../../../apps/saa/behaviours/send-submission-emails',
  () => superclass => superclass
);

jest.mock(
  '../../../apps/common/behaviours/send-verification-email',
  () => superclass => superclass
);

const common = require('../../../apps/common');
const saa = require('../../../apps/saa');
const settings = require('../../../hof.settings.json');
const FormController = require('hof/controller');
const Model = require('hof/model');

describe('session-ended routes', () => {
  test.each([common, saa])(
    '$name clears the journey session before expiry when exiting the form',
    app => {
      const Controller = settings.behaviours.reduce(
        (superclass, behaviour) => require(behaviour)(superclass),
        FormController
      );
      const controller = new Controller({
        ...app.steps[app.exitStep],
        steps: app.steps
      });
      const sessionModel = new Model({
        'claimant-unique-application-number': '1234567890123456',
        'claimant-date-of-birth': '1990-01-31'
      });
      const reset = jest.spyOn(sessionModel, 'reset');
      const callback = jest.fn();

      controller.getValues(
        { path: app.exitStep, sessionModel },
        { locals: {} },
        callback
      );

      expect(callback).toHaveBeenCalledWith(null, expect.any(Object));
      expect(reset).toHaveBeenCalledTimes(1);
      expect(sessionModel.toJSON()).toEqual({});
    }
  );
});
