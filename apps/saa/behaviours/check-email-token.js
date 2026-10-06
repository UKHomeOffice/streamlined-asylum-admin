const getToken = require('../../../utils/check-token');
const { auth } = require('../../../config');

const checkEmailToken = superclass =>
  class extends superclass {
    async getValues(req, res, next) {
      const token = req.query.token;
      const KEY_USER_EMAIL = 'user-email';
      const KEY_VALID_TOKEN = 'valid-token';
      const sessionEmail = req.sessionModel.get(KEY_USER_EMAIL);

      const skipEmailAuth = token === 'skip' && auth.allowSkip && auth.skipEmail;
      const validEmailToken = req.sessionModel.get(KEY_VALID_TOKEN) === true;
      if (skipEmailAuth) {
        req.sessionModel.set(KEY_USER_EMAIL, auth.skipEmail);
        return super.getValues(req, res, next);
      }

      if (validEmailToken && sessionEmail) {
        return super.getValues(req, res, next);
      }

      try {
        const user = await getToken.read(token);
        if (user.valid && user.email) {
          await getToken.delete(token);
          req.sessionModel.set(KEY_VALID_TOKEN, true);
          req.sessionModel.set(KEY_USER_EMAIL, user.email);
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
