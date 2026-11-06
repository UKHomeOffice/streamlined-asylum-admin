const { NO_DIGITS_REGEX } = require('../../../utils/constants');
const customValidation = superclass =>
  class extends superclass {
    validateField(key, req) {
      const validationErrorFunc = (type, args) =>
        new this.ValidationError(key, { type: type, arguments: [args] });

      const fieldError = super.validateField(key, req);

      // Return any existing validation error from the validate array.
      // This ensures users see previous errors before custom validation runs,
      // preventing earlier errors from being overwritten or hidden.
      if (fieldError) {
        return fieldError;
      }
      const keysToValidate = [
        'child-partner-given-name',
        'child-partner-family-name',
        'claimants-given-name',
        'claimants-family-name',
        'helper-given-name',
        'helper-family-name',
        'given-name',
        'family-name',
        'someone-else-old-given-name',
        'someone-else-old-family-name',
        'someone-else-new-given-name',
        'someone-else-new-family-name',
        'someone-else-correct-date-of-birth-given-name',
        'someone-else-correct-date-of-birth-family-name'
      ];

      if (keysToValidate.includes(key)) {
        const value = req.form.values[key];
        if (!value.match(NO_DIGITS_REGEX)) {
          return validationErrorFunc('noDigits');
        }
      }

      // Generic cross-field equality check, enabled via matchField: '<other-field>' in field config
      const matchField = req.form.options?.fields?.[key]?.matchField;
      if (matchField && req.form.values[key] !== req.form.values[matchField]) {
        return validationErrorFunc('matchField', matchField);
      }
      return fieldError;
    }
  };
module.exports = customValidation;
