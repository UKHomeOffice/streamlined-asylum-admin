const hof = require('hof');
const dateComponent = hof.components.date;
module.exports = {
  'claimant-unique-application-number': {
    mixin: 'input-text',
    validate: ['required', 'notUrl'],
    labelClassName: 'govuk-label--s'
  },
  'claimant-date-of-birth': dateComponent('claimant-date-of-birth', {
    mixin: 'input-date',
    legend: { className: 'govuk-fieldset__legend--s' },
    validate: [
      'required',
      'date',
      'before',
      { type: 'after', arguments: '1900-01-01' }
    ]
  }),
  'claim-decided': {
    mixin: 'radio-group',
    options: ['yes', 'no'],
    validate: ['required'],
    className: ['govuk-radios', 'govuk-radios--inline'],
    isPageHeading: true
  },
  'user-email': {
    validate: ['required', 'email'],
    labelClassName: 'visuallyhidden'
  }
};
