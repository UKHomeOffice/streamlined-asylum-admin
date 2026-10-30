'use strict';

const { randomUUID } = require('node:crypto');
const { model: Model } = require('hof');
const { API_METHODS } = require('./constants');
const { normaliseEmail } = require('./index');
const config = require('../config');
const { protocol, host, port } = config.saveService;

const logger = require('hof/lib/logger')({ env: config.env });

const applicationsUrl = `${protocol}://${host}:${port}/applications`;

/**
 * @typedef {Object} ApplicationRecord
 * @property {number} id - Application identifier.
 * @property {string} email - Normalised applicant email address.
 * @property {string} uan - Normalised unique application number.
 * @property {string} date_of_birth - Claimant date of birth.
 * @property {Object} session - Saved form session.
 * @property {string} [submitted_at] - ISO timestamp of submission.
 * @property {string} [submission_reference] - Reference issued on submission.
 */

const encodeEmail = normalisedEmail =>
  Buffer.from(normalisedEmail).toString('hex');

// Submitted records are retained for 90 days but must not block a new application.
const isDraft = record => !record.submitted_at;

const matches = (uan, dateOfBirth) => record => {
  return record.uan === uan && record.date_of_birth === dateOfBirth;
};

const assertApplicationDetails = (email, uan, dateOfBirth) => {
  if (!email || !uan || !dateOfBirth) {
    throw new Error('Missing required application details');
  }
};

const assertApplicationId = id => {
  if (id === undefined || id === null || id === '') {
    throw new Error('Application id is required');
  }
};

/**
 * Thrown when the UAN and date of birth already belong to an application
 * registered under a different email address.
 */
class ApplicationExistsError extends Error {
  constructor() {
    super(
      'An application already exists for this UAN and date of birth under a different email'
    );
    this.name = 'ApplicationExistsError';
  }
}

/** Extracts loggable details from an HTTP client error. */
const describeError = error => ({
  message: error.message,
  status: error.status || error.response?.status
});

/**
 * Sends a request to the RDS API and returns the response body.
 *
 * @param {{url: string, method: string, data?: Object}} options - Request options.
 * @returns {Promise<*>} Response body.
 * @throws {Error} Status-only error; method, status and message are logged.
 */
async function request(options) {
  try {
    const response = await new Model()._request(options);
    return response.data;
  } catch (error) {
    const details = describeError(error);
    logger.error('RDS API error', { method: options.method, ...details });
    throw new Error(
      `RDS API ${options.method} failed with status ${details.status}`
    );
  }
}

/**
 * Finds draft applications registered to an email address.
 *
 * @param {string} email - Email address; normalised before lookup.
 * @returns {Promise<ApplicationRecord[]>} Matching draft applications.
 * @throws {Error} When the email is empty after normalisation.
 * @throws {Error} When the RDS API request fails.
 */
async function findApplicationsByEmail(email) {
  const normalisedEmail = normaliseEmail(email);
  if (!normalisedEmail) {
    throw new Error('Email address is required');
  }
  const records = await request({
    url: `${applicationsUrl}/email/${encodeEmail(normalisedEmail)}`,
    method: API_METHODS.GET
  });

  logger.info(JSON.stringify(records, null, 2));
  return records.filter(isDraft);
}

/**
 * Finds draft applications with a UAN, regardless of email.
 *
 * @param {string} uan - Digits-only UAN, as stored in the session.
 * @returns {Promise<ApplicationRecord[]>} Matching draft applications.
 * @throws {Error} When the UAN is missing.
 * @throws {Error} When the RDS API request fails.
 */
async function findApplicationsByUan(uan) {
  if (!uan) {
    throw new Error('UAN is required');
  }
  const records = await request({
    url: `${applicationsUrl}/uan/${encodeURIComponent(uan)}`,
    method: API_METHODS.GET
  });
  return records.filter(isDraft);
}

/**
 * Creates an application with a normalised email.
 *
 * @param {Object} details - Application details.
 * @param {string} details.email - Applicant email address.
 * @param {string} details.uan - Digits-only UAN, as stored in the session.
 * @param {string} details.dateOfBirth - Claimant date of birth.
 * @param {Object} [details.session={}] - Initial form session.
 * @returns {Promise<ApplicationRecord>} Created application.
 * @throws {Error} When the email, UAN or date of birth is missing.
 * @throws {Error} When the RDS API request fails.
 */
async function createApplication({ email, uan, dateOfBirth, session = {} }) {
  const normalisedEmail = normaliseEmail(email);
  assertApplicationDetails(normalisedEmail, uan, dateOfBirth);

  const [record] = await request({
    url: applicationsUrl,
    method: API_METHODS.POST,
    data: {
      email: normalisedEmail,
      uan,
      date_of_birth: dateOfBirth,
      session
    }
  });
  return record;
}

/**
 * Saves form progress to an application.
 *
 * @param {number} id - Application identifier.
 * @param {Object} session - Form session to store.
 * @returns {Promise<ApplicationRecord>} Updated application.
 * @throws {Error} When the application id is missing.
 * @throws {Error} When the RDS API request fails.
 */
async function saveApplication(id, session) {
  assertApplicationId(id);
  const [record] = await request({
    url: `${applicationsUrl}/${encodeURIComponent(id)}`,
    method: API_METHODS.PATCH,
    data: { session }
  });
  return record;
}

/**
 * Marks an application as submitted with the current time and a reference.
 *
 * @param {number} id - Application identifier.
 * @param {Object} session - Final form session.
 * @param {string} [submissionReference] - Submission reference; a UUID is generated if not supplied.
 * @returns {Promise<ApplicationRecord>} Submitted application.
 * @throws {Error} When the application id is missing.
 * @throws {Error} When the RDS API request fails.
 */
async function submitApplication(
  id,
  session,
  submissionReference = randomUUID()
) {
  assertApplicationId(id);
  const [record] = await request({
    url: `${applicationsUrl}/${encodeURIComponent(id)}`,
    method: API_METHODS.PATCH,
    data: {
      session,
      submitted_at: new Date().toISOString(),
      submission_reference: submissionReference
    }
  });
  return record;
}

/**
 * Returns the email's draft application matching the UAN and date of birth, or creates one.
 * Submitted applications are ignored.
 *
 * @param {Object} details - Claimant details.
 * @param {string} details.email - Applicant email address.
 * @param {string} details.uan - Digits-only UAN, as stored in the session.
 * @param {string} details.dateOfBirth - Claimant date of birth.
 * @param {Object} [details.session={}] - Form session stored if a new application is created.
 * @returns {Promise<ApplicationRecord>} Existing draft or newly created application.
 * @throws {ApplicationExistsError} When the UAN and date of birth match another email's draft.
 * @throws {Error} When the email, UAN or date of birth is missing.
 * @throws {Error} When an RDS API request fails.
 */
async function findOrCreateApplication({
  email,
  uan,
  dateOfBirth,
  session = {}
}) {
  assertApplicationDetails(normaliseEmail(email), uan, dateOfBirth);
  const isMatch = matches(uan, dateOfBirth);

  const existing = (await findApplicationsByEmail(email)).find(isMatch);
  if (existing) {
    logger.info('Application lookup matched an existing record');
    return existing;
  }

  const existsUnderAnotherEmail = (await findApplicationsByUan(uan)).some(
    isMatch
  );

  if (existsUnderAnotherEmail) {
    logger.info(
      'Application exists for this UAN and DOB under a different email'
    );
    throw new ApplicationExistsError();
  }

  logger.info('Application lookup found no match; creating a record');
  return createApplication({ email, uan, dateOfBirth, session });
}

module.exports = {
  findApplicationsByEmail,
  findApplicationsByUan,
  createApplication,
  saveApplication,
  submitApplication,
  findOrCreateApplication,
  ApplicationExistsError
};
