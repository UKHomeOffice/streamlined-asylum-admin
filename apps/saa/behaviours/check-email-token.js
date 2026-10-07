const getToken = require('../../../utils/check-token');
const { auth } = require('../../../config');

const KEY_USER_EMAIL = 'user-email';
const KEY_VALID_TOKEN = 'valid-token';
const KEY_PENDING_TOKEN = 'pending-email-token';

const checkEmailToken = superclass =>
  class extends superclass {
    hasVerifiedSession(req) {
      return (
        req.sessionModel.get(KEY_VALID_TOKEN) === true &&
        req.sessionModel.get(KEY_USER_EMAIL)
      );
    }

    canSkip(token) {
      return token === 'skip' && auth.allowSkip && auth.skipEmail;
    }

    async getValues(req, res, next) {
      // HOF also calls getValues during POST; authentication happens in saveValues.
      if (req.method === 'POST' || this.hasVerifiedSession(req)) {
        return super.getValues(req, res, next);
      }

      const token = req.query.token;
      req.sessionModel.unset(KEY_PENDING_TOKEN);
      if (typeof token !== 'string' || !token) {
        return res.redirect(auth.invalidTokenPath);
      }
      if (this.canSkip(token)) {
        req.sessionModel.set(KEY_PENDING_TOKEN, token);
        return super.getValues(req, res, next);
      }

      try {
        const user = await getToken.read(token);
        if (user.valid && user.email) {
          req.sessionModel.set(KEY_PENDING_TOKEN, token);
          return super.getValues(req, res, next);
        }
        return res.redirect(auth.invalidTokenPath);
      } catch (err) {
        req.log('error', `Check Token Error: ${err}`);
        return res.redirect(auth.invalidTokenPath);
      }
    }

    async saveValues(req, res, next) {
      if (this.hasVerifiedSession(req)) {
        return super.saveValues(req, res, next);
      }

      const token = req.sessionModel.get(KEY_PENDING_TOKEN);
      req.sessionModel.unset(KEY_PENDING_TOKEN);
      if (typeof token !== 'string' || !token) {
        return res.redirect(auth.invalidTokenPath);
      }

      try {
        const user = this.canSkip(token)
          ? { valid: true, email: auth.skipEmail }
          : await getToken.consume(token);
        if (!user.valid || !user.email) {
          return res.redirect(auth.invalidTokenPath);
        }
        req.sessionModel.set(KEY_VALID_TOKEN, true);
        req.sessionModel.set(KEY_USER_EMAIL, user.email);
      } catch (err) {
        req.log('error', `Check Token Error: ${err}`);
        return res.redirect(auth.invalidTokenPath);
      }

      return super.saveValues(req, res, next);
    }
  };
module.exports = checkEmailToken;
