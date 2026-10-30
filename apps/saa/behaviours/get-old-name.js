module.exports = superclass =>
  class extends superclass {
    locals(req, res) {
      const oldName = [
        req.sessionModel.get('claimants-given-name'),
        req.sessionModel.get('claimants-family-name')
      ].filter(Boolean).join(' ');

      return {
        ...super.locals(req, res),
        oldName
      };
    }
  };
