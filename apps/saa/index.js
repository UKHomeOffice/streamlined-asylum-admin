const steps = {
  '/continue-to-form': {}
};

module.exports = {
  name: 'saa',
  baseUrl: '/saa',
  params: '/:action?/:id?/:edit?',
  fields: 'apps/saa/fields',
  views: 'apps/saa/views',
  translations: 'apps/saa/translations',
  steps: steps
};
