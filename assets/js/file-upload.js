'use strict';

const uploadConfig = require('./file-upload-config');

const setUploadStatus = (status, errorType, elements) => {
  const { component, spinner, input, continueButtons, removeLinks } = elements;
  const errors = component.querySelectorAll('.govuk-error-message');

  errors.forEach(error => error.classList.add('govuk-!-display-none'));
  component.classList.remove('govuk-form-group--error');
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-describedby');

  if (status === 'error') {
    const errorId = `file-upload-error-${errorType}`;
    component.classList.add('govuk-form-group--error');
    document.getElementById(errorId).classList.remove('govuk-!-display-none');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errorId);
  }

  if (status === 'uploading') {
    spinner.style.display = 'flex';
    input.disabled = true;
    input.ariaDisabled = true;
    continueButtons.forEach(button => {
      button.disabled = true;
      button.ariaDisabled = true;
    });
    removeLinks.forEach(link => link.classList.add('disabled-link'));
  }
};

const initFileUpload = () => {
  const input = document.getElementById('file-upload');

  if (!input) {
    return;
  }

  const elements = {
    component: document.getElementById('hofFileUpload'),
    spinner: document.getElementById('upload-page-loading-spinner'),
    input,
    continueButtons: document.getElementsByName('continueWithoutUpload'),
    removeLinks: document.querySelectorAll('#uploaded-documents a')
  };

  input.addEventListener('change', () => {
    setUploadStatus('ready', null, elements);
    const file = input.files && input.files[0];

    if (!file) {
      return;
    }

    const categoryConfig = uploadConfig.documentCategories[input.getAttribute('document-category')];
    const allowedMimeTypes = categoryConfig.allowedMimeTypes || uploadConfig.allowedMimeTypes;
    const acceptedFileExtensions = (categoryConfig.acceptedFileExtensions || uploadConfig.acceptedFileExtensions)
      .split(',');
    const dotIndex = file.name.lastIndexOf('.');
    const fileExtension = dotIndex > 0 ? file.name.slice(dotIndex).toLowerCase() : '';

    if (file.size === 0) {
      setUploadStatus('error', 'emptyFile', elements);
      return;
    }
    if (file.size > uploadConfig.maxFileSizeInBytes) {
      setUploadStatus('error', 'maxFileSize', elements);
      return;
    }
    // Browsers can report an empty MIME type for valid files, so leave those to server validation
    if (!acceptedFileExtensions.includes(fileExtension) || (file.type && !allowedMimeTypes.includes(file.type))) {
      setUploadStatus('error', 'fileType', elements);
      return;
    }

    document.querySelector('[name=file-upload-form]').submit();
    setUploadStatus('uploading', null, elements);
  });
};

module.exports = { initFileUpload };
