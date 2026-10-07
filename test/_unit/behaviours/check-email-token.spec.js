jest.mock('../../../utils/check-token', () => ({
  read: jest.fn(),
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
const { auth } = require('../../../config');
const CheckEmailToken = require('../../../apps/saa/behaviours/check-email-token');

describe('check email token behaviour', () => {
  const baseGetValues = jest.fn();
  const baseSaveValues = jest.fn();

  class BaseBehaviour {
    getValues(req, res, next) {
      return baseGetValues(req, res, next);
    }

    saveValues(req, res, next) {
      return baseSaveValues(req, res, next);
    }
  }

  const Behaviour = CheckEmailToken(BaseBehaviour);
  let behaviour;
  let next;
  let req;
  let res;
  let session;

  beforeEach(() => {
    behaviour = new Behaviour();
    next = jest.fn();
    session = new Map();
    req = {
      method: 'GET',
      query: {
        token: 'token-id'
      },
      sessionModel: {
        get: jest.fn(key => session.get(key)),
        set: jest.fn((key, value) => session.set(key, value)),
        unset: jest.fn(key => session.delete(key))
      },
      log: jest.fn()
    };
    res = {
      redirect: jest.fn()
    };
    baseGetValues.mockReset();
    baseSaveValues.mockReset();
    auth.allowSkip = true;
    auth.skipEmail = 'skip@example.com';
    getToken.read.mockReset();
    getToken.consume.mockReset();
  });

  test('should defer configured skip authentication until continuation POST', async () => {
    req.query = {
      token: 'skip',
      email: 'someone-else@example.com'
    };

    await behaviour.getValues(req, res, next);

    expect([...session]).toEqual([['pending-email-token', 'skip']]);
    req.method = 'POST';
    req.query = {};
    await behaviour.saveValues(req, res, next);

    expect(getToken.read).not.toHaveBeenCalled();
    expect(getToken.consume).not.toHaveBeenCalled();
    expect(req.sessionModel.set).toHaveBeenCalledWith(
      'user-email',
      'skip@example.com'
    );
    expect(baseGetValues).toHaveBeenCalledWith(req, res, next);
    expect(baseSaveValues).toHaveBeenCalledWith(req, res, next);
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

  test('should read on GET without consuming the token or authenticating the session', async () => {
    getToken.read.mockResolvedValue({
      valid: 'token-id',
      email: 'person@example.com'
    });

    await behaviour.getValues(req, res, next);

    expect(getToken.read).toHaveBeenCalledWith('token-id');
    expect(getToken.consume).not.toHaveBeenCalled();
    expect([...session]).toEqual([['pending-email-token', 'token-id']]);
    expect(baseGetValues).toHaveBeenCalledWith(req, res, next);
  });

  test('should redirect to the invalid token path when the token is not valid', async () => {
    getToken.read.mockResolvedValue({
      valid: null,
      email: 'person@example.com'
    });

    await behaviour.getValues(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/updates/expired-link');
    expect(baseGetValues).not.toHaveBeenCalled();
  });

  test('should log and redirect to the invalid token path when token lookup fails', async () => {
    getToken.read.mockRejectedValue(new Error('redis unavailable'));

    await behaviour.getValues(req, res, next);

    expect(req.log).toHaveBeenCalledWith(
      'error',
      'Check Token Error: Error: redis unavailable'
    );
    expect(res.redirect).toHaveBeenCalledWith('/updates/expired-link');
    expect(baseGetValues).not.toHaveBeenCalled();
  });

  test('should authenticate only one session when concurrent POSTs consume the same token', async () => {
    req.method = 'POST';
    session.set('pending-email-token', 'token-id');
    getToken.consume
      .mockResolvedValueOnce({ valid: 'token-id', email: 'person@example.com' })
      .mockResolvedValueOnce({ valid: null, email: null });
    const secondReq = {
      ...req,
      sessionModel: {
        get: jest.fn(key =>
          key === 'pending-email-token' ? 'token-id' : undefined
        ),
        set: jest.fn(),
        unset: jest.fn()
      }
    };
    const secondRes = { redirect: jest.fn() };

    await Promise.all([
      behaviour.saveValues(req, res, next),
      behaviour.saveValues(secondReq, secondRes, next)
    ]);

    expect(req.sessionModel.set).toHaveBeenCalledWith('valid-token', true);
    expect(secondReq.sessionModel.set).not.toHaveBeenCalled();
    expect(secondRes.redirect).toHaveBeenCalledWith('/updates/expired-link');
    expect(baseSaveValues).toHaveBeenCalledTimes(1);
  });

  test('should consume the pending token on POST and authenticate using the consumed email', async () => {
    getToken.read.mockResolvedValue({
      valid: 'token-id',
      email: 'person@example.com'
    });
    await behaviour.getValues(req, res, next);
    req.method = 'POST';
    req.query = {};
    getToken.consume.mockResolvedValue({
      valid: 'token-id',
      email: 'verified@example.com'
    });

    await behaviour.getValues(req, res, next);
    expect(getToken.read).toHaveBeenCalledTimes(1);
    expect(getToken.consume).not.toHaveBeenCalled();
    await behaviour.saveValues(req, res, next);

    expect(getToken.consume).toHaveBeenCalledWith('token-id');
    expect(session.get('valid-token')).toBe(true);
    expect(session.get('user-email')).toBe('verified@example.com');
    expect(session.has('pending-email-token')).toBe(false);
    expect(baseSaveValues).toHaveBeenCalledWith(req, res, next);
  });

  test.each([
    { valid: null, email: null },
    { valid: 'token-id', email: null }
  ])(
    'should reject expired or incomplete token data at continuation: %j',
    async user => {
      session.set('pending-email-token', 'token-id');
      getToken.consume.mockResolvedValue(user);

      await behaviour.saveValues(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(auth.invalidTokenPath);
      expect(session.has('valid-token')).toBe(false);
      expect(session.has('user-email')).toBe(false);
      expect(session.has('pending-email-token')).toBe(false);
      expect(baseSaveValues).not.toHaveBeenCalled();
    }
  );

  test('should reject a direct POST without a pending token', async () => {
    req.method = 'POST';

    await behaviour.getValues(req, res, next);
    await behaviour.saveValues(req, res, next);

    expect(getToken.read).not.toHaveBeenCalled();
    expect(getToken.consume).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(auth.invalidTokenPath);
    expect(baseSaveValues).not.toHaveBeenCalled();
  });

  test('should preserve a verified session on repeat continuation POST', async () => {
    session.set('valid-token', true);
    session.set('user-email', 'person@example.com');

    await behaviour.saveValues(req, res, next);

    expect(getToken.consume).not.toHaveBeenCalled();
    expect(req.sessionModel.set).not.toHaveBeenCalled();
    expect(baseSaveValues).toHaveBeenCalledWith(req, res, next);
  });

  test('should log consumption errors without authenticating', async () => {
    session.set('pending-email-token', 'token-id');
    getToken.consume.mockRejectedValue(new Error('redis unavailable'));

    await behaviour.saveValues(req, res, next);

    expect(req.log).toHaveBeenCalledWith(
      'error',
      'Check Token Error: Error: redis unavailable'
    );
    expect(res.redirect).toHaveBeenCalledWith(auth.invalidTokenPath);
    expect(baseSaveValues).not.toHaveBeenCalled();
  });

  test.each([undefined, '', ['token-id']])(
    'should reject missing or malformed GET tokens: %j',
    async token => {
      session.set('pending-email-token', 'old-token');
      req.query.token = token;

      await behaviour.getValues(req, res, next);

      expect(session.has('pending-email-token')).toBe(false);
      expect(getToken.read).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(auth.invalidTokenPath);
    }
  );

  test('should reject skip tokens when skip authentication is disabled', async () => {
    auth.allowSkip = false;
    req.query.token = 'skip';
    getToken.read.mockResolvedValue({ valid: null, email: null });

    await behaviour.getValues(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(auth.invalidTokenPath);
    expect(session.has('valid-token')).toBe(false);
  });
});
