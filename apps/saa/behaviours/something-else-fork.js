const { hasSelectedSection } = require('../../../utils');

const somethingElseFork = superclass =>
  class extends superclass {
    getNextStep(req, res) {
      const nextStep = super.getNextStep(req, res);

      if (req.sessionModel.get('something-else') === 'yes') {
        return `${req.baseUrl}/contact-us-by-email`;
      }

      if (req.sessionModel.get('something-else') === 'no') {
        if (hasSelectedSection(req.sessionModel)) {
          return `${req.baseUrl}/confirm`;
        }

        return `${req.baseUrl}/no-options`;
      }

      return nextStep;
    }
  };

module.exports = somethingElseFork;
