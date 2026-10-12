'use strict';

const Notify = require('hof/components/notify/notify');
const {
  normaliseEmail,
  getNotifyErrorMessage,
  isTeamOnlyNotifyError
} = require('../../../utils/index');
const { govukNotify, env, auth } = require('../../../config');
const notifyApiKey = govukNotify.notifyApiKey;
const templateId = govukNotify.emailTemplates.userVerifyEmailTemplateId;
const notifyClient = new Notify({
  notifyApiKey: notifyApiKey
});
const tokenGenerator = require('../../../utils/save-token');
const logger = require('hof/lib/logger')({ env: env });

const getPersonalisation = (protocol, host, token) => {
  return {
    link: `${protocol}://${host}${auth.continueAppPath}?token=${token}`
  };
};

const sendEmail = async (req, email, host, token) => {
  const personalisation = getPersonalisation(req.protocol, host, token);
  await notifyClient.sendEmail(templateId, email, personalisation);
  logger.log('info', 'verification email sent to user');
};

const sendVerificationEmail = superclass =>
  class extends superclass {
    skipEmailVerification(email) {
      return (
        auth.allowSkip &&
        auth.skipEmail &&
        email === normaliseEmail(auth.skipEmail)
      );
    }

    async saveValues(req, res, next) {
      const email =
        normaliseEmail(req.form.values['user-email']) ||
        normaliseEmail(req.sessionModel.get('user-email'));

      if (!email) {
        const errorMsg = 'Email address is required';
        logger.error(errorMsg);
        return next(errorMsg);
      }

      if (this.skipEmailVerification(email)) {
        return res.redirect(`${auth.continueAppPath}?token=skip`);
      }

      return super.saveValues(req, res, async err => {
        if (err) {
          return next(err);
        }
        try {
          const host = req.get('host');
          const token = await tokenGenerator.save(email);
          await sendEmail(req, email, host, token);
          return next();
        } catch (error) {
          const notifyMessage =
            getNotifyErrorMessage(error) ?? 'Unknown verification email error';
          logger.error(`Verification email flow failed: ${notifyMessage}`);
          if (isTeamOnlyNotifyError(error)) {
            return res.redirect('/team-email-invalid');
          }
          return next(new Error(notifyMessage));
        }
      });
    }
  };
module.exports = sendVerificationEmail;
