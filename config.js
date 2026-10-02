'use strict';

const env = process.env.NODE_ENV || 'production';

module.exports = {
  env: env,
  redis: {
    port: process.env.REDIS_PORT || '6379',
    host: process.env.REDIS_HOST || '127.0.0.1'
  },
  auth: {
    tokenExpiry: 1800,
    continueAppPath: '/check-your-email',
    invalidTokenPath: '/updates/expired-link',
    allowSkip: String(process.env.ALLOW_SKIP) === 'true',
    skipEmail: process.env.SKIP_EMAIL
  },
  govukNotify: {
    notifyApiKey: process.env.NOTIFY_KEY,
    emailTemplates: {
      userVerifyEmailTemplateId: process.env.USER_VERIFY_EMAIL_TEMPLATE_ID
    }
  },
  feedbackUrl: process.env.FEEDBACK_URL,
  disallowIndexing: process.env.DISALLOW_INDEXING === 'true'
};
