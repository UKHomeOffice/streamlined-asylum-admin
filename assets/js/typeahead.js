/* eslint-disable no-var, vars-on-top */
'use strict';

const accessibleAutocomplete = require('accessible-autocomplete');

function initTypeahead() {
  document
    .querySelectorAll('.typeahead')
    .forEach(function applyTypeahead(element) {
      accessibleAutocomplete.enhanceSelectElement({
        defaultValue: '',
        selectElement: element
      });
    });
}

module.exports = { initTypeahead };
