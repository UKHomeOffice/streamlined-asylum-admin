/**
 * This behaviour checks if a field is selected, if not.. it will remove all fields related to that selection.
 */
const clearRedundantFields = (conditionalField, fieldsToUnset) => superclass => class extends superclass {
  saveValues(req, res, next) {
    super.saveValues(req, res, err => {
      if (err) {
        return next(err);
      }

      if (req.form.values[conditionalField] === 'no') {
        req.sessionModel.unset([
          ...fieldsToUnset
        ]);
      }

      return next();
    });
  }
};

module.exports = clearRedundantFields;
