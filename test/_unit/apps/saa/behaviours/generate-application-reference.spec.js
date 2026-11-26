'use strict';

jest.mock(
  '../../../../../apps/saa/behaviours/check-email-token',
  () => superclass => superclass
);

jest.mock('../../../../../config', () => ({
  ...jest.requireActual('../../../../../config'),
  govukNotify: {
    notifyApiKey: 'notify-key',
    emailTemplates: { submissionConfirmationTemplateId: 'submission-template-id' },
    caseworkerEmail: 'caseworker@example.com'
  }
}));

jest.mock('hof/components/notify/notify', () =>
  jest.fn().mockImplementation(() => ({ sendEmail: jest.fn().mockResolvedValue() }))
);

const { execFileSync } = require('node:child_process');
const Notify = require('hof/components/notify/notify');
const GenerateApplicationReference = require(
  '../../../../../apps/saa/behaviours/generate-application-reference'
);
const app = require('../../../../../apps/saa');
const fields = require('../../../../../apps/saa/fields');
const Controller = require('hof/controller/controller');
const Session = require('hof/controller/behaviour-session');
const Model = require('hof/model');

const declarationRequest = body => {
  const step = app.steps['/declaration'];
  const options = {
    ...step,
    route: '/declaration',
    fields: { 'declaration-check': fields['declaration-check'] }
  };
  const Composed = [...app.behaviours, ...step.behaviours].reduce(
    (BaseController, behaviour) => behaviour(BaseController),
    Session(Controller)
  );
  return {
    controller: new Composed(options),
    request: {
      method: 'POST',
      url: '/',
      path: '/declaration',
      baseUrl: app.baseUrl,
      params: {},
      body,
      sessionModel: new Model({ 'user-email': 'person@example.com' })
    }
  };
};

describe('generate application reference behaviour', () => {
  const notifyClient = Notify.mock.results[0].value;
  const baseSaveValues = jest.fn();
  class Base {
    saveValues(req, res, next) {
      return baseSaveValues(req, res, next);
    }
  }

  const Behaviour = GenerateApplicationReference(Base);
  let controller;
  let req;
  let res;
  let next;
  let session;

  beforeEach(() => {
    controller = new Behaviour();
    session = new Map();
    req = {
      sessionModel: {
        get: jest.fn(key => session.get(key)),
        set: jest.fn((key, value) => session.set(key, value))
      }
    };
    res = {};
    next = jest.fn();
    controller.generateReference = jest.fn().mockResolvedValue('COC-1234ABCDEF');
    baseSaveValues.mockReset();
    notifyClient.sendEmail.mockReset();
    notifyClient.sendEmail.mockResolvedValue();
  });

  test('is configured on the declaration with required validation', () => {
    expect(app.steps['/declaration'].behaviours).toContain(GenerateApplicationReference);
    expect(app.steps['/declaration'].fields).toContain('declaration-check');
    expect(fields['declaration-check'].validate).toContain('required');
    expect(app.steps['/declaration'].next).toBe('/submitted');
  });

  test('stores the reference before continuing on successful submission', async () => {
    baseSaveValues.mockImplementation(() => {
      expect(session.get('application-reference')).toBe('COC-1234ABCDEF');
    });

    await controller.saveValues(req, res, next);

    expect(controller.generateReference).toHaveBeenCalledTimes(1);
    expect(baseSaveValues).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  test('retains the reference when the submission is repeated', async () => {
    await controller.saveValues(req, res, next);
    await controller.saveValues(req, res, next);

    expect(session.get('application-reference')).toBe('COC-1234ABCDEF');
    expect(controller.generateReference).toHaveBeenCalledTimes(1);
    expect(baseSaveValues).toHaveBeenCalledTimes(2);
  });

  test('passes generation errors to the error handler without continuing', async () => {
    const error = new Error('random generator failed');
    controller.generateReference.mockRejectedValue(error);

    await controller.saveValues(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(req.sessionModel.set).not.toHaveBeenCalled();
    expect(baseSaveValues).not.toHaveBeenCalled();
  });

  test('an unchecked declaration does not generate a reference', done => {
    const { controller: routeController, request } = declarationRequest({});
    const generate = jest.spyOn(routeController, 'generateReference');
    const response = { locals: {}, redirect: jest.fn() };

    routeController.post(request, response, errors => {
      try {
        expect(errors['declaration-check']).toMatchObject({ type: 'required' });
        expect(generate).not.toHaveBeenCalled();
        expect(notifyClient.sendEmail).not.toHaveBeenCalled();
        expect(request.sessionModel.get('application-reference')).toBeUndefined();
        expect(response.redirect).not.toHaveBeenCalled();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('a valid declaration uses the session reference in both emails before advancing to submitted', async () => {
    const { controller: routeController, request } = declarationRequest({
      'declaration-check': 'true'
    });
    jest.spyOn(routeController, 'generateReference').mockResolvedValue('COC-1234ABCDEF');
    jest.spyOn(routeController, 'getRowsForSummarySections').mockReturnValue([]);
    notifyClient.sendEmail.mockImplementation(async (templateId, email, personalisation) => {
      expect(request.sessionModel.get('application-reference')).toBe('COC-1234ABCDEF');
      expect(personalisation.submission_ref).toBe(request.sessionModel.get('application-reference'));
    });

    const location = await new Promise((resolve, reject) => {
      routeController.post(request, { locals: {}, redirect: resolve }, reject);
    });

    expect(request.sessionModel.get('application-reference')).toBe('COC-1234ABCDEF');
    expect(notifyClient.sendEmail).toHaveBeenCalledTimes(2);
    expect(notifyClient.sendEmail.mock.calls.map(call => call[1])).toEqual([
      'caseworker@example.com', 'person@example.com'
    ]);
    expect(location).toBe(`${app.baseUrl}/submitted`);
  });

  test('retains the generated reference when retrying after an email failure', async () => {
    const { controller: routeController, request } = declarationRequest({
      'declaration-check': 'true'
    });
    const generate = jest.spyOn(routeController, 'generateReference')
      .mockResolvedValue('COC-1234ABCDEF');
    jest.spyOn(routeController, 'getRowsForSummarySections').mockReturnValue([]);
    notifyClient.sendEmail.mockRejectedValueOnce(new Error('Notify request failed'));

    await expect(new Promise((resolve, reject) => {
      routeController.post(request, { locals: {}, redirect: resolve }, reject);
    })).rejects.toThrow('Notify request failed');

    const location = await new Promise((resolve, reject) => {
      routeController.post(request, { locals: {}, redirect: resolve }, reject);
    });

    expect(generate).toHaveBeenCalledTimes(1);
    expect(notifyClient.sendEmail).toHaveBeenCalledTimes(3);
    notifyClient.sendEmail.mock.calls.forEach(([, , personalisation]) => {
      expect(personalisation.submission_ref).toBe(request.sessionModel.get('application-reference'));
    });
    expect(location).toBe(`${app.baseUrl}/submitted`);
  });

  test('does not send emails if reference generation fails on a valid declaration', async () => {
    const { controller: routeController, request } = declarationRequest({
      'declaration-check': 'true'
    });
    jest.spyOn(routeController, 'generateReference').mockRejectedValue(new Error('random generator failed'));

    await expect(new Promise((resolve, reject) => {
      routeController.post(request, { locals: {}, redirect: resolve }, reject);
    })).rejects.toThrow('random generator failed');

    expect(notifyClient.sendEmail).not.toHaveBeenCalled();
  });

  test('generates ten-character COC-prefixed alphanumeric references', () => {
    const script = `
      const Behaviour = require('./apps/saa/behaviours/generate-application-reference')(class {});
      (async () => {
        const controller = new Behaviour();
        const references = await Promise.all(
          Array.from({ length: 50 }, () => controller.generateReference())
        );
        process.stdout.write(JSON.stringify(references));
      })().catch(error => { console.error(error); process.exitCode = 1; });
    `;
    const references = JSON.parse(execFileSync(process.execPath, ['-e', script], {
      cwd: process.cwd(),
      encoding: 'utf8'
    }));

    expect(references).toHaveLength(50);
    references.forEach(reference => {
      expect(reference).toMatch(/^COC-[A-Z0-9]{10}$/);
    });
  });
});
