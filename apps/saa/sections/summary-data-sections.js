// Using default labels for now. Review and update when the final CYA design is available.
const {
  formatAggregateForSummary
} = require('../behaviours/parse-section-summary-fields');
const aggregatorSummaries = require('../config/aggregator-summaries');
const { SAA_BASE_URL } = require('../../../utils/constants');
const evidenceSummary = require('./summary-data-evidence-help-your-claim');
const emailAddressSummary = require('./summary-data-email-address');
const dateOfBirthSummary = require('./summary-data-date-of-birth');
const phoneNumberSummary = require('./summary-data-phone-number');
const nameSummary = require('./summary-data-name');
const { formatDate, formatUanForDisplay } = require('../../../utils');

// Same rows as /check-your-answers-evidence; Change goes back to that page.
const evidenceRows = evidenceSummary.evidence.steps.map(row => ({
  ...row,
  changeLink: `${SAA_BASE_URL}/check-your-answers-evidence`,
  dependsOn: 'send-evidence-for-your-claim'
}));

// Same rows as /check-your-answers-email; Change goes back to that page.
const emailAddressRows = emailAddressSummary['email-address'].steps.map(
  row => ({
    ...row,
    changeLink: `${SAA_BASE_URL}/check-your-answers-email`,
    dependsOn: 'change-personal-details'
  })
);

// Same rows as /check-your-answers-date-of-birth; Change goes back to that page.
const dateOfBirthRows = dateOfBirthSummary['date-of-birth'].steps.map(row => ({
  ...row,
  changeLink: `${SAA_BASE_URL}/check-your-answers-date-of-birth`,
  dependsOn: 'change-personal-details'
}));

// Same rows as /check-your-answers-phone-number; Change goes back to that page.
const phoneNumberRows = phoneNumberSummary['phone-number'].steps.map(row => ({
  ...row,
  changeLink: `${SAA_BASE_URL}/check-your-answers-phone-number`,
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
        step: '/person-completing-form',
        field: 'person-completing-form'
      },
      {
        step: '/who-are-you',
        field: 'who-are-you'
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
  'personal-details': {
    steps: [
      {
        step: '/personal-details',
        field: 'change-personal-details'
      },
      {
        step: '/changes-to-contact-details',
        field: 'changes-to-contact-details',
        parse: list => (Array.isArray(list) ? list.join('\n') : list)
      }
    ]
  },
  name: {
    steps: [
      {
        step: '/do-you-need-to-change-your-name',
        field: 'do-you-need-to-change-your-name'
      },
      {
        step: '/reason-name-change',
        field: 'reason-name-change',
        changeLink: `${SAA_BASE_URL}/check-your-answers-name`,
        dependsOn: 'do-you-need-to-change-your-name'
      },
      {
        step: '/new-name',
        field: 'given-name',
        changeLink: `${SAA_BASE_URL}/check-your-answers-name`,
        parse: (value, req) => {
          const newName = [
            req.sessionModel.get('given-name'),
            req.sessionModel.get('family-name')
          ];
          return newName.filter(Boolean).join(' ');
        }
      },
      {
        ...nameSummary['change-your-name'].steps.find(
          row => row.field === 'documents-new-name'
        ),
        changeLink: `${SAA_BASE_URL}/check-your-answers-name`,
        dependsOn: 'do-you-need-to-change-your-name'
      }
    ]
  },
  'someone-else-new-name': {
    steps: [
      {
        step: '/do-you-need-to-change-someone-elses-name',
        field: 'change-someone-elses-name'
      },
      aggregateSummaryRow('someoneelsenewname')
    ]
  },
  'date-of-birth': {
    steps: dateOfBirthRows
  },
  'someone-else-date-of-birth': {
    steps: [
      {
        step: '/change-someone-else-date-of-birth',
        field: 'change-someone-else-date-of-birth'
      },
      aggregateSummaryRow('someoneelsenewdob')
    ]
  },
  'email-address': {
    steps: emailAddressRows
  },
  'phone-number': {
    steps: phoneNumberRows
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
