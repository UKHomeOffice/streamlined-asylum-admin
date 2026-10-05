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
 *
 * Page-specific controllers can later use this same state when they need to
 * programmatically remove a selection, but the rule deciding when to do that
 * should remain local to that page/section.
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

  return {
    selections: asArray(selections),
    activeSections: activeSectionIds,
    activeRoutes,
    completedSections,
    lastCompletionRoute: completedSections.length
      ? previousState.lastCompletionRoute
      : undefined,
    addedSections,
    inactiveSections,
    fieldsToUnset: getFieldsToUnset(config, inactiveSections, removedSelections)
  };
};

const getSectionById = (sections, sectionId) =>
  sections.find(section => section.id === sectionId);

const nextIncompleteSection = (sections, state) =>
  sections.find(
    section => !asArray(state.completedSections).includes(section.id)
  );

const getCompletionRoute = completion =>
  typeof completion === 'string' ? completion : completion.route;

const completionConditionMet = (completion, req) => {
  if (typeof completion === 'string' || !completion.condition) {
    return true;
  }

  const value =
    req.form?.values?.[completion.condition.field] ||
    req.sessionModel.get(completion.condition.field);
  return value === completion.condition.value;
};

const sectionCompletesOnRoute = (section, route, req) =>
  asArray(section.completeOn).some(
    completion =>
      getCompletionRoute(completion) === route &&
      completionConditionMet(completion, req)
  );

const getCompletingSections = (sections, route, req) =>
  sections.filter(section => sectionCompletesOnRoute(section, route, req));

const getSectionIds = sections => sections.map(section => section.id);

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

/*
 * Preserve HOF's edit-mode URL convention. If the user edits the multi-select
 * page and adds a new section, they should be sent into that section in edit
 * mode. The configured exit point is left alone so edit journeys can return to
 * the normal downstream route/summary behaviour.
 */
const withEditSuffix = (req, config, route, nextRoute) => {
  const isEdit = req.params?.action === 'edit';
  return isEdit && nextRoute !== config.exitPoint ? `${route}/edit` : route;
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

const withSectionStartBackLink = (state, config, nextRoute, backLinkRoute) => ({
  ...state,
  sectionStartRoute: nextRoute === config.exitPoint ? undefined : nextRoute,
  sectionStartBackLink: nextRoute === config.exitPoint ? undefined : backLinkRoute
});

const getCompletionNextRoute = (config, activeSections, state) =>
  nextIncompleteSection(activeSections, state)?.start || config.exitPoint;

const multiSelectFollowUps = behaviourConfig => SuperClass =>
  class MultiSelectFollowUps extends SuperClass {
    getMultiSelectFollowUpsConfig() {
      return behaviourConfig ? normaliseConfig(behaviourConfig) : false;
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

          if (state.fieldsToUnset.length) {
            req.sessionModel.unset(state.fieldsToUnset);
          }
        } else {
          /*
           * Completion is section-boundary based. Posting any configured
           * `completeOn` route marks that section complete, then `getNextStep`
           * can move the user to the next incomplete selected section. All pages
           * before this point remain normal HOF pages.
           */
          const activeSections = getActiveSections(
            config,
            previousState.selections
          );
          const completingSections = getCompletingSections(
            activeSections,
            this.options.route,
            req
          );

          if (completingSections.length) {
            state = {
              ...previousState,
              completedSections: getCompletedSections(
                previousState,
                completingSections
              ),
              lastCompletionRoute: getLastCompletionRoute(
                previousState,
                this.options.route,
                completingSections
              )
            };

            state = withSectionStartBackLink(
              state,
              config,
              getCompletionNextRoute(config, activeSections, state),
              this.options.route
            );
          } else {
            state = previousState;
          }
        }

        req.sessionModel.set(config.stateKey, state);
        callback();
      });
    }

    locals(req, res) {
      const locals = super.locals(req, res);
      const config = this.getMultiSelectFollowUpsConfig();

      if (!config) {
        return locals;
      }

      const state = req.sessionModel.get(config.stateKey) || {};
      const isTrackedSectionStart =
        state.sectionStartRoute === this.options.route;

      if (this.options.route !== config.exitPoint && !isTrackedSectionStart) {
        return locals;
      }

      const backLinkRoute = isTrackedSectionStart
        ? state.sectionStartBackLink
        : state.lastCompletionRoute || config.entryPoint;

      return {
        ...locals,
        backLink: withBaseUrl(req, backLinkRoute)
      };
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
        /*
         * After the multi-select page, follow configured order in normal journeys.
         * In edit mode, prioritise a newly added section so adding Email later
         * does not make the user re-enter already completed sections.
         */
        nextRoute = getEntryPointNextRoute(
          req,
          config,
          activeSections,
          state
        );
      } else if (
        getCompletingSections(activeSections, this.options.route, req).length
      ) {
        /*
         * When a section completion page posts, hand the user to the next selected
         * incomplete section. If every selected section is complete, this behaviour
         * gets out of the way by sending the user to the configured exit point.
         */
        nextRoute =
          nextIncompleteSection(activeSections, state)?.start ||
          config.exitPoint;
      }

      if (!nextRoute) {
        return super.getNextStep(req, res);
      }

      return withEditSuffix(
        req,
        config,
        withBaseUrl(req, nextRoute),
        nextRoute
      );
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
