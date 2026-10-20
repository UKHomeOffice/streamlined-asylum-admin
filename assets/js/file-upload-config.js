'use strict';

module.exports = {
  maxFileSizeInBytes: 25 * 1024 * 1024,
  acceptedFileExtensions: '.doc,.docx,.pdf,.rtf,.txt,.odt,.jpeg,.jpg,.png',
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf',
    'text/rtf',
    'text/plain',
    'application/vnd.oasis.opendocument.text'
  ],
  limit: 6,
  limitValidationError: 'fileCountLimit',
  documentCategories: {
    // Add document categories override here if required
  }
};
