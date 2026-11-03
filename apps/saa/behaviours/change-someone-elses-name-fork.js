const { asArray } = require('./multi-select-follow-ups');
const multiSelectFollowUpsConfig = require('../config/multi-select-follow-ups-config');
const { SECTION_FIELDS } = require('../../../utils/constants');

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
      const selectedUpdates = asArray(
        req.sessionModel.get(multiSelectFollowUpsConfig.field)
      );
      const onlyNameSelected =
        selectedUpdates.length === 1 && selectedUpdates[0] === 'name';
      const hasOtherJourney = SECTION_FIELDS.some(field =>
        field !== 'change-personal-details' &&
        req.sessionModel.get(field) === 'yes'
      ) || req.sessionModel.get('something-else') === 'yes';

      if (
        changeYourName === 'no' &&
        changeSomeoneElsesName === 'no' &&
        onlyNameSelected &&
        !hasOtherJourney
      ) {
        return `${req.baseUrl}/no-changes-made`;
      }

      if (changeSomeoneElsesName === 'yes') {
        return `${req.baseUrl}/relationship-name-change`;
      }

      return nextStep;
    }
  };

module.exports = changeSomeoneElsesNameFork;
