'use strict';

/**
 * clears section summary data when a section is changed to "no".
 *
 * For each configured aggregate field, this behaviour unsets the value in the session
 * if the decision field is "no" and the stored aggregate contains one or more
 * `aggregatedValues`.
 *
 * @param {string[]} aggregateToFields - Session model field names that store aggregated section data.
 * @param {string} decisionField - Form field name that controls whether the section is enabled.
 * @returns {(superclass: new (...args: any[]) => any) => new (...args: any[]) => any}
 * A class-mixin function that overrides `saveValues`.
 */

const resetSectionSummary = (aggregateToFields, decisionField) => superclass =>
  class extends superclass {
    /**
     * Clears configured aggregate fields from session state when the decision field is set to "no",
     * then delegates to the parent `saveValues` implementation.
     *
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     * @returns {*} Result from `super.saveValues(req, res, next)`.
     */
    saveValues(req, res, next) {
      if (Array.isArray(aggregateToFields) && aggregateToFields.length > 0) {
        aggregateToFields.forEach(aggregateToField => {
          if (req.sessionModel.get(aggregateToField)) {
            if (
              req.form.values[decisionField] === 'no' &&
              req.sessionModel.get(aggregateToField).aggregatedValues.length > 0
            ) {
              req.sessionModel.unset(aggregateToField);
            }
          }
        });
      }

      return super.saveValues(req, res, next);
    }
  };
module.exports = resetSectionSummary;
