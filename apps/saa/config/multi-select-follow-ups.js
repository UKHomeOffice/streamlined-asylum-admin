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
      sections: [
        {
          id: 'name',
          start: '/do-you-need-to-change-your-name',
          completeOn: '/check-your-answers-name',
          routes: [
            '/do-you-need-to-change-your-name',
            '/reason-name-change',
            '/new-name',
            '/new-name-evidence',
            '/check-your-answers-name'
          ]
        }
      ]
    },
    {
      value: 'date-of-birth',
      order: 20,
      sections: [
        {
          id: 'date-of-birth',
          start: '/whose-date-of-birth',
          completeOn: '/check-your-answers-date-of-birth',
          routes: [
            '/whose-date-of-birth',
            '/correct-date-of-birth',
            '/new-date-of-birth-evidence',
            '/check-your-answers-date-of-birth'
          ]
        }
      ]
    },
    {
      value: 'nationality',
      order: 30,
      sections: [
        {
          id: 'nationality',
          start: '/whose-nationality-to-change',
          completeOn: '/check-your-answers-nationality',
          routes: [
            '/whose-nationality-to-change',
            '/correct-nationality',
            '/reason-nationality-change',
            '/upload-nationality-evidence',
            '/check-your-answers-nationality'
          ]
        }
      ]
    },
    {
      value: 'address',
      order: 40,
      sections: [
        {
          id: 'address',
          start: '/provide-photo-update-contact',
          completeOn: '/check-your-answers-address',
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
        }
      ]
    },
    {
      value: 'email-address',
      order: 50,
      sections: [
        {
          id: 'email-address',
          start: '/new-email-address',
          completeOn: '/check-your-answers-email',
          routes: [
            '/new-email-address',
            '/check-your-answers-email'
          ]
        }
      ]
    },
    {
      value: 'phone-number',
      order: 60,
      sections: [
        {
          id: 'phone-number',
          start: '/your-phone-number',
          completeOn: '/new-phone-number',
          routes: [
            '/your-phone-number',
            '/new-phone-number'
          ]
        }
      ]
    }
  ]
};
