/**
 * This is a behaviour to clear the claimants DOB when they submit "no".
 */
const clearOwnDob = superclass => class extends superclass {
  saveValues(req, res, next) {
    super.saveValues(req, res, err => {
      if (err) {
        return next(err);
      }

      if (req.form.values['change-your-date-of-birth'] === 'no') {
        req.sessionModel.unset([
          'correct-date-of-birth',
          'documents-new-dob'
        ]);
      }

      return next();
    });
  }
};

module.exports = clearOwnDob;
