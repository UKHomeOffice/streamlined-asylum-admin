'use strict';

const env = process.env.NODE_ENV || 'production';
const fileUploadConfig = require('./assets/js/file-upload-config');

module.exports = {
  env: env,
  dateLocales: 'en-GB',
  dateFormat: {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  },
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
  sessionDefaults: {
    preservedKeys: ['csrf-secret', 'user-email', 'valid-token'],
    preservedSteps: ['/continue-to-form', '/which-form'],
    excludedSnapshotKeys: [
      'csrf-secret',
      'user-email',
      'valid-token',
      'errors',
      'errorValues'
    ],
    saveExemptions: [
      '/continue-to-form',
      '/form-saved',
      '/session-ended',
      '/no-options-chosen',
      '/add-remove-child-partner',
      '/provide-photo-identity',
      '/reason-for-removing-child-partner',
      '/relationship-to-child-partner',
      '/child-partner-name',
      '/child-partner-date-of-birth',
      '/child-partner-nationality',
      '/evidence-child-partner',
      '/no-changes-made',
      '/which-form',
      '/do-you-need-to-change-your-name',
      '/reason-name-change',
      '/new-name',
      '/new-name-evidence',
      '/do-you-need-to-change-someone-elses-name',
      '/relationship-name-change',
      '/reason-someone-else-name-change',
      '/someone-else-new-name',
      '/someone-else-new-name-evidence',
      '/check-your-answers-date-of-birth',
      '/change-someone-else-date-of-birth',
      '/relationship-date-of-birth',
      '/someone-else-correct-date-of-birth',
      '/someone-else-new-date-of-birth-evidence',
      '/change-someone-else-nationality',
      '/relationship-nationality-change',
      '/someone-else-correct-nationality',
      '/reason-someone-else-nationality-change',
      '/upload-someone-else-nationality-evidence',
      '/change-uk-address',
      '/home-address',
      '/change-contact-address',
      '/reason-contact-address-change',
      '/contact-address',
      '/new-email-address',
      '/your-phone-number',
      '/new-phone-number',
      '/main-claimant-died',
      '/about-who-has-died',
      '/name-person-who-died',
      '/date-of-birth-person-who-died',
      '/nationality-person-who-died',
      '/upload-death-certificate',
      '/declaration',
      '/submitted',
      '/expired-link'
    ]
  },
  govukNotify: {
    notifyApiKey: process.env.NOTIFY_KEY,
    emailTemplates: {
      userVerifyEmailTemplateId: process.env.USER_VERIFY_EMAIL_TEMPLATE_ID
    }
  },
  saveService: {
    protocol: process.env.DATASERVICE_USE_HTTPS === 'false' ? 'http' : 'https',
    port: process.env.DATASERVICE_SERVICE_PORT_HTTPS || '10443',
    host: process.env.DATASERVICE_SERVICE_HOST || '127.0.0.1'
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
  aggregateLimits: {
    defaultLimit: 100,
    addOrRemoveChildPartner: 15,
    reportADeath: 15,
    someoneElseNewDob: 15
  },
  feedbackUrl: process.env.FEEDBACK_URL,
  disallowIndexing: process.env.DISALLOW_INDEXING === 'true'
};
