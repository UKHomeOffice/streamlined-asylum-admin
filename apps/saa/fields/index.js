module.exports = {
  'send-evidence-for-your-claim': {
    mixin: 'radio-group',
    options: ['yes', 'no'],
    validate: ['required'],
    isPageHeading: true
  },
  'evidence-violent-or-upsetting': {
    mixin: 'radio-group',
    options: ['yes', 'no'],
    validate: ['required'],
    className: ['govuk-radios--inline'],
    legend: {
      className: ['govuk-!-font-weight-bold']
    },
  }
};
