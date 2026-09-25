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

const getRoutesForSection = section => section.routes || section.steps || [];

const getSectionsForOption = option => {
  const sections = option.sections || [{
    id: option.value,
    order: option.order,
    start: (option.routes || option.steps || [])[0],
    completeOn: (option.routes || option.steps || []).slice(-1)[0],
    routes: option.routes || option.steps || [],
    fieldsToUnset: option.fieldsToUnset
  }];

  return sections.map(section => Object.assign({
    order: typeof section.order === 'number' ? section.order : option.order,
    value: option.value
  }, section));
};

const normaliseConfig = config => Object.assign({
  stateKey: `${config.field}-follow-ups`,
  options: []
}, config);

const getSelectedOptions = (config, selections) => {
  const selectedValues = asArray(selections);

  return sortByOrder(config.options.filter(option => selectedValues.includes(option.value)));
};

const getActiveSections = (config, selections) => {
  const sections = getSelectedOptions(config, selections)
    .reduce((allSections, option) => allSections.concat(getSectionsForOption(option)), []);

  return sortByOrder(sections).filter((section, index, allSections) =>
    allSections.findIndex(item => item.id === section.id) === index);
};

const getActiveRoutes = (config, selections) => unique(getActiveSections(config, selections)
  .reduce((routes, section) => routes.concat(getRoutesForSection(section)), []));

const getFieldsToUnset = (config, inactiveSections, removedSelections) => unique(config.options.reduce(
  (fields, option) => {
    const sections = getSectionsForOption(option);
    const optionRemoved = removedSelections.includes(option.value);
    const sectionInactive = sections.some(section => inactiveSections.includes(section.id));

    if (optionRemoved || sectionInactive) {
      return fields.concat(option.fieldsToUnset || [], ...sections.map(section => section.fieldsToUnset || []));
    }

    return fields;
  }, []));

const createState = (config, previousState, selections) => {
  const previousSelections = asArray(previousState.selections);
  const previousSections = asArray(previousState.activeSections);
  const activeSections = getActiveSections(config, selections);
  const activeSectionIds = activeSections.map(section => section.id);
  const activeRoutes = getActiveRoutes(config, selections);
  const removedSelections = previousSelections.filter(value => !asArray(selections).includes(value));
  const addedSections = activeSectionIds.filter(section => !previousSections.includes(section));
  const inactiveSections = previousSections.filter(section => !activeSectionIds.includes(section));

  return {
    selections: asArray(selections),
    activeSections: activeSectionIds,
    activeRoutes,
    completedSections: asArray(previousState.completedSections).filter(section =>
      activeSectionIds.includes(section)),
    addedSections,
    inactiveSections,
    fieldsToUnset: getFieldsToUnset(config, inactiveSections, removedSelections)
  };
};

const getSectionById = (sections, sectionId) => sections.find(section => section.id === sectionId);

const nextIncompleteSection = (sections, state) => sections.find(section =>
  !asArray(state.completedSections).includes(section.id));

const getCompletingSections = (sections, route) => sections.filter(section => section.completeOn === route);

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
      } else {
        const activeSections = getActiveSections(config, previousState.selections);
        const completingSections = getCompletingSections(activeSections, this.options.route);

        state = Object.assign({}, previousState, {
          completedSections: unique(asArray(previousState.completedSections)
            .concat(completingSections.map(section => section.id)))
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
    const activeSections = getActiveSections(config, state.selections);
    let nextRoute;

    if (this.options.route === config.entryPoint) {
      const addedSection = asArray(state.addedSections)
        .map(section => getSectionById(activeSections, section))
        .find(Boolean);
      const incompleteSection = nextIncompleteSection(activeSections, state);

      nextRoute = (addedSection || incompleteSection || {}).start || config.exitPoint;
    } else if (getCompletingSections(activeSections, this.options.route).length) {
      nextRoute = (nextIncompleteSection(activeSections, state) || {}).start || config.exitPoint;
    }

    if (!nextRoute) {
      return super.getNextStep(req, res);
    }

    return withEditSuffix(req, config, withBaseUrl(req, nextRoute), nextRoute);
  }
};

module.exports.createState = createState;
module.exports.getActiveSections = getActiveSections;
module.exports.getActiveRoutes = getActiveRoutes;
module.exports.asArray = asArray;
