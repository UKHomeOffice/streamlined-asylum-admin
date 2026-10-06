jest.mock('../../../utils/check-token', () => ({
  consume: jest.fn()
}));

jest.mock('../../../config', () => ({
  auth: {
    allowSkip: true,
    skipEmail: 'skip@example.com',
    invalidTokenPath: '/updates/expired-link'
  }
}));

const getToken = require('../../../utils/check-token');
const CheckEmailToken = require('../../../apps/saa/behaviours/check-email-token');

describe('check email token behaviour', () => {
  const baseGetValues = jest.fn();

  class BaseBehaviour {
    getValues(req, res, next) {
      return baseGetValues(req, res, next);
    }
  }

  const Behaviour = CheckEmailToken(BaseBehaviour);
  let behaviour;
  let next;
  let req;
  let res;

  beforeEach(() => {
    behaviour = new Behaviour();
    next = jest.fn();
    req = {
      query: {
        token: 'token-id'
      },
      sessionModel: {
        get: jest.fn(),
        set: jest.fn()
      },
      log: jest.fn()
    };
    res = {
      redirect: jest.fn()
    };
    baseGetValues.mockReset();
    getToken.consume.mockReset();
  });

  test('should skip token validation when skip auth is allowed', async () => {
    req.query = {
      token: 'skip',
      email: 'someone-else@example.com'
    };

    await behaviour.getValues(req, res, next);

    expect(getToken.consume).not.toHaveBeenCalled();
    expect(req.sessionModel.set).toHaveBeenCalledWith(
      'user-email',
      'skip@example.com'
    );
    expect(baseGetValues).toHaveBeenCalledWith(req, res, next);
  });

  test('should continue with the stored session email when the session already has a valid token', async () => {
    req.query.email = 'someone-else@example.com';
    req.sessionModel.get.mockImplementation(
      key =>
        ({
          'user-email': 'person@example.com',
          'valid-token': true
        })[key]
    );

    await behaviour.getValues(req, res, next);

    expect(getToken.consume).not.toHaveBeenCalled();
    expect(req.sessionModel.set).not.toHaveBeenCalled();
    expect(baseGetValues).toHaveBeenCalledWith(req, res, next);
  });

  test('should consume a token and continue with the token email', async () => {
    getToken.consume.mockResolvedValue({
      valid: 'token-id',
      email: 'person@example.com'
    });

    await behaviour.getValues(req, res, next);

    expect(getToken.consume).toHaveBeenCalledWith('token-id');
    expect(req.sessionModel.set).toHaveBeenCalledWith('valid-token', true);
    expect(req.sessionModel.set).toHaveBeenCalledWith(
      'user-email',
      'person@example.com'
    );
    expect(baseGetValues).toHaveBeenCalledWith(req, res, next);
  });

  test('should redirect to the invalid token path when the token is not valid', async () => {
    getToken.consume.mockResolvedValue({
      valid: null,
      email: 'person@example.com'
    });

    await behaviour.getValues(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/updates/expired-link');
    expect(baseGetValues).not.toHaveBeenCalled();
  });

  test('should log and redirect to the invalid token path when token lookup fails', async () => {
    getToken.consume.mockRejectedValue(new Error('redis unavailable'));

    await behaviour.getValues(req, res, next);

    expect(req.log).toHaveBeenCalledWith(
      'error',
      'Check Token Error: Error: redis unavailable'
    );
    expect(res.redirect).toHaveBeenCalledWith('/updates/expired-link');
    expect(baseGetValues).not.toHaveBeenCalled();
  });

  test('should authenticate only one session when concurrent requests consume the same token', async () => {
    getToken.consume
      .mockResolvedValueOnce({ valid: 'token-id', email: 'person@example.com' })
      .mockResolvedValueOnce({ valid: null, email: null });
    const secondReq = {
      ...req,
      sessionModel: { get: jest.fn(), set: jest.fn() }
    };
    const secondRes = { redirect: jest.fn() };

    await Promise.all([
      behaviour.getValues(req, res, next),
      behaviour.getValues(secondReq, secondRes, next)
    ]);

    expect(req.sessionModel.set).toHaveBeenCalledWith('valid-token', true);
    expect(secondReq.sessionModel.set).not.toHaveBeenCalled();
    expect(secondRes.redirect).toHaveBeenCalledWith('/updates/expired-link');
    expect(baseGetValues).toHaveBeenCalledTimes(1);
  });
});
