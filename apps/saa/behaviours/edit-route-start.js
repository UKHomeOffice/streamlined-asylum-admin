// This behaviour captures the return from Edit-mode url.
// Edit-mode is entered by clicking a Change link on a summary page and
// signals that routing will return from the changed (edited) page to
// the summary page.
const editRouteStart = superclass =>
  class extends superclass {
    getValues(req, res, next) {
      req.sessionModel.set('edit-return-path', req.originalUrl);
      return super.getValues(req, res, next);
    }

    saveValues(req, res, next) {
      req.sessionModel.unset('edit-return-path');

      return super.saveValues(req, res, next);
    }
  };
module.exports = editRouteStart;
