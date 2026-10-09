// Using default labels for now. Review and update when the final CYA design is available.
module.exports = {
  'personal-details': {
    steps: [
      {
        step: '/personal-details',
        field: 'change-personal-details'
      }
    ]
  },
  dependant: {
    steps: [
      {
        step: '/do-you-need-add-remove-dependant',
        field: 'add-remove-dependant'
      },
      {
        step: '/child-partner-nationality',
        field: 'child-partner-nationality',
        dependsOn: 'add-remove-dependant'
      }
    ]
  },
  evidences: {
    steps: [
      {
        step: '/send-evidence-for-your-claim',
        field: 'send-evidence-for-your-claim'
      }
    ]
  },
  'something-else': {
    steps: [
      {
        step: '/something-else',
        field: 'something-else'
      }
    ]
  }
};
