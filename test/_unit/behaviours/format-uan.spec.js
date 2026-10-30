const FormatUan = require('../../../apps/common/behaviours/format-uan');

describe('format UAN behaviour', () => {
  const key = 'claimant-unique-application-number';
  const baseSuccessHandler = jest.fn();

  class BaseBehaviour {
    successHandler(req, res, next) {
      return baseSuccessHandler(req, res, next);
    }
  }

  const Behaviour = FormatUan(BaseBehaviour);
  let behaviour;
  let req;
  let res;
  let next;

  beforeEach(() => {
    behaviour = new Behaviour();
    req = {
      form: { values: {} },
      sessionModel: { set: jest.fn() }
    };
    res = {};
    next = jest.fn();
  });

  test.each([
    '1234 5678 9012 3456',
    '1234-5678-9012-3456',
    '1234 - 5678 - 9012 - 3456'
  ])('should store UAN %p in the session as digits only', value => {
    req.form.values[key] = value;

    behaviour.successHandler(req, res, next);

    expect(req.sessionModel.set).toHaveBeenCalledWith(key, '1234567890123456');
  });

  test('should store the UAN before continuing to the next step', () => {
    req.form.values[key] = '1234-5678-9012-3456';
    baseSuccessHandler.mockImplementationOnce(() => {
      expect(req.sessionModel.set).toHaveBeenCalled();
    });

    behaviour.successHandler(req, res, next);

    expect(baseSuccessHandler).toHaveBeenCalledWith(req, res, next);
  });

  test('should continue without updating the session when no UAN was submitted', () => {
    behaviour.successHandler(req, res, next);

    expect(req.sessionModel.set).not.toHaveBeenCalled();
    expect(baseSuccessHandler).toHaveBeenCalledWith(req, res, next);
  });
});
