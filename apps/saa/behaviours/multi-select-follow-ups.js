'use strict';

const asArray = value => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
};

const unique = values => values.filter((value, index) => values.indexOf(value) === index);

const sortByOrder = items => items.slice().sort((left, right) => {
  const leftOrder = typeof left.order === 'number' ? left.order : Number.MAX_SAFE_INTEGER;
  const rightOrder = typeof right.order === 'number' ? right.order : Number.MAX_SAFE_INTEGER;

  return leftOrder - rightOrder;
});

const getRoutesForOption = option => option.routes || option.steps || [];

const normaliseConfig = config => Object.assign({
  stateKey: `${config.field}-follow-ups`,
  options: []
}, config);

const getSelectedOptions = (config, selections) => {
  const selectedValues = asArray(selections);

  return sortByOrder(config.options.filter(option => selectedValues.includes(option.value)));
};

const getActiveRoutes = (config, selections) => unique(getSelectedOptions(config, selections)
  .reduce((routes, option) => routes.concat(getRoutesForOption(option)), []));

const getFieldsToUnset = (config, inactiveRoutes, removedSelections) => unique(config.options.reduce(
  (fields, option) => {
    const optionRoutes = getRoutesForOption(option);
    const optionRemoved = removedSelections.includes(option.value);
    const optionInactive = optionRoutes.some(route => inactiveRoutes.includes(route));

    if (optionRemoved || optionInactive) {
      return fields.concat(option.fieldsToUnset || []);
    }

    return fields;
  }, []));

const createState = (config, previousState, selections) => {
  const previousSelections = asArray(previousState.selections);
  const previousRoutes = asArray(previousState.activeRoutes);
  const activeRoutes = getActiveRoutes(config, selections);
  const removedSelections = previousSelections.filter(value => !asArray(selections).includes(value));
  const addedRoutes = activeRoutes.filter(route => !previousRoutes.includes(route));
  const inactiveRoutes = previousRoutes.filter(route => !activeRoutes.includes(route));

  return {
    selections: asArray(selections),
    activeRoutes,
    completedRoutes: asArray(previousState.completedRoutes).filter(route => activeRoutes.includes(route)),
    addedRoutes,
    inactiveRoutes,
    fieldsToUnset: getFieldsToUnset(config, inactiveRoutes, removedSelections)
  };
};

const nextIncompleteRoute = state => state?.activeRoutes?.find(route => !state.completedRoutes.includes(route));

const withBaseUrl = (req, route) => req.baseUrl === '/' ? route : req.baseUrl + route;

const withEditSuffix = (req, config, route, nextRoute) => {
  const isEdit = req.params && req.params.action === 'edit';
  return isEdit && nextRoute !== config.exitPoint ? `${route}/edit` : route;
};

module.exports = SuperClass => class MultiSelectFollowUps extends SuperClass {
  getMultiSelectFollowUpsConfig() {
    return this.options.multiSelectFollowUps ? normaliseConfig(this.options.multiSelectFollowUps) : false;
  }

  saveValues(req, res, callback) {
    super.saveValues(req, res, err => {
      if (err) {
        callback(err);
        return;
      }

      const config = this.getMultiSelectFollowUpsConfig();

      if (!config) {
        callback();
        return;
      }

      const previousState = req.sessionModel.get(config.stateKey) || {};
      let state = previousState;

      if (this.options.route === config.entryPoint) {
        state = createState(config, previousState, req.form.values[config.field]);

        if (state.fieldsToUnset.length) {
          req.sessionModel.unset(state.fieldsToUnset);
        }
      } else if (asArray(previousState.activeRoutes).includes(this.options.route)) {
        state = Object.assign({}, previousState, {
          completedRoutes: unique(asArray(previousState.completedRoutes).concat(this.options.route))
        });
      }

      req.sessionModel.set(config.stateKey, state);
      callback();
    });
  }

  getNextStep(req, res) {
    const config = this.getMultiSelectFollowUpsConfig();

    if (!config) {
      return super.getNextStep(req, res);
    }

    const state = req.sessionModel.get(config.stateKey) || {};
    let nextRoute;

    if (this.options.route === config.entryPoint) {
      nextRoute = asArray(state.addedRoutes)[0] || nextIncompleteRoute(state) || config.exitPoint;
    } else if (asArray(state.activeRoutes).includes(this.options.route)) {
      nextRoute = nextIncompleteRoute(state) || config.exitPoint;
    }

    if (!nextRoute) {
      return super.getNextStep(req, res);
    }

    return withEditSuffix(req, config, withBaseUrl(req, nextRoute), nextRoute);
  }
};

module.exports.createState = createState;
module.exports.getActiveRoutes = getActiveRoutes;
module.exports.asArray = asArray;
