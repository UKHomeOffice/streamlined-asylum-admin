jest.mock('../../../utils/application-service', () => ({
  saveApplication: jest.fn()
}));

jest.mock('../../../config', () => ({
  sessionDefaults: {
    saveExemptions: ['/form-saved'],
    excludedSnapshotKeys: [
      'csrf-secret', 'user-email', 'valid-token', 'errors', 'errorValues'
    ]
  }
}));

const { saveApplication } = require('../../../utils/application-service');
const SaveFormSession = require('../../../apps/saa/behaviours/save-form-session');

describe('save form session behaviour', () => {
  const baseLocals = jest.fn();
  const baseSuccessHandler = jest.fn();
  class BaseBehaviour {
    locals(req, res) {
      return baseLocals(req, res);
    }

    successHandler(req, res, next) {
      return baseSuccessHandler(req, res, next);
    }
  }
  const Behaviour = SaveFormSession(BaseBehaviour);
  let behaviour;
  let req;
  let res;
  let next;
  let session;

  beforeEach(() => {
    behaviour = new Behaviour();
    session = {
      'application-id': 9,
      'claimant-unique-application-number': '1234567890123456',
      'claimant-date-of-birth': '1990-01-31',
      'claimants-given-name': 'Alex',
      'csrf-secret': 'secret',
      'user-email': 'person@example.com',
      'valid-token': true,
      errors: { field: 'error' },
      errorValues: { field: 'attempted value' },
      steps: [
        '/claimants-name',
        '/claimants-name/change',
        '/claimants-name/edit/0',
        '/dependants/delete/1',
        '/changes-to-contact-details',
        '/change-personal-details'
      ]
    };
    req = {
      form: { options: { route: '/claimants-name' } },
      body: {},
      baseUrl: '/changes',
      sessionModel: {
        toJSON: jest.fn(() => structuredClone(session)),
        get: jest.fn(key => session[key])
      },
      log: jest.fn()
    };
    res = { redirect: jest.fn().mockReturnValue('redirected') };
    next = jest.fn();
    baseLocals.mockReset().mockReturnValue({ existing: 'local' });
    baseSuccessHandler.mockReset().mockReturnValue('continued');
    saveApplication.mockReset().mockResolvedValue({ id: 9 });
  });

  test.each([
    ['/claimants-name', true],
    ['/form-saved', false]
  ])('should set save-and-exit visibility for %s and retain superclass locals', (route, visible) => {
    req.form.options.route = route;

    expect(behaviour.locals(req, res)).toEqual({
      existing: 'local', showSaveAndExit: visible
    });
    expect(baseLocals).toHaveBeenCalledWith(req, res);
  });

  test('should save a filtered snapshot without changing the live session before continuing', async () => {
    const original = structuredClone(session);

    expect(await behaviour.successHandler(req, res, next)).toBe('continued');

    expect(saveApplication).toHaveBeenCalledTimes(1);
    expect(saveApplication).toHaveBeenCalledWith(9, {
      'application-id': 9,
      'claimant-unique-application-number': '1234567890123456',
      'claimant-date-of-birth': '1990-01-31',
      'claimants-given-name': 'Alex',
      steps: ['/claimants-name', '/changes-to-contact-details', '/change-personal-details']
    });
    expect(session).toEqual(original);
    expect(req.log).toHaveBeenCalledWith('info', 'Saved form session for application 9');
    expect(baseSuccessHandler).toHaveBeenCalledWith(req, res, next);
    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test.each([undefined, null, []])('should save empty steps when session steps are %p', steps => {
    session.steps = steps;

    return behaviour.successHandler(req, res, next).then(() => {
      expect(saveApplication).toHaveBeenCalledWith(9, expect.objectContaining({ steps: [] }));
    });
  });

  test('should save before redirecting when save-and-exit is requested', async () => {
    req.body['save-and-exit'] = 'true';
    let resolveSave;
    saveApplication.mockReturnValue(new Promise(resolve => { resolveSave = resolve; }));

    const saving = behaviour.successHandler(req, res, next);

    expect(res.redirect).not.toHaveBeenCalled();
    expect(baseSuccessHandler).not.toHaveBeenCalled();
    resolveSave({ id: 9 });
    expect(await saving).toBe('redirected');
    expect(res.redirect).toHaveBeenCalledWith('/changes/form-saved');
    expect(baseSuccessHandler).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test.each([false, true])('should delegate exempt routes without saving, even with save-and-exit %p', exit => {
    req.form.options.route = '/form-saved';
    req.body['save-and-exit'] = exit;

    return behaviour.successHandler(req, res, next).then(result => {
      expect(result).toBe('continued');
      expect(baseSuccessHandler).toHaveBeenCalledWith(req, res, next);
      expect(req.sessionModel.toJSON).not.toHaveBeenCalled();
      expect(saveApplication).not.toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });
  });

  test.each([9, '9'])('should accept a matching saved application ID %p', async id => {
    saveApplication.mockResolvedValue({ id });

    await behaviour.successHandler(req, res, next);

    expect(baseSuccessHandler).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  test.each([undefined, null, {}, { id: 10 }])('should reject an unsuccessful save response %p', async saved => {
    req.body['save-and-exit'] = 'true';
    saveApplication.mockResolvedValue(saved);

    await behaviour.successHandler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new Error('Application could not be saved'));
    expect(baseSuccessHandler).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
    expect(req.log).not.toHaveBeenCalled();
  });

  test.each([false, true])('should stop on API failure with save-and-exit %p', async exit => {
    const error = new Error('Save failed');
    const original = structuredClone(session);
    req.body['save-and-exit'] = exit;
    saveApplication.mockRejectedValue(error);

    await behaviour.successHandler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
    expect(session).toEqual(original);
    expect(baseSuccessHandler).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
    expect(req.log).not.toHaveBeenCalled();
  });

  test('should forward snapshot failures without attempting an API save', async () => {
    const error = new Error('Snapshot failed');
    req.sessionModel.toJSON.mockImplementation(() => { throw error; });

    await behaviour.successHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(saveApplication).not.toHaveBeenCalled();
    expect(baseSuccessHandler).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
