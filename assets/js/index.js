require('hof/frontend/themes/gov-uk/client-js');

const { initFileUpload } = require('./file-upload');
const { initTypeahead } = require('./typeahead');

document.addEventListener('DOMContentLoaded', () => {
  initFileUpload();
  initTypeahead();

  const errorBackButton = document.getElementById('error-back-button');
  if (errorBackButton) {
    errorBackButton.addEventListener('click', () => {
      window.history.back();
    });
    errorBackButton.hidden = false;
  }
});
