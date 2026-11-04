const saveAndExit = superclass =>
  class extends superclass {
    successHandler(req, res, next) {
      req.sessionModel.reset();
      return super.successHandler(req, res, next);
    }
  };
module.exports = saveAndExit;
