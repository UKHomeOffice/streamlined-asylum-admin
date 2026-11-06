const InformationGiven = require('../../../apps/saa/behaviours/information-given');
const EditRouteStart = require('../../../apps/saa/behaviours/edit-route-start');
const Session = require('hof/controller/behaviour-session');
const BaseController = require('hof/controller/base-controller');
const Model = require('hof/model');

describe('information given behaviour', () => {
  const baseGetNextStep = jest.fn();
  class BaseBehaviour {
    getNextStep(req, res) {
      return baseGetNextStep(req, res);
    }
  }
  const Behaviour = InformationGiven(BaseBehaviour);
  const steps = {
    '/continue-to-form': { next: '/which-form' },
    '/which-form': { next: '/information-given' },
    '/information-given': { next: '/claimants-name' },
    '/claimants-name': { next: '/claimant-main-language' },
    '/claimant-main-language': { next: '/person-completing-form' },
    '/check-your-answers-add-child-partner': {
      next: '/send-evidence-for-your-claim'
    },
    '/check-your-answers-death': { next: '/something-else' },
    '/confirm': {},
    '/form-saved': {},
    '/submitted': {}
  };
  let behaviour;
  let req;
  let res;
  let savedSteps;
  let savedRoute;

  beforeEach(() => {
    behaviour = new Behaviour();
    savedSteps = ['/continue-to-form', '/which-form'];
    savedRoute = undefined;
    req = {
      baseUrl: '/changes',
      path: '/information-given',
      form: { options: { steps, next: '/claimants-name' } },
      sessionModel: {
        get: jest.fn(key => (key === 'steps' ? savedSteps : savedRoute))
      }
    };
    res = {};
    baseGetNextStep.mockReset().mockReturnValue('/changes/claimants-name');
  });

  test('should return to the last completed route without mutating progress', () => {
    savedSteps.push(
      '/claimants-name',
      '/claimant-main-language',
      '/information-given'
    );
    const original = [...savedSteps];

    expect(behaviour.getNextStep(req, res)).toBe(
      '/changes/claimant-main-language'
    );
    expect(savedSteps).toEqual(original);
    expect(baseGetNextStep).not.toHaveBeenCalled();
  });

  test('should prefer the saved summary route even when it is absent from completed steps', () => {
    savedSteps.push('/claimants-name');
    savedRoute = '/check-your-answers-add-child-partner';

    expect(behaviour.getNextStep(req, res)).toBe(
      '/changes/check-your-answers-add-child-partner'
    );
    expect(savedSteps).not.toContain(savedRoute);
  });

  test.each(['/removed-route', '/form-saved', '/information-given', 123])(
    'should ignore invalid saved-route marker %p',
    route => {
      savedRoute = route;
      savedSteps.push('/claimant-main-language');

      expect(behaviour.getNextStep(req, res)).toBe(
        '/changes/claimant-main-language'
      );
    }
  );

  test('should use a saved confirmation route without completed-step history', () => {
    savedRoute = '/confirm';
    savedSteps = undefined;

    expect(behaviour.getNextStep(req, res)).toBe('/changes/confirm');
  });

  test.each([
    undefined,
    null,
    [],
    'invalid',
    ['/continue-to-form', '/which-form', '/information-given']
  ])(
    'should use the normal first question when saved progress is %p',
    progress => {
      savedSteps = progress;

      expect(behaviour.getNextStep(req, res)).toBe('/changes/claimants-name');
      expect(baseGetNextStep).toHaveBeenCalledWith(req, res);
    }
  );

  test.each([
    '/removed-route',
    '/claimants-name/edit',
    '/form-saved',
    '/submitted'
  ])('should ignore non-resumable route %s', route => {
    savedSteps.push('/claimants-name', route);

    expect(behaviour.getNextStep(req, res)).toBe('/changes/claimants-name');
    expect(baseGetNextStep).not.toHaveBeenCalled();
  });

  test.each([
    '/check-your-answers-add-child-partner',
    '/check-your-answers-death',
    '/confirm'
  ])(
    'should return directly to saved summary %s without reconstructing its loop',
    route => {
      savedSteps.push(route, '/information-given');

      expect(behaviour.getNextStep(req, res)).toBe(`/changes${route}`);
    }
  );

  test('should use the current app base URL', () => {
    req.baseUrl = '/another-app';
    savedSteps.push('/claimant-main-language');

    expect(behaviour.getNextStep(req, res)).toBe(
      '/another-app/claimant-main-language'
    );
  });

  test('should preserve HOF saving and edit cleanup before the Continue redirect', () => {
    const Controller = InformationGiven(
      EditRouteStart(Session(BaseController))
    );
    const controller = new Controller({ steps, next: '/claimants-name' });
    req.sessionModel = new Model({
      steps: ['/continue-to-form', '/which-form', '/claimant-main-language'],
      'edit-return-path': '/changes/information-given'
    });
    req.form.values = {};
    res.redirect = jest.fn();
    controller.on('complete', () => {
      req.sessionModel.set('steps', [
        ...req.sessionModel.get('steps'),
        '/information-given'
      ]);
    });

    controller.saveValues(req, res, error => {
      expect(error).toBeUndefined();
      controller.successHandler(req, res);
    });

    expect(req.sessionModel.get('edit-return-path')).toBeUndefined();
    expect(req.sessionModel.get('steps')).toContain('/information-given');
    expect(res.redirect).toHaveBeenCalledWith(
      '/changes/claimant-main-language'
    );
  });
});
