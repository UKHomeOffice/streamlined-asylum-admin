require('hof/frontend/themes/gov-uk/client-js');

const { initFileUpload } = require('./file-upload');
const { initTypeahead } = require('./typeahead');

document.querySelectorAll('.typeahead').forEach(initTypeahead);

document.addEventListener('DOMContentLoaded', () => {
  initFileUpload();
});
