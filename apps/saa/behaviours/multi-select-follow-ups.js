'use strict';

/*
 * Temporary implementation notes for review.
 *
 * This behaviour is deliberately small and generic. It is intended to behave
 * like a future HOF framework behaviour, even though it currently lives inside
 * this service. It should not know anything about SAA-specific page content,
 * summaries, PDFs, aggregate item structures, or final submission payloads.
 *
 * The behaviour only owns the boundaries around a multi-select-driven set of
 * follow-up sections:
 * - the multi-select entry page where selected options are recalculated
 * - the configured start page for each active follow-up section
 * - the configured completion page for each active follow-up section
 *
 * Normal HOF step configuration still owns navigation inside a section. That is
 * important for complex flows such as aggregator loops, forks, local CYA pages,
 * and page-specific correction logic. This behaviour should only decide which
 * selected section starts next after the user enters or completes a section.
 */

const asArray = value => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  return value ? [value] : [];
};

const unique = values =>
  values.filter((value, index) => values.indexOf(value) === index);

const sortByOrder = items =>
  items.slice().sort((left, right) => {
    const leftOrder =
      typeof left.order === 'number' ? left.order : Number.MAX_SAFE_INTEGER;
    const rightOrder =
      typeof right.order === 'number' ? right.order : Number.MAX_SAFE_INTEGER;

    return leftOrder - rightOrder;
  });

const getRoutesForSection = section => section.routes || section.steps || [];

const sectionIsInactive = inactiveSections => section =>
  inactiveSections.includes(section.id);

const getFieldsForSection = section => section.fieldsToUnset || [];

/*
 * Sections are the unit of orchestration. A section has a start route, a route
 * that marks it complete, and a list of owned routes used as metadata. The
 * owned routes are not treated as a strict navigation sequence; individual HOF
 * pages continue to use their own `next` and `forks` configuration.
 *
 * The fallback branch keeps the initial `routes`/`steps` shape working while we
 * move towards the clearer `sections` contract. That makes this easier to lift
 * into HOF later without coupling the behaviour to this service's route names.
 */
const getSectionsForOption = option => {
  const sections = option.sections || [
    {
      id: option.value,
      order: option.order,
      start: (option.routes || option.steps || [])[0],
      completeOn: (option.routes || option.steps || []).slice(-1)[0],
      routes: option.routes || option.steps || [],
      fieldsToUnset: option.fieldsToUnset
    }
  ];

  return sections.map(section => ({
    order: typeof section.order === 'number' ? section.order : option.order,
    value: option.value,
    ...section
  }));
};

const normaliseConfig = config => ({
  stateKey: `${config.field}-follow-ups`,
  options: [],
  ...config
});

const getSelectedOptions = (config, selections) => {
  const selectedValues = asArray(selections);

  return sortByOrder(
    config.options.filter(option => selectedValues.includes(option.value))
  );
};

/*
 * Build the active section list from the submitted checkbox values. Ordering is
 * always taken from config, never from the order in which values arrive from the
 * browser. Duplicate section ids are collapsed so two selected options can point
 * at the same follow-up section without making the user complete it twice.
 */
const getActiveSections = (config, selections) => {
  const sections = getSelectedOptions(config, selections).reduce(
    (allSections, option) => allSections.concat(getSectionsForOption(option)),
    []
  );

  return sortByOrder(sections).filter(
    (section, index, allSections) =>
      allSections.findIndex(item => item.id === section.id) === index
  );
};

/*
 * Active routes are exposed as metadata for the service to use later for output
 * filtering, stale data clean-up, or prerequisite checks. They are intentionally
 * not used by this behaviour as page-by-page navigation instructions.
 */
const getActiveRoutes = (config, selections) =>
  unique(
    getActiveSections(config, selections).reduce(
      (routes, section) => routes.concat(getRoutesForSection(section)),
      []
    )
  );

const getCompletionRoute = completion =>
  typeof completion === 'string' ? completion : completion.route;

const getOwnedRoutes = section =>
  unique(
    [section.start]
      .concat(getRoutesForSection(section))
      .concat(asArray(section.completeOn).map(getCompletionRoute))
      .filter(Boolean)
  );

const getOwnedRoutesForSections = sections =>
  unique(
    sections.reduce(
      (routes, section) => routes.concat(getOwnedRoutes(section)),
      []
    )
  );

const routeIsInactive = inactiveRoutes => route =>
  inactiveRoutes.includes(route);

// Drops Back-link history that points into or out of sections no longer selected.
const pruneBackLinks = (backLinks, inactiveRoutes) => {
  const isInactive = routeIsInactive(inactiveRoutes);

  return Object.fromEntries(
    Object.entries(backLinks || {}).filter(
      ([start, backLink]) => !isInactive(start) && !isInactive(backLink)
    )
  );
};

/*
 * Clean-up is deliberately neutral. If a service wants de selecting an option to
 * clear stale answers, it can provide `fieldsToUnset`. The behaviour does not
 * know what those fields mean or how they appear in summary/output payloads.
 */
const getFieldsToUnset = (config, inactiveSections, removedSelections) =>
  unique(
    config.options.reduce((fields, option) => {
      const sections = getSectionsForOption(option);
      const optionRemoved = removedSelections.includes(option.value);
      const optionFields = optionRemoved ? option.fieldsToUnset || [] : [];
      const sectionFields = sections
        .filter(sectionIsInactive(inactiveSections))
        .map(getFieldsForSection);

      return fields.concat(optionFields, ...sectionFields);
    }, [])
  );

/*
 * The session state is the only persistent contract this behaviour creates:
 * - `selections`: current multi-select values
 * - `activeSections`: selected follow-up sections in configured order
 * - `activeRoutes`: all possible routes owned by those active sections
 * - `completedSections`: active sections whose `completeOn` route has posted
 * - `addedSections`: newly selected sections, used to prioritise edit journeys
 * - `inactiveSections`: previously active sections that are no longer selected
 * - `noChangesSection` / `noChangesFrom`: the section that reported no changes, and its reporting page
 * - `noChangesNextRoute`: resume destination after confirming that nothing changed
 *
 * The service config owns the rules for reporting no changes and clearing data.
 */
const createState = (config, previousState, selections) => {
  const previousSelections = asArray(previousState.selections);
  const previousSections = asArray(previousState.activeSections);
  const activeSections = getActiveSections(config, selections);
  const activeSectionIds = activeSections.map(section => section.id);
  const activeRoutes = getActiveRoutes(config, selections);
  const removedSelections = previousSelections.filter(
    value => !asArray(selections).includes(value)
  );
  const addedSections = activeSectionIds.filter(
    section => !previousSections.includes(section)
  );
  const inactiveSections = previousSections.filter(
    section => !activeSectionIds.includes(section)
  );
  const completedSections = asArray(previousState.completedSections).filter(
    section => activeSectionIds.includes(section)
  );
  const activeOwnedRoutes = getOwnedRoutesForSections(activeSections);
  const inactiveRoutes = getOwnedRoutesForSections(
    getActiveSections(config, previousSelections).filter(
      sectionIsInactive(inactiveSections)
    )
  ).filter(route => !activeOwnedRoutes.includes(route));
  const lastCompletionRoute =
    completedSections.length &&
    !inactiveRoutes.includes(previousState.lastCompletionRoute)
      ? previousState.lastCompletionRoute
      : undefined;

  return {
    selections: asArray(selections),
    activeSections: activeSectionIds,
    activeRoutes,
    completedSections,
    lastCompletionRoute,
    sectionStartBackLinks: pruneBackLinks(
      previousState.sectionStartBackLinks,
      inactiveRoutes
    ),
    addedSections,
    inactiveSections,
    inactiveRoutes,
    fieldsToUnset: getFieldsToUnset(config, inactiveSections, removedSelections)
  };
};

const getSectionById = (sections, sectionId) =>
  sections.find(section => section.id === sectionId);

const nextIncompleteSection = (sections, state) =>
  sections.find(
    section => !asArray(state.completedSections).includes(section.id)
  );

const fieldConditionMet = (condition, req) => {
  if (typeof condition === 'function') {
    return condition(req);
  }

  const value =
    req.form?.values?.[condition.field] ??
    req.sessionModel.get(condition.field);
  return value === condition.value;
};

// A condition is a HOF-style field condition, a function, or a list that must all match.
const conditionsMet = (conditions, req) =>
  [conditions].flat().every(condition => fieldConditionMet(condition, req));

const completionConditionMet = (completion, req) =>
  typeof completion === 'string' ||
  !completion.condition ||
  conditionsMet(completion.condition, req);

const sectionCompletesOnRoute = (section, route, req) =>
  asArray(section.completeOn).some(
    completion =>
      getCompletionRoute(completion) === route &&
      completionConditionMet(completion, req)
  );

const getCompletingSections = (sections, route, req) =>
  sections.filter(section => sectionCompletesOnRoute(section, route, req));

const getSectionIds = sections => sections.map(section => section.id);

const completionIsOnRoute = route => completion =>
  getCompletionRoute(completion) === route;

const sectionReopensOnRoute = (state, route, req) => section =>
  asArray(state.completedSections).includes(section.id) &&
  asArray(section.completeOn).some(completionIsOnRoute(route)) &&
  !sectionCompletesOnRoute(section, route, req);

const invalidateReopenedSections = (state, sections, route, req) => {
  const reopenedIds = getSectionIds(
    sections.filter(sectionReopensOnRoute(state, route, req))
  );

  if (!reopenedIds.length) {
    return state;
  }

  const sectionStartBackLinks = Object.fromEntries(
    Object.entries(state.sectionStartBackLinks || {}).filter(
      ([, backLink]) => backLink !== route
    )
  );
  const invalidStartLink = state.sectionStartBackLink === route;

  // Reopening a boundary revokes completion and links created by that completion.
  return {
    ...state,
    completedSections: asArray(state.completedSections).filter(
      sectionId => !reopenedIds.includes(sectionId)
    ),
    lastCompletionRoute:
      state.lastCompletionRoute === route
        ? undefined
        : state.lastCompletionRoute,
    sectionStartRoute: invalidStartLink ? undefined : state.sectionStartRoute,
    sectionStartBackLink: invalidStartLink
      ? undefined
      : state.sectionStartBackLink,
    sectionStartBackLinks
  };
};

const getCompletedSections = (previousState, completingSections) =>
  unique(
    asArray(previousState.completedSections).concat(
      getSectionIds(completingSections)
    )
  );

const getLastCompletionRoute = (previousState, route, completingSections) =>
  completingSections.length ? route : previousState.lastCompletionRoute;

const withBaseUrl = (req, route) => {
  const baseUrl = req.baseUrl === '/' ? '' : req.baseUrl || '';
  return `${baseUrl.replace(/\/$/, '')}/${route.replace(/^\//, '')}`;
};

const isEdit = req => req.params?.action === 'edit';

/*
 * Preserve HOF's edit-mode URL convention. If the user edits the multi-select
 * page and adds a new section, they should be sent into that section in edit
 * mode. The configured exit point is left alone so edit journeys can return to
 * the normal downstream route/summary behaviour.
 */
const withEditSuffix = (req, config, route, nextRoute) => {
  return isEdit(req) && nextRoute !== config.exitPoint
    ? `${route}/edit`
    : route;
};

const getEntryPointNextRoute = (req, config, activeSections, state) => {
  const addedSection = asArray(state.addedSections)
    .map(section => getSectionById(activeSections, section))
    .find(Boolean);
  const incompleteSection = nextIncompleteSection(activeSections, state);

  if (req.params?.action === 'edit') {
    return (addedSection || incompleteSection)?.start || config.exitPoint;
  }

  return incompleteSection?.start || config.exitPoint;
};

const withSectionStartBackLink = (state, config, nextRoute, backLinkRoute) => {
  if (nextRoute === config.exitPoint) {
    return {
      ...state,
      sectionStartRoute: undefined,
      sectionStartBackLink: undefined
    };
  }

  return {
    ...state,
    sectionStartRoute: nextRoute,
    sectionStartBackLink: backLinkRoute,
    sectionStartBackLinks: {
      ...state.sectionStartBackLinks,
      [nextRoute]: backLinkRoute
    }
  };
};

const getSectionStartBackLink = (state, route) =>
  state.sectionStartBackLinks?.[route] ||
  (state.sectionStartRoute === route ? state.sectionStartBackLink : undefined);

const getCompletionNextRoute = (config, activeSections, state) =>
  nextIncompleteSection(activeSections, state)?.start || config.exitPoint;

const getAllSections = config =>
  getActiveSections(
    config,
    config.options.map(option => option.value)
  );

// A section reports "nothing changed" when every `noChanges.when` condition matches on its `noChanges.route`.
const getNoChangesSection = (sections, route, req) =>
  sections.find(
    section =>
      (section.noChanges?.route === route ||
        (isEdit(req) && section.noChanges?.editRoute === route)) &&
      conditionsMet(section.noChanges.when, req)
  );

const markNoChanges = (state, section, route) => ({
  ...state,
  completedSections: asArray(state.completedSections).filter(
    sectionId => sectionId !== section.id
  ),
  lastCompletionRoute:
    state.lastCompletionRoute === route ? undefined : state.lastCompletionRoute,
  noChangesSection: section.id,
  noChangesFrom: route,
  noChangesNextRoute: undefined
});

const optionHasSection = sectionId => option =>
  getSectionsForOption(option).some(section => section.id === sectionId);

const clearInactiveValues = (req, state) => {
  if (state.fieldsToUnset.length) {
    req.sessionModel.unset(state.fieldsToUnset);
  }

  const steps = req.sessionModel.get('steps');
  if (Array.isArray(steps) && state.inactiveRoutes.length) {
    req.sessionModel.set(
      'steps',
      steps.filter(route => !state.inactiveRoutes.includes(route))
    );
  }
};

// Unticks the options behind a section, as if the user had deselected them on the entry page.
const removeSectionSelection = (req, config, state, sectionId) => {
  const removedValues = new Set(
    config.options
      .filter(optionHasSection(sectionId))
      .map(option => option.value)
  );
  const selections = asArray(state.selections).filter(
    value => !removedValues.has(value)
  );
  const nextState = createState(config, state, selections);

  clearInactiveValues(req, nextState);

  if (selections.length) {
    req.sessionModel.set(config.field, selections);
  } else {
    req.sessionModel.unset(config.field);
    config.onNoneSelected?.(req);
  }

  return nextState;
};

const updateSectionState = (req, config, previousState, route) => {
  const activeSections = getActiveSections(config, previousState.selections);
  const noChangesSection = getNoChangesSection(activeSections, route, req);

  if (noChangesSection) {
    return markNoChanges(previousState, noChangesSection, route);
  }

  const completingSections = getCompletingSections(activeSections, route, req);
  const resumedState = previousState.noChangesSection
    ? {
      ...previousState,
      noChangesSection: undefined,
      noChangesFrom: undefined
    }
    : previousState;
  let state = invalidateReopenedSections(
    resumedState,
    activeSections,
    route,
    req
  );

  if (!completingSections.length) {
    return state;
  }

  state = {
    ...state,
    completedSections: getCompletedSections(state, completingSections),
    lastCompletionRoute: getLastCompletionRoute(
      state,
      route,
      completingSections
    )
  };

  const nextRoute = getCompletionNextRoute(config, activeSections, state);
  return withSectionStartBackLink(state, config, nextRoute, route);
};

const resolveNoChanges = (req, config, state, continuing) => {
  const point = config.noChangesPoint;
  req.sessionModel.unset(point.field);

  if (!state.noChangesSection || !continuing) {
    return state;
  }

  const nextState = removeSectionSelection(
    req,
    config,
    state,
    state.noChangesSection
  );
  const nextRoute = getCompletionNextRoute(
    config,
    getActiveSections(config, nextState.selections),
    nextState
  );

  return withSectionStartBackLink(
    { ...nextState, noChangesNextRoute: nextRoute },
    config,
    nextRoute,
    nextState.lastCompletionRoute || config.entryPoint
  );
};

const getNoChangesLocals = (req, res, config, state) => {
  const section = getSectionById(
    getAllSections(config),
    state.noChangesSection
  );
  const headerKey = section?.noChanges?.header;
  const header =
    headerKey && typeof req.translate === 'function'
      ? req.translate(headerKey)
      : headerKey;

  // Set before HOF builds the page title and legend, which render from res.locals.
  if (header && res.locals) {
    res.locals.noChangesHeader = header;
  }

  return {
    noChangesHeader: header,
    backLink: state.noChangesFrom
      ? withEditSuffix(
        req,
        config,
        withBaseUrl(req, state.noChangesFrom),
        state.noChangesFrom
      )
      : undefined
  };
};

const multiSelectFollowUps = behaviourConfig => SuperClass =>
  class MultiSelectFollowUps extends SuperClass {
    getMultiSelectFollowUpsConfig() {
      return behaviourConfig ? normaliseConfig(behaviourConfig) : false;
    }

    configure(req, res, next) {
      const config = this.getMultiSelectFollowUpsConfig();
      if (config && this.options.route === config.noChangesPoint?.route) {
        const state = req.sessionModel.get(config.stateKey) || {};
        if (!state.noChangesSection) {
          // A saved POST can resume here after the option has already been removed.
          return res.redirect(this.getNextStep(req, res));
        }
      }
      return super.configure(req, res, next);
    }

    saveValues(req, res, callback) {
      /*
       * Let HOF save and validate the page in the normal way first. This behaviour
       * only updates its derived section state after the current page values have
       * been persisted to the session model.
       */
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
        let state;

        if (this.options.route === config.entryPoint) {
          /*
           * The entry page is the only place where selected options are
           * recalculated from form values. This keeps the behaviour predictable:
           * internal section pages do not silently change which sections are
           * active unless a page-specific controller explicitly does so.
           */
          state = createState(
            config,
            previousState,
            req.form.values[config.field]
          );

          state = withSectionStartBackLink(
            state,
            config,
            getEntryPointNextRoute(
              req,
              config,
              getActiveSections(config, state.selections),
              state
            ),
            config.entryPoint
          );

          clearInactiveValues(req, state);
        } else if (this.options.route === config.noChangesPoint?.route) {
          if (!previousState.noChangesSection) {
            callback(
              new Error(
                'No follow-up section is awaiting a no-changes decision'
              )
            );
            return;
          }
          state = this.resolveNoChanges(req, config, previousState);
        } else {
          state = this.updateSectionState(req, config, previousState);
        }

        req.sessionModel.set(config.stateKey, state);
        if (
          req.form.options &&
          (this.options.route === config.entryPoint ||
            this.options.route === config.noChangesPoint?.route ||
            getNoChangesSection(
              getActiveSections(config, state.selections),
              this.options.route,
              req
            ) ||
            getCompletingSections(
              getActiveSections(config, state.selections),
              this.options.route,
              req
            ).length)
        ) {
          // Let successHandler persist the session before following our boundary route.
          req.form.options.continueOnEdit = true;
        }
        callback();
      });
    }

    /*
     * Completion is section-boundary based. Posting a configured `completeOn`
     * route marks that section complete, unless the section's `noChanges` rule
     * matches first, in which case the user is sent to the shared no-changes page.
     */
    updateSectionState(req, config, previousState) {
      return updateSectionState(req, config, previousState, this.options.route);
    }

    // "Yes" unticks the section's option and moves on; "No" keeps state so getNextStep returns to the section start.
    resolveNoChanges(req, config, state) {
      return resolveNoChanges(
        req,
        config,
        state,
        this.isContinuingWithNoChanges(req, config)
      );
    }

    isContinuingWithNoChanges(req, config) {
      const point = config.noChangesPoint;
      return req.form?.values?.[point.field] === (point.continueValue || 'yes');
    }

    getEditExitUrl(req, config) {
      return (
        config.editReturnUrl?.(req) ||
        withBaseUrl(req, this.confirmStep || '/confirm')
      );
    }

    toNextUrl(req, config, nextRoute) {
      if (nextRoute === config.exitPoint && (isEdit(req) || config.editReturnUrl?.(req))) {
        return this.getEditExitUrl(req, config);
      }

      return withEditSuffix(
        req,
        config,
        withBaseUrl(req, nextRoute),
        nextRoute
      );
    }

    getNoChangesNextRoute(req, config, state) {
      if (!state.noChangesSection) {
        return state.noChangesNextRoute || config.entryPoint;
      }

      if (this.isContinuingWithNoChanges(req, config)) {
        return getCompletionNextRoute(
          config,
          getActiveSections(config, state.selections),
          state
        );
      }

      return getSectionById(getAllSections(config), state.noChangesSection)
        ?.start;
    }

    getNoChangesLocals(req, res, config, state) {
      return getNoChangesLocals(req, res, config, state);
    }

    locals(req, res) {
      const config = this.getMultiSelectFollowUpsConfig();
      const state = config ? req.sessionModel.get(config.stateKey) || {} : {};
      const noChangesLocals =
        config && this.options.route === config.noChangesPoint?.route
          ? this.getNoChangesLocals(req, res, config, state)
          : undefined;
      const locals = super.locals(req, res);

      if (!config) {
        return locals;
      }

      if (noChangesLocals) {
        return {
          ...locals,
          noChangesHeader: noChangesLocals.noChangesHeader,
          backLink: noChangesLocals.backLink || locals.backLink
        };
      }

      const sectionStartBackLink = getSectionStartBackLink(
        state,
        this.options.route
      );
      const isTrackedSectionStart = Boolean(sectionStartBackLink);
      // The exit page only gets an orchestrated Back link while options are still ticked.
      const isActiveExitPoint =
        this.options.route === config.exitPoint &&
        asArray(req.sessionModel.get(config.field)).length > 0;

      if (!isActiveExitPoint && !isTrackedSectionStart) {
        return locals;
      }

      const backLinkRoute = isTrackedSectionStart
        ? sectionStartBackLink
        : state.lastCompletionRoute || config.entryPoint;
      const backLink = isTrackedSectionStart
        ? withEditSuffix(
          req,
          config,
          withBaseUrl(req, backLinkRoute),
          backLinkRoute
        )
        : withBaseUrl(req, backLinkRoute);

      return {
        ...locals,
        backLink
      };
    }

    getNextStep(req, res) {
      const config = this.getMultiSelectFollowUpsConfig();

      if (!config) {
        return super.getNextStep(req, res);
      }

      const state = req.sessionModel.get(config.stateKey) || {};
      const activeSections = getActiveSections(config, state.selections);
      const route = this.options.route;
      let nextRoute;

      if (route === config.entryPoint) {
        /*
         * After the multi-select page, follow configured order in normal journeys.
         * In edit mode, prioritise a newly added section so adding Email later
         * does not make the user re-enter already completed sections.
         */
        nextRoute = getEntryPointNextRoute(req, config, activeSections, state);
      } else if (route === config.noChangesPoint?.route) {
        nextRoute = this.getNoChangesNextRoute(req, config, state);
      } else if (getNoChangesSection(activeSections, route, req)) {
        nextRoute = config.noChangesPoint?.route;
      } else if (getCompletingSections(activeSections, route, req).length) {
        /*
         * When a section completion page posts, hand the user to the next selected
         * incomplete section. If every selected section is complete, this behaviour
         * gets out of the way by sending the user to the configured exit point.
         */
        nextRoute = getCompletionNextRoute(config, activeSections, state);
      }

      if (!nextRoute) {
        return super.getNextStep(req, res);
      }

      return this.toNextUrl(req, config, nextRoute);
    }
  };
module.exports = multiSelectFollowUps;

// Export pure helpers for service route wiring and focused unit tests.
// The behaviour itself remains the runtime integration point.
module.exports.createState = createState;
module.exports.getActiveSections = getActiveSections;
module.exports.getActiveRoutes = getActiveRoutes;
module.exports.asArray = asArray;
module.exports.getCompletionRoute = getCompletionRoute;
