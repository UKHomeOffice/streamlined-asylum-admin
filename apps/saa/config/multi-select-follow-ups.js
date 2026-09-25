'use strict';

/*
 * Temporary implementation notes for review.
 *
 * This is service-owned configuration for the generic multi-select follow-up
 * behaviour. The behaviour should be movable to HOF later without changing this
 * config shape or adding SAA-specific logic to the behaviour.
 *
 * Contract summary:
 * - `field` is the checkbox/multi-select field whose selected values drive the
 *   active follow-up sections.
 * - `entryPoint` is the route where that field is submitted and recalculated.
 * - `exitPoint` is where the user continues after all selected sections are
 *   complete, or when no sections are active.
 * - `stateKey` is the session key used by the behaviour to store derived state.
 * - each option maps a checkbox value to one or more ordered sections.
 *
 * A section is deliberately described by boundaries rather than by hard-coded
 * navigation. `start` is where the behaviour sends the user. `completeOn` is the
 * page that marks the section complete. `routes` lists pages owned by the
 * section for clean up/output metadata, but normal HOF `next`/`forks` still drive
 * navigation between those pages.
 */
module.exports = {
  field: 'changes-to-contact-details',
  entryPoint: '/changes-to-contact-details',
  exitPoint: '/do-you-need-add-remove-dependant',
  stateKey: 'contact-detail-updates',
  options: [
    {
      value: 'name',
      order: 10,
      sections: [
        {
          /*
           * The Name section may later contain forks and aggregator loops. Keep
           * those local to the Name pages/controllers; this config only tells
           * the common behaviour where the section starts and where it is done.
           */
          id: 'name',
          start: '/do-you-need-to-change-your-name',
          completeOn: [
            {
              route: '/do-you-need-to-change-someone-elses-name',
              condition: {
                field: 'do-you-need-to-change-someone-elses-name',
                value: 'no'
              }
            },
            '/check-your-answers-someone-else-name'
          ],
          routes: [
            '/do-you-need-to-change-your-name',
            '/reason-name-change',
            '/new-name',
            '/new-name-evidence',
            '/check-your-answers-name',
            '/do-you-need-to-change-someone-elses-name',
            '/relationship-name-change',
            '/reason-someone-else-name-change',
            '/someone-else-new-name',
            '/someone-else-new-name-evidence',
            '/check-your-answers-someone-else-name'
          ]
        }
      ]
    },
    {
      value: 'date-of-birth',
      order: 20,
      sections: [
        {
          /*
           * The routes below are not a forced sequence. They are the current
           * possible pages owned by this selected option, while HOF still owns
           * the actual page-to-page movement inside the section.
           */
          id: 'date-of-birth',
          start: '/whose-date-of-birth',
          completeOn: [
            {
              route: '/change-someone-else-date-of-birth',
              condition: {
                field: 'change-someone-else-date-of-birth',
                value: 'no'
              }
            },
            {
              route: '/check-your-answers-date-of-birth',
              condition: {
                field: 'change-someone-else-date-of-birth',
                value: 'yes'
              }
            }
          ],
          routes: [
            '/whose-date-of-birth',
            '/correct-date-of-birth',
            '/new-date-of-birth-evidence',
            '/check-your-answers-date-of-birth',
            '/change-someone-else-date-of-birth',
            '/relationship-date-of-birth',
            '/someone-else-correct-date-of-birth'
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
          completeOn: [
            {
              route: '/change-someone-else-nationality',
              condition: {
                field: 'change-someone-else-nationality',
                value: 'no'
              }
            },
            '/check-your-answers-someone-else-nationality'
          ],
          routes: [
            '/whose-nationality-to-change',
            '/correct-nationality',
            '/reason-nationality-change',
            '/upload-nationality-evidence',
            '/check-your-answers-nationality',
            '/change-someone-else-nationality',
            '/relationship-nationality-change',
            '/someone-else-correct-nationality',
            '/reason-someone-else-nationality-change',
            '/upload-someone-else-nationality-evidence',
            '/check-your-answers-someone-else-nationality'
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
          start: '/change-uk-address',
          completeOn: '/check-your-answers-address',
          routes: [
            '/change-uk-address',
            '/home-address',
            '/change-contact-address',
            '/reason-contact-address-change',
            '/contact-address',
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
          completeOn: '/check-your-answers-phone-number',
          routes: [
            '/your-phone-number',
            '/new-phone-number',
            '/check-your-answers-phone-number'
          ]
        }
      ]
    }
  ]
};
