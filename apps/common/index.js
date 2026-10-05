const { disallowIndexing } = require('../../config');
const SendVerificationEmail = require('./behaviours/send-verification-email');
const steps = {
  '/': {
    template: 'start'
  },
  '/before-you-start': {
    next: '/claimant-details',
    backLink: ' ' // workaround to allow the back link to route to the root of the app
  },
  '/claimant-details': {
    next: '/claim-decided'
  },
  '/claim-decided': {
    next: '/email-address'
  },
  '/email-address': {
    // Decide whether this flow should find an existing record or create one before sending a magic link.
    behaviours: [SendVerificationEmail],
    fields: ['user-email'],
    next: '/check-your-email'
  },
  '/cannot-use-form': {
    // end of user journey
  },
  '/check-your-email': {
    behaviours: [SendVerificationEmail]
  }
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
