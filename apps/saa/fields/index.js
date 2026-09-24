module.exports = {
  'changes-to-contact-details': {
    mixin: 'checkbox-group',
    options: [
      'name',
      'date-of-birth',
      'nationality',
      'address',
      'email-address',
      'phone-number'
    ],
    validate: ['required'],
    isPageHeading: true
  },
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
  'send-evidence-for-your-claim': {
    mixin: 'radio-group',
    options: ['yes', 'no'],
    validate: ['required'],
    className: ['govuk-radios', 'govuk-radios--inline'],
    isPageHeading: true
  }
};
