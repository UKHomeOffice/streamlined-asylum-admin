const changeSomeoneElsesNameFork = superclass =>
  class extends superclass {
    getNextStep(req, res) {
      const nextStep = super.getNextStep(req, res);
      const changeYourName = req.sessionModel.get(
        'do-you-need-to-change-your-name'
      );
      const changeSomeoneElsesName = req.sessionModel.get(
        'change-someone-elses-name'
      );

      if (changeYourName === 'no' && changeSomeoneElsesName === 'no') {
        return `${req.baseUrl}/no-changes-made`;
      }

      if (changeSomeoneElsesName === 'yes') {
        return `${req.baseUrl}/relationship-name-change`;
      }

      return nextStep;
    }
  };

module.exports = changeSomeoneElsesNameFork;
