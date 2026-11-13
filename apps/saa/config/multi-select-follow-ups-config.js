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
 * - completion `reopenOnChange` limits reopening at that boundary to changes in the named field.
 * - `deselectOn` clears all configured sections when its parent-page condition matches.
 */
const SAA_NO_CHANGES_HEADER = 'pages.no-changes-made.headers';
const CONTACT_DETAIL_UPDATES_STATE_KEY = 'contact-detail-updates';
const EDIT_RETURN_PATH_KEY = 'edit-return-path';
const DATE_OF_BIRTH_SECTION = 'date-of-birth';
const NAME_SECTION = 'name';
const PHOTO_IDENTITY_ROUTE = '/provide-photo-identity';
const OWN_NAME_ROUTE = '/do-you-need-to-change-your-name';
const SOMEONE_ELSE_NAME_ROUTE = '/do-you-need-to-change-someone-elses-name';
const OWN_DOB_ROUTE = '/change-your-date-of-birth';
const SOMEONE_ELSE_DOB_ROUTE = '/change-someone-else-date-of-birth';
const SOMEONE_ELSE_NATIONALITY_ROUTE = '/change-someone-else-nationality';
const OWN_NAME_FIELD = 'do-you-need-to-change-your-name';
const SOMEONE_ELSE_NAME_FIELD = 'change-someone-elses-name';
const OWN_DOB_FIELD = 'change-your-date-of-birth';
const SOMEONE_ELSE_DOB_FIELD = 'change-someone-else-date-of-birth';
const SOMEONE_ELSE_NATIONALITY_FIELD = 'change-someone-else-nationality';

// The photo identity page is shown once, last, when any contact detail is still selected.
const photoIdentitySection = {
  id: 'photo-identity',
  order: 100,
  start: PHOTO_IDENTITY_ROUTE,
  completeOn: PHOTO_IDENTITY_ROUTE,
  routes: [PHOTO_IDENTITY_ROUTE],
  fieldsToUnset: ['documents-update-contact']
};

module.exports = {
  field: 'changes-to-contact-details',
  entryPoint: '/changes-to-contact-details',
  exitPoint: '/do-you-need-add-remove-dependant',
  stateKey: CONTACT_DETAIL_UPDATES_STATE_KEY,
  deselectOn: {
    route: '/personal-details',
    condition: { field: 'change-personal-details', value: 'no' }
  },
  noChangesPoint: {
    route: '/no-changes-made',
    field: 'no-changes-made',
    continueValue: 'yes'
  },
  onNoneSelected: req => req.sessionModel.set('change-personal-details', 'no'),
  editReturnUrl: req => req.sessionModel.get(EDIT_RETURN_PATH_KEY),
  options: [
    {
      value: NAME_SECTION,
      order: 10,
      sections: [
        {
          id: NAME_SECTION,
          start: OWN_NAME_ROUTE,
          completeOn: [
            {
              route: SOMEONE_ELSE_NAME_ROUTE,
              condition: { field: SOMEONE_ELSE_NAME_FIELD, value: 'no' }
            },
            '/check-your-answers-someone-else-name',
            {
              route: OWN_NAME_ROUTE,
              condition: [
                req => req.params?.action === 'edit',
                req => req.sessionModel.get(CONTACT_DETAIL_UPDATES_STATE_KEY)
                  ?.completedSections?.includes(NAME_SECTION),
                { field: OWN_NAME_FIELD, value: 'no' },
                { field: SOMEONE_ELSE_NAME_FIELD, value: 'yes' }
              ]
            },
            {
              route: '/check-your-answers-name',
              condition: [
                req => req.params?.action === 'edit' ||
                  Boolean(req.sessionModel.get(EDIT_RETURN_PATH_KEY)),
                req => req.sessionModel.get(CONTACT_DETAIL_UPDATES_STATE_KEY)
                  ?.completedSections?.includes(NAME_SECTION)
              ]
            }
          ],
          noChanges: {
            route: SOMEONE_ELSE_NAME_ROUTE,
            editRoute: OWN_NAME_ROUTE,
            when: [
              { field: OWN_NAME_FIELD, value: 'no' },
              { field: SOMEONE_ELSE_NAME_FIELD, value: 'no' }
            ],
            header: `${SAA_NO_CHANGES_HEADER}.name`
          },
          routes: [
            OWN_NAME_ROUTE,
            '/reason-name-change',
            '/new-name',
            '/new-name-evidence',
            '/check-your-answers-name',
            SOMEONE_ELSE_NAME_ROUTE,
            '/relationship-name-change',
            '/reason-someone-else-name-change',
            '/someone-else-new-name',
            '/someone-else-new-name-evidence',
            '/check-your-answers-someone-else-name'
          ],
          fieldsToUnset: [
            OWN_NAME_FIELD,
            'reason-name-change',
            'given-name',
            'family-name',
            'documents-new-name',
            SOMEONE_ELSE_NAME_FIELD,
            'relationship-name-change',
            'reason-someone-else-name-change',
            'someone-else-old-given-name',
            'someone-else-old-family-name',
            'someone-else-new-given-name',
            'someone-else-new-family-name',
            'documents-someone-else-new-name',
            'someoneelsenewname'
          ]
        }
      ]
    },
    {
      value: DATE_OF_BIRTH_SECTION,
      order: 20,
      sections: [
        {
          id: DATE_OF_BIRTH_SECTION,
          start: OWN_DOB_ROUTE,
          completeOn: [
            {
              route: SOMEONE_ELSE_DOB_ROUTE,
              condition: {
                field: SOMEONE_ELSE_DOB_FIELD,
                value: 'no'
              }
            },
            '/check-your-answers-someone-else-date-of-birth',
            {
              route: OWN_DOB_ROUTE,
              reopenOnChange: OWN_DOB_FIELD,
              condition: [
                req => req.params?.action === 'edit',
                req => req.sessionModel.get(CONTACT_DETAIL_UPDATES_STATE_KEY)
                  ?.completedSections?.includes(DATE_OF_BIRTH_SECTION),
                { field: OWN_DOB_FIELD, value: 'no' },
                { field: SOMEONE_ELSE_DOB_FIELD, value: 'yes' }
              ]
            },
            {
              route: '/check-your-answers-date-of-birth',
              condition: [
                req => req.params?.action === 'edit' ||
                  Boolean(req.sessionModel.get(EDIT_RETURN_PATH_KEY)),
                req => req.sessionModel.get(CONTACT_DETAIL_UPDATES_STATE_KEY)
                  ?.completedSections?.includes(DATE_OF_BIRTH_SECTION)
              ]
            }
          ],
          noChanges: {
            route: SOMEONE_ELSE_DOB_ROUTE,
            editRoute: OWN_DOB_ROUTE,
            when: [
              { field: OWN_DOB_FIELD, value: 'no' },
              { field: SOMEONE_ELSE_DOB_FIELD, value: 'no' }
            ],
            header: `${SAA_NO_CHANGES_HEADER}.date-of-birth`
          },
          routes: [
            OWN_DOB_ROUTE,
            '/correct-date-of-birth',
            '/new-date-of-birth-evidence',
            '/check-your-answers-date-of-birth',
            SOMEONE_ELSE_DOB_ROUTE,
            '/relationship-date-of-birth',
            '/someone-else-correct-date-of-birth',
            '/someone-else-new-date-of-birth-evidence',
            '/check-your-answers-someone-else-date-of-birth'
          ],
          fieldsToUnset: [
            OWN_DOB_FIELD,
            'correct-date-of-birth',
            'documents-new-dob',
            SOMEONE_ELSE_DOB_FIELD,
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
              route: SOMEONE_ELSE_NATIONALITY_ROUTE,
              condition: {
                field: SOMEONE_ELSE_NATIONALITY_FIELD,
                value: 'no'
              }
            },
            '/check-your-answers-someone-else-nationality'
          ],
          noChanges: {
            route: SOMEONE_ELSE_NATIONALITY_ROUTE,
            when: [
              { field: 'change-your-nationality', value: 'no' },
              { field: SOMEONE_ELSE_NATIONALITY_FIELD, value: 'no' }
            ],
            header: `${SAA_NO_CHANGES_HEADER}.nationality`
          },
          routes: [
            '/nationality-change',
            '/correct-nationality',
            '/reason-nationality-change',
            '/upload-nationality-evidence',
            '/check-your-answers-nationality',
            SOMEONE_ELSE_NATIONALITY_ROUTE,
            '/relationship-nationality-change',
            '/someone-else-correct-nationality',
            '/reason-someone-else-nationality-change',
            '/upload-someone-else-nationality-evidence',
            '/check-your-answers-someone-else-nationality'
          ],
          // Add the page fields and loop key as the nationality page stories are built.
          fieldsToUnset: [
            'change-your-nationality',
            SOMEONE_ELSE_NATIONALITY_FIELD
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
