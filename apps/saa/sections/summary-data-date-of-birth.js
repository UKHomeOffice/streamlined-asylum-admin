const { SAA_BASE_URL } = require('../../../utils/constants');
const { formatDate } = require('../../../utils');

module.exports = {
  'date-of-birth': {
    steps: [
      {
        step: '/correct-date-of-birth',
        field: 'correct-date-of-birth',
        changeLink: `${SAA_BASE_URL}/correct-date-of-birth`,
        parse: date => date ? formatDate(date) : null
      },
      {
        step: '/new-date-of-birth-evidence',
        field: 'documents-new-dob',
        changeLink: `${SAA_BASE_URL}/new-date-of-birth-evidence`,
        parse: documents =>
          (documents || []).map(document => document.name).join('\n')
      }
    ]
  }
};
