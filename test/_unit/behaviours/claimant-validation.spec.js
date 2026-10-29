jest.mock('../../../utils/application-service', () => ({
  findOrCreateApplication: jest.fn(),
  ApplicationExistsError: class ApplicationExistsError extends Error {}
}));

const {
  findOrCreateApplication,
  ApplicationExistsError
} = require('../../../utils/application-service');
const ClaimantValidation = require('../../../apps/common/behaviours/claimant-validation');

describe('claimant validation behaviour', () => {
  const baseValidate = jest.fn();

  class BaseBehaviour {
    constructor() {
      this.ValidationError = class {
        constructor(key, options) {
          Object.assign(this, { key }, options);
        }
      };
    }

    validate(req, res, next) {
      return baseValidate(req, res, next);
    }
  }

  const Behaviour = ClaimantValidation(BaseBehaviour);
  let behaviour;
  let req;
  let res;
  let next;
  let session;

  beforeEach(() => {
    behaviour = new Behaviour();
    session = {
      'claimant-unique-application-number': '1234567890123456',
      'claimant-date-of-birth': '1990-01-31',
      'csrf-secret': 'secret',
      errors: { field: 'error' },
      errorValues: { field: 'value' },
      steps: ['/claimant-details', '/claim-decided']
    };
    req = {
      form: { values: { 'user-email': 'Person@Example.com' } },
      sessionModel: {
        get: jest.fn(key => session[key]),
        toJSON: jest.fn(() => structuredClone(session))
      }
    };
    res = {};
    next = jest.fn();
    findOrCreateApplication.mockResolvedValue({ id: 1 });
  });

  test('should find or create an application from the email and session claimant details', async () => {
    await behaviour.validate(req, res, next);

    expect(findOrCreateApplication).toHaveBeenCalledWith({
      email: 'person@example.com',
      uan: '1234567890123456',
      dateOfBirth: '1990-01-31',
      session: {
        'claimant-unique-application-number': '1234567890123456',
        'claimant-date-of-birth': '1990-01-31'
      }
    });
  });

  test('should exclude CSRF, errors and journey steps from the saved session only', async () => {
    await behaviour.validate(req, res, next);

    const [{ session: saved }] = findOrCreateApplication.mock.calls[0];
    expect(saved).not.toHaveProperty('csrf-secret');
    expect(saved).not.toHaveProperty('errors');
    expect(saved).not.toHaveProperty('errorValues');
    expect(saved).not.toHaveProperty('steps');
    expect(session['csrf-secret']).toBe('secret');
    expect(session.steps).toEqual(['/claimant-details', '/claim-decided']);
  });

  test('should continue validation after the application is found or created', async () => {
    await behaviour.validate(req, res, next);

    expect(baseValidate).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  test('should pass application service errors to next without continuing validation', async () => {
    const error = new Error('RDS API GET failed with status 500');
    findOrCreateApplication.mockRejectedValue(error);

    await behaviour.validate(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(baseValidate).not.toHaveBeenCalled();
  });

  test('should return a user-email validation error when the application exists under another email', async () => {
    findOrCreateApplication.mockRejectedValue(new ApplicationExistsError());

    await behaviour.validate(req, res, next);

    expect(next).toHaveBeenCalledWith({
      'user-email': expect.objectContaining({
        key: 'user-email',
        type: 'existsUnderAnotherEmail'
      })
    });
    expect(baseValidate).not.toHaveBeenCalled();
  });
});
