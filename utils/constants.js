const NO_DIGITS_REGEX = /^\D*$/;
const CHANGE_EDIT_DELETE_REGEX = /\/(change|edit|delete)(?:\/|$)/;

const SAA_BASE_URL = '/changes';

// yes/no fields on SAA pages that start a follow-up journey.
const SECTION_FIELDS = [
  'change-personal-details',
  'add-remove-dependant',
  'send-evidence-for-your-claim',
  'someone-on-claim-died'
];
// Caseworker email "Type of information submitted" list, in display order.
const SUBMITTED_INFORMATION_TYPES = [
  { field: 'send-evidence-for-your-claim', label: 'Evidence to help your claim (Webform-EVI101)' },
  { field: 'change-personal-details', label: 'Updated personal details (Webform-UPD101)' },
  { field: 'add-remove-dependant', label: 'Add or remove dependant (Webform-DEP101)' },
  { field: 'someone-on-claim-died', label: 'Tell us someone has died (Webform-RAD101)' }
];

const REQUEST_METHODS = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH'
});

module.exports = {
  NO_DIGITS_REGEX,
  SAA_BASE_URL,
  SECTION_FIELDS,
  SUBMITTED_INFORMATION_TYPES,
  REQUEST_METHODS,
  CHANGE_EDIT_DELETE_REGEX
};
