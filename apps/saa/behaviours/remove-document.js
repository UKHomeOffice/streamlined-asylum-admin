'use strict';

module.exports = documentCategory => superclass => class extends superclass {
  configure(req, res, next) {
    if (req.query.delete) {
      const documents = req.sessionModel.get(documentCategory) || [];
      const remainingDocuments = documents.filter(document => document.id !== req.query.delete);
      req.log('info', `Removing document: ${req.query.delete}`);
      req.sessionModel.set(documentCategory, remainingDocuments);
      return res.redirect(`${req.baseUrl}${req.path}`);
    }
    return super.configure(req, res, next);
  }
};
