const { disallowIndexing } = require('../../config');
const steps = {
  '/': {
    template: 'start'
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
