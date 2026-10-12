const { hasSelectedSection } = require('../../../utils');

module.exports = superclass =>
  class extends superclass {
    locals(req, res) {
      return {
        ...super.locals(req, res),
        hasSelectedSection: hasSelectedSection(req.sessionModel)
      };
    }
  };
