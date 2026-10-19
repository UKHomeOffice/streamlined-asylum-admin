'use strict';

const AggregateSaveUpdate = require('../../../../../apps/saa/behaviours/aggregator-save-update');

class BaseBehaviour {
  constructor(options) {
    this.options = options;
  }

  locals() {
    return {};
  }

  getValues() {
    return {};
  }
}

const Behaviour = AggregateSaveUpdate(BaseBehaviour);

const editStepForks = [
  {
    target: 'relationship-to-child-partner',
    condition: { field: 'add-remove-child-partner', value: 'add-child-partner' }
  },
  {
    target: 'reason-for-removing-child-partner',
    condition: {
      field: 'add-remove-child-partner',
      value: 'remove-child-partner'
    }
  }
];

const createRequest = ({ session = {}, options = {}, params = {} } = {}) => {
  const values = { ...session };

  return {
    baseUrl: '/changes',
    params,
    form: {
      options: {
        aggregateTo: 'addremovechildpartner',
        aggregateFrom: ['child-partner-given-name'],
        addStep: 'do-you-need-add-remove-dependant',
        route: '/check-your-answers-add-child-partner',
        ...options
      }
    },
    sessionModel: {
      get: jest.fn(key => values[key]),
      set: jest.fn((key, value) => {
        values[key] = value;
      }),
      unset: jest.fn(key => {
        delete values[key];
      })
    }
  };
};

describe('aggregator save update behaviour', () => {
  let behaviour;

  beforeEach(() => {
    behaviour = new Behaviour({
      aggregateTo: 'items',
      aggregateFrom: ['field']
    });
  });

  test('uses addStep when no add-step forks are configured', () => {
    const req = createRequest();

    expect(behaviour.getAddStep(req)).toBe('do-you-need-add-remove-dependant');
    expect(behaviour.locals(req, {}).addStep).toBe(
      'do-you-need-add-remove-dependant'
    );
  });

  test.each([
    ['add-child-partner', 'relationship-to-child-partner'],
    ['remove-child-partner', 'reason-for-removing-child-partner']
  ])('uses the add-step fork for %s', (choice, expectedStep) => {
    const req = createRequest({
      session: { 'add-remove-child-partner': choice },
      options: { editStepForks }
    });

    expect(behaviour.getAddStep(req)).toBe(expectedStep);
    expect(behaviour.locals(req, {}).addStep).toBe(expectedStep);
  });

  test('falls back to addStep when no add-step fork matches', () => {
    const req = createRequest({ options: { editStepForks } });

    expect(behaviour.getAddStep(req)).toBe('do-you-need-add-remove-dependant');
  });

  test('redirects an edited item to the matching add-step fork', () => {
    const req = createRequest({
      params: { id: '0' },
      session: {
        'add-remove-child-partner': 'remove-child-partner',
        addremovechildpartner: {
          aggregatedValues: [
            { fields: [{ field: 'child-partner-given-name', value: 'Sam' }] }
          ]
        }
      },
      options: { editStepForks }
    });
    const res = { redirect: jest.fn() };

    behaviour.updateItem(req, res);

    expect(req.sessionModel.set).toHaveBeenCalledWith(
      'child-partner-given-name',
      'Sam'
    );
    expect(res.redirect).toHaveBeenCalledWith(
      '/changes/reason-for-removing-child-partner'
    );
  });

  test.each([
    ['0', 'relationship-to-child-partner'],
    ['1', 'reason-for-removing-child-partner']
  ])(
    'routes edited item %s by its own add/remove choice',
    (id, expectedStep) => {
      const req = createRequest({
        params: { id },
        session: {
          'add-remove-child-partner':
            id === '0' ? 'remove-child-partner' : 'add-child-partner',
          addremovechildpartner: {
            aggregatedValues: [
              {
                fields: [
                  {
                    field: 'add-remove-child-partner',
                    value: 'add-child-partner'
                  }
                ]
              },
              {
                fields: [
                  {
                    field: 'add-remove-child-partner',
                    value: 'remove-child-partner'
                  }
                ]
              }
            ]
          }
        },
        options: { editStepForks }
      });
      const res = { redirect: jest.fn() };

      behaviour.updateItem(req, res);

      expect(res.redirect).toHaveBeenCalledWith(`/changes/${expectedStep}`);
    }
  );

  test('keeps the default addStep when the summary is empty', () => {
    const req = createRequest({
      session: { 'add-remove-child-partner': 'add-child-partner' },
      options: { editStepForks }
    });
    const res = { redirect: jest.fn() };

    behaviour.getValues(req, res, jest.fn());

    expect(res.redirect).toHaveBeenCalledWith(
      '/changes/do-you-need-add-remove-dependant'
    );
  });
});

describe('aggregator save update item handling', () => {
  const behaviour = new Behaviour({
    aggregateTo: 'items',
    aggregateFrom: ['field']
  });
  const aggregateFrom = [
    'child-partner-given-name',
    'child-partner-family-name'
  ];
  const savedItems = () => ({
    aggregatedValues: [
      {
        joinTitle: 'A',
        fields: [{ field: 'child-partner-given-name', value: 'A' }]
      },
      {
        joinTitle: 'B',
        fields: [{ field: 'child-partner-given-name', value: 'B' }]
      }
    ]
  });
  const itemsIn = req =>
    req.sessionModel.get('addremovechildpartner').aggregatedValues;

  test.each([
    [{ aggregateFrom: ['a'] }, 'options.aggregateTo is required for loops'],
    [{ aggregateTo: 'items' }, 'options.aggregateFrom is required for loops']
  ])('throws when a required option is missing (%p)', (options, message) => {
    expect(() => new Behaviour(options)).toThrow(message);
  });

  test('adds a new item from the session and clears the answered fields', () => {
    const req = createRequest({
      session: {
        'child-partner-given-name': 'Sam',
        'child-partner-family-name': 'Smith'
      },
      options: {
        aggregateFrom,
        titleField: aggregateFrom,
        fieldsConfig: {
          'child-partner-family-name': { parse: value => value.toUpperCase() }
        }
      }
    });
    const res = { redirect: jest.fn() };

    behaviour.addItem(req, res);

    expect(itemsIn(req)).toEqual([
      {
        joinTitle: 'Sam Smith',
        fields: [
          {
            field: 'child-partner-given-name',
            parsed: 'Sam',
            value: 'Sam',
            showInSummary: true
          },
          {
            field: 'child-partner-family-name',
            parsed: 'SMITH',
            value: 'Smith',
            showInSummary: true
          }
        ]
      }
    ]);
    expect(req.sessionModel.unset).toHaveBeenCalledWith(
      'child-partner-given-name'
    );
    expect(req.sessionModel.unset).toHaveBeenCalledWith(
      'child-partner-family-name'
    );
    expect(res.redirect).toHaveBeenCalledWith(
      '/changes/check-your-answers-add-child-partner'
    );
  });

  test('does not add an item once the limit is reached', () => {
    const req = createRequest({
      session: {
        addremovechildpartner: savedItems(),
        'child-partner-given-name': 'C'
      },
      options: {
        aggregateFrom: ['child-partner-given-name'],
        aggregateLimit: 2,
        fieldsConfig: {}
      }
    });

    behaviour.addItem(req, { redirect: jest.fn() });

    expect(itemsIn(req).map(item => item.joinTitle)).toEqual(['A', 'B']);
  });

  test('uses the default limit when none is configured', () => {
    const req = createRequest({
      session: { 'child-partner-given-name': 'C' },
      options: { aggregateFrom: ['child-partner-given-name'], fieldsConfig: {} }
    });

    behaviour.addItem(req, { redirect: jest.fn() });

    expect(itemsIn(req)).toHaveLength(1);
  });

  test('puts an edited item back in its original position', () => {
    const req = createRequest({
      params: { id: '0' },
      session: { addremovechildpartner: savedItems() },
      options: {
        aggregateFrom: ['child-partner-given-name'],
        titleField: 'child-partner-given-name',
        fieldsConfig: {}
      }
    });

    behaviour.updateItem(req, { redirect: jest.fn() });
    expect(itemsIn(req).map(item => item.joinTitle)).toEqual(['B']);
    expect(req.sessionModel.get('child-partner-given-name')).toBe('A');

    req.sessionModel.set('child-partner-given-name', 'A2');
    behaviour.addItem(req, { redirect: jest.fn() });

    expect(itemsIn(req).map(item => item.joinTitle)).toEqual(['A2', 'B']);
    expect(req.sessionModel.get('isUpdate')).toBeUndefined();
    expect(req.sessionModel.get('updatingIndex')).toBeUndefined();
  });

  test('redirects to the add step without changes when the edited item does not exist', () => {
    const req = createRequest({
      params: { id: '5' },
      session: { addremovechildpartner: savedItems() }
    });
    const res = { redirect: jest.fn() };

    behaviour.updateItem(req, res);

    expect(itemsIn(req)).toHaveLength(2);
    expect(res.redirect).toHaveBeenCalledWith(
      '/changes/do-you-need-add-remove-dependant'
    );
  });

  test('deletes the selected item and redirects to the summary', () => {
    const req = createRequest({
      params: { id: '0' },
      session: { addremovechildpartner: savedItems() }
    });
    const res = { redirect: jest.fn() };

    behaviour.deleteItem(req, res);

    expect(itemsIn(req).map(item => item.joinTitle)).toEqual(['B']);
    expect(res.redirect).toHaveBeenCalledWith(
      '/changes/check-your-answers-add-child-partner'
    );
  });

  test('only redirects when deleting without an id', () => {
    const req = createRequest({
      session: { addremovechildpartner: savedItems() }
    });

    behaviour.deleteItem(req, { redirect: jest.fn() });

    expect(req.sessionModel.set).not.toHaveBeenCalled();
  });

  describe.each([
    'forEach',
    'length',
    'constructor',
    '-1',
    '1.5',
    '0abc',
    '2',
    ' ',
    '',
    '0x1',
    '1e0',
    '+1'
  ])('with an invalid id in the URL (%s)', id => {
    test('edit redirects without crashing or changing the session', () => {
      const req = createRequest({
        params: { id },
        session: { addremovechildpartner: savedItems() }
      });
      const res = { redirect: jest.fn() };

      expect(() => behaviour.updateItem(req, res)).not.toThrow();
      expect(req.sessionModel.set).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        '/changes/do-you-need-add-remove-dependant'
      );
    });

    test('delete redirects without removing anything', () => {
      const req = createRequest({
        params: { id },
        session: { addremovechildpartner: savedItems() }
      });
      const res = { redirect: jest.fn() };

      behaviour.deleteItem(req, res);

      expect(req.sessionModel.set).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        '/changes/check-your-answers-add-child-partner'
      );
    });
  });

  test('saves the edit position as a number', () => {
    const req = createRequest({
      params: { id: '1' },
      session: { addremovechildpartner: savedItems() }
    });

    behaviour.updateItem(req, { redirect: jest.fn() });

    expect(req.sessionModel.get('updatingIndex')).toBe(1);
  });

  test.each([
    ['addItem', { 'child-partner-given-name': 'Sam' }, {}],
    ['redirectToAddStep', {}, {}],
    ['redirectToCustomAddStep', {}, { customAddStep: 'custom-step' }],
    ['showItems', { addremovechildpartner: savedItems() }, {}]
  ])('chooses %s', (action, session, options) => {
    const req = createRequest({
      session,
      options: { aggregateFrom: ['child-partner-given-name'], ...options }
    });

    expect(behaviour.getAction(req)).toBe(action);
  });

  test.each([
    ['delete', 'deleteItem'],
    ['edit', 'updateItem'],
    ['addItem', 'addItem'],
    ['redirectToAddStep', 'redirectToAddStep'],
    ['redirectToCustomAddStep', 'redirectToCustomAddStep']
  ])('handles the %s action by calling %s', (action, method) => {
    const spy = jest.spyOn(behaviour, method).mockImplementation(() => {});

    expect(
      behaviour.handleAction(createRequest(), {}, jest.fn(), action)
    ).toEqual({ redirected: true });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('shows the items for the showItems action', () => {
    expect(
      behaviour.handleAction(createRequest(), {}, jest.fn(), 'showItems')
    ).toEqual({ redirected: false });
  });

  test('redirects to the custom add step', () => {
    const res = { redirect: jest.fn() };

    behaviour.redirectToCustomAddStep(
      createRequest({ options: { customAddStep: 'custom-step' } }),
      res
    );

    expect(res.redirect).toHaveBeenCalledWith('/changes/custom-step');
  });

  test('uses the action from the URL when one is given', () => {
    const spy = jest
      .spyOn(behaviour, 'deleteItem')
      .mockImplementation(() => {});

    behaviour.getValues(
      createRequest({ params: { action: 'delete' } }),
      {},
      jest.fn()
    );

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  // Changing "No" to "Yes" on /confirm makes HOF route through the loop with /edit and no item id.
  test('saves the completed item when reached with /edit and no id', () => {
    const req = createRequest({
      params: { action: 'edit' },
      session: { 'child-partner-given-name': 'Sam' },
      options: { aggregateFrom: ['child-partner-given-name'], fieldsConfig: {} }
    });
    const res = { redirect: jest.fn() };
    const updateSpy = jest.spyOn(behaviour, 'updateItem');

    behaviour.getValues(req, res, jest.fn());

    expect(updateSpy).not.toHaveBeenCalled();
    expect(itemsIn(req).map(item => item.fields[0].value)).toEqual(['Sam']);
    expect(res.redirect).toHaveBeenCalledWith(
      '/changes/check-your-answers-add-child-partner'
    );
    updateSpy.mockRestore();
  });

  test('still changes a saved item when /edit has an id', () => {
    const req = createRequest({
      params: { action: 'edit', id: '0' },
      session: { addremovechildpartner: savedItems() }
    });
    const res = { redirect: jest.fn() };

    behaviour.getValues(req, res, jest.fn());

    expect(req.sessionModel.get('isUpdate')).toBe(true);
    expect(req.sessionModel.get('child-partner-given-name')).toBe('A');
    expect(res.redirect).toHaveBeenCalledWith(
      '/changes/do-you-need-add-remove-dependant'
    );
  });

  test.each([
    [{ action: 'edit' }, undefined],
    [{ action: 'edit', id: '0' }, 'edit'],
    [{ action: 'delete', id: '0' }, 'delete'],
    [{}, undefined]
  ])('reads the requested action from %p as %p', (params, expected) => {
    expect(behaviour.getRequestedAction({ params })).toBe(expected);
  });

  test('accepts aggregateFrom entries given as objects', () => {
    const req = createRequest({
      options: { fieldsConfig: { name: { parse: value => `parsed ${value}` } } }
    });

    expect(behaviour.parseField({ field: 'name' }, 'Sam', req)).toBe(
      'parsed Sam'
    );
  });

  test('numbers the items for the view', () => {
    const req = createRequest({
      session: { addremovechildpartner: savedItems() }
    });

    const locals = behaviour.locals(req, {});

    expect(locals.items.map(item => item.index)).toEqual([0, 1]);
    expect(locals.hasItems).toBe(true);
    expect(locals.hasMultipleItems).toBe(true);
    expect(locals.field).toBe('addremovechildpartner');
  });

  test('does not allow removing the only item', () => {
    const req = createRequest({
      session: {
        addremovechildpartner: {
          aggregatedValues: [savedItems().aggregatedValues[0]]
        }
      }
    });

    const locals = behaviour.locals(req, {});

    expect(locals.hasItems).toBe(true);
    expect(locals.hasMultipleItems).toBe(false);
  });
});
