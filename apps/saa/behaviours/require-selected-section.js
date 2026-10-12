const { hasSelectedSection } = require('../../../utils');

// For SECTION_FIELDS steps: stop edits that leave every section as "no" from returning to /confirm.
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

      if (req.sessionModel.get('something-else') === 'yes') {
        return `${req.baseUrl}/contact-us-by-email`;
      }

      return `${req.baseUrl}/no-options`;
    }
  };
