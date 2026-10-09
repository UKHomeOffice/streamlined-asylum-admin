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
  const required = element.getAttribute('aria-required');
  if (required !== null) {
    input.setAttribute('aria-required', required);
  }
  input.setAttribute('name', `${element.name}-auto`);
  const values = Array.from(document.getElementById(`${element.name}-select`).options).map(option => option.value);

  function clear() {
    element.value = '';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  input.addEventListener('input', () => {
    if(input.value !== element.value) {
      clear();
    }
  });
}

module.exports = { initTypeahead };
