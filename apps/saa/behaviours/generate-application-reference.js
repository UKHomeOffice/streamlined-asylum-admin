'use strict';

const REFERENCE_FIELD = 'application-reference';

const generateApplicationReference = superclass =>
  class extends superclass {
    async generateReference() {
      const crs = await import('crypto-random-string');
      const suffix = crs.default({
        length: 10,
        characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      });
      return `COC-${suffix}`;
    }

    async successHandler(req, res, next) {
      try {
        if (!req.sessionModel.get(REFERENCE_FIELD)) {
          req.sessionModel.set(REFERENCE_FIELD, await this.generateReference());
        }
      } catch (error) {
        return next(error);
      }

      return super.successHandler(req, res, next);
    }
  };

module.exports = generateApplicationReference;
