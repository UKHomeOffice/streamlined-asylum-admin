const SaveAndExit = require('../../../apps/saa/behaviours/save-and-exit');

describe('save and exit behaviour', () => {
  const baseSuccessHandler = jest.fn();
  class BaseBehaviour {
    successHandler(req, res, next) {
      return baseSuccessHandler(req, res, next);
    }
  }
  const Behaviour = SaveAndExit(BaseBehaviour);
  let behaviour;
  let req;
  let res;
  let next;

  beforeEach(() => {
    behaviour = new Behaviour();
    req = { sessionModel: { reset: jest.fn() } };
    res = {};
    next = jest.fn();
    baseSuccessHandler.mockReset();
  });

  test('should reset the session before delegating and return the superclass result', () => {
    baseSuccessHandler.mockImplementation(() => {
      expect(req.sessionModel.reset).toHaveBeenCalledTimes(1);
      return 'continued';
    });

    expect(behaviour.successHandler(req, res, next)).toBe('continued');

    expect(baseSuccessHandler).toHaveBeenCalledTimes(1);
    expect(baseSuccessHandler).toHaveBeenCalledWith(req, res, next);
  });

  test('should not delegate if the session cannot be reset', () => {
    const error = new Error('Session reset failed');
    req.sessionModel.reset.mockImplementation(() => { throw error; });

    expect(() => behaviour.successHandler(req, res, next)).toThrow(error);

    expect(baseSuccessHandler).not.toHaveBeenCalled();
  });
});
