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
      'claimant-unique-application-number': '1234-5678-9012-3456',
      'claimant-date-of-birth': '1990-01-31'
    };
    req = {
      form: { values: { 'user-email': 'Person@Example.com' } },
      sessionModel: { get: jest.fn(key => session[key]) }
    };
    res = {};
    next = jest.fn();
    findOrCreateApplication.mockResolvedValue({ id: 1 });
  });

  test('should find or create an application from the email and session claimant details', async () => {
    await behaviour.validate(req, res, next);

    expect(findOrCreateApplication).toHaveBeenCalledWith({
      email: 'person@example.com',
      uan: '1234-5678-9012-3456',
      dateOfBirth: '1990-01-31'
    });
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
