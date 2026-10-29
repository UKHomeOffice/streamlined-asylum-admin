const { normaliseUan } = require('../../../utils');
const formatUan = superclass =>
  class extends superclass {
    successHandler(req, res, next) {
      const uan = req.form.values['claimant-unique-application-number'];
      if (!uan) {
        return super.successHandler(req, res, next);
      }
      const formattedUan = normaliseUan(uan);
      req.sessionModel.set('claimant-unique-application-number', formattedUan);
      return super.successHandler(req, res, next);
    }
  };
module.exports = formatUan;
