const { normaliseEmail } = require('../../../utils');
const {
  findOrCreateApplication,
  ApplicationExistsError
} = require('../../../utils/application-service');

// Security tokens, transient validation state and common-journey history must not be persisted.
const EXCLUDED_SESSION_KEYS = ['csrf-secret', 'errors', 'errorValues', 'steps'];

const getSessionSnapshot = sessionModel => {
  const session = sessionModel.toJSON();
  EXCLUDED_SESSION_KEYS.forEach(key => delete session[key]);
  return session;
};

const candidateValidation = SuperClass =>
  class extends SuperClass {
    async validate(req, res, next) {
      try {
        const userEmail = normaliseEmail(req.form.values['user-email']);
        const uan = req.sessionModel.get('claimant-unique-application-number');
        const dob = req.sessionModel.get('claimant-date-of-birth');

        await findOrCreateApplication({
          email: userEmail,
          uan,
          dateOfBirth: dob,
          session: getSessionSnapshot(req.sessionModel)
        });
      } catch (e) {
        if (e instanceof ApplicationExistsError) {
          return next({
            'user-email': new this.ValidationError('user-email', {
              type: 'existsUnderAnotherEmail'
            })
          });
        }
        return next(e);
      }
      return super.validate(req, res, next);
    }
  };
module.exports = candidateValidation;
