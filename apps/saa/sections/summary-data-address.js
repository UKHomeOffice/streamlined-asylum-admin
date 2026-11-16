const { SAA_BASE_URL } = require('../../../utils/constants');
const { formatDate } = require('../../../utils');

const formatAddress = prefix => (value, req) =>
  [
    value,
    ...['line-2', 'town-or-city', 'county', 'postcode'].map(
      part => req.sessionModel.get(`${prefix}-${part}`)
    )
  ]
    .map(part => part?.trim())
    .filter(Boolean)
    .join('\n');

module.exports = {
  address: {
    steps: [
      {
        step: '/change-uk-address',
        field: 'change-uk-address',
        changeLink: `${SAA_BASE_URL}/change-uk-address`
      },
      {
        step: '/home-address',
        field: 'home-address-line-1',
        changeLink: `${SAA_BASE_URL}/home-address`,
        dependsOn: 'change-uk-address',
        parse: formatAddress('home-address')
      },
      {
        step: '/home-address',
        field: 'home-address-moved-date',
        changeLink: `${SAA_BASE_URL}/home-address`,
        dependsOn: 'change-uk-address',
        parse: date => (date ? formatDate(date) : null)
      },
      {
        step: '/home-address',
        field: 'send-letters-to-home-address',
        changeLink: `${SAA_BASE_URL}/home-address`,
        dependsOn: 'change-uk-address'
      },
      {
        step: '/change-contact-address',
        field: 'change-contact-address',
        changeLink: `${SAA_BASE_URL}/change-contact-address`
      },
      {
        step: '/reason-contact-address-change',
        field: 'reason-contact-address-change',
        changeLink: `${SAA_BASE_URL}/reason-contact-address-change`,
        dependsOn: 'change-contact-address'
      },
      {
        step: '/contact-address',
        field: 'contact-address-full-name',
        changeLink: `${SAA_BASE_URL}/contact-address`,
        dependsOn: 'change-contact-address'
      },
      {
        step: '/contact-address',
        field: 'contact-address-line-1',
        changeLink: `${SAA_BASE_URL}/contact-address`,
        dependsOn: 'change-contact-address',
        parse: formatAddress('contact-address')
      }
    ]
  }
};
