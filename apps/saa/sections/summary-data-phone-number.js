const { SAA_BASE_URL } = require('../../../utils/constants');

module.exports = {
  'phone-number': {
    steps: [
      {
        step: '/your-phone-number',
        field: 'your-phone-number',
        changeLink: `${SAA_BASE_URL}/your-phone-number`
      },
      {
        step: '/your-phone-number',
        field: 'whose-phone-number',
        changeLink: `${SAA_BASE_URL}/your-phone-number`
      },
      {
        step: '/new-phone-number',
        field: 'old-phone-number',
        changeLink: `${SAA_BASE_URL}/new-phone-number`
      },
      {
        step: '/new-phone-number',
        field: 'new-phone-number',
        changeLink: `${SAA_BASE_URL}/new-phone-number`
      },
      {
        step: '/new-phone-number',
        field: 'confirm-new-phone-number',
        changeLink: `${SAA_BASE_URL}/new-phone-number`
      }
    ]
  }
};
