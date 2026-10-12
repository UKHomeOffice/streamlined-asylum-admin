'use strict';

const { randomUUID } = require('node:crypto');
const redis = require('../utils/redis');
const { auth, env } = require('../config');
const tokenExpiry = auth.tokenExpiry;
const logger = require('hof/lib/logger')({ env: env });

module.exports = {
  /**
   * Creates a verification token and stores the token/email pair in Redis.
   *
   * @param {string} email - Email address to associate with the generated token.
   * @returns {Promise<string>} Generated verification token.
   * @throws {Error} When Redis fails to persist either token key.
   */
  async save(email) {
    const token = randomUUID();
    const ttl = tokenExpiry;

    const tokenKey = `token:${token}`;
    const emailKey = `${token}:email`;

    /* Using MULTI/EXEC ensures atomicity, so both keys are set together
     * or not at all, preventing partial writes that could lead to
     * inconsistent state.
     * */
    const response = await redis
      .multi()
      .set(tokenKey, token, 'EX', ttl)
      .set(emailKey, email, 'EX', ttl)
      .exec();

    const redisErrors = response.find(([err]) => err);
    if (redisErrors) {
      const firstError = redisErrors[0];
      logger.error(`Error saving token to redis: ${firstError?.message}`);
      throw new Error('Could not save verification token');
    }

    return token;
  }
};
