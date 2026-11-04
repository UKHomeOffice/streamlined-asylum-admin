const { formatUanForDisplay } = require('../../../utils');
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
        if (req.method !== REQUEST_METHODS.GET || !values?.[key]) {
          return next(null, values);
        }
        return next(null, {
          ...values,
          [key]: formatUanForDisplay(values[key])
        });
      });
    }
  };
module.exports = formatUan;
