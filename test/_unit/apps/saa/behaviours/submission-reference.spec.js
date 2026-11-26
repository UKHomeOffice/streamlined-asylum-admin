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

jest.mock('../../../../../utils/generate-application-reference');

const Notify = require('hof/components/notify/notify');
const generateApplicationReference = require('../../../../../utils/generate-application-reference');
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

describe('submission reference', () => {
  const notifyClient = Notify.mock.results[0].value;

  beforeEach(() => {
    generateApplicationReference.mockReset();
    generateApplicationReference.mockResolvedValue('COC-1234ABCDEF');
    notifyClient.sendEmail.mockReset();
    notifyClient.sendEmail.mockResolvedValue();
  });

  test('is configured on the declaration with required validation', () => {
    expect(app.steps['/declaration'].fields).toContain('declaration-check');
    expect(fields['declaration-check'].validate).toContain('required');
    expect(app.steps['/declaration'].next).toBe('/submitted');
  });

  test('an unchecked declaration does not generate a reference', done => {
    const { controller: routeController, request } = declarationRequest({});
    const response = { locals: {}, redirect: jest.fn() };

    routeController.post(request, response, errors => {
      try {
        expect(errors['declaration-check']).toMatchObject({ type: 'required' });
        expect(generateApplicationReference).not.toHaveBeenCalled();
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
    jest.spyOn(routeController, 'getRowsForSummarySections').mockReturnValue([]);
    notifyClient.sendEmail.mockRejectedValueOnce(new Error('Notify request failed'));

    await expect(new Promise((resolve, reject) => {
      routeController.post(request, { locals: {}, redirect: resolve }, reject);
    })).rejects.toThrow('Notify request failed');

    const location = await new Promise((resolve, reject) => {
      routeController.post(request, { locals: {}, redirect: resolve }, reject);
    });

    expect(generateApplicationReference).toHaveBeenCalledTimes(1);
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
    generateApplicationReference.mockRejectedValue(new Error('random generator failed'));

    await expect(new Promise((resolve, reject) => {
      routeController.post(request, { locals: {}, redirect: resolve }, reject);
    })).rejects.toThrow('random generator failed');

    expect(notifyClient.sendEmail).not.toHaveBeenCalled();
    expect(request.sessionModel.get('application-reference')).toBeUndefined();
  });

  test('does not store a reference or send emails when generation returns no value', async () => {
    const { controller: routeController, request } = declarationRequest({
      'declaration-check': 'true'
    });
    generateApplicationReference.mockResolvedValue('');

    await expect(new Promise((resolve, reject) => {
      routeController.post(request, { locals: {}, redirect: resolve }, reject);
    })).rejects.toThrow('Submission reference is missing');

    expect(notifyClient.sendEmail).not.toHaveBeenCalled();
    expect(request.sessionModel.get('application-reference')).toBeUndefined();
  });

  test('uses an existing reference without regenerating it', async () => {
    const { controller: routeController, request } = declarationRequest({
      'declaration-check': 'true'
    });
    request.sessionModel.set('application-reference', 'COC-HV12YT3344');
    jest.spyOn(routeController, 'getRowsForSummarySections').mockReturnValue([]);

    await new Promise((resolve, reject) => {
      routeController.post(request, { locals: {}, redirect: resolve }, reject);
    });

    expect(generateApplicationReference).not.toHaveBeenCalled();
    expect(notifyClient.sendEmail).toHaveBeenCalledTimes(2);
    notifyClient.sendEmail.mock.calls.forEach(([, , personalisation]) => {
      expect(personalisation.submission_ref).toBe('COC-HV12YT3344');
    });
  });
});
