const { hasSelectedSection } = require('../../../utils');

// Revisit the final question when an edit leaves no main sections selected.
module.exports = superclass =>
  class extends superclass {
    getNextStep(req, res) {
      const nextStep = super.getNextStep(req, res);

      if (
        nextStep !== `${req.baseUrl}/confirm` ||
        hasSelectedSection(req.sessionModel)
      ) {
        return nextStep;
      }

      return `${req.baseUrl}/something-else`;
    }
  };
