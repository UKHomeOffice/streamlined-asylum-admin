// Summary settings for each aggregator page, keyed by its aggregateTo name. titleField stays on the step itself.
module.exports = {
  addremovechildpartner: {
    route: '/check-your-answers-add-child-partner',
    dependsOn: 'add-remove-dependant',
    omitFields: ['add-remove-child-partner', 'reason-removing-child-partner'],
    dateFields: ['child-partner-date-of-birth'],
    combineFields: {
      'child-partner-given-name': ['child-partner-family-name']
    }
  }
};
