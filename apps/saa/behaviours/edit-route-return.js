// This behaviour will redirect the route back to the Summary page that set the Edit-mode url in edit-return-path.
const editRouteReturn = superclass =>
  class extends superclass {
    saveValues(req, res, next) {
      super.saveValues(req, res, err => {
        if (err) {
          return next(err);
        }

        const shouldContinueOnEdit = this.isContinueOnEdit(req);
        const editReturnPath = req.sessionModel.get('edit-return-path');

        if (!shouldContinueOnEdit && editReturnPath) {
          return res.redirect(editReturnPath);
        }
        return next();
      });
    }

    /**
     * Checks if continueOnEdit is set on the form or on the selected fork
     */
    isContinueOnEdit(req) {
      if (req.form.options.continueOnEdit) {
        return true;
      }
      const chosenOption = req.form.options.forks?.find(fork => {
        return fork.condition && this.isForkSelected(fork.condition, req);
      });
      return Boolean(chosenOption?.continueOnEdit);
    }

    /*
     * Check if the conditions of the fork are met
     */
    isForkSelected(condition, req) {
      if (typeof condition === 'function') {
        return condition(req);
      }
      return req.form.values[condition.field] === condition.value;
    }
  };
module.exports = editRouteReturn;
