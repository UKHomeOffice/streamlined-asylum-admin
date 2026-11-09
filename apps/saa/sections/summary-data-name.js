'use strict';

module.exports = {
  'change-your-name': {
    steps: [
      {
        step: '/reason-name-change',
        field: 'reason-name-change'
      },
      {
        step: '/new-name',
        field: 'given-name',
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
        parse: documents =>
          (documents || []).map(document => document.name).join('\n')
      }
    ]
  }
};
