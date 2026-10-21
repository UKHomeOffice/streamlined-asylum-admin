// Using default labels for now. Review and update when the final CYA design is available.
const {
  formatAggregateForSummary
} = require('../behaviours/parse-section-summary-fields');
const aggregatorSummaries = require('../config/aggregator-summaries');

// Read-only rows for every item of an aggregate; Change goes to that aggregate's summary page.
const aggregateSummaryRow = name => {
  const settings = aggregatorSummaries[name];
  const changeLink = `/changes${settings.route}`;

  return {
    step: settings.route,
    field: name,
    changeLink,
    dependsOn: settings.dependsOn,
    addElementSeparators: true,
    parse: (aggregate, req) =>
      formatAggregateForSummary(aggregate, req, {
        ...settings,
        changeLink,
        titleField: req.form.options.steps?.[settings.route]?.titleField
      })
  };
};

module.exports = {
  'your-details': {
    steps: [
      {
        step: '/claimants-name',
        field: 'claimants-given-name',
        parse: (value, req) => {
          const claimaintsFullName = [
            req.sessionModel.get('claimants-given-name'),
            req.sessionModel.get('claimants-family-name')
          ];
          return claimaintsFullName.filter(Boolean).join(' ');
        }
      },
      {
        step: '/claimant-main-language',
        field: 'claimant-main-language'
      }
    ]
  },
  'personal-details': {
    steps: [
      {
        step: '/personal-details',
        field: 'change-personal-details'
      }
    ]
  },
  'add-or-remove-dependants': {
    steps: [
      {
        step: '/do-you-need-add-remove-dependant',
        field: 'add-remove-dependant'
      },
      aggregateSummaryRow('addremovechildpartner')
    ]
  },
  death: {
    steps: [
      {
        step: '/someone-on-claim-died',
        field: 'someone-on-claim-died'
      },
      {
        step: '/main-claimant-died',
        field: 'main-claimant-died',
        dependsOn: 'someone-on-claim-died'
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
