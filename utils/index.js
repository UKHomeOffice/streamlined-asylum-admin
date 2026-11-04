const config = require('../config');
const { SECTION_FIELDS } = require('./constants');

const PRETTY_DATE_FORMATTER = new Intl.DateTimeFormat(
  config.dateLocales,
  config.dateFormat
);

const logger = require('hof/lib/logger')({ env: config.env });

/**
 * Logs an internal error message and throws an Error for the caller to handle.
 * Logging is skipped if the logger does not provide an error method.
 *
 * @param {string} message - The internal log message; avoid sensitive data.
 * @param {string} [publicMessage] - The thrown message, falling back to message if empty or omitted.
 * @param {object} [meta] - Optional log metadata, not included in the thrown message.
 * @returns {never} Always throws.
 * @throws {Error} An error containing publicMessage or message.
 */
function logAndThrow(message, publicMessage, meta) {
  if (logger && typeof logger.error === 'function') {
    meta ? logger.error(message, meta) : logger.error(message);
  }
  throw new Error(publicMessage || message);
}

/**
 * Redacts the middle of a filename while preserving its first two characters,
 * final two basename characters, and extension.
 *
 * @param {string|null|undefined} filename - The filename to sanitise.
 * @returns {string|undefined} The sanitised filename, or undefined if omitted.
 */
const sanitiseFilename = filename => {
  if (filename === undefined || filename === null) {
    return undefined;
  }

  const extensionSeparator = filename.lastIndexOf('.');

  if (extensionSeparator < 4 || extensionSeparator === filename.length - 1) {
    return filename;
  }

  return `${filename.slice(0, 2)}**REDACTED**${filename.slice(
    extensionSeparator - 2
  )}`;
};

/**
 * Trims and lower-cases an email address so it can be compared and stored consistently.
 *
 * @param {*} email - The email address to normalise.
 * @returns {string} The normalised email, or an empty string if it is missing or not a string.
 */
const normaliseEmail = email => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
};

/**
 * Gets the most useful message from a GOV.UK Notify error.
 *
 * Prefers the first message returned by the Notify API, falling back to the
 * error's own message.
 *
 * @param {Error|object|undefined} error - The error thrown by the Notify client.
 * @returns {string|undefined} The error message, if any.
 */
const getNotifyErrorMessage = error =>
  error?.response?.data?.errors?.[0]?.message ?? error?.message;

/**
 * Checks whether a Notify error was caused by sending to a recipient that a
 * team-only API key cannot reach (typical in non-production environments).
 *
 * @param {Error|object|undefined} error - The error thrown by the Notify client.
 * @returns {boolean} True if the error is the team-only key restriction.
 */
const isTeamOnlyNotifyError = error => {
  const message = getNotifyErrorMessage(error);
  return message === 'Can’t send to this recipient using a team-only API key';
};

/**
 * Checks whether the user answered "yes" to at least one main section question
 * (see SECTION_FIELDS).
 *
 * @param {object} sessionModel - The HOF session model.
 * @returns {boolean} True if at least one section was selected.
 */
const hasSelectedSection = sessionModel =>
  SECTION_FIELDS.some(field => sessionModel.get(field) === 'yes');

/**
 * Checks whether a value is a valid Date or a string that can be parsed as one.
 *
 * @param {*} date - The value to check.
 * @returns {boolean} True if the value represents a valid date.
 */
const isValidDate = date =>
  (date instanceof Date && !Number.isNaN(date.getTime())) ||
  (typeof date === 'string' && !Number.isNaN(Date.parse(date)));

/**
 * Formats a date for display using the app's date settings in config, for
 * example "01 March 2020".
 *
 * Date-only strings such as "2020-03-01" are read as midnight UTC.
 *
 * @param {Date|string} date - A Date or a date string, such as HOF's "YYYY-MM-DD".
 * @returns {string} The formatted date.
 * @throws {Error} If the value is not a valid date.
 */
const formatDate = date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date value');
  }

  try {
    const dateObj = new Date(date);
    return PRETTY_DATE_FORMATTER.format(dateObj);
  } catch (error) {
    throw new Error(
      `Error formatting date to formatDate format: ${error.message}`
    );
  }
};

/**
 * Removes whitespace and hyphen separators, then groups a UAN for display.
 *
 * @param {*} uan - A UAN string, optionally separated by whitespace or hyphens.
 * @returns {string} The display UAN, for example "1234-5678-9012-3456".
 * @throws {Error} If the input is not a string or is empty after removing separators.
 */
const formatUanForDisplay = uan => {
  const cleaned =
    typeof uan === 'string' ? uan.replaceAll(/[\s\u2013\u2014-]+/g, '') : '';
  if (!cleaned) {
    logAndThrow(
      'Cannot format UAN: expected a non-empty string',
      'Invalid UAN'
    );
  }
  return cleaned.match(/.{1,4}/g).join('-');
};

module.exports = {
  logAndThrow,
  sanitiseFilename,
  normaliseEmail,
  getNotifyErrorMessage,
  isTeamOnlyNotifyError,
  hasSelectedSection,
  formatDate,
  formatUanForDisplay
};
