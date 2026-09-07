const steps = {
  '/continue-to-form': {
    next: '/which-form'
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
    next: '/update-personal-details'
  },
  '/update-personal-details': {
    next: '/changes-to-contact-details'
  },
  '/changes-to-contact-details': {
    next: '/do-you-need-to-change-your-name'
  },
  '/do-you-need-to-change-your-name': {
    next: '/reason-name-change'
  },
  '/reason-name-change': {
    next: '/new-name'
  },
  '/new-name': {
    next: '/new-name-evidence'
  },
  '/new-name-evidence': {
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
    next: '/whose-date-of-birth'
  },
  '/whose-date-of-birth': {
    next: '/correct-date-of-birth'
  },
  '/correct-date-of-birth': {
    next: '/new-date-of-birth-evidence'
  },
  '/new-date-of-birth-evidence': {
    next: '/check-your-answers-date-of-birth'
  },
  '/check-your-answers-date-of-birth': {
    next: '/relationship-date-of-birth'
  },
  '/relationship-date-of-birth': {
    next: '/someone-else-correct-date-of-birth'
  },
  '/someone-else-correct-date-of-birth': {
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
    next: '/check-your-answers-nationality'
  },
  '/check-your-answers-nationality': {
    next: '/claimants-name'
  },
  '/relationship-nationality-change': {
    next: '/someone-else-correct-nationality'
  },
  '/someone-else-correct-nationality': {
    next: '/provide-photo-update-contact'
  },
  '/provide-photo-update-contact': {
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
    next: '/add-remove-child-partner'
  },
  '/add-remove-child-partner': {
    next: '/relationship-to-child-partner'
  },
  '/relationship-to-child-partner': {
    next: '/child-partner-name'
  },
  '/child-partner-name': {
    next: '/child-partner-date-of-birth'
  },
  '/child-partner-date-of-birth': {
    next: '/child-partner-nationality'
  },
  '/child-partner-nationality': {
    next: '/evidence-child-partner'
  },
  '/evidence-child-partner': {
    next: '/check-your-answers-add-child-partner'
  },
  '/check-your-answers-add-child-partner': {
    next: '/reason-for-removing-child-partner'
  },
  '/reason-for-removing-child-partner': {
    next: '/send-evidence-for-your-claim'
  },
  '/send-evidence-for-your-claim': {
    next: '/prepare-your-evidence'
  },
  '/prepare-your-evidence': {
    next: '/upload-supporting-evidence'
  },
  '/upload-supporting-evidence': {
    next: '/violent-upsetting-images'
  },
  '/violent-upsetting-images': {
    next: '/check-your-answers-evidence'
  },
  '/check-your-answers-evidence': {
    next: '/someone-on-claim-died'
  },
  '/someone-on-claim-died': {
    next: '/about-who-has-died'
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
    next: '/check-your-answers-death'
  },
  '/check-your-answers-death': {
    next: '/confirm'
  },
  '/confirm': {},
  '/something-else': {
    next: '/contact-us-by-email'
  },
  '/contact-us-by-email': {},
  '/not-selected-options': {},
  '/page-not-found': {},
  '/service-unavailable': {},
  '/problem-with-service': {},
  '/session-ended': {},
  '/form-saved': {},
  '/cannot-use-form': {},
  '/expired-link': {}
};

module.exports = {
  name: 'saa',
  baseUrl: '/saa', // TODO not confirmed yet, may need to revisit and update
  params: '/:action?/:id?/:edit?',
  fields: 'apps/saa/fields',
  views: 'apps/saa/views',
  translations: 'apps/saa/translations',
  steps: steps
};
