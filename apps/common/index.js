const { disallowIndexing } = require('../../config');
const steps = {
  '/': {
    template: 'start'
  },
  '/before-you-start': {
    next: '/claimant-details'
  },
  '/claimant-details': {
    next: '/claim-decided'
  },
  '/claim-decided': {
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
