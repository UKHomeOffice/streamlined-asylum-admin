const { normaliseEmail } = require('../../../utils');
const {
  findOrCreateApplication,
  ApplicationExistsError
} = require('../../../utils/application-service');

const candidateValidation = SuperClass =>
  class extends SuperClass {
    async validate(req, res, next) {
      try {
        const userEmail = normaliseEmail(req.form.values['user-email']);
        const uan = req.sessionModel.get('claimant-unique-application-number');
        const dob = req.sessionModel.get('claimant-date-of-birth');

        // perhaps check if dob and uan are present before proceeding?

        await findOrCreateApplication({
          email: userEmail,
          uan,
          dateOfBirth: dob
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
