require('hof/frontend/themes/gov-uk/client-js');

const { initFileUpload } = require('./file-upload');

document.addEventListener('DOMContentLoaded', () => {
  initFileUpload();
});
