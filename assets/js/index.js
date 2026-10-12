require('hof/frontend/themes/gov-uk/client-js');

const { initFileUpload } = require('./file-upload');
const { initTypeahead } = require('./typeahead');

document.addEventListener('DOMContentLoaded', () => {
  initFileUpload();
  initTypeahead();
});
