const { NO_DIGITS_REGEX } = require('../../../utils/constants');
module.exports = superclass =>
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

      if (
        key === 'child-partner-given-name' ||
        key === 'child-partner-family-name'
      ) {
        const value = req.form.values[key];
        if (!value.match(NO_DIGITS_REGEX)) {
          return validationErrorFunc('noDigits');
        }
      }
      return fieldError;
    }
  };
