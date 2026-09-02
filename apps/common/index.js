const steps = {
  '/start': {}
};
const pages = {
  '/accessibility': 'static/accessibility'
};

module.exports = {
  name: 'common',
  baseUrl: '/',
  fields: 'apps/common/fields',
  translations: 'apps/common/translations',
  steps: steps,
  pages: pages
};
