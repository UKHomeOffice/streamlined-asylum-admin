'use strict';

const { SAA_BASE_URL } = require('../../../utils/constants');
const { formatUploadedDocuments } = require('../../../utils');

module.exports = {
  'change-your-name': {
    steps: [
      {
        step: '/reason-name-change',
        field: 'reason-name-change',
        changeLink: `${SAA_BASE_URL}/reason-name-change`
      },
      {
        step: '/new-name',
        field: 'given-name',
        changeLink: `${SAA_BASE_URL}/new-name`,
        parse: (value, req) =>
          [
            req.sessionModel.get('given-name'),
            req.sessionModel.get('family-name')
          ]
            .filter(Boolean)
            .join(' ')
      },
      {
        step: '/new-name-evidence',
        field: 'documents-new-name',
        changeLink: `${SAA_BASE_URL}/new-name-evidence`,
        parse: formatUploadedDocuments
      }
    ]
  }
};
