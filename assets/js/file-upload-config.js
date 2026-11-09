'use strict';

module.exports = {
  required: true,
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
  // Categories inherit global defaults unless overridden here.
  documentCategories: {
    'documents-new-name': { required: false },
    'documents-someone-else-new-name': { required: false },
    'documents-new-dob': { required: false },
    'documents-someone-else-new-dob': { required: false },
    'documents-nationality': { required: false },
    'documents-someone-else-nationality': { required: false },
    'documents-child-partner': { required: false },
    'documents-death-certificate': { required: false }
  }
};
