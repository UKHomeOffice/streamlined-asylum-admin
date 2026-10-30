const { NO_DIGITS_REGEX } = require('../../../utils/constants');
const { validUniqueApplicationNumber } = require('../../../utils');
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
        'helper-family-name'
      ];

      if (keysToValidate.includes(key)) {
        const value = req.form.values[key];
        if (!value.match(NO_DIGITS_REGEX)) {
          return validationErrorFunc('noDigits');
        }
      }
      if (key === 'claimant-unique-application-number') {
        const value = req.form.values[key];
        if (!validUniqueApplicationNumber(value)) {
          return validationErrorFunc('validUniqueApplicationNumber');
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
