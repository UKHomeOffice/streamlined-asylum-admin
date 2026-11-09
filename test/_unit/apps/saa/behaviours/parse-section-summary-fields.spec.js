'use strict';

const ParseSummaryFields = require('../../../../../apps/saa/behaviours/parse-section-summary-fields');

const translations = {
  'fields.file-upload.no-files-uploaded': 'No files uploaded',
  'fields.documents-child-partner.summary-label': 'Files uploaded',
  'fields.documents-death-certificate.summary-label': 'Files uploaded',
  'fields.documents-someone-else-new-dob.summary-label': 'Files uploaded',
  'fields.add-remove-child-partner.options.add-child-partner.summary-label':
    'Add a child or partner as a dependant',
  'fields.add-remove-child-partner.options.remove-child-partner.summary-label':
    'Remove a child or partner as a dependant',
  'fields.relationship-to-child-partner.options.my-child.label': 'My child',
  'fields.relationship-to-child-partner.options.spouse-or-partner.label':
    'My partner',
  'fields.relationship-to-child-partner.legend': 'How are they related to you?',
  'fields.child-partner-given-name.label': 'Given name',
  'fields.child-partner-given-name.summary-label': 'Their name',
  'fields.child-partner-family-name.label': 'Family name',
  'fields.child-partner-date-of-birth.legend': 'Their date of birth',
  'fields.child-partner-nationality.label': 'Country of nationality',
  'fields.child-partner-nationality.summary-label':
    'Their country of nationality'
};

// Mirrors HOF: an array of keys returns the first match, and a missing key returns the key itself.
const translate = keys => {
  const list = [].concat(keys);
  return (
    translations[list.find(key => translations[key])] || list[list.length - 1]
  );
};

const createItem = choice => ({
  joinTitle: choice,
  fields: [
    { field: 'add-remove-child-partner', value: choice, parsed: choice },
    {
      field: 'reason-removing-child-partner',
      value: 'Moved out',
      parsed: 'Moved out'
    },
    {
      field: 'relationship-to-child-partner',
      value: 'my-child',
      parsed: 'my-child'
    },
    { field: 'child-partner-given-name', value: 'Sam', parsed: 'Sam' },
    { field: 'child-partner-family-name', value: 'Smith', parsed: 'Smith' },
    {
      field: 'child-partner-date-of-birth',
      value: '2020-03-27',
      parsed: '2020-03-27'
    },
    { field: 'child-partner-nationality', value: 'France', parsed: 'France' },
    {
      field: 'documents-child-partner',
      value: [{ id: 'doc', name: 'birth-certificate.pdf' }],
      parsed: [{ id: 'doc', name: 'birth-certificate.pdf' }]
    }
  ]
});

const options = {
  omitFields: [
    'add-remove-child-partner',
    'reason-removing-child-partner',
    'documents-child-partner'
  ],
  dateFields: ['child-partner-date-of-birth'],
  combineFields: { 'child-partner-given-name': ['child-partner-family-name'] }
};

const createBehaviour = (items, summaryOptions = options) => {
  class BaseBehaviour {
    locals() {
      return { items };
    }
  }
  const Behaviour = ParseSummaryFields(summaryOptions)(BaseBehaviour);
  return new Behaviour();
};

const req = {
  translate,
  form: {
    options: {
      titleField: ['add-remove-child-partner'],
      fieldsConfig: {
        'add-remove-child-partner': { mixin: 'radio-group' },
        'relationship-to-child-partner': { mixin: 'radio-group' }
      }
    }
  }
};

const visibleRows = item =>
  item.fields
    .filter(field => !field.omitFromSummary)
    .map(({ label, parsed }) => [label, parsed]);

describe('parse section summary fields behaviour', () => {
  test.each([
    ['add-child-partner', 'Add a child or partner as a dependant'],
    ['remove-child-partner', 'Remove a child or partner as a dependant']
  ])('uses the summary-label of %s as the card title', (choice, title) => {
    const [item] = createBehaviour([createItem(choice)]).locals(req, {}).items;

    expect(item.joinTitle).toBe(title);
  });

  test('uses summary-label when defined, otherwise the field label or legend', () => {
    const [item] = createBehaviour([createItem('add-child-partner')]).locals(
      req,
      {}
    ).items;

    expect(visibleRows(item)).toEqual([
      ['How are they related to you?', 'My child'],
      ['Their name', 'Sam Smith'],
      ['Their date of birth', '27 March 2020'],
      ['Their country of nationality', 'France']
    ]);
  });

  test('omits fields without a value', () => {
    const item = createItem('add-child-partner');
    item.fields.find(
      ({ field }) => field === 'child-partner-nationality'
    ).value = '';

    const [result] = createBehaviour([item]).locals(req, {}).items;

    expect(visibleRows(result).map(([label]) => label)).not.toContain(
      'Their country of nationality'
    );
  });

  test('does not change the saved field names used when editing', () => {
    const item = createItem('add-child-partner');

    createBehaviour([item]).locals(req, {});

    expect(item.fields[0].field).toBe('add-remove-child-partner');
  });

  test('maps each field to its own row when no options are passed', () => {
    class BaseBehaviour {
      locals() {
        return {
          items: [
            {
              joinTitle: 'Sam',
              fields: [
                {
                  field: 'child-partner-given-name',
                  value: 'Sam',
                  parsed: 'Sam'
                },
                {
                  field: 'child-partner-family-name',
                  value: 'Smith',
                  parsed: 'Smith'
                },
                {
                  field: 'relationship-to-child-partner',
                  value: 'my-child',
                  parsed: 'my-child'
                }
              ]
            }
          ]
        };
      }
    }
    const Behaviour = ParseSummaryFields()(BaseBehaviour);
    const plainReq = {
      ...req,
      form: {
        options: {
          ...req.form.options,
          titleField: ['child-partner-given-name']
        }
      }
    };

    const [item] = new Behaviour().locals(plainReq, {}).items;

    expect(item.joinTitle).toBe('Sam');
    expect(visibleRows(item)).toEqual([
      ['Their name', 'Sam'],
      ['Family name', 'Smith'],
      ['How are they related to you?', 'My child']
    ]);
  });

  describe('list values', () => {
    const listReq = {
      translate,
      form: {
        options: {
          fieldsConfig: {
            'relationship-to-child-partner': { mixin: 'checkbox-group' }
          }
        }
      }
    };
    const rowFor = fields => {
      class BaseBehaviour {
        locals() {
          return { items: [{ fields }] };
        }
      }
      const Behaviour = ParseSummaryFields()(BaseBehaviour);
      return new Behaviour().locals(listReq, {}).items[0].fields[0];
    };

    test('shows uploaded file names one per line', () => {
      const row = rowFor([
        {
          field: 'documents-child-partner',
          value: [
            { id: '1', name: 'birth-certificate.pdf' },
            { id: '2', name: 'photo.png' }
          ]
        }
      ]);

      expect(row.parsed).toBe('birth-certificate.pdf\nphoto.png');
      expect(row.omitFromSummary).toBe(false);
    });

    test('hides empty document rows unless configured as documentFields', () => {
      expect(
        rowFor([{ field: 'documents-child-partner', value: [] }])
          .omitFromSummary
      ).toBe(true);
    });

    describe.each([
      ['addremovechildpartner', 'documents-child-partner'],
      ['reportadeath', 'documents-death-certificate'],
      ['someoneelsenewdob', 'documents-someone-else-new-dob']
    ])('document rows for %s', (aggregateTo, field) => {
      const settings =
        require('../../../../../apps/saa/config/aggregator-summaries')[
          aggregateTo
        ];
      const rowsFor = (value, summaryOptions = settings) => {
        const saved = { joinTitle: 'An item', fields: [{ field, value }] };
        const original = structuredClone(saved);
        const mini = createBehaviour([saved], summaryOptions).locals(req, {})
          .items[0].fields[0];
        const final = ParseSummaryFields.formatAggregateForSummary(
          { aggregatedValues: [saved] },
          req,
          summaryOptions
        ).aggregatedValues[0].fields[1];

        expect(saved).toEqual(original);
        return [mini, final];
      };

      test.each([[[]], [undefined], [null], ['']])(
        'shows No files uploaded when the value is %p in mini and final summaries',
        value => {
          for (const row of rowsFor(value)) {
            expect(row).toMatchObject({
              field,
              label: 'Files uploaded',
              parsed: 'No files uploaded',
              omitFromSummary: false
            });
            expect(row.value).toEqual(value);
          }
        }
      );

      test('keeps uploaded filenames one per line', () => {
        const documents = [{ name: 'evidence.pdf' }, { name: 'photo.png' }];

        for (const row of rowsFor(documents)) {
          expect(row.parsed).toBe('evidence.pdf\nphoto.png');
          expect(row.omitFromSummary).toBe(false);
        }
      });

      test('keeps explicit omissions hidden', () => {
        for (const row of rowsFor([], { ...settings, omitFields: [field] })) {
          expect(row.omitFromSummary).toBe(true);
        }
      });

      test('still hides other empty fields', () => {
        const saved = {
          fields: [{ field: 'relationship-to-child-partner', value: [] }]
        };
        const result = createBehaviour([saved], settings).locals(req, {})
          .items[0];

        expect(result.fields[0].omitFromSummary).toBe(true);
      });
    });

    test('shows checkbox answers as option labels one per line', () => {
      const row = rowFor([
        {
          field: 'relationship-to-child-partner',
          value: ['my-child', 'spouse-or-partner']
        }
      ]);

      expect(row.parsed).toBe('My child\nMy partner');
    });
  });

  test('uses the itemTitle option as the title of every item', () => {
    class BaseBehaviour {
      locals() {
        return {
          items: [
            createItem('add-child-partner'),
            createItem('remove-child-partner')
          ]
        };
      }
    }
    const titleKey = 'pages.check-your-answers-evidence.item-title';
    const Behaviour = ParseSummaryFields({ itemTitle: titleKey })(
      BaseBehaviour
    );
    const titleReq = {
      ...req,
      translate: key => (key === titleKey ? 'Evidence' : translate(key))
    };

    const items = new Behaviour().locals(titleReq, {}).items;

    expect(items.map(item => item.joinTitle)).toEqual(['Evidence', 'Evidence']);
  });

  describe('opt-in title numbering', () => {
    const summaryOptions =
      require('../../../../../apps/saa/config/aggregator-summaries').someoneelsenewdob;
    const title = "Change someone else's date of birth";
    const titleReq = {
      ...req,
      translate: keys =>
        keys === summaryOptions.itemTitle ? title : translate(keys)
    };
    const formatItems = (items, settings = summaryOptions) =>
      createBehaviour(items, settings).locals(titleReq, {}).items;
    const finalItems = (items, settings = summaryOptions) =>
      ParseSummaryFields.formatAggregateForSummary(
        { aggregatedValues: items },
        titleReq,
        settings
      );

    test.each([
      [0, []],
      [1, [title]],
      [3, [title, `${title} 2`, `${title} 3`]]
    ])(
      'numbers %i items consistently in mini and final summaries',
      (count, expected) => {
        const items = Array.from({ length: count }, () =>
          createItem('add-child-partner')
        );

        expect(formatItems(items).map(item => item.joinTitle)).toEqual(
          expected
        );
        if (count === 0) {
          expect(finalItems(items)).toBeNull();
        } else {
          expect(
            finalItems(items).aggregatedValues.map(
              item => item.fields[0].parsed
            )
          ).toEqual(expected);
        }
      }
    );

    test.each([undefined, false])(
      'leaves titles unchanged when addIncrement is %p',
      addIncrement => {
        const items = Array.from({ length: 3 }, () =>
          createItem('add-child-partner')
        );
        const settings = { ...summaryOptions, addIncrement };

        expect(
          formatItems(items, settings).map(item => item.joinTitle)
        ).toEqual([title, title, title]);
        expect(
          finalItems(items, settings).aggregatedValues.map(
            item => item.fields[0].parsed
          )
        ).toEqual([title, title, title]);
      }
    );

    test('preserves all field formatting and Change links when numbering is enabled', () => {
      const items = Array.from({ length: 3 }, () =>
        createItem('add-child-partner')
      );
      const settings = {
        ...options,
        itemTitle: summaryOptions.itemTitle,
        addIncrement: true,
        changeLink: '/changes/check-your-answers-someone-else-date-of-birth'
      };
      const unnumbered = { ...settings, addIncrement: false };
      const mini = formatItems(items, settings);
      const final = finalItems(items, settings).aggregatedValues;

      expect(mini.map(item => item.fields)).toEqual(
        formatItems(items, unnumbered).map(item => item.fields)
      );
      expect(final.map(item => item.fields.slice(1))).toEqual(
        finalItems(items, unnumbered).aggregatedValues.map(item =>
          item.fields.slice(1)
        )
      );
      expect(
        final.map(item => item.fields[0].aggregatorTitleChangeLink)
      ).toEqual(Array(3).fill(settings.changeLink));
    });

    test('recalculates numbering after deletion using current positions, not saved indexes', () => {
      const items = Array.from({ length: 3 }, (_, index) => ({
        ...createItem('add-child-partner'),
        index
      }));
      const remaining = items.slice(1);

      expect(formatItems(remaining).map(item => item.joinTitle)).toEqual([
        title,
        `${title} 2`
      ]);
      expect(
        finalItems(remaining).aggregatedValues.map(
          item => item.fields[0].parsed
        )
      ).toEqual([title, `${title} 2`]);
    });

    test('does not mutate saved items or accumulate suffixes on repeated rendering', () => {
      const items = Array.from({ length: 3 }, () =>
        createItem('add-child-partner')
      );
      const saved = structuredClone(items);
      const mini = formatItems(items);
      const final = finalItems(items);

      expect(formatItems(items)).toEqual(mini);
      expect(finalItems(items)).toEqual(final);
      expect(items).toEqual(saved);
    });

    test.each([
      [
        req,
        ['add-child-partner', 'remove-child-partner'],
        [
          'Add a child or partner as a dependant',
          'Remove a child or partner as a dependant 2'
        ]
      ],
      [{ ...req, form: { options: {} } }, ['Sam', 'Alex'], ['Sam', 'Alex 2']]
    ])(
      'supports numbering option-based and saved titles (%p)',
      (request, choices, expected) => {
        const items = choices.map(createItem);
        const settings = { addIncrement: true };

        expect(
          createBehaviour(items, settings)
            .locals(request, {})
            .items.map(item => item.joinTitle)
        ).toEqual(expected);
        expect(
          ParseSummaryFields.formatAggregateForSummary(
            { aggregatedValues: items },
            request,
            settings
          ).aggregatedValues.map(item => item.fields[0].parsed)
        ).toEqual(expected);
      }
    );
  });

  describe('formatAggregateForSummary', () => {
    const { formatAggregateForSummary } = ParseSummaryFields;
    const childPartnerSummary = {
      ...require('../../../../../apps/saa/config/aggregator-summaries')
        .addremovechildpartner,
      changeLink: '/changes/check-your-answers-add-child-partner'
    };

    test('starts each item with a title that links to the aggregate summary page', () => {
      const aggregate = {
        aggregatedValues: [
          createItem('add-child-partner'),
          createItem('remove-child-partner')
        ]
      };

      const titles = formatAggregateForSummary(
        aggregate,
        req,
        childPartnerSummary
      ).aggregatedValues.map(item => item.fields[0]);

      expect(titles).toEqual(
        ['Add', 'Remove'].map(action => ({
          field: 'add-remove-child-partner',
          parsed: `${action} a child or partner as a dependant`,
          isAggregatorTitle: true,
          aggregatorTitleChangeLink:
            '/changes/check-your-answers-add-child-partner'
        }))
      );
    });

    test('shows the same formatted answers as the item card, without their own Change links', () => {
      const [item] = formatAggregateForSummary(
        { aggregatedValues: [createItem('add-child-partner')] },
        req,
        childPartnerSummary
      ).aggregatedValues;
      const answers = item.fields.slice(1);

      expect(answers.every(field => field.omitChangeLink)).toBe(true);
      expect(
        answers
          .filter(field => !field.omitFromSummary)
          .map(field => field.parsed)
      ).toEqual([
        'Moved out',
        'My child',
        'Sam Smith',
        '27 March 2020',
        'France',
        'birth-certificate.pdf'
      ]);
    });

    test.each([[undefined], [{ aggregatedValues: [] }]])(
      'returns null when there are no items (%p)',
      aggregate => {
        expect(
          formatAggregateForSummary(aggregate, req, childPartnerSummary)
        ).toBeNull();
      }
    );

    test('does not change the saved items', () => {
      const saved = createItem('add-child-partner');

      formatAggregateForSummary(
        { aggregatedValues: [saved] },
        req,
        childPartnerSummary
      );

      expect(saved.fields[0]).toEqual({
        field: 'add-remove-child-partner',
        value: 'add-child-partner',
        parsed: 'add-child-partner'
      });
    });
  });
});
