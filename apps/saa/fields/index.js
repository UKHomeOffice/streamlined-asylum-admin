const hof = require('hof');
const dateComponent = hof.components.date;
module.exports = {
  'add-remove-dependant': {
    mixin: 'radio-group',
    options: ['yes', 'no'],
    validate: ['required'],
    className: ['govuk-radios', 'govuk-radios--inline'],
    isPageHeading: true
  },
  'add-remove-child-partner': {
    mixin: 'radio-group',
    options: ['add-child-partner', 'remove-child-partner'],
    validate: ['required'],
    legend: { className: 'visuallyhidden' }
  },
  'reason-removing-child-partner': {
    mixin: 'textarea',
    validate: ['required', 'notUrl', { type: 'maxlength', arguments: 500 }],
    attributes: [{ attribute: 'rows', value: 5 }],
    isPageHeading: true
  },
  'relationship-to-child-partner': {
    mixin: 'radio-group',
    options: ['my-child', 'husband-wife-partner'],
    validate: ['required'],
    isPageHeading: true
  },
  'child-partner-given-name': {
    mixin: 'input-text',
    validate: ['required', 'notUrl', { type: 'maxlength', arguments: 255 }],
    labelClassName: 'govuk-label--m'
  },
  'child-partner-family-name': {
    mixin: 'input-text',
    validate: ['required', 'notUrl', { type: 'maxlength', arguments: 255 }],
    labelClassName: 'govuk-label--m'
  },
  'child-partner-date-of-birth': dateComponent('child-partner-date-of-birth', {
    mixin: 'input-date',
    validate: [
      'required',
      'date',
      'before',
      { type: 'after', arguments: '1900-01-01' }
    ],
    isPageHeading: true
  }),
  'send-evidence-for-your-claim': {
    mixin: 'radio-group',
    options: ['yes', 'no'],
    validate: ['required'],
    className: ['govuk-radios', 'govuk-radios--inline'],
    isPageHeading: true
  },
  'evidence-violent-or-upsetting': {
    mixin: 'radio-group',
    options: ['yes', 'no'],
    validate: ['required'],
    className: ['govuk-radios--inline'],
    legend: {
      className: ['govuk-!-font-weight-bold']
    }
  }
};
