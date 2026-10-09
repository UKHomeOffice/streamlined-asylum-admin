/* eslint-disable no-var, vars-on-top */
'use strict';

const accessibleAutocomplete = require('accessible-autocomplete');

function initTypeahead(element) {
  const container = element.parentNode;

  accessibleAutocomplete.enhanceSelectElement({
    defaultValue: '',
    selectElement: element
  });

  const input = container.querySelector('.autocomplete__input');
  if (!input) {
    return;
  }

  // This needed to do custom validation in validate-autocomplete behaviour
  input.setAttribute('name', `${element.name}-auto`);
  const values = Array.from(document.getElementById(`${element.name}-select`).options).map(option => option.value);

  function clear() {
    element.value = '';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  input.addEventListener('input', () => {
    // If user clears the field completely
    if (!input.value) clear();

    // If user enters a value not in the values array
    if (input.value && !values.includes(input.value)) clear();
  });
}

module.exports = { initTypeahead };
