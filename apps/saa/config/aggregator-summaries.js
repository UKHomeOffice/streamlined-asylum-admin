// Summary settings for each aggregator page, keyed by its aggregateTo name. titleField stays on the step itself.
module.exports = {
  addremovechildpartner: {
    route: '/check-your-answers-add-child-partner',
    dependsOn: 'add-remove-dependant',
    omitFields: ['add-remove-child-partner'],
    dateFields: ['child-partner-date-of-birth'],
    combineFields: {
      'child-partner-given-name': ['child-partner-family-name']
    }
  },
  reportadeath: {
    route: '/check-your-answers-death',
    itemTitle: 'pages.check-your-answers-death.item-title',
    dependsOn: 'someone-on-claim-died',
    omitFields: ['about-who-has-died'],
    dateFields: ['date-of-birth-person-who-died'],
    combineFields: {
      'given-name-person-who-died': ['family-name-person-who-died']
    }
  },
  someoneelsenewdob: {
    route: '/check-your-answers-someone-else-date-of-birth',
    dependsOn: 'change-someone-else-date-of-birth',
    dateFields: ['someone-else-correct-date-of-birth'],
    combineFields: {
      'someone-else-correct-date-of-birth-given-name': ['someone-else-correct-date-of-birth-family-name']
    },
    itemTitle: 'Change someone else\'s date of birth',
    addIncrement: true
  }
};
