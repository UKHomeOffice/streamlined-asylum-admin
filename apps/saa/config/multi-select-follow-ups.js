'use strict';

module.exports = {
  field: 'changes-to-contact-details',
  entryPoint: '/changes-to-contact-details',
  exitPoint: '/do-you-need-add-remove-dependant',
  stateKey: 'contact-detail-follow-ups',
  options: [
    {
      value: 'name',
      order: 10,
      routes: [
        '/do-you-need-to-change-your-name',
        '/reason-name-change',
        '/new-name',
        '/new-name-evidence',
        '/check-your-answers-name'
      ]
    },
    {
      value: 'date-of-birth',
      order: 20,
      routes: [
        '/whose-date-of-birth',
        '/correct-date-of-birth',
        '/new-date-of-birth-evidence',
        '/check-your-answers-date-of-birth'
      ]
    },
    {
      value: 'nationality',
      order: 30,
      routes: [
        '/whose-nationality-to-change',
        '/correct-nationality',
        '/reason-nationality-change',
        '/upload-nationality-evidence',
        '/check-your-answers-nationality'
      ]
    },
    {
      value: 'address',
      order: 40,
      routes: [
        '/provide-photo-update-contact',
        '/change-uk-address',
        '/home-address',
        '/change-contact-address',
        '/reason-contact-address-change',
        '/contact-address',
        '/how-you-are-helping',
        '/check-your-answers-address'
      ]
    },
    {
      value: 'email-address',
      order: 50,
      routes: [
        '/new-email-address',
        '/check-your-answers-email'
      ]
    },
    {
      value: 'phone-number',
      order: 60,
      routes: [
        '/your-phone-number',
        '/new-phone-number'
      ]
    }
  ]
};
