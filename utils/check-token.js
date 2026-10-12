'use strict';

const redis = require('./redis');

/**
 * Checks token availability without consuming it or authenticating a session.
 *
 * @param {string} token - Verification token to look up.
 * @returns {Promise<{valid: string|null, email: string|null}>} Stored token and email values.
 * @throws {Error} When Redis cannot read the token values.
 */
const read = async token => {
  try {
    const [valid, email] = await Promise.all([
      redis.get(`token:${token}`),
      redis.get(`${token}:email`)
    ]);
    return { valid, email };
  } catch (err) {
    throw new Error(`Error reading token: ${err.message}`);
  }
};

/**
 * Atomically claims a verification token, then consumes its associated email.
 * Only the request that claims the token can retrieve the email. An email lookup
 * failure leaves the token consumed, requiring a new verification link.
 *
 * @param {string} token - Verification token to consume.
 * @returns {Promise<{valid: string|null, email: string|null}>} Consumed values, or null values if unavailable.
 * @throws {Error} When Redis cannot consume the token.
 */
const consume = async token => {
  try {
    // Claim the token first so concurrent requests cannot authenticate with it.
    const valid = await redis.getdel(`token:${token}`);
    if (!valid) {
      return { valid: null, email: null };
    }
    const email = await redis.getdel(`${token}:email`);
    if (!email) {
      return { valid: null, email: null };
    }
    return { valid, email };
  } catch (err) {
    throw new Error(`Error consuming token: ${err.message}`);
  }
};

module.exports = {
  read,
  consume
};
