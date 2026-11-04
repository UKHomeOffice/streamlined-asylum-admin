// Using default labels for now. Review and update when the final CYA design is available.
const {
  formatAggregateForSummary
} = require('../behaviours/parse-section-summary-fields');
const aggregatorSummaries = require('../config/aggregator-summaries');
const { SAA_BASE_URL } = require('../../../utils/constants');
const evidenceSummary = require('./summary-data-evidence-help-your-claim');
const emailAddressSummary = require('./summary-data-email-address');
const { formatDate, formatUanForDisplay } = require('../../../utils');
const dateOfBirthSummary = require('./summary-data-date-of-birth');

// Same rows as /check-your-answers-evidence; Change goes back to that page.
const evidenceRows = evidenceSummary.evidence.steps.map(row => ({
  ...row,
  changeLink: `${SAA_BASE_URL}/check-your-answers-evidence`,
  dependsOn: 'send-evidence-for-your-claim'
}));

// Same rows as /check-your-answers-email; Change goes back to that page.
const emailAddressRows = emailAddressSummary['email-address'].steps.map(row => ({
  ...row,
  changeLink: `${SAA_BASE_URL}/check-your-answers-email`,
  dependsOn: 'change-personal-details'
}));

// Same rows as /check-your-answers-date-of-birth; Change goes back to that page.
const dateOfBirthRows = dateOfBirthSummary['date-of-birth'].steps.map(row => ({
  ...row,
  changeLink: `${SAA_BASE_URL}/check-your-answers-date-of-birth`,
  dependsOn: 'change-personal-details'
}));

// Read-only rows for every item of an aggregate; Change goes to that aggregate's summary page.
const aggregateSummaryRow = name => {
  const settings = aggregatorSummaries[name];
  const changeLink = `${SAA_BASE_URL}${settings.route}`;

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
        step: '/claimant-details',
        field: 'claimant-unique-application-number',
        parse: uan => formatUanForDisplay(uan),
        omitChangeLink: true
      },
      {
        step: '/claimant-details',
        field: 'claimant-date-of-birth',
        parse: dob => formatDate(dob),
        omitChangeLink: true
      },
      {
        step: '/claim-decided',
        field: 'claim-decided',
        // This common-journey field has no radio config in SAA, so capitalise its raw yes/no value for display.
        parse: claimDecided =>
          claimDecided
            ? claimDecided.charAt(0).toUpperCase() + claimDecided.slice(1)
            : null,
        omitChangeLink: true
      },
      {
        step: '/email-address',
        field: 'user-email',
        parse: (email, req) => email || req.sessionModel.get('user-email'),
        omitChangeLink: true
      }
    ]
  },
  'claimant-details': {
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
      },
      {
        step: '/relationship-to-claimant',
        field: 'relationship-to-claimant'
      },
      {
        step: '/how-you-are-helping',
        field: 'how-you-are-helping'
      },
      {
        step: '/helper-details',
        field: 'helper-given-name'
      },
      {
        step: '/helper-details',
        field: 'helper-family-name'
      },
      {
        step: '/helper-details',
        field: 'helper-organisation'
      },
      {
        step: '/helper-details',
        field: 'helper-email-address'
      }
    ]
  },
  name: {
    steps: [
      {
        step: '/new-name',
        field: 'given-name',
        parse: (value, req) => {
          const newName = [
            req.sessionModel.get('given-name'),
            req.sessionModel.get('family-name')
          ];
          return newName.filter(Boolean).join(' ');
        }
      },
      {
        step: '/do-you-need-to-change-your-name',
        field: 'do-you-need-to-change-your-name'
      },
      {
        step: '/do-you-need-to-change-someone-elses-name',
        field: 'change-someone-elses-name'
      },
      {
        step: '/relationship-name-change',
        field: 'relationship-name-change',
        dependsOn: 'change-someone-elses-name'
      },
      {
        step: '/reason-someone-else-name-change',
        field: 'reason-someone-else-name-change',
        dependsOn: 'change-someone-elses-name'
      },
      {
        step: '/someone-else-new-name',
        field: 'someone-else-old-given-name',
        dependsOn: 'change-someone-elses-name'
      },
      {
        step: '/someone-else-new-name',
        field: 'someone-else-old-family-name',
        dependsOn: 'change-someone-elses-name'
      },
      {
        step: '/someone-else-new-name',
        field: 'someone-else-new-given-name',
        dependsOn: 'change-someone-elses-name'
      },
      {
        step: '/someone-else-new-name',
        field: 'someone-else-new-family-name',
        dependsOn: 'change-someone-elses-name'
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
  'date-of-birth': {
    steps: dateOfBirthRows
  },
  'email-address': {
    steps: emailAddressRows
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
      aggregateSummaryRow('reportadeath')
    ]
  },
  evidence: {
    steps: [
      {
        step: '/send-evidence-for-your-claim',
        field: 'send-evidence-for-your-claim'
      },
      ...evidenceRows
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
