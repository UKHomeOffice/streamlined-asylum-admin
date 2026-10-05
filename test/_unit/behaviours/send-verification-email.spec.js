jest.mock('../../../config', () => ({
  govukNotify: {
    notifyApiKey: 'notify-key',
    emailTemplates: {
      userVerifyEmailTemplateId: 'verify-template-id'
    }
  },
  env: 'test',
  auth: {
    continueAppPath: '/check-your-email',
    allowSkip: true,
    skipEmail: 'SKIP@EXAMPLE.COM'
  }
}));

jest.mock('hof/components/notify/notify', () =>
  jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn()
  }))
);

jest.mock('hof/lib/logger', () =>
  jest.fn(() => ({
    log: jest.fn(),
    error: jest.fn()
  }))
);

jest.mock('../../../utils/save-token', () => ({
  save: jest.fn()
}));

const Notify = require('hof/components/notify/notify');
const logger = require('hof/lib/logger');
const tokenGenerator = require('../../../utils/save-token');
const SendVerificationEmail = require('../../../apps/common/behaviours/send-verification-email');

describe('send verification email behaviour', () => {
  const notifyClient = Notify.mock.results[0].value;
  const log = logger.mock.results[0].value;
  const baseSaveValues = jest.fn((req, res, next) => next());

  class BaseBehaviour {
    saveValues(req, res, next) {
      return baseSaveValues(req, res, next);
    }
  }

  const Behaviour = SendVerificationEmail(BaseBehaviour);
  let behaviour;
  let next;
  let req;
  let res;

  beforeEach(() => {
    behaviour = new Behaviour();
    next = jest.fn();
    res = {
      redirect: jest.fn()
    };
    req = {
      protocol: 'https',
      form: {
        values: {
          'user-email': 'person@example.com'
        }
      },
      sessionModel: {
        get: jest.fn()
      },
      get: jest.fn().mockReturnValue('example.com')
    };
    baseSaveValues.mockClear();
    baseSaveValues.mockImplementation((request, response, callback) => callback());
    tokenGenerator.save.mockResolvedValue('token');
    tokenGenerator.save.mockClear();
    notifyClient.sendEmail.mockReset();
    notifyClient.sendEmail.mockResolvedValue();
    log.log.mockReset();
    log.error.mockReset();
  });

  test('should redirect with a skip token when skip email verification is allowed', async () => {
    req.form.values['user-email'] = 'skip@example.com';

    await behaviour.saveValues(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/check-your-email?token=skip');
    expect(baseSaveValues).not.toHaveBeenCalled();
    expect(tokenGenerator.save).not.toHaveBeenCalled();
    expect(notifyClient.sendEmail).not.toHaveBeenCalled();
  });

  test('should save a token and send a verification email', async () => {
    await behaviour.saveValues(req, res, next);

    expect(baseSaveValues).toHaveBeenCalledWith(req, res, expect.any(Function));
    expect(tokenGenerator.save).toHaveBeenCalledWith('person@example.com');
    expect(notifyClient.sendEmail).toHaveBeenCalledWith(
      'verify-template-id',
      'person@example.com',
      {
        link: 'https://example.com/check-your-email?token=token'
      }
    );
    expect(log.log).toHaveBeenCalledWith('info', 'verification email sent to user');
    expect(next).toHaveBeenCalledWith();
  });

  test('should lower case the form email before saving the token and sending the email', async () => {
    req.form.values['user-email'] = 'PERSON@EXAMPLE.COM';

    await behaviour.saveValues(req, res, next);

    expect(tokenGenerator.save).toHaveBeenCalledWith('person@example.com');
    expect(notifyClient.sendEmail).toHaveBeenCalledWith(
      'verify-template-id',
      'person@example.com',
      expect.any(Object)
    );
    expect(req.sessionModel.get).not.toHaveBeenCalled();
  });

  test('should use a lower case session email when the form email is missing', async () => {
    req.form.values['user-email'] = '';
    req.sessionModel.get.mockReturnValue('SESSION@EXAMPLE.COM');

    await behaviour.saveValues(req, res, next);

    expect(req.sessionModel.get).toHaveBeenCalledWith('user-email');
    expect(tokenGenerator.save).toHaveBeenCalledWith('session@example.com');
    expect(notifyClient.sendEmail).toHaveBeenCalledWith(
      'verify-template-id',
      'session@example.com',
      expect.any(Object)
    );
  });

  test('should pass an error to next when no email is available', async () => {
    req.form.values['user-email'] = '';

    await behaviour.saveValues(req, res, next);

    expect(log.error).toHaveBeenCalledWith('Email address is required');
    expect(next).toHaveBeenCalledWith('Email address is required');
    expect(baseSaveValues).not.toHaveBeenCalled();
  });

  test('should pass superclass save errors to next', async () => {
    const error = new Error('save failed');
    baseSaveValues.mockImplementation((request, response, callback) => callback(error));

    await behaviour.saveValues(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(tokenGenerator.save).not.toHaveBeenCalled();
    expect(notifyClient.sendEmail).not.toHaveBeenCalled();
  });

  test('should log and propagate token save errors', async () => {
    const error = new Error('redis unavailable');
    tokenGenerator.save.mockRejectedValue(error);

    await behaviour.saveValues(req, res, next);

    expect(log.error).toHaveBeenCalledWith(
      'Error in the saveValues method redis unavailable'
    );
    expect(next).toHaveBeenCalledWith(error);
    expect(notifyClient.sendEmail).not.toHaveBeenCalled();
  });

  test('should log and propagate HOF Notify errors', async () => {
    const error = new Error(
      "Can't send to this recipient using a team-only API key"
    );
    notifyClient.sendEmail.mockRejectedValue(error);

    await behaviour.saveValues(req, res, next);

    expect(log.error).toHaveBeenCalledWith(`Error sending email: ${error}`);
    expect(log.error).toHaveBeenCalledWith(
      `Error in the saveValues method ${error.message}`
    );
    expect(next).toHaveBeenCalledWith(error);
  });

  test('should log object-string HOF Notify errors without changing them', async () => {
    const error = new Error('[object Object]');
    notifyClient.sendEmail.mockRejectedValue(error);

    await behaviour.saveValues(req, res, next);

    expect(log.error).toHaveBeenCalledWith(`Error sending email: ${error}`);
    expect(log.error).toHaveBeenCalledWith(
      `Error in the saveValues method ${error.message}`
    );
    expect(next).toHaveBeenCalledWith(error);
  });
});
