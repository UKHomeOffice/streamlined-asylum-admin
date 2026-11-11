'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Hogan = require('hogan.js');
const Summary = require('hof').components.summary;
const SummaryLabels = require('../../../../apps/saa/behaviours/summary-labels');
const sections = require('../../../../apps/saa/sections/summary-data-sections');

const dependantRows = sections['add-or-remove-dependants'].steps;

describe('summary data sections', () => {
  const row = dependantRows.find(
    entry => entry.field === 'addremovechildpartner'
  );

  test('lists the child/partner aggregate with a link back to its summary page', () => {
    expect(row).toMatchObject({
      step: '/check-your-answers-add-child-partner',
      changeLink: '/changes/check-your-answers-add-child-partner',
      dependsOn: 'add-remove-dependant',
      addElementSeparators: true
    });
  });

  test('HOF lists each item as a titled block of labelled rows, with a line break between items', () => {
    const translations = {
      'fields.add-remove-child-partner.options.add-child-partner.summary-label':
        'Add a child or partner as a dependant',
      'fields.add-remove-child-partner.options.remove-child-partner.summary-label':
        'Remove a child or partner as a dependant',
      'fields.child-partner-given-name.label': 'Given name',
      'fields.child-partner-given-name.summary-label': 'Their name'
    };
    const item = choice => ({
      fields: [
        { field: 'add-remove-child-partner', value: choice, parsed: choice },
        { field: 'child-partner-given-name', value: 'Sam', parsed: 'Sam' },
        { field: 'child-partner-family-name', value: 'Smith', parsed: 'Smith' }
      ]
    });
    const session = {
      'add-remove-dependant': 'yes',
      addremovechildpartner: {
        aggregatedValues: [
          item('add-child-partner'),
          item('remove-child-partner')
        ]
      }
    };
    const req = {
      baseUrl: '/changes',
      sessionModel: { get: key => session[key] },
      translate: keys => {
        const list = [].concat(keys);
        return (
          translations[list.find(key => translations[key])] ||
          list[list.length - 1]
        );
      },
      form: {
        options: {
          fieldsConfig: {
            'add-remove-child-partner': { mixin: 'radio-group' }
          },
          steps: {
            '/check-your-answers-add-child-partner': {
              titleField: ['add-remove-child-partner']
            }
          }
        }
      }
    };
    const ConfirmPage = SummaryLabels(Summary(class {}));

    const summaryFields = new ConfirmPage().getFieldsForRow([row], req);
    const shown = summaryFields
      .filter(field => !field.omitFromSummary)
      .map(field => {
        if (field.isSeparator) {
          return 'divider';
        }
        return field.isAggregatorTitle
          ? `title: ${field.value} (${field.aggregatorTitleChangeLink})`
          : `${field.label}: ${field.value}${field.omitChangeLink ? '' : ' (change link)'}`;
      });

    expect(shown).toEqual([
      'title: Add a child or partner as a dependant (/changes/check-your-answers-add-child-partner)',
      'Their name: Sam Smith',
      'divider',
      'title: Remove a child or partner as a dependant (/changes/check-your-answers-add-child-partner)',
      'Their name: Sam Smith'
    ]);

    const template = Hogan.compile(fs.readFileSync(
      path.resolve(__dirname, '../../../../apps/saa/views/partials/summary-table.html'),
      'utf8'
    ));
    const html = template.render({ section: 'Dependants', fields: summaryFields });
    expect(html.match(/<br>/g)).toHaveLength(1);
    expect(html).toMatch(/<\/dl>\s*<br>\s*<dl>/);
    expect(html).not.toMatch(/<hr\b|confirm-separator|<dt><\/dt>/);
  });

  test('returns nothing when no children or partners have been added', () => {
    expect(row.parse(undefined, { form: { options: {} } })).toBeNull();
  });

  test.each([
    [
      'add-or-remove-dependants',
      'addremovechildpartner',
      'documents-child-partner'
    ],
    ['death', 'reportadeath', 'documents-death-certificate'],
    [
      'someone-else-date-of-birth',
      'someoneelsenewdob',
      'documents-someone-else-new-dob'
    ]
  ])(
    'HOF shows No files uploaded for the %s aggregate',
    (section, aggregateTo, documentField) => {
      const aggregateRow = sections[section].steps.find(
        entry => entry.field === aggregateTo
      );
      const session = {
        [aggregateRow.dependsOn]: 'yes',
        [aggregateTo]: {
          aggregatedValues: [
            {
              joinTitle: 'An item',
              fields: [{ field: documentField, value: [] }]
            }
          ]
        }
      };
      const translations = {
        'fields.file-upload.no-files-uploaded': 'No files uploaded',
        [`fields.${documentField}.summary-label`]: 'Files uploaded'
      };
      const req = {
        baseUrl: '/changes',
        sessionModel: { get: key => session[key] },
        translate: keys => {
          const list = [].concat(keys);
          return (
            translations[list.find(key => translations[key])] ||
            list[list.length - 1]
          );
        },
        form: { options: { fieldsConfig: {}, steps: {} } }
      };
      const ConfirmPage = SummaryLabels(Summary(class {}));
      const fields = new ConfirmPage().getFieldsForRow([aggregateRow], req);
      const documentRow = fields.find(field => field.field === documentField);

      expect(documentRow).toMatchObject({
        label: 'Files uploaded',
        value: 'No files uploaded',
        omitFromSummary: false,
        omitChangeLink: true
      });
    }
  );

  test('DOB decision can be edited directly while detail Change links return to its mini-CYA', () => {
    const rows = sections['date-of-birth'].steps;

    expect(rows[0]).toEqual({
      step: '/change-your-date-of-birth',
      field: 'change-your-date-of-birth'
    });
    expect(rows.slice(1).map(dobRow => dobRow.changeLink)).toEqual([
      '/changes/check-your-answers-date-of-birth',
      '/changes/check-your-answers-date-of-birth'
    ]);
  });

  test('HOF displays numbered DOB titles with links back to the mini summary', () => {
    const dobRow = sections['someone-else-date-of-birth'].steps.find(
      entry => entry.field === 'someoneelsenewdob'
    );
    const pages = require('../../../../apps/saa/translations/src/en/pages.json');
    const title =
      pages['check-your-answers-someone-else-date-of-birth']['item-title'];
    const titleKey =
      'pages.check-your-answers-someone-else-date-of-birth.item-title';
    const session = {
      'change-someone-else-date-of-birth': 'yes',
      someoneelsenewdob: {
        aggregatedValues: Array.from({ length: 3 }, (_, index) => ({
          joinTitle: `Saved title ${index}`,
          fields: [
            {
              field: 'someone-else-correct-date-of-birth',
              value: '2020-03-27',
              parsed: '2020-03-27'
            }
          ]
        }))
      }
    };
    const req = {
      baseUrl: '/changes',
      sessionModel: { get: key => session[key] },
      translate: keys => (keys === titleKey ? title : [].concat(keys)[0]),
      form: { options: { fieldsConfig: {}, steps: {} } }
    };
    const ConfirmPage = SummaryLabels(Summary(class {}));
    const fields = new ConfirmPage().getFieldsForRow([dobRow], req);
    const titles = fields.filter(field => field.isAggregatorTitle);

    expect(dobRow).toMatchObject({
      step: '/check-your-answers-someone-else-date-of-birth',
      dependsOn: 'change-someone-else-date-of-birth'
    });
    expect(titles.map(field => field.value)).toEqual([
      title,
      `${title} 2`,
      `${title} 3`
    ]);
    expect(
      titles.every(
        field =>
          field.aggregatorTitleChangeLink ===
          '/changes/check-your-answers-someone-else-date-of-birth'
      )
    ).toBe(true);
    expect(fields.filter(field => field.isSeparator)).toHaveLength(2);
    expect(
      fields
        .filter(field => field.field === 'someone-else-correct-date-of-birth')
        .map(field => field.value)
    ).toEqual(Array(3).fill('27 March 2020'));
  });
});

describe('name rows on the confirm page', () => {
  const ConfirmPage = SummaryLabels(Summary(class {}));
  const pages = require('../../../../apps/saa/translations/src/en/pages.json');
  const fields = require('../../../../apps/saa/translations/src/en/fields.json');
  const uploadRow = sections.name.steps.find(
    entry => entry.field === 'documents-new-name'
  );
  const createRequest = session => ({
    baseUrl: '/changes',
    sessionModel: { get: key => session[key] },
    translate: keys => {
      const list = [].concat(keys);
      return list.map(key =>
        key.split('.').reduce((value, part) => value?.[part], { pages, fields })
      ).find(value => value !== undefined) || list[list.length - 1];
    },
    form: { options: { fieldsConfig: {}, steps: {} } }
  });

  test('shows the decision, reason, new name and uploaded files in order', () => {
    const req = createRequest({
      'do-you-need-to-change-your-name': 'yes',
      'reason-name-change': 'marriage',
      'given-name': 'Alex',
      'family-name': 'Smith',
      'documents-new-name': [{ name: 'certificate.pdf' }]
    });
    const shown = new ConfirmPage().getFieldsForRow(sections.name.steps, req);

    expect(shown.map(entry => entry.field)).toEqual([
      'do-you-need-to-change-your-name',
      'reason-name-change',
      'given-name',
      'documents-new-name'
    ]);
    expect(shown[1]).toMatchObject({
      value: 'marriage',
      changeLink: '/changes/check-your-answers-name'
    });
  });

  test.each(['no', undefined])('hides the reason when the name change answer is %p', answer => {
    const reasonRow = sections.name.steps.find(entry => entry.field === 'reason-name-change');
    const req = createRequest({
      'do-you-need-to-change-your-name': answer,
      'reason-name-change': 'marriage'
    });

    expect(new ConfirmPage().getFieldsForRow([reasonRow], req)).toEqual([]);
  });

  test('keeps the someone else name decision only in its dedicated section', () => {
    expect(sections.name.steps.some(entry => entry.field === 'change-someone-elses-name'))
      .toBe(false);
    expect(sections['someone-else-new-name'].steps).toEqual([
      expect.objectContaining({
        step: '/do-you-need-to-change-someone-elses-name',
        field: 'change-someone-elses-name'
      }),
      expect.objectContaining({ field: 'someoneelsenewname' })
    ]);
  });

  test('shows saved someone-else names only through the collection, without leaking draft fields', () => {
    const req = createRequest({
      'change-someone-elses-name': 'yes',
      'relationship-name-change': 'child',
      'reason-someone-else-name-change': 'error',
      'someone-else-old-given-name': 'Old draft',
      'someone-else-old-family-name': 'Family',
      'someone-else-new-given-name': 'New draft',
      'someone-else-new-family-name': 'Family',
      someoneelsenewname: {
        aggregatedValues: ['First saved name', 'Second saved name'].map(value => ({
          fields: [{ field: 'someone-else-new-given-name', value, parsed: value }]
        }))
      }
    });
    const page = new ConfirmPage();

    expect(page.getFieldsForRow(sections.name.steps, req)).toEqual([]);
    const savedRows = page.getFieldsForRow(sections['someone-else-new-name'].steps, req);
    expect(savedRows.filter(row => row.field === 'someone-else-new-given-name')
      .map(row => row.value)).toEqual(['First saved name', 'Second saved name']);
  });

  test('New name Change links go to the name check your answers page', () => {
    const req = createRequest({
      'given-name': 'Alex',
      'family-name': 'Smith'
    });
    const nameRow = sections.name.steps.find(entry => entry.field === 'given-name');

    expect(new ConfirmPage().getFieldsForRow([nameRow], req)).toEqual([
      expect.objectContaining({
        value: 'Alex Smith',
        changeLink: '/changes/check-your-answers-name'
      })
    ]);
  });

  test('lists own-name evidence as Files uploaded with a link to the name check your answers page', () => {
    const req = createRequest({
      'do-you-need-to-change-your-name': 'yes',
      'documents-new-name': [
        { id: '1', name: 'deed-poll.pdf' },
        { id: '2', name: 'certificate.pdf' }
      ]
    });

    expect(new ConfirmPage().getFieldsForRow([uploadRow], req)).toEqual([
      expect.objectContaining({
        label: 'Files uploaded',
        value: 'deed-poll.pdf\ncertificate.pdf',
        changeLink: '/changes/check-your-answers-name'
      })
    ]);
  });

  test.each(['no', undefined])('hides own-name evidence when the answer is %p', answer => {
    const req = createRequest({
      'do-you-need-to-change-your-name': answer,
      'documents-new-name': [{ name: 'old-evidence.pdf' }]
    });

    expect(new ConfirmPage().getFieldsForRow([uploadRow], req)).toEqual([]);
  });

  test.each([undefined, null, []])(
    'shows No files uploaded when own-name evidence is %p',
    documents => {
      const req = createRequest({
        'do-you-need-to-change-your-name': 'yes',
        'documents-new-name': documents
      });

      expect(new ConfirmPage().getFieldsForRow([uploadRow], req)).toEqual([
        expect.objectContaining({
          value: 'No files uploaded',
          changeLink: '/changes/check-your-answers-name'
        })
      ]);
    }
  );
});

describe('evidence rows on the confirm page', () => {
  const evidenceRows = sections.evidence.steps.filter(
    entry => entry.dependsOn === 'send-evidence-for-your-claim'
  );
  const translations = {
    'fields.file-upload.no-files-uploaded': 'No files uploaded',
    'fields.documents-help-your-claim.summary-label': 'Files uploaded',
    'fields.evidence-violent-or-upsetting.summary-label':
      'Violent or upsetting images',
    'fields[evidence-violent-or-upsetting].options.[yes]': 'Yes'
  };
  const createRequest = session => ({
    baseUrl: '/changes',
    sessionModel: { get: key => session[key] },
    translate: keys => {
      const list = [].concat(keys);
      return (
        translations[list.find(key => translations[key])] ||
        list[list.length - 1]
      );
    },
    form: {
      options: {
        fieldsConfig: {
          'evidence-violent-or-upsetting': { mixin: 'radio-group' }
        },
        steps: {}
      }
    }
  });
  const ConfirmPage = SummaryLabels(Summary(class {}));
  const session = {
    'send-evidence-for-your-claim': 'yes',
    'documents-help-your-claim': [
      { id: '1', name: 'letter.pdf' },
      { id: '2', name: 'photo.png' }
    ],
    'evidence-violent-or-upsetting': 'yes'
  };

  test('lists the uploaded files and the images answer', () => {
    expect(evidenceRows.map(entry => entry.field)).toEqual([
      'documents-help-your-claim',
      'evidence-violent-or-upsetting'
    ]);
  });

  test('Change links go to the evidence check your answers page', () => {
    const shown = new ConfirmPage()
      .getFieldsForRow(evidenceRows, createRequest(session))
      .map(field => `${field.label}: ${field.value} (${field.changeLink})`);

    expect(shown).toEqual([
      'Files uploaded: letter.pdf\nphoto.png (/changes/check-your-answers-evidence)',
      'Violent or upsetting images: Yes (/changes/check-your-answers-evidence)'
    ]);
  });

  test('hides the rows when the user does not need to send evidence', () => {
    const fields = new ConfirmPage().getFieldsForRow(
      evidenceRows,
      createRequest({ ...session, 'send-evidence-for-your-claim': 'no' })
    );

    expect(fields).toEqual([]);
  });

  test.each([[undefined], [null], [[]]])(
    'shows an empty-upload row for %p when evidence is selected',
    documents => {
      const fields = new ConfirmPage().getFieldsForRow(
        evidenceRows,
        createRequest({ ...session, 'documents-help-your-claim': documents })
      );

      expect(
        fields.find(field => field.field === 'documents-help-your-claim')
      ).toMatchObject({
        label: 'Files uploaded',
        value: 'No files uploaded',
        changeLink: '/changes/check-your-answers-evidence'
      });
    }
  );

  test.each([undefined, 'no'])(
    'keeps empty evidence hidden when the selection is %p',
    selection => {
      expect(
        new ConfirmPage().getFieldsForRow(
          evidenceRows,
          createRequest({
            'send-evidence-for-your-claim': selection,
            'documents-help-your-claim': undefined
          })
        )
      ).toEqual([]);
    }
  );
});

describe('non-aggregate DOB evidence on the confirm page', () => {
  const rows = sections['date-of-birth'].steps;
  const ConfirmPage = SummaryLabels(Summary(class {}));
  const createRequest = (selection, documents) => ({
    baseUrl: '/changes',
    sessionModel: {
      get: key =>
        ({
          'change-personal-details': selection,
          'documents-new-dob': documents
        })[key]
    },
    translate: keys => {
      const translations = {
        'fields.file-upload.no-files-uploaded': 'No files uploaded',
        'fields.documents-new-dob.summary-label': 'Files uploaded'
      };
      const list = [].concat(keys);
      return (
        translations[list.find(key => translations[key])] ||
        list[list.length - 1]
      );
    },
    form: { options: { fieldsConfig: {}, steps: {} } }
  });

  test.each([[undefined], [null], [[]]])(
    'shows the translated fallback for %p',
    documents => {
      expect(
        new ConfirmPage().getFieldsForRow(rows, createRequest('yes', documents))
      ).toEqual([
        expect.objectContaining({
          field: 'documents-new-dob',
          label: 'Files uploaded',
          value: 'No files uploaded',
          changeLink: '/changes/check-your-answers-date-of-birth'
        })
      ]);
    }
  );

  test.each([undefined, 'no'])(
    'does not display fallback text when the section selection is %p',
    selection => {
      expect(
        new ConfirmPage().getFieldsForRow(
          rows,
          createRequest(selection, undefined)
        )
      ).toEqual([]);
    }
  );
});
