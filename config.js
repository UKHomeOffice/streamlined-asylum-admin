'use strict';

const env = process.env.NODE_ENV || 'production';
const fileUploadConfig = require('./assets/js/file-upload-config');

module.exports = {
  env: env,
  redis: {
    port: process.env.REDIS_PORT || '6379',
    host: process.env.REDIS_HOST || '127.0.0.1'
  },
  auth: {
    tokenExpiry: 1800,
    continueAppPath: '/changes/continue-to-form',
    invalidTokenPath: '/changes/expired-link',
    allowSkip: String(process.env.ALLOW_SKIP) === 'true',
    skipEmail: process.env.SKIP_EMAIL
  },
  govukNotify: {
    notifyApiKey: process.env.NOTIFY_KEY,
    emailTemplates: {
      userVerifyEmailTemplateId: process.env.USER_VERIFY_EMAIL_TEMPLATE_ID
    }
  },
  upload: {
    ...fileUploadConfig,
    hostname: process.env.FILE_VAULT_URL
  },
  keycloak: {
    tokenUrl: process.env.KEYCLOAK_TOKEN_URL,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    secret: process.env.KEYCLOAK_CLIENT_SECRET
  },
  feedbackUrl: process.env.FEEDBACK_URL,
  disallowIndexing: process.env.DISALLOW_INDEXING === 'true'
};
