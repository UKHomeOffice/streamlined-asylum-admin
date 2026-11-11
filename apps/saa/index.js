const hof = require('hof');
const Summary = hof.components.summary;
const config = require('../../config');

const CustomValidation = require('../common/behaviours/custom-validation');
const somethingElseFork = require('../saa/behaviours/something-else-fork');
const ContactUsByEmail = require('./behaviours/contact-us-by-email');
const CheckEmailToken = require('./behaviours/check-email-token');
const RemoveDocument = require('./behaviours/remove-document');
const SaveDocument = require('./behaviours/save-document');
const RequireSelectedSection = require('./behaviours/require-selected-section');
const getOldName = require('./behaviours/get-old-name');

const AggregateSaveUpdate = require('./behaviours/aggregator-save-update');
const LimitAggregateItems = require('./behaviours/limit-aggregator');
const ParseSummaryFields = require('./behaviours/parse-section-summary-fields');
const aggregatorSummaries = require('./config/aggregator-summaries');
const EditRouteReturn = require('./behaviours/edit-route-return');
const EditRouteStart = require('./behaviours/edit-route-start');
const SummaryLabels = require('./behaviours/summary-labels');
const ResetSectionSummary = require('./behaviours/reset-section-summary');
const ResumeFormSession = require('./behaviours/resume-form-session');
const SaveFormSession = require('./behaviours/save-form-session');
const InformationGiven = require('./behaviours/information-given');

const documentUploadStep = category => ({
  behaviours: [SaveDocument(category, 'file-upload'), RemoveDocument(category)],
  fields: ['file-upload'],
  locals: {
    documentCategory: {
      name: category,
      required: config.upload.required,
      acceptedFileExtensions: config.upload.acceptedFileExtensions,
      limit: config.upload.limit,
      limitValidationError: config.upload.limitValidationError,
      allowedMimeTypes: config.upload.allowedMimeTypes,
      ...config.upload.documentCategories[category]
    }
  }
});

const configureMultiSelectFollowUps = require('./config/configure-multi-select-follow-ups');
const multiSelectFollowUpsConfig = require('./config/multi-select-follow-ups-config');
const { SAA_BASE_URL: baseUrl } = require('../../utils/constants');

const steps = {
  '/continue-to-form': {
    behaviours: [CheckEmailToken],
    next: '/which-form',
    backLink: false
  },
  '/which-form': {
    behaviours: [ResumeFormSession],
    next: '/information-given',
    backLink: false
  },
  '/information-given': {
    behaviours: [Summary, SummaryLabels, EditRouteStart, InformationGiven],
    sections: require('./sections/summary-data-sections'),
    next: '/claimants-name'
  },
  '/claimants-name': {
    behaviours: [CustomValidation],
    fields: ['claimants-given-name', 'claimants-family-name'],
    next: '/claimant-main-language'
  },
  '/claimant-main-language': {
    fields: ['claimant-main-language'],
    next: '/person-completing-form'
  },
  '/person-completing-form': {
    fields: ['person-completing-form'],
    forks: [
      {
        target: '/relationship-to-claimant',
        continueOnEdit: true,
        condition: {
          field: 'person-completing-form',
          value: 'someone-else'
        }
      }
    ],
    next: '/who-are-you'
  },
  '/who-are-you': {
    fields: ['who-are-you'],
    next: '/personal-details'
  },
  '/personal-details': {
    behaviours: [RequireSelectedSection],
    fields: ['change-personal-details'],
    forks: [
      {
        target: '/changes-to-contact-details',
        continueOnEdit: true,
        condition: {
          field: 'change-personal-details',
          value: 'yes'
        }
      }
    ],
    next: '/do-you-need-add-remove-dependant'
  },
  '/changes-to-contact-details': {
    fields: ['changes-to-contact-details'],
    // Entry point: calculate active follow-up sections from the checkbox field.
    behaviours: [RequireSelectedSection],
    next: '/do-you-need-add-remove-dependant'
  },
  '/do-you-need-to-change-your-name': {
    continueOnEdit: true,
    fields: ['do-you-need-to-change-your-name'],
    forks: [
      {
        target: '/do-you-need-to-change-someone-elses-name',
        continueOnEdit: true,
        condition: {
          field: 'do-you-need-to-change-your-name',
          value: 'no'
        }
      }
    ],
    next: '/reason-name-change'
  },
  '/reason-name-change': {
    fields: ['reason-name-change'],
    next: '/new-name'
  },
  '/new-name': {
    behaviours: [CustomValidation, getOldName],
    fields: ['given-name', 'family-name'],
    next: '/new-name-evidence'
  },
  '/new-name-evidence': {
    ...documentUploadStep('documents-new-name'),
    template: 'upload-new-name-evidence',
    next: '/check-your-answers-name'
  },
  '/check-your-answers-name': {
    // New sections still need the someone-else question; completed edits use the configured boundary.
    continueOnEdit: true,
    behaviours: [Summary, SummaryLabels, EditRouteReturn],
    sections: require('./sections/summary-data-name'),
    next: '/do-you-need-to-change-someone-elses-name'
  },
  '/do-you-need-to-change-someone-elses-name': {
    behaviours: [
      ResetSectionSummary(['someoneelsenewname'], 'change-someone-elses-name')
    ],
    fields: ['change-someone-elses-name'],
    forks: [
      {
        target: '/relationship-name-change',
        continueOnEdit: true,
        condition: {
          field: 'change-someone-elses-name',
          value: 'yes'
        }
      }
    ],
    next: '/do-you-need-add-remove-dependant'
  },
  '/relationship-name-change': {
    fields: ['relationship-name-change'],
    next: '/reason-someone-else-name-change'
  },
  '/reason-someone-else-name-change': {
    fields: ['reason-someone-else-name-change'],
    next: '/someone-else-new-name'
  },
  '/someone-else-new-name': {
    behaviours: [CustomValidation],
    fields: [
      'someone-else-old-given-name',
      'someone-else-old-family-name',
      'someone-else-new-given-name',
      'someone-else-new-family-name'
    ],
    next: '/someone-else-new-name-evidence'
  },
  '/someone-else-new-name-evidence': {
    ...documentUploadStep('documents-someone-else-new-name'),
    template: 'upload-new-name-evidence',
    next: '/check-your-answers-someone-else-name'
  },
  '/check-your-answers-someone-else-name': {
    backLink: false,
    behaviours: [
      AggregateSaveUpdate,
      LimitAggregateItems,
      ParseSummaryFields(aggregatorSummaries.someoneelsenewname),
      EditRouteReturn
    ],
    aggregateTo: 'someoneelsenewname',
    aggregateFrom: [
      'relationship-name-change',
      'reason-someone-else-name-change',
      'someone-else-old-given-name',
      'someone-else-old-family-name',
      'someone-else-new-given-name',
      'someone-else-new-family-name',
      'documents-someone-else-new-name'
    ],
    aggregateLimit: config.aggregateLimits.someoneElsesName,
    addStep: 'relationship-name-change',
    next: '/do-you-need-add-remove-dependant'
  },
  '/change-your-date-of-birth': {
    fields: ['change-your-date-of-birth'],
    forks: [
      {
        target: '/change-someone-else-date-of-birth',
        continueOnEdit: true,
        condition: {
          field: 'change-your-date-of-birth',
          value: 'no'
        }
      }
    ],
    next: '/correct-date-of-birth'
  },
  '/correct-date-of-birth': {
    fields: ['correct-date-of-birth'],
    next: '/new-date-of-birth-evidence'
  },
  '/new-date-of-birth-evidence': {
    ...documentUploadStep('documents-new-dob'),
    template: 'upload-dob-evidence',
    next: '/check-your-answers-date-of-birth'
  },
  '/check-your-answers-date-of-birth': {
    // Incomplete sections still need the someone-else question; completed edits use the configured boundary.
    continueOnEdit: true,
    behaviours: [Summary, SummaryLabels, EditRouteReturn],
    sections: require('./sections/summary-data-date-of-birth'),
    next: '/change-someone-else-date-of-birth'
  },
  '/change-someone-else-date-of-birth': {
    behaviours: [
      ResetSectionSummary(
        ['someoneelsenewdob'],
        'change-someone-else-date-of-birth'
      )
    ],
    fields: ['change-someone-else-date-of-birth'],
    forks: [
      {
        target: '/relationship-date-of-birth',
        continueOnEdit: true,
        condition: {
          field: 'change-someone-else-date-of-birth',
          value: 'yes'
        }
      }
    ],
    next: '/do-you-need-add-remove-dependant'
  },
  '/relationship-date-of-birth': {
    fields: ['relationship-date-of-birth'],
    next: '/someone-else-correct-date-of-birth'
  },
  '/someone-else-correct-date-of-birth': {
    behaviours: [CustomValidation],
    fields: [
      'someone-else-correct-date-of-birth-given-name',
      'someone-else-correct-date-of-birth-family-name',
      'someone-else-correct-date-of-birth'
    ],
    next: '/someone-else-new-date-of-birth-evidence'
  },
  '/someone-else-new-date-of-birth-evidence': {
    ...documentUploadStep('documents-someone-else-new-dob'),
    template: 'upload-dob-evidence',
    next: '/check-your-answers-someone-else-date-of-birth'
  },
  '/check-your-answers-someone-else-date-of-birth': {
    backLink: false,
    behaviours: [
      AggregateSaveUpdate,
      LimitAggregateItems,
      ParseSummaryFields(aggregatorSummaries.someoneelsenewdob),
      EditRouteReturn
    ],
    aggregateTo: 'someoneelsenewdob',
    aggregateFrom: [
      'relationship-date-of-birth',
      'someone-else-correct-date-of-birth-given-name',
      'someone-else-correct-date-of-birth-family-name',
      'someone-else-correct-date-of-birth',
      'documents-someone-else-new-dob'
    ],
    addStep: 'relationship-date-of-birth',
    aggregateLimit: config.aggregateLimits.someoneElseNewDob,
    next: '/do-you-need-add-remove-dependant'
  },
  '/nationality-change': {
    // Page fields and validation belong to its Nationality story.
    forks: [
      {
        target: '/change-someone-else-nationality',
        continueOnEdit: true,
        condition: {
          field: 'change-your-nationality',
          value: 'no'
        }
      }
    ],
    next: '/correct-nationality'
  },
  '/correct-nationality': {
    // Page fields to be added in its story.
    next: '/reason-nationality-change'
  },
  '/reason-nationality-change': {
    // Page fields to be added in its story.
    next: '/upload-nationality-evidence'
  },
  '/upload-nationality-evidence': {
    // Upload (documents-nationality) to be added in its story.
    next: '/check-your-answers-nationality'
  },
  '/check-your-answers-nationality': {
    // Summary to be added in its story.
    next: '/change-someone-else-nationality'
  },
  '/change-someone-else-nationality': {
    // Add ResetSectionSummary for the nationality loop when its add-another story is built.
    // Page fields and validation belong to its Nationality story.
    forks: [
      {
        target: '/relationship-nationality-change',
        continueOnEdit: true,
        condition: {
          field: 'change-someone-else-nationality',
          value: 'yes'
        }
      }
    ],
    // Keep unanswered placeholders inside the section until the decision field is implemented.
    next: '/relationship-nationality-change'
  },
  '/relationship-nationality-change': {
    // Page fields to be added in its story.
    next: '/someone-else-correct-nationality'
  },
  '/someone-else-correct-nationality': {
    // Page fields to be added in its story.
    next: '/reason-someone-else-nationality-change'
  },
  '/reason-someone-else-nationality-change': {
    // Page fields to be added in its story.
    next: '/upload-someone-else-nationality-evidence'
  },
  '/upload-someone-else-nationality-evidence': {
    // Upload (documents-someone-else-nationality) to be added in its story.
    next: '/check-your-answers-someone-else-nationality'
  },
  '/check-your-answers-someone-else-nationality': {
    // Add-another loop to be added in its story; Continue completes the nationality section.
    next: '/do-you-need-add-remove-dependant'
  },
  '/change-uk-address': {
    // Page fields and validation belong to its Address story.
    forks: [
      {
        target: '/change-contact-address',
        continueOnEdit: true,
        condition: {
          field: 'change-uk-address',
          value: 'no'
        }
      }
    ],
    next: '/home-address'
  },
  '/home-address': {
    fields: [
      'home-address-line-1',
      'home-address-line-2',
      'home-address-town-or-city',
      'home-address-county',
      'home-address-postcode',
      'home-address-moved-date',
      'send-letters-to-home-address'
    ],
    forks: [
      {
        target: '/change-contact-address',
        continueOnEdit: true,
        condition: {
          field: 'send-letters-to-home-address',
          value: 'no'
        }
      }
    ],
    next: '/check-your-answers-address'
  },
  '/new-email-address': {
    behaviours: [CustomValidation],
    fields: [
      'old-email-address',
      'new-email-address',
      'confirm-new-email-address'
    ],
    next: '/check-your-answers-email'
  },
  '/check-your-answers-email': {
    behaviours: [Summary, SummaryLabels, EditRouteReturn],
    sections: require('./sections/summary-data-email-address'),
    next: '/do-you-need-add-remove-dependant'
  },
  '/your-phone-number': {
    fields: ['your-phone-number', 'whose-phone-number'],
    next: '/new-phone-number'
  },
  '/new-phone-number': {
    behaviours: [CustomValidation],
    fields: [
      'old-phone-number',
      'new-phone-number',
      'confirm-new-phone-number'
    ],
    next: '/check-your-answers-phone-number'
  },
  '/check-your-answers-phone-number': {
    behaviours: [Summary, SummaryLabels, EditRouteReturn],
    sections: require('./sections/summary-data-phone-number'),
    next: '/do-you-need-add-remove-dependant'
  },
  '/provide-photo-identity': {
    // provisional document category: documents-update-contact
    next: '/do-you-need-add-remove-dependant'
  },
  '/no-changes-made': {
    // Shared by personal details sections; the multi-select behaviour handles routing, header and Back.
    fields: ['no-changes-made'],
    behaviours: [RequireSelectedSection],
    next: '/do-you-need-add-remove-dependant'
  },
  '/relationship-to-claimant': {
    fields: ['relationship-to-claimant'],
    forks: [
      {
        target: '/how-you-are-helping',
        continueOnEdit: true,
        condition: {
          field: 'relationship-to-claimant',
          value: 'someone-helping-them'
        }
      }
    ],
    next: '/helper-details'
  },
  '/how-you-are-helping': {
    fields: ['how-you-are-helping'],
    next: '/helper-details'
  },
  '/helper-details': {
    behaviours: [CustomValidation],
    fields: [
      'helper-given-name',
      'helper-family-name',
      'helper-organisation',
      'helper-email-address'
    ],
    next: '/completing-for-someone-else'
  },
  '/completing-for-someone-else': {
    next: '/personal-details'
  },
  '/change-contact-address': {
    // Page fields and validation belong to its Address story.
    forks: [
      {
        target: '/reason-contact-address-change',
        continueOnEdit: true,
        condition: {
          field: 'change-contact-address',
          value: 'yes'
        }
      }
    ],
    next: '/check-your-answers-address'
  },
  '/reason-contact-address-change': {
    // Page fields to be added in its story.
    next: '/contact-address'
  },
  '/contact-address': {
    // Page fields to be added in its story.
    next: '/check-your-answers-address'
  },
  '/check-your-answers-address': {
    // Summary to be added in its story.
    next: '/do-you-need-add-remove-dependant'
  },
  '/do-you-need-add-remove-dependant': {
    behaviours: [
      RequireSelectedSection,
      ResetSectionSummary(['addremovechildpartner'], 'add-remove-dependant')
    ],
    fields: ['add-remove-dependant'],
    forks: [
      {
        target: '/add-remove-child-partner',
        continueOnEdit: true,
        condition: {
          field: 'add-remove-dependant',
          value: 'yes'
        }
      }
    ],
    next: '/send-evidence-for-your-claim'
  },
  '/add-remove-child-partner': {
    continueOnEdit: true,
    fields: ['add-remove-child-partner'],
    forks: [
      {
        target: '/relationship-to-child-partner',
        condition: {
          field: 'add-remove-child-partner',
          value: 'add-child-partner'
        }
      }
    ],
    next: '/reason-for-removing-child-partner'
  },
  '/reason-for-removing-child-partner': {
    continueOnEdit: true,
    fields: ['reason-removing-child-partner'],
    next: '/relationship-to-child-partner'
  },
  '/relationship-to-child-partner': {
    continueOnEdit: true,
    fields: ['relationship-to-child-partner'],
    next: '/child-partner-name'
  },
  '/child-partner-name': {
    continueOnEdit: true,
    behaviours: [CustomValidation],
    fields: ['child-partner-given-name', 'child-partner-family-name'],
    next: '/child-partner-date-of-birth'
  },
  '/child-partner-date-of-birth': {
    continueOnEdit: true,
    fields: ['child-partner-date-of-birth'],
    next: '/child-partner-nationality'
  },
  '/child-partner-nationality': {
    continueOnEdit: true,
    fields: ['child-partner-nationality'],
    next: '/evidence-child-partner'
  },
  '/evidence-child-partner': {
    continueOnEdit: true,
    ...documentUploadStep('documents-child-partner'),
    next: '/check-your-answers-add-child-partner'
  },
  '/check-your-answers-add-child-partner': {
    backLink: false,
    behaviours: [
      AggregateSaveUpdate,
      LimitAggregateItems,
      ParseSummaryFields(aggregatorSummaries.addremovechildpartner),
      EditRouteReturn
    ],
    aggregateTo: 'addremovechildpartner',
    aggregateFrom: [
      // Stored per item so editing restores the right add/remove route.
      'add-remove-child-partner',
      'reason-removing-child-partner',
      'relationship-to-child-partner',
      'child-partner-given-name',
      'child-partner-family-name',
      'child-partner-date-of-birth',
      'child-partner-nationality',
      'documents-child-partner'
    ],
    titleField: ['add-remove-child-partner'],
    addStep: 'add-remove-child-partner',
    editStepForks: [
      {
        target: 'relationship-to-child-partner',
        condition: {
          field: 'add-remove-child-partner',
          value: 'add-child-partner'
        }
      },
      {
        target: 'reason-for-removing-child-partner',
        condition: {
          field: 'add-remove-child-partner',
          value: 'remove-child-partner'
        }
      }
    ],
    aggregateLimit: config.aggregateLimits.addOrRemoveChildPartner,
    next: '/send-evidence-for-your-claim'
  },
  '/send-evidence-for-your-claim': {
    behaviours: [RequireSelectedSection],
    fields: ['send-evidence-for-your-claim'],
    forks: [
      {
        target: '/prepare-your-evidence',
        continueOnEdit: true,
        condition: {
          field: 'send-evidence-for-your-claim',
          value: 'yes'
        }
      }
    ],
    next: '/someone-on-claim-died'
  },
  '/prepare-your-evidence': {
    continueOnEdit: true,
    next: '/upload-supporting-evidence'
  },
  '/upload-supporting-evidence': {
    continueOnEdit: true,
    ...documentUploadStep('documents-help-your-claim'),
    next: '/violent-upsetting-images'
  },
  '/violent-upsetting-images': {
    continueOnEdit: true,
    fields: ['evidence-violent-or-upsetting'],
    next: '/check-your-answers-evidence'
  },
  '/check-your-answers-evidence': {
    behaviours: [Summary, SummaryLabels, EditRouteReturn],
    sections: require('./sections/summary-data-evidence-help-your-claim'),
    locals: { addStep: 'upload-supporting-evidence' },
    next: '/someone-on-claim-died'
  },
  '/someone-on-claim-died': {
    behaviours: [
      RequireSelectedSection,
      ResetSectionSummary(['reportadeath'], 'someone-on-claim-died')
    ],
    fields: ['someone-on-claim-died'],
    forks: [
      {
        target: '/about-who-has-died',
        continueOnEdit: true,
        condition: {
          field: 'someone-on-claim-died',
          value: 'yes'
        }
      }
    ],
    next: '/something-else'
  },
  '/about-who-has-died': {
    continueOnEdit: true,
    next: '/main-claimant-died'
  },
  '/main-claimant-died': {
    continueOnEdit: true,
    fields: ['main-claimant-died'],
    next: '/name-person-who-died'
  },
  '/name-person-who-died': {
    continueOnEdit: true,
    fields: ['given-name-person-who-died', 'family-name-person-who-died'],
    next: '/date-of-birth-person-who-died'
  },
  '/date-of-birth-person-who-died': {
    continueOnEdit: true,
    fields: ['date-of-birth-person-who-died'],
    next: '/nationality-person-who-died'
  },
  '/nationality-person-who-died': {
    continueOnEdit: true,
    fields: ['nationality-person-who-died'],
    next: '/upload-death-certificate'
  },
  '/upload-death-certificate': {
    continueOnEdit: true,
    ...documentUploadStep('documents-death-certificate'),
    template: 'upload-supporting-evidence',
    next: '/check-your-answers-death'
  },
  '/check-your-answers-death': {
    backLink: false,
    behaviours: [
      AggregateSaveUpdate,
      LimitAggregateItems,
      ParseSummaryFields(aggregatorSummaries.reportadeath),
      EditRouteReturn
    ],
    aggregateTo: 'reportadeath',
    aggregateFrom: [
      'about-who-has-died',
      'main-claimant-died',
      'given-name-person-who-died',
      'family-name-person-who-died',
      'date-of-birth-person-who-died',
      'nationality-person-who-died',
      'documents-death-certificate'
    ],
    titleField: ['about-who-has-died'],
    addStep: 'main-claimant-died',
    aggregateLimit: config.aggregateLimits.reportADeath,
    next: '/something-else'
  },
  '/confirm': {
    behaviours: [Summary, SummaryLabels, EditRouteStart],
    sections: require('./sections/summary-data-sections')
  },
  '/declaration': {
    next: '/submitted'
  },
  '/submitted': {},
  '/something-else': {
    behaviours: [somethingElseFork],
    fields: ['something-else'],
    next: '/confirm'
  },
  '/contact-us-by-email': {
    behaviours: [ContactUsByEmail],
    backLink: 'something-else',
    next: '/confirm'
  },
  '/no-options': {
    backLink: 'something-else'
  },
  '/service-unavailable': {},
  '/session-ended': {},
  '/form-saved': {
    clearSession: true,
    backLink: false
  },
  '/expired-link': {}
};

configureMultiSelectFollowUps(steps, multiSelectFollowUpsConfig);

module.exports = {
  name: 'saa',
  baseUrl,
  params: '/:action?/:id?/:edit?',
  fields: 'apps/saa/fields',
  views: 'apps/saa/views',
  translations: 'apps/saa/translations',
  steps: steps,
  behaviours: [SaveFormSession]
};
