const getToken = require('../../../utils/check-token');
const { auth } = require('../../../config');

const checkEmailToken = superclass =>
  class extends superclass {
    async getValues(req, res, next) {
      const token = req.query.token;
      const sessionEmail = req.sessionModel.get('user-email');

      const skipEmailAuth =
        token === 'skip' && auth.allowSkip && auth.skipEmail;
      const validEmailToken = req.sessionModel.get('valid-token') === true;
      if (skipEmailAuth) {
        req.sessionModel.set('user-email', auth.skipEmail);
        return super.getValues(req, res, next);
      }

      if (validEmailToken && sessionEmail) {
        return super.getValues(req, res, next);
      }

      try {
        const user = await getToken.read(token);
        if (user.valid && user.email) {
          await getToken.delete(token);
          req.sessionModel.set('valid-token', true);
          req.sessionModel.set('user-email', user.email);
          return super.getValues(req, res, next);
        }
        return res.redirect(auth.invalidTokenPath);
      } catch (err) {
        req.log('error', `Check Token Error: ${err}`);
        return res.redirect(auth.invalidTokenPath);
      }
    }
  };
module.exports = checkEmailToken;
