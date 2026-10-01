'use strict';

const path = require('node:path');
const config = require('../../../config');
const FileUpload = require('../../../utils/file-upload');
const { sanitiseFilename } = require('../../../utils');

module.exports = (documentCategory, fieldName) => superclass => class extends superclass {
  process(req) {
    if (req.files && req.files[fieldName]) {
      req.form.values[fieldName] = req.files[fieldName].name;
      req.log('info', `Processing field ${fieldName} with value: ${sanitiseFilename(req.files[fieldName].name)}`);
    }
    super.process.apply(this, arguments);
  }

  locals(req, res) {
    const locals = super.locals(req, res);
    locals.documents = req.sessionModel.get(documentCategory) || [];
    return locals;
  }

  validateField(key, req) {
    const file = req.files && req.files[fieldName];
    const documents = req.sessionModel.get(documentCategory) || [];
    const validationError = (type, args) => new this.ValidationError(key, { type, arguments: [args] });

    if (!file && documents.length === 0) {
      return validationError('required');
    }

    if (file) {
      const categoryConfig = config.upload.documentCategories[documentCategory];
      const allowedMimeTypes = categoryConfig.allowedMimeTypes || config.upload.allowedMimeTypes;
      const acceptedFileExtensions = (categoryConfig.acceptedFileExtensions || config.upload.acceptedFileExtensions)
        .split(',');
      const fileExtension = path.extname(file.name).toLowerCase();

      if (file.size === 0) {
        return validationError('emptyFile');
      }
      if (file.size > config.upload.maxFileSizeInBytes || file.truncated) {
        return validationError('maxFileSize');
      }
      if (!allowedMimeTypes.includes(file.mimetype) || !acceptedFileExtensions.includes(fileExtension)) {
        return validationError('fileType');
      }
      if (documents.length >= categoryConfig.limit) {
        return validationError(categoryConfig.limitValidationError, categoryConfig.limit);
      }
      if (documents.some(document => document.name === file.name)) {
        return validationError('isDuplicateFileName', file.name);
      }
    }

    return super.validateField(key, req);
  }

  async saveValues(req, res, next) {
    const documents = req.sessionModel.get(documentCategory) || [];
    const file = req.files && req.files[fieldName];

    if (file) {
      req.log('info', `Saving document: ${sanitiseFilename(file.name)} in ${documentCategory} category`);
      const upload = new FileUpload({
        name: file.name,
        data: file.data,
        mimetype: file.mimetype
      });

      try {
        await upload.save();
        req.sessionModel.set(documentCategory, [...documents, upload.toJSON()]);
        return res.redirect(`${req.baseUrl}${req.path}`);
      } catch (error) {
        return next(new Error(`Failed to save document: ${error}`));
      }
    }

    return super.saveValues.apply(this, arguments);
  }
};
