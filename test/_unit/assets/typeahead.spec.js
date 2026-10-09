'use strict';

jest.mock('accessible-autocomplete', () => ({
  enhanceSelectElement: jest.fn()
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
});
