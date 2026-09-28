const customValidation = require('../../../apps/common/behaviours/custom-validation');

describe('custom validation behaviour', () => {
  const baseValidateField = jest.fn();

  class ValidationError extends Error {
    constructor(key, options) {
      super(options.type);
      this.key = key;
      this.type = options.type;
      this.arguments = options.arguments;
    }
  }

  class BaseBehaviour {
    constructor() {
      this.ValidationError = ValidationError;
    }

    validateField(key, req) {
      return baseValidateField(key, req);
    }
  }

  const Behaviour = customValidation(BaseBehaviour);
  let behaviour;

  beforeEach(() => {
    behaviour = new Behaviour();
    baseValidateField.mockReturnValue(undefined);
  });

  test('should return an existing field error before running custom validation', () => {
    const existingError = new Error('Field is required');
    const req = {
      form: { values: { 'child-partner-given-name': 'Alex2' } }
    };
    baseValidateField.mockReturnValue(existingError);

    expect(behaviour.validateField('child-partner-given-name', req)).toBe(
      existingError
    );
  });

  test.each(['child-partner-given-name', 'child-partner-family-name'])(
    'should reject digits in %s',
    key => {
      const req = { form: { values: { [key]: 'Name2' } } };

      const error = behaviour.validateField(key, req);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toMatchObject({
        key,
        type: 'noDigits',
        arguments: [undefined]
      });
      expect(baseValidateField).toHaveBeenCalledWith(key, req);
    }
  );

  test.each([
    ['child-partner-given-name', 'Mary-Jane'],
    ['child-partner-family-name', "O'Connor"],
    ['child-partner-given-name', '']
  ])('should accept a digit-free value for %s', (key, value) => {
    const req = { form: { values: { [key]: value } } };

    expect(behaviour.validateField(key, req)).toBeUndefined();
  });

  test('should not apply name validation to other fields', () => {
    const req = { form: { values: { reference: 'ABC123' } } };

    expect(behaviour.validateField('reference', req)).toBeUndefined();
    expect(baseValidateField).toHaveBeenCalledWith('reference', req);
  });
});
