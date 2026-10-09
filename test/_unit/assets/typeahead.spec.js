'use strict';

jest.mock('accessible-autocomplete', () => ({
  enhanceSelectElement: jest.fn()
}));

const { initTypeahead } = require('../../../assets/js/typeahead');

describe('typeahead client synchronization', () => {
  let input;
  let select;
  let dispatchInput;

  beforeEach(() => {
    input = {
      value: 'France',
      setAttribute: jest.fn(),
      addEventListener: jest.fn((event, handler) => {
        if (event === 'input') {
          dispatchInput = handler;
        }
      })
    };
    select = {
      name: 'nationality',
      value: 'France',
      options: [{ value: '' }, { value: 'France' }, { value: 'Germany' }],
      parentNode: { querySelector: jest.fn().mockReturnValue(input) },
      getAttribute: jest.fn().mockReturnValue(null),
      dispatchEvent: jest.fn()
    };
    global.document = {
      getElementById: jest.fn().mockReturnValue(select)
    };

    initTypeahead(select);
  });

  afterEach(() => {
    delete global.document;
  });

  test.each(['', 'Atlantis', 'Fra'])(
    'clears a previously selected nationality when text becomes "%s"',
    text => {
      input.value = text;
      dispatchInput();

      expect(select.value).toBe('');
      expect(select.dispatchEvent).toHaveBeenCalledTimes(1);
      const [event] = select.dispatchEvent.mock.calls[0];
      expect(event.type).toBe('change');
      expect(event.bubbles).toBe(true);
    }
  );

  test('preserves a confirmed country without dispatching a change', () => {
    dispatchInput();

    expect(select.value).toBe('France');
    expect(select.dispatchEvent).not.toHaveBeenCalled();
  });
});
