const { SAA_BASE_URL } = require('../../../utils/constants');

module.exports = {
  evidence: {
    steps: [
      {
        // Files are saved under the document category, not the 'file-upload' field.
        step: '/upload-supporting-evidence',
        field: 'documents-help-your-claim',
        changeLink: `${SAA_BASE_URL}/upload-supporting-evidence`,
        parse: documents =>
          (documents || []).map(document => document.name).join('\n')
      },
      {
        step: '/violent-upsetting-images',
        field: 'evidence-violent-or-upsetting',
        changeLink: `${SAA_BASE_URL}/violent-upsetting-images`
      }
    ]
  }
};
