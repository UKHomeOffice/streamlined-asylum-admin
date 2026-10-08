const { disallowIndexing } = require('../../config');
const CustomValidation = require('../common/behaviours/custom-validation');
const steps = {
  '/': {
    template: 'start'
  },
  '/before-you-start': {
    next: '/claimant-details',
    backLink: ' ' // workaround to allow the back link to route to the root of the app
  },
  '/claimant-details': {
    fields: ['claimant-unique-application-number', 'claimant-date-of-birth'],
    behaviours: [CustomValidation],
    next: '/claim-decided'
  },
  '/claim-decided': {
    fields: ['claim-decided'],
    forks: [
      {
        target: '/cannot-use-form',
        continueOnEdit: true,
        condition: {
          field: 'claim-decided',
          value: 'yes'
        }
      }
    ],
    next: '/email-address'
  },
  '/email-address': {
    next: '/check-your-email'
  },
  '/cannot-use-form': {
    // end of user journey
  },
  '/check-your-email': {}
};
const pages = {
  '/accessibility': 'static/accessibility'
};

if (disallowIndexing) {
  pages['/robots.txt'] = 'static/robots';
}
module.exports = {
  name: 'common',
  baseUrl: '/',
  fields: 'apps/common/fields',
  translations: 'apps/common/translations',
  steps: steps,
  pages: pages
};
