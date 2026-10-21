const NO_DIGITS_REGEX = /^\D*$/;

const SAA_BASE_URL = '/changes';

// yes/no fields on SAA pages that start a follow-up journey.
const SECTION_FIELDS = [
  'change-personal-details',
  'add-remove-dependant',
  'send-evidence-for-your-claim',
  'someone-on-claim-died'
];

module.exports = {
  NO_DIGITS_REGEX,
  SAA_BASE_URL,
  SECTION_FIELDS
};
