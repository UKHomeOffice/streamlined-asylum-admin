jest.mock('../../../utils', () => ({
  isValidUan: jest.requireActual('../../../utils').isValidUan,
  formatUanForDisplay: jest.fn().mockReturnValue('1234-5678-9012-3456')
}));

const { formatUanForDisplay } = require('../../../utils');
const FormatUanForDisplay = require('../../../apps/common/behaviours/format-uan-for-display');
const Session = require('hof/controller/behaviour-session');

describe('format UAN for display behaviour', () => {
  const baseGetValues = jest.fn();
  const key = 'claimant-unique-application-number';

  class BaseBehaviour {
    getValues(req, res, next) {
      return baseGetValues(req, res, next);
    }
  }

  const Behaviour = FormatUanForDisplay(BaseBehaviour);
  let behaviour;
  let req;
  let res;
  let next;
  let values;

  beforeEach(() => {
    behaviour = new Behaviour();
    req = {
      method: 'GET',
      sessionModel: { set: jest.fn() }
    };
    res = {};
    next = jest.fn();
    values = { [key]: '1234567890123456', answer: 'unchanged' };
    baseGetValues.mockReset();
    baseGetValues.mockImplementation((request, response, callback) =>
      callback(null, values)
    );
  });

  test('should format a copy of the GET values without changing the session or source values', () => {
    behaviour.getValues(req, res, next);

    expect(baseGetValues).toHaveBeenCalledWith(req, res, expect.any(Function));
    expect(next).toHaveBeenCalledWith(null, {
      [key]: '1234-5678-9012-3456',
      answer: 'unchanged'
    });
    expect(next.mock.calls[0][1]).not.toBe(values);
    expect(values[key]).toBe('1234567890123456');
    expect(req.sessionModel.set).not.toHaveBeenCalled();
  });

  test('should leave POST historical values unchanged', () => {
    req.method = 'POST';

    behaviour.getValues(req, res, next);

    expect(next).toHaveBeenCalledWith(null, values);
    expect(next.mock.calls[0][1]).toBe(values);
    expect(formatUanForDisplay).not.toHaveBeenCalled();
    expect(req.sessionModel.set).not.toHaveBeenCalled();
  });

  test.each([undefined, null, ''])(
    'should leave an absent or empty UAN %p unchanged',
    value => {
      values[key] = value;

      behaviour.getValues(req, res, next);

      expect(next).toHaveBeenCalledWith(null, values);
      expect(formatUanForDisplay).not.toHaveBeenCalled();
    }
  );

  test('should handle missing superclass values without formatting', () => {
    values = undefined;

    behaviour.getValues(req, res, next);

    expect(next).toHaveBeenCalledWith(null, undefined);
    expect(formatUanForDisplay).not.toHaveBeenCalled();
  });

  test.each([
    '123',
    '12345678901234567',
    '1234abcd56789012',
    '1234 5678 9012 3456',
    '1234567890123456\n',
    1234567890123456
  ])('should redisplay invalid attempted UAN %p without formatting', value => {
    values[key] = value;

    behaviour.getValues(req, res, next);

    expect(next).toHaveBeenCalledWith(null, values);
    expect(next.mock.calls[0][1]).toBe(values);
    expect(formatUanForDisplay).not.toHaveBeenCalled();
    expect(req.sessionModel.set).not.toHaveBeenCalled();
  });

  test('should preserve HOF errorValues over a valid saved UAN on GET redisplay', () => {
    const stored = { [key]: '1234567890123456' };
    req.form = { values: { [key]: '123' } };
    req.sessionModel = {
      toJSON: () => ({ ...stored }),
      get: name => stored[name],
      set: jest.fn((name, value) => {
        stored[name] = value;
      })
    };
    const SessionBehaviour = FormatUanForDisplay(Session(BaseBehaviour));
    const sessionBehaviour = new SessionBehaviour();
    sessionBehaviour.setErrors({ [key]: 'validation error' }, req);
    req.sessionModel.set.mockClear();

    expect(() => sessionBehaviour.getValues(req, res, next)).not.toThrow();

    expect(next).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ [key]: '123' })
    );
    expect(stored[key]).toBe('1234567890123456');
    expect(formatUanForDisplay).not.toHaveBeenCalled();
    expect(req.sessionModel.set).not.toHaveBeenCalled();
  });

  test('should forward superclass errors without formatting', () => {
    const error = new Error('Unable to read session');
    baseGetValues.mockImplementation((request, response, callback) =>
      callback(error)
    );

    behaviour.getValues(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(formatUanForDisplay).not.toHaveBeenCalled();
  });
});
