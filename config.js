'use strict';

const env = process.env.NODE_ENV || 'production';

module.exports = {
  env: env,
  redis: {
    port: process.env.REDIS_PORT || '6379',
    host: process.env.REDIS_HOST || '127.0.0.1'
  },
  feedbackUrl: process.env.FEEDBACK_URL,
  disallowIndexing: process.env.DISALLOW_INDEXING === 'true'
};
