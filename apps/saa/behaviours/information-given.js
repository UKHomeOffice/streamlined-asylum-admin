const ENTRY_ROUTES = new Set([
  '/continue-to-form',
  '/which-form',
  '/information-given'
]);

const informationGiven = superclass =>
  class extends superclass {
    getNextStep(req, res) {
      const savedSteps = req.sessionModel.get('steps');
      const steps = req.form.options.steps;
      const isResumableRoute = route =>
        typeof route === 'string' &&
        !ENTRY_ROUTES.has(route) &&
        Object.hasOwn(steps, route) &&
        (route === '/confirm' || steps[route].next);
      const savedRoute = req.sessionModel.get('last-saved-route');
      if (isResumableRoute(savedRoute)) {
        return `${req.baseUrl}${savedRoute}`;
      }
      if (!Array.isArray(savedSteps)) {
        return super.getNextStep(req, res);
      }

      const lastSavedRoute = savedSteps.findLast(isResumableRoute);
      return lastSavedRoute
        ? `${req.baseUrl}${lastSavedRoute}`
        : super.getNextStep(req, res);
    }
  };

module.exports = informationGiven;
