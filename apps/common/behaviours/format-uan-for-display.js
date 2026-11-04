const { formatUanForDisplay, isValidUan } = require('../../../utils');
const { REQUEST_METHODS } = require('../../../utils/constants');
/**
 * Displays the UAN with hyphens while keeping its session value digits-only.
 * The field formatters remove separators from submitted input before validation.
 */
const formatUan = superclass =>
  class extends superclass {
    getValues(req, res, next) {
      const key = 'claimant-unique-application-number';
      return super.getValues(req, res, (error, values) => {
        if (error) {
          return next(error);
        }
        const uan = values?.[key];
        // Preserve invalid attempted values so we can redisplay validation errors.
        if (req.method !== REQUEST_METHODS.GET || !isValidUan(uan)) {
          return next(null, values);
        }
        return next(null, {
          ...values,
          [key]: formatUanForDisplay(uan)
        });
      });
    }
  };
module.exports = formatUan;
