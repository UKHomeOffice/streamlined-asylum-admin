'use strict';

/**
 * Generates a COC- reference followed by ten uppercase alphanumeric characters.
 * @returns {Promise<string>} A cryptographically random application reference.
 */
const generateApplicationReference = async () => {
  const { default: cryptoRandomString } = await import('crypto-random-string');
  const suffix = cryptoRandomString({
    length: 10,
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  });
  return `COC-${suffix}`;
};

module.exports = generateApplicationReference;
