'use strict';

const Notify = require('hof/components/notify/notify');
const { normaliseEmail, getNotifyErrorMessage } = require('../../../utils');
const {
  SUBMITTED_INFORMATION_TYPES,
  PLACEHOLDER_SUBMISSION_REF
} = require('../../../utils/constants');
const { govukNotify, env } = require('../../../config');
const logger = require('hof/lib/logger')({ env });

const notifyClient = new Notify({ notifyApiKey: govukNotify.notifyApiKey });

/**
 * Converts document file names and URLs to markdown links for email.
 * @param {string} text - The field value text, potentially containing file names
 * @param {Array<{name: string, url: string}>} documents - Available documents with URLs
 * @returns {string} Text with file names replaced by markdown links
 */
const replaceFileNamesWithLinks = (text, documents) => {
  if (!documents?.length || !text) {
    return text;
  }

  let result = text;
  documents.forEach(({ name, url }) => {
    result = result.replace(name, `[${name}](${url})`);
  });

  return result;
};

/**
 * Formats a field as a line or lines for email.
 * @param {Object} field - Field object with label and value
 * @param {Array} documents - Optional documents for linking
 * @returns {string[]} Lines to add to output
 */
const formatField = (field, documents) => {
  const { label, value } = field;
  const text = [].concat(value).join('\n');
  const formattedText = documents
    ? replaceFileNamesWithLinks(text, documents)
    : text;

  return formattedText.includes('\n')
    ? [`${label}:`, formattedText]
    : [`${label}: ${formattedText}`];
};

/**
 * Checks if a field should be skipped in output.
 * @param {Object} field - Field object
 * @returns {boolean} True if field should be omitted
 */
const shouldOmitField = field => field.omitFromSummary || field.isSeparator;

/**
 * Formats HOF summary rows (as shown on /confirm) as GOV.UK Notify markdown.
 *
 * @param {Array<{section: string, fields: object[]}>} rows - Rows from getRowsForSummarySections.
 * @param {Object} options - Options object
 * @param {Array<{name: string, url: string}>} options.documents - Optional documents with URLs for linking
 * @returns {string} Notify markdown.
 */
const formatSummaryForEmail = (rows, options = {}) => {
  const { documents } = options;

  return rows
    .map(({ section, fields }) => {
      const lines = [`## ${section}`];

      // Find aggregator titles and their indices
      const aggregatorTitles = fields
        .map((f, i) => f.isAggregatorTitle ? { index: i, field: f } : null)
        .filter(Boolean);

      if (aggregatorTitles.length > 0) {
        // Process main fields before first aggregator
        const firstAggregatorIndex = aggregatorTitles[0].index;
        for (let i = 0; i < firstAggregatorIndex; i++) {
          const field = fields[i];
          if (shouldOmitField(field)) continue;
          lines.push('', ...formatField(field, documents));
        }

        // Process aggregated items
        aggregatorTitles.forEach((titleObj, titleIndex) => {
          const startIndex = titleObj.index;
          const endIndex = titleIndex < aggregatorTitles.length - 1
            ? aggregatorTitles[titleIndex + 1].index
            : fields.length;

          lines.push('', '---', '', `## ${titleObj.field.value}`);

          for (let i = startIndex + 1; i < endIndex; i++) {
            const field = fields[i];
            if (shouldOmitField(field)) continue;
            lines.push('', ...formatField(field, documents));
          }
        });

        return lines.join('\n');
      }

      // Non-aggregated section formatting
      fields.forEach(field => {
        if (shouldOmitField(field)) return;
        if (field.isAggregatorTitle) {
          lines.push('', field.value);
          return;
        }
        lines.push('', ...formatField(field, documents));
      });

      return lines.join('\n');
    })
    .join('\n\n---\n\n');
};

const getSubmittedInformationTypes = sessionModel =>
  SUBMITTED_INFORMATION_TYPES
    .filter(({ field }) => sessionModel.get(field) === 'yes')
    .map(({ label }) => label);

const getClaimantFullName = sessionModel =>
  [
    sessionModel.get('claimants-given-name'),
    sessionModel.get('claimants-family-name')
  ]
    .filter(Boolean)
    .join(' ');

/**
 * Collects all uploaded documents from the session across all document categories.
 * Handles both root-level documents and nested documents within aggregated items.
 * @param {object} sessionModel - The session model
 * @returns {Array<{name: string, url: string}>} All documents with URLs
 */
const getAllDocuments = sessionModel => {
  const documentCategories = [
    'documents-new-name',
    'documents-someone-else-new-name',
    'documents-new-dob',
    'documents-someone-else-new-dob',
    'documents-nationality',
    'documents-someone-else-nationality',
    'documents-update-contact',
    'documents-child-partner',
    'documents-death-certificate',
    'documents-help-your-claim'
  ];

  const aggregators = [
    'addremovechildpartner',
    'reportadeath',
    'someoneelsenewdob',
    'someoneelsenewnationality',
    'someoneelsenewname'
  ];

  const allDocuments = [];

  // Collect root-level documents
  documentCategories.forEach(category => {
    const data = sessionModel.get(category);
    if (Array.isArray(data)) {
      allDocuments.push(...data);
    }
  });

  // Collect documents from aggregated items
  aggregators.forEach(aggregatorKey => {
    const aggregatorData = sessionModel.get(aggregatorKey);
    if (aggregatorData?.aggregatedValues?.length) {
      aggregatorData.aggregatedValues.forEach(item => {
        if (item?.fields?.length) {
          item.fields.forEach(field => {
            if (Array.isArray(field.value)) {
              field.value.forEach(doc => {
                if (doc?.name && doc?.url) {
                  allDocuments.push(doc);
                }
              });
            }
          });
        }
      });
    }
  });

  return allDocuments;
};

// Requires Summary and SummaryLabels earlier in the step's behaviours to build the /confirm rows.
const sendSubmissionEmails = superclass =>
  class extends superclass {
    /**
     * Builds email personalisation data for GOV.UK Notify template.
     * @param {Object} req - Express request object (must contain sessionModel)
     * @param {boolean} [forCaseworker=false] - If true, includes document links; if false, plain file names only
     * @returns {Object} Personalisation object with submission_ref, claimant_full_name, and submission_summary
     * @returns {string} returns.submission_ref - Placeholder submission reference number
     * @returns {string} returns.claimant_full_name - Full name of the claimant from session
     * @returns {string} returns.submission_summary - Formatted markdown email body with form data
     */
    getEmailPersonalisation(req, forCaseworker = false) {
      const rows = this.getRowsForSummarySections(req);
      const documents = forCaseworker ? getAllDocuments(req.sessionModel) : undefined;

      return {
        submission_ref: PLACEHOLDER_SUBMISSION_REF,
        claimant_full_name: getClaimantFullName(req.sessionModel),
        submission_summary: formatSummaryForEmail(rows, { documents })
      };
    }

    async sendSubmissionEmails(req) {
      const templateId = govukNotify.emailTemplates.submissionConfirmationTemplateId;
      const userEmail = normaliseEmail(req.sessionModel.get('user-email'));
      const caseworkerEmail = normaliseEmail(govukNotify.caseworkerEmail);

      if (!templateId || !userEmail || !caseworkerEmail) {
        throw new Error('Submission email template, user email or caseworker email is missing');
      }

      const informationTypes = getSubmittedInformationTypes(req.sessionModel);
      const caseworkerPersonalisation = this.getEmailPersonalisation(req, true);
      const userPersonalisation = this.getEmailPersonalisation(req, false);

      await notifyClient.sendEmail(templateId, caseworkerEmail, {
        ...caseworkerPersonalisation,
        show_information_types: 'yes',
        information_types: informationTypes
      });
      logger.log('info', 'submission confirmation email sent to caseworker');

      await notifyClient.sendEmail(templateId, userEmail, {
        ...userPersonalisation,
        show_information_types: 'no',
        information_types: ''
      });
      logger.log('info', 'submission confirmation email sent to user');
    }

    saveValues(req, res, next) {
      return super.saveValues(req, res, async err => {
        if (err) {
          return next(err);
        }
        try {
          await this.sendSubmissionEmails(req);
          return next();
        } catch (error) {
          const errorMessage =
            getNotifyErrorMessage(error) ?? 'Unknown submission email error';
          logger.error(`Submission email flow failed: ${errorMessage}`);
          return next(new Error(errorMessage));
        }
      });
    }
  };

module.exports = sendSubmissionEmails;
module.exports.formatSummaryForEmail = formatSummaryForEmail;
module.exports.getSubmittedInformationTypes = getSubmittedInformationTypes;
