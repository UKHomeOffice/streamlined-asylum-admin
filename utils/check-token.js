'use strict';

const redis = require('./redis');

/**
 * Reads the verification token and associated email address from Redis.
 *
 * @param {string} token - Verification token to look up.
 * @returns {Promise<{valid: string|null, email: string|null}>} Stored token value and associated email.
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
 * Removes the verification token and associated email address from Redis.
 *
 * @param {string} token - Verification token to remove.
 * @returns {Promise<void>}
 * @throws {Error} When Redis cannot delete the token values.
 */
const remove = async token => {
  try {
    await redis.del(`token:${token}`);
    await redis.del(`${token}:email`);
  } catch (err) {
    throw new Error(`Error deleting token: ${err.message}`);
  }
};

module.exports = {
  read,
  delete: remove
};
