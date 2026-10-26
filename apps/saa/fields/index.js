const hof = require('hof');
const countries = require('hof').utils.countries();
const languages = require('../data/languages.json');
const dateComponent = hof.components.date;
module.exports = {
  'claimant-main-language': {
    mixin: 'select',
    className: ['typeahead'],
    validate: ['required'],
    options: [{
      value: '',
      label: 'fields.claimant-main-language.options.none_selected'
    }].concat(languages.map(language => ({ value: language, label: language }))),
    labelClassName: 'govuk-label--m'
  },
  'person-completing-form': {
    mixin: 'radio-group',
    options: ['for-me', 'someone-else'],
    validate: ['required'],
    className: ['govuk-radios'],
    isPageHeading: true
  },
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
  'change-personal-details': {
    mixin: 'radio-group',
    options: ['yes', 'no'],
    validate: ['required'],
    className: ['govuk-radios', 'govuk-radios--inline'],
    isPageHeading: true
  },
  'reason-name-change': {
    mixin: 'radio-group',
    options: [
      'error',
      'marriage-or-divorce',
      'deed-poll'
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
  },
  'someone-on-claim-died': {
    mixin: 'radio-group',
    options: ['yes', 'no'],
    validate: ['required'],
    className: ['govuk-radios', 'govuk-radios--inline'],
    isPageHeading: true
  },
  'something-else': {
    mixin: 'radio-group',
    options: ['yes', 'no'],
    validate: ['required'],
    className: ['govuk-radios', 'govuk-radios--inline'],
    isPageHeading: true
  },
  'child-partner-nationality': {
    mixin: 'select',
    className: ['typeahead'],
    validate: ['required'],
    options: [{
      value: '',
      label: 'fields.child-partner-nationality.options.none_selected'
    }].concat(countries)
  },
  'main-claimant-died': {
    mixin: 'radio-group',
    options: ['yes', 'no'],
    validate: ['required'],
    className: ['govuk-radios', 'govuk-radios--inline'],
    isPageHeading: true
  },
  'claimants-given-name': {
    mixin: 'input-text',
    validate: ['required', 'notUrl', { type: 'maxlength', arguments: 255 }],
    labelClassName: 'govuk-label--m'
  },
  'claimants-family-name': {
    mixin: 'input-text',
    validate: ['required', 'notUrl', { type: 'maxlength', arguments: 255 }],
    labelClassName: 'govuk-label--m'
  },
  'given-name-person-who-died': {
    mixin: 'input-text',
    validate: ['required', 'notUrl', { type: 'maxlength', arguments: 255 }],
    labelClassName: 'govuk-label--s'
  },
  'family-name-person-who-died': {
    mixin: 'input-text',
    validate: ['required', 'notUrl', { type: 'maxlength', arguments: 255 }],
    labelClassName: 'govuk-label--s'
  },
  'date-of-birth-person-who-died': dateComponent('date-of-birth-person-who-died', {
    mixin: 'input-date',
    validate: [
      'required',
      'date',
      'before',
      { type: 'after', arguments: '1900-01-01' }
    ],
    isPageHeading: true
  }),
  'nationality-person-who-died': {
    mixin: 'select',
    className: ['typeahead'],
    validate: ['required'],
    options: [{
      value: '',
      label: 'fields.nationality-person-who-died.options.none_selected'
    }].concat(countries)
  },
  'relationship-to-claimant': {
    mixin: 'radio-group',
    options: ['immigration-adviser', 'someone-helping-them'],
    validate: ['required'],
    className: ['govuk-radios'],
    isPageHeading: true
  },
  'how-you-are-helping': {
    mixin: 'radio-group',
    options: [
      'family-member-or-friend',
      'interpreter',
      'charity-worker-l1',
      'charity-worker-l2-3',
      'local-authority',
      'government-organisation'
    ],
    validate: ['required'],
    isPageHeading: true
  }
};
