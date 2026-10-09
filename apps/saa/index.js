const hof = require('hof');
const Summary = hof.components.summary;
const config = require('../../config');

const CustomValidation = require('../common/behaviours/custom-validation');
const somethingElseFork = require('../saa/behaviours/something-else-fork');
const CheckEmailToken = require('./behaviours/check-email-token');
const RemoveDocument = require('./behaviours/remove-document');
const SaveDocument = require('./behaviours/save-document');

const documentUploadStep = category => ({
  behaviours: [
    SaveDocument(category, 'file-upload'),
    RemoveDocument(category)
  ],
  fields: ['file-upload'],
  locals: {
    documentCategory: {
      name: category,
      acceptedFileExtensions: config.upload.acceptedFileExtensions,
      ...config.upload.documentCategories[category]
    }
  }
});

const MultiSelectFollowUps = require('./behaviours/multi-select-follow-ups');
const multiSelectFollowUpsConfig = require('./config/multi-select-follow-ups-config');
const multiSelectFollowUpsBehaviour = MultiSelectFollowUps(
  multiSelectFollowUpsConfig
);
const baseUrl = '/changes';

const getConfiguredSections = option => option.sections || [];

const getCompletionRoutesForSection = section =>
  MultiSelectFollowUps.asArray(section.completeOn).map(completion =>
    MultiSelectFollowUps.getCompletionRoute(completion)
  );

const getCompletionRoutesForOption = option =>
  getConfiguredSections(option).reduce(
    (routes, section) => routes.concat(getCompletionRoutesForSection(section)),
    []
  );

const getConfiguredCompletionRoutes = followUpsConfig =>
  followUpsConfig.options.reduce(
    (routes, option) => routes.concat(getCompletionRoutesForOption(option)),
    []
  );

const getStartRoutesForOption = option =>
  getConfiguredSections(option).map(section => section.start);

const getConfiguredStartRoutes = followUpsConfig =>
  followUpsConfig.options.reduce(
    (routes, option) => routes.concat(getStartRoutesForOption(option)),
    []
  );

/*
 * The multi-select follow-up behaviour is intentionally used as a thin wrapper
 * around normal HOF routes. It only decides which selected section starts next
 * after `/changes-to-contact-details`, and which section starts after a section
 * completion page posts. Individual pages below still use their existing `next`
 * and `forks` settings.
 */
const steps = {
  '/continue-to-form': {
    behaviours: [CheckEmailToken],
    next: '/which-form',
    backLink: false
  },
  '/which-form': {
    next: '/information-given'
  },
  '/information-given': {
    next: '/claimants-name'
  },
  '/claimants-name': {
    next: '/claimant-main-language'
  },
  '/claimant-main-language': {
    next: '/person-completing-form'
  },
  '/person-completing-form': {
    next: '/who-are-you'
  },
  '/who-are-you': {
    next: '/personal-details'
  },
  '/personal-details': {
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
    behaviours: [multiSelectFollowUpsBehaviour],
    next: '/do-you-need-add-remove-dependant'
  },
  '/do-you-need-to-change-your-name': {
    next: '/reason-name-change',
    backLink: '/changes/changes-to-contact-details'
  },
  '/reason-name-change': {
    next: '/new-name'
  },
  '/new-name': {
    next: '/new-name-evidence'
  },
  '/new-name-evidence': {
    // provisional document category: documents-new-name
    next: '/check-your-answers-name'
  },
  '/check-your-answers-name': {
    next: '/do-you-need-to-change-someone-elses-name'
  },
  '/do-you-need-to-change-someone-elses-name': {
    next: '/relationship-name-change'
  },
  '/relationship-name-change': {
    next: '/someone-else-new-name'
  },
  '/someone-else-new-name': {
    next: '/someone-else-new-name-evidence'
  },
  '/someone-else-new-name-evidence': {
    // provisional document category: documents-someone-else-new-name
    next: '/whose-date-of-birth'
  },
  '/whose-date-of-birth': {
    next: '/correct-date-of-birth'
  },
  '/correct-date-of-birth': {
    next: '/new-date-of-birth-evidence'
  },
  '/new-date-of-birth-evidence': {
    // provisional document category: documents-new-dob
    next: '/check-your-answers-date-of-birth'
  },
  '/check-your-answers-date-of-birth': {
    next: '/relationship-date-of-birth'
  },
  '/relationship-date-of-birth': {
    next: '/someone-else-correct-date-of-birth'
  },
  '/someone-else-correct-date-of-birth': {
    // provisional document category: documents-someone-else-new-dob
    next: '/whose-nationality-to-change'
  },
  '/whose-nationality-to-change': {
    next: '/correct-nationality'
  },
  '/correct-nationality': {
    next: '/reason-nationality-change'
  },
  '/reason-nationality-change': {
    next: '/upload-nationality-evidence'
  },
  '/upload-nationality-evidence': {
    // provisional document category: documents-nationality
    next: '/check-your-answers-nationality'
  },
  '/check-your-answers-nationality': {
    next: '/change-someone-else-nationality'
  },
  '/change-someone-else-nationality': {
    next: '/relationship-nationality-change'
  },
  '/relationship-nationality-change': {
    next: '/someone-else-correct-nationality'
  },
  '/someone-else-correct-nationality': {
    // provisional document category: documents-someone-else-nationality
    next: '/provide-photo-identity'
  },
  '/provide-photo-identity': {
    // provisional document category: documents-update-contact
    next: '/change-uk-address'
  },
  '/change-uk-address': {
    next: '/home-address'
  },
  '/home-address': {
    next: '/new-email-address'
  },
  '/new-email-address': {
    next: '/check-your-answers-email'
  },
  '/check-your-answers-email': {
    next: '/your-phone-number'
  },
  '/your-phone-number': {
    next: '/new-phone-number'
  },
  '/new-phone-number': {
    next: '/declaration'
  },
  '/declaration': {
    next: '/relationship-to-claimant'
  },
  '/relationship-to-claimant': {
    next: '/helper-details'
  },
  '/helper-details': {
    next: '/completing-for-someone-else'
  },
  '/completing-for-someone-else': {
    next: '/change-contact-address'
  },
  '/change-contact-address': {
    next: '/reason-contact-address-change'
  },
  '/reason-contact-address-change': {
    next: '/contact-address'
  },
  '/contact-address': {
    next: '/how-you-are-helping'
  },
  '/how-you-are-helping': {
    next: '/check-your-answers-address'
  },
  '/check-your-answers-address': {
    next: '/do-you-need-add-remove-dependant'
  },
  '/do-you-need-add-remove-dependant': {
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
    fields: ['reason-removing-child-partner'],
    next: '/relationship-to-child-partner'
  },
  '/relationship-to-child-partner': {
    fields: ['relationship-to-child-partner'],
    next: '/child-partner-name'
  },
  '/child-partner-name': {
    behaviours: [CustomValidation],
    fields: ['child-partner-given-name', 'child-partner-family-name'],
    next: '/child-partner-date-of-birth'
  },
  '/child-partner-date-of-birth': {
    fields: ['child-partner-date-of-birth'],
    next: '/child-partner-nationality'
  },
  '/child-partner-nationality': {
    fields: ['child-partner-nationality'],
    next: '/evidence-child-partner'
  },
  '/evidence-child-partner': {
    // provisional document category: documents-child-partner
    next: '/check-your-answers-add-child-partner'
  },
  '/check-your-answers-add-child-partner': {
    next: '/send-evidence-for-your-claim'
  },
  '/send-evidence-for-your-claim': {
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
    next: '/upload-supporting-evidence'
  },
  '/upload-supporting-evidence': {
    ...documentUploadStep('documents-help-your-claim'),
    next: '/violent-upsetting-images'
  },
  '/violent-upsetting-images': {
    fields: ['evidence-violent-or-upsetting'],
    next: '/check-your-answers-evidence'
  },
  '/check-your-answers-evidence': {
    next: '/someone-on-claim-died'
  },
  '/someone-on-claim-died': {
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
    next: '/main-claimant-died'
  },
  '/main-claimant-died': {
    next: '/name-person-who-died'
  },
  '/name-person-who-died': {
    next: '/date-of-birth-person-who-died'
  },
  '/date-of-birth-person-who-died': {
    next: '/nationality-person-who-died'
  },
  '/nationality-person-who-died': {
    next: '/upload-death-certificate'
  },
  '/upload-death-certificate': {
    // provisional document category: documents-death-certificate
    next: '/check-your-answers-death'
  },
  '/check-your-answers-death': {
    next: '/something-else'
  },
  '/confirm': {
    behaviours: [Summary],
    sections: require('./sections/summary-data-sections')
  },
  '/something-else': {
    behaviours: [somethingElseFork],
    fields: ['something-else']
  },
  '/contact-us-by-email': {},
  '/no-options': {
    backLink: 'something-else'
  },
  '/page-not-found': {},
  '/service-unavailable': {},
  '/problem-with-service': {},
  '/session-ended': {},
  '/form-saved': {},
  '/cannot-use-form': {},
  '/expired-link': {}
};

/*
 * Attach the behaviour only to configured section completion pages. This is the
 * key design choice: the behaviour should not run every page in a selected flow,
 * because section internals can include HOF forks, aggregate loops and local CYA
 * journeys. Completion pages are the hand-off points back to the common
 * orchestrator.
 */
getConfiguredCompletionRoutes(multiSelectFollowUpsConfig)
  .filter((route, index, routes) => routes.indexOf(route) === index)
  .forEach(route => {
    if (!steps[route]) {
      return;
    }

    steps[route].behaviours = [].concat(
      steps[route].behaviours || [],
      multiSelectFollowUpsBehaviour
    );
  });

if (steps[multiSelectFollowUpsConfig.exitPoint]) {
  steps[multiSelectFollowUpsConfig.exitPoint].behaviours = [].concat(
    steps[multiSelectFollowUpsConfig.exitPoint].behaviours || [],
    multiSelectFollowUpsBehaviour
  );
}

getConfiguredStartRoutes(multiSelectFollowUpsConfig)
  .filter((route, index, routes) => routes.indexOf(route) === index)
  .forEach(route => {
    if (!steps[route]) {
      return;
    }

    steps[route].behaviours = [].concat(
      steps[route].behaviours || [],
      multiSelectFollowUpsBehaviour
    );
    steps[route].prereqs = [].concat(
      steps[route].prereqs || [],
      multiSelectFollowUpsConfig.entryPoint
    );
    steps[route].backLinks = [].concat(
      steps[route].backLinks || [],
      multiSelectFollowUpsConfig.entryPoint
    );
  });

module.exports = {
  name: 'saa',
  baseUrl,
  params: '/:action?/:id?/:edit?',
  fields: 'apps/saa/fields',
  views: 'apps/saa/views',
  translations: 'apps/saa/translations',
  steps: steps
};
