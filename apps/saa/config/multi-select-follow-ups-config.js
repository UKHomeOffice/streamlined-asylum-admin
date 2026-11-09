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
 *
 * Optional extras:
 * - `noChangesPoint` is a shared page shown when a section's `noChanges` rule
 *   matches. "Continue" unticks that section's option; "cancel" restarts it.
 * - `onNoneSelected` runs when unticking leaves no options selected.
 * - `editReturnUrl` is where edit journeys go once no selected section is left.
 * - section `noChanges.editRoute` optionally reports the same rule from an edit-only page.
 */
const SAA_NO_CHANGES_HEADER = 'pages.no-changes-made.headers';

// The photo identity page is shown once, last, when any contact detail is still selected.
const photoIdentitySection = {
  id: 'photo-identity',
  order: 100,
  start: '/provide-photo-identity',
  completeOn: '/provide-photo-identity',
  routes: ['/provide-photo-identity'],
  fieldsToUnset: ['documents-update-contact']
};

module.exports = {
  field: 'changes-to-contact-details',
  entryPoint: '/changes-to-contact-details',
  exitPoint: '/do-you-need-add-remove-dependant',
  stateKey: 'contact-detail-updates',
  noChangesPoint: {
    route: '/no-changes-made',
    field: 'no-changes-made',
    continueValue: 'yes'
  },
  onNoneSelected: req => req.sessionModel.set('change-personal-details', 'no'),
  editReturnUrl: req => req.sessionModel.get('edit-return-path'),
  options: [
    {
      value: 'name',
      order: 10,
      sections: [
        {
          id: 'name',
          start: '/do-you-need-to-change-your-name',
          completeOn: [
            {
              route: '/do-you-need-to-change-someone-elses-name',
              condition: { field: 'change-someone-elses-name', value: 'no' }
            },
            '/check-your-answers-someone-else-name',
            {
              route: '/do-you-need-to-change-your-name',
              condition: [
                req => req.params?.action === 'edit',
                { field: 'do-you-need-to-change-your-name', value: 'no' },
                { field: 'change-someone-elses-name', value: 'yes' }
              ]
            }
          ],
          noChanges: {
            route: '/do-you-need-to-change-someone-elses-name',
            editRoute: '/do-you-need-to-change-your-name',
            when: [
              { field: 'do-you-need-to-change-your-name', value: 'no' },
              { field: 'change-someone-elses-name', value: 'no' }
            ],
            header: `${SAA_NO_CHANGES_HEADER}.name`
          },
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
          ],
          // Add the someone-else name loop key when its add-another story is built.
          fieldsToUnset: [
            'do-you-need-to-change-your-name',
            'reason-name-change',
            'given-name',
            'family-name',
            'documents-new-name',
            'change-someone-elses-name',
            'relationship-name-change',
            'reason-someone-else-name-change',
            'someone-else-old-given-name',
            'someone-else-old-family-name',
            'someone-else-new-given-name',
            'someone-else-new-family-name',
            'documents-someone-else-new-name'
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
          start: '/change-your-date-of-birth',
          completeOn: [
            {
              route: '/change-someone-else-date-of-birth',
              condition: {
                field: 'change-someone-else-date-of-birth',
                value: 'no'
              }
            },
            '/check-your-answers-someone-else-date-of-birth'
          ],
          noChanges: {
            route: '/change-someone-else-date-of-birth',
            when: [
              { field: 'change-your-date-of-birth', value: 'no' },
              { field: 'change-someone-else-date-of-birth', value: 'no' }
            ],
            header: `${SAA_NO_CHANGES_HEADER}.date-of-birth`
          },
          routes: [
            '/change-your-date-of-birth',
            '/correct-date-of-birth',
            '/new-date-of-birth-evidence',
            '/check-your-answers-date-of-birth',
            '/change-someone-else-date-of-birth',
            '/relationship-date-of-birth',
            '/someone-else-correct-date-of-birth',
            '/someone-else-new-date-of-birth-evidence',
            '/check-your-answers-someone-else-date-of-birth'
          ],
          fieldsToUnset: [
            'change-your-date-of-birth',
            'correct-date-of-birth',
            'documents-new-dob',
            'change-someone-else-date-of-birth',
            'someoneelsenewdob',
            'relationship-date-of-birth',
            'someone-else-correct-date-of-birth-given-name',
            'someone-else-correct-date-of-birth-family-name',
            'someone-else-correct-date-of-birth',
            'documents-someone-else-new-dob'
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
          start: '/nationality-change',
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
          noChanges: {
            route: '/change-someone-else-nationality',
            when: [
              { field: 'change-your-nationality', value: 'no' },
              { field: 'change-someone-else-nationality', value: 'no' }
            ],
            header: `${SAA_NO_CHANGES_HEADER}.nationality`
          },
          routes: [
            '/nationality-change',
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
          ],
          // Add the page fields and loop key as the nationality page stories are built.
          fieldsToUnset: [
            'change-your-nationality',
            'change-someone-else-nationality'
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
          noChanges: {
            route: '/change-contact-address',
            when: [
              { field: 'change-uk-address', value: 'no' },
              { field: 'change-contact-address', value: 'no' }
            ],
            header: `${SAA_NO_CHANGES_HEADER}.address`
          },
          routes: [
            '/change-uk-address',
            '/home-address',
            '/change-contact-address',
            '/reason-contact-address-change',
            '/contact-address',
            '/check-your-answers-address'
          ],
          // Add the page fields as the address page stories are built.
          fieldsToUnset: [
            'change-uk-address',
            'send-letters-to-home-address',
            'change-contact-address'
          ]
        },
        photoIdentitySection
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
          routes: ['/new-email-address', '/check-your-answers-email'],
          fieldsToUnset: [
            'old-email-address',
            'new-email-address',
            'confirm-new-email-address'
          ]
        },
        photoIdentitySection
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
          ],
          fieldsToUnset: [
            'your-phone-number',
            'whose-phone-number',
            'old-phone-number',
            'new-phone-number',
            'confirm-new-phone-number'
          ]
        },
        photoIdentitySection
      ]
    }
  ]
};
