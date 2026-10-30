const { SAA_BASE_URL } = require('../../../utils/constants');

module.exports = {
  'email-address': {
    steps: [
      {
        step: '/new-email-address',
        field: 'old-email-address',
        changeLink: `${SAA_BASE_URL}/new-email-address`
      },
      {
        step: '/new-email-address',
        field: 'new-email-address',
        changeLink: `${SAA_BASE_URL}/new-email-address`
      }
    ]
  }
};
