const { SAA_BASE_URL } = require('../../../utils/constants');
const { formatUploadedDocuments } = require('../../../utils');

module.exports = {
  nationality: {
    steps: [
      {
        step: '/correct-nationality',
        field: 'correct-nationality',
        changeLink: `${SAA_BASE_URL}/correct-nationality`
      },
      {
        step: '/reason-nationality-change',
        field: 'reason-nationality-change',
        changeLink: `${SAA_BASE_URL}/reason-nationality-change`
      },
      {
        step: '/upload-nationality-evidence',
        field: 'documents-nationality',
        changeLink: `${SAA_BASE_URL}/upload-nationality-evidence`,
        parse: formatUploadedDocuments
      }
    ]
  }
};
