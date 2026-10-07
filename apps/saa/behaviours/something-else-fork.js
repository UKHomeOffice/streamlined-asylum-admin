const somethingElseFork = superclass =>
  class extends superclass {
    getNextStep(req, res) {
      const nextStep = super.getNextStep(req, res);

      if (req.sessionModel.get('something-else') === 'yes') {
        return `${req.baseUrl}/contact-us-by-email`;
      }

      if (req.sessionModel.get('something-else') === 'no') {
        const selectedSection = [
          'add-remove-dependant',
          'send-evidence-for-your-claim',
          'someone-on-claim-died'
        ].some(field => req.sessionModel.get(field) === 'yes');

        if (selectedSection) {
          return `${req.baseUrl}/confirm`;
        }

        return `${req.baseUrl}/not-selected-options`;
      }

      return nextStep;
    }
  };

module.exports = somethingElseFork;
