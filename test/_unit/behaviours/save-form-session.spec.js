jest.mock('../../../utils/application-service', () => ({
  saveApplication: jest.fn()
}));

jest.mock('../../../config', () => ({
  sessionDefaults: {
    saveExemptions: ['/form-saved'],
    excludedSnapshotKeys: [
      'csrf-secret',
      'user-email',
      'valid-token',
      'errors',
      'errorValues'
    ]
  }
}));

const { saveApplication } = require('../../../utils/application-service');
const SaveFormSession = require('../../../apps/saa/behaviours/save-form-session');
const InformationGiven = require('../../../apps/saa/behaviours/information-given');
const ResumeFormSession = require('../../../apps/saa/behaviours/resume-form-session');
const Model = require('hof/model');

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
        get: jest.fn(key => session[key]),
        set: jest.fn((key, value) => {
          session[key] = value;
        })
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
  ])(
    'should set save-and-exit visibility for %s and retain superclass locals',
    (route, visible) => {
      req.form.options.route = route;

      expect(behaviour.locals(req, res)).toEqual({
        existing: 'local',
        showSaveAndExit: visible
      });
      expect(baseLocals).toHaveBeenCalledWith(req, res);
    }
  );

  test('should save a filtered snapshot and update only the live resume marker before continuing', async () => {
    const original = structuredClone(session);

    expect(await behaviour.successHandler(req, res, next)).toBe('continued');

    expect(saveApplication).toHaveBeenCalledTimes(1);
    expect(saveApplication).toHaveBeenCalledWith(9, {
      'application-id': 9,
      'claimant-unique-application-number': '1234567890123456',
      'claimant-date-of-birth': '1990-01-31',
      'claimants-given-name': 'Alex',
      'last-saved-route': '/claimants-name',
      steps: [
        '/claimants-name',
        '/changes-to-contact-details',
        '/change-personal-details'
      ]
    });
    expect(session).toEqual({
      ...original,
      'last-saved-route': '/claimants-name'
    });
    expect(req.log).toHaveBeenCalledWith(
      'info',
      'Saved form session for application 9'
    );
    expect(baseSuccessHandler).toHaveBeenCalledWith(req, res, next);
    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test.each([undefined, null, []])(
    'should save empty steps when session steps are %p',
    steps => {
      session.steps = steps;

      return behaviour.successHandler(req, res, next).then(() => {
        expect(saveApplication).toHaveBeenCalledWith(
          9,
          expect.objectContaining({ steps: [] })
        );
      });
    }
  );

  test('should save before redirecting when save-and-exit is requested', async () => {
    req.body['save-and-exit'] = 'true';
    session['last-saved-route'] = '/claimant-main-language';
    let resolveSave;
    saveApplication.mockReturnValue(
      new Promise(resolve => {
        resolveSave = resolve;
      })
    );

    const saving = behaviour.successHandler(req, res, next);

    expect(res.redirect).not.toHaveBeenCalled();
    expect(baseSuccessHandler).not.toHaveBeenCalled();
    expect(session['last-saved-route']).toBe('/claimant-main-language');
    expect(req.sessionModel.set).not.toHaveBeenCalled();
    resolveSave({ id: 9 });
    expect(await saving).toBe('redirected');
    expect(session['last-saved-route']).toBe('/claimants-name');
    expect(res.redirect).toHaveBeenCalledWith('/changes/form-saved');
    expect(baseSuccessHandler).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test.each([false, true])(
    'should preserve the saved aggregator summary across repeated entry-page saves with save-and-exit %p',
    async exit => {
      const summaryRoute = '/check-your-answers-add-child-partner';
      req.form.options.route = summaryRoute;
      req.body['save-and-exit'] = 'true';
      session.steps = ['/which-form', '/evidence-child-partner'];
      session.addremovechildpartner = {
        aggregatedValues: [
          { fields: [{ field: 'child-partner-given-name', value: 'Alex' }] }
        ]
      };

      await behaviour.successHandler(req, res, next);

      let snapshot = saveApplication.mock.calls[0][1];
      expect(snapshot['last-saved-route']).toBe(summaryRoute);
      expect(snapshot.steps).not.toContain(summaryRoute);
      expect(snapshot.addremovechildpartner).toEqual(
        session.addremovechildpartner
      );
      expect(session['last-saved-route']).toBe(summaryRoute);
      expect(res.redirect).toHaveBeenCalledWith('/changes/form-saved');

      const ResumeBehaviour = InformationGiven(BaseBehaviour);
      const resumeReq = {
        baseUrl: '/changes',
        form: {
          options: {
            steps: {
              '/evidence-child-partner': { next: summaryRoute },
              [summaryRoute]: { next: '/send-evidence-for-your-claim' }
            }
          }
        },
        sessionModel: { get: key => snapshot[key] }
      };
      expect(new ResumeBehaviour().getNextStep(resumeReq, res)).toBe(
        `/changes${summaryRoute}`
      );

      for (let round = 0; round < 2; round++) {
        session = structuredClone(snapshot);
        const original = structuredClone(session);
        req.form.options.route = '/information-given';
        req.body = exit ? { 'save-and-exit': 'true' } : {};
        res.redirect.mockClear();
        baseSuccessHandler.mockClear();

        await behaviour.successHandler(req, res, next);

        snapshot = saveApplication.mock.calls.at(-1)[1];
        expect(snapshot['last-saved-route']).toBe(summaryRoute);
        expect(snapshot.steps).not.toContain(summaryRoute);
        expect(session).toEqual(original);
        if (exit) {
          expect(res.redirect).toHaveBeenCalledWith('/changes/form-saved');
          expect(baseSuccessHandler).not.toHaveBeenCalled();
        } else {
          expect(baseSuccessHandler).toHaveBeenCalledWith(req, res, next);
          expect(res.redirect).not.toHaveBeenCalled();
        }
        expect(new ResumeBehaviour().getNextStep(resumeReq, res)).toBe(
          `/changes${summaryRoute}`
        );
      }
    }
  );

  test.each([false, true])(
    'should delegate exempt routes without saving, even with save-and-exit %p',
    exit => {
      req.form.options.route = '/form-saved';
      req.body['save-and-exit'] = exit;

      return behaviour.successHandler(req, res, next).then(result => {
        expect(result).toBe('continued');
        expect(baseSuccessHandler).toHaveBeenCalledWith(req, res, next);
        expect(req.sessionModel.toJSON).not.toHaveBeenCalled();
        expect(saveApplication).not.toHaveBeenCalled();
        expect(res.redirect).not.toHaveBeenCalled();
      });
    }
  );

  test.each([
    ['/send-evidence-for-your-claim', false],
    ['/check-your-answers-death', true]
  ])(
    'should resume newer saved progress at %s when the already-loaded draft is selected again',
    async (newRoute, exit) => {
      const summaryRoute = '/check-your-answers-add-child-partner';
      session['last-saved-route'] = summaryRoute;
      session.steps = ['/which-form', '/evidence-child-partner'];
      const loadedDraft = { id: 9, session: structuredClone(session) };
      req.sessionModel = new Model(session);
      req.form.options.steps = {
        '/evidence-child-partner': { next: summaryRoute },
        [summaryRoute]: { next: '/send-evidence-for-your-claim' },
        '/send-evidence-for-your-claim': { next: '/someone-on-claim-died' },
        '/check-your-answers-death': { next: '/something-else' }
      };
      const resume = new (InformationGiven(BaseBehaviour))();
      const loader = new (ResumeFormSession(BaseBehaviour))();
      expect(resume.getNextStep(req, res)).toBe(`/changes${summaryRoute}`);

      req.form.options.route = newRoute;
      req.body = exit ? { 'save-and-exit': 'true' } : {};
      await behaviour.successHandler(req, res, next);

      expect(req.sessionModel.get('last-saved-route')).toBe(newRoute);
      expect(saveApplication.mock.calls[0][1]['last-saved-route']).toBe(
        newRoute
      );
      expect(req.sessionModel.get('steps')).not.toContain(newRoute);
      loader.loadApplication(req, loadedDraft);
      expect(resume.getNextStep(req, res)).toBe(`/changes${newRoute}`);

      req.form.options.route = '/information-given';
      await behaviour.successHandler(req, res, next);
      expect(saveApplication.mock.calls[1][1]['last-saved-route']).toBe(
        newRoute
      );
      expect(resume.getNextStep(req, res)).toBe(`/changes${newRoute}`);
    }
  );

  test.each([9, '9'])(
    'should accept a matching saved application ID %p',
    async id => {
      saveApplication.mockResolvedValue({ id });

      await behaviour.successHandler(req, res, next);

      expect(baseSuccessHandler).toHaveBeenCalledTimes(1);
      expect(next).not.toHaveBeenCalled();
    }
  );

  test.each([undefined, null, {}, { id: 10 }])(
    'should reject an unsuccessful save response %p',
    async saved => {
      req.body['save-and-exit'] = 'true';
      saveApplication.mockResolvedValue(saved);

      await behaviour.successHandler(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(
        new Error('Application could not be saved')
      );
      expect(baseSuccessHandler).not.toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
      expect(req.log).not.toHaveBeenCalled();
      expect(req.sessionModel.set).not.toHaveBeenCalled();
    }
  );

  test.each([false, true])(
    'should stop on API failure with save-and-exit %p',
    async exit => {
      const error = new Error('Save failed');
      session['last-saved-route'] = '/check-your-answers-add-child-partner';
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
      expect(req.sessionModel.set).not.toHaveBeenCalled();
    }
  );

  test('should forward snapshot failures without attempting an API save', async () => {
    const error = new Error('Snapshot failed');
    req.sessionModel.toJSON.mockImplementation(() => {
      throw error;
    });

    await behaviour.successHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(saveApplication).not.toHaveBeenCalled();
    expect(baseSuccessHandler).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
