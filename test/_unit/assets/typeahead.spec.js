'use strict';

jest.mock('accessible-autocomplete', () => ({
  enhanceSelectElement: jest.fn()
}));
jest.mock('hof/frontend/themes/gov-uk/client-js', () => ({}));
jest.mock('../../../assets/js/file-upload', () => ({
  initFileUpload: jest.fn()
}));

const accessibleAutocomplete = require('accessible-autocomplete');
const { initTypeahead } = require('../../../assets/js/typeahead');

describe('typeahead initialization', () => {
  afterEach(() => {
    delete global.document;
    jest.clearAllMocks();
  });

  test('enhances each matching select once with an empty default value', () => {
    const firstSelect = {};
    const secondSelect = {};
    global.document = {
      querySelectorAll: jest.fn().mockReturnValue([firstSelect, secondSelect])
    };

    initTypeahead();

    expect(global.document.querySelectorAll).toHaveBeenCalledWith('.typeahead');
    expect(accessibleAutocomplete.enhanceSelectElement).toHaveBeenCalledTimes(2);
    expect(accessibleAutocomplete.enhanceSelectElement).toHaveBeenNthCalledWith(1, {
      defaultValue: '',
      selectElement: firstSelect
    });
    expect(accessibleAutocomplete.enhanceSelectElement).toHaveBeenNthCalledWith(2, {
      defaultValue: '',
      selectElement: secondSelect
    });
  });
  test('does nothing when there are no matching selects', () => {
    global.document = {
      querySelectorAll: jest.fn().mockReturnValue([])
    };

    expect(() => initTypeahead()).not.toThrow();
    expect(accessibleAutocomplete.enhanceSelectElement).not.toHaveBeenCalled();
  });

  test('the entry point enhances each select exactly once', () => {
    const firstSelect = {};
    const secondSelect = {};
    const handlers = {};
    global.document = {
      querySelectorAll: jest.fn().mockReturnValue([firstSelect, secondSelect]),
      addEventListener: jest.fn((event, handler) => {
        handlers[event] = handler;
      })
    };

    jest.isolateModules(() => {
      const autocomplete = require('accessible-autocomplete');
      autocomplete.enhanceSelectElement.mockClear();

      require('../../../assets/js/index');
      expect(handlers.DOMContentLoaded).toEqual(expect.any(Function));
      handlers.DOMContentLoaded();

      expect(autocomplete.enhanceSelectElement.mock.calls).toEqual([
        [{ defaultValue: '', selectElement: firstSelect }],
        [{ defaultValue: '', selectElement: secondSelect }]
      ]);
    });
  });
});
