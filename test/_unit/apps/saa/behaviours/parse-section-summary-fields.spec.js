'use strict';

const ParseSummaryFields = require('../../../../../apps/saa/behaviours/parse-section-summary-fields');

const translations = {
  'fields.add-remove-child-partner.options.add-child-partner.summary-label':
    'Add a child or partner as a dependant',
  'fields.add-remove-child-partner.options.remove-child-partner.summary-label':
    'Remove a child or partner as a dependant',
  'fields.relationship-to-child-partner.options.my-child.label': 'My child',
  'fields.relationship-to-child-partner.options.husband-wife-partner.label':
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

const createBehaviour = items => {
  class BaseBehaviour {
    locals() {
      return { items };
    }
  }
  const Behaviour = ParseSummaryFields(options)(BaseBehaviour);
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

    test('hides the row when no files were uploaded', () => {
      expect(
        rowFor([{ field: 'documents-child-partner', value: [] }])
          .omitFromSummary
      ).toBe(true);
    });

    test('shows checkbox answers as option labels one per line', () => {
      const row = rowFor([
        {
          field: 'relationship-to-child-partner',
          value: ['my-child', 'husband-wife-partner']
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
