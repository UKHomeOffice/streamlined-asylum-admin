'use strict';

const MultiSelectFollowUps = require('../behaviours/multi-select-follow-ups');

const uniqueRoutes = routes => [...new Set(routes.filter(Boolean))];

const configureMultiSelectFollowUps = (steps, config) => {
  const behaviour = MultiSelectFollowUps(config);
  const sections = config.options.flatMap(option => option.sections || []);
  const starts = uniqueRoutes(sections.map(section => section.start));
  const completions = uniqueRoutes(
    sections.flatMap(section =>
      MultiSelectFollowUps.asArray(section.completeOn).map(
        MultiSelectFollowUps.getCompletionRoute
      )
    )
  );
  const noChangesRoutes = uniqueRoutes(
    sections.flatMap(section => [
      section.noChanges?.route,
      section.noChanges?.editRoute
    ])
  );
  const noChangesPoint = config.noChangesPoint?.route;

  // Internal pages continue editing until a configured completion boundary.
  sections.forEach(section => {
    section.routes.forEach(route => {
      if (steps[route] && !completions.includes(route)) {
        steps[route].continueOnEdit = true;
      }
    });
  });

  uniqueRoutes([
    config.entryPoint,
    ...starts,
    ...completions,
    ...noChangesRoutes,
    noChangesPoint,
    config.exitPoint
  ]).forEach(route => {
    const step = steps[route];
    if (step && !(step.behaviours || []).includes(behaviour)) {
      // Save orchestration state before step behaviours such as EditRouteReturn run.
      step.behaviours = [behaviour].concat(step.behaviours || []);
    }
  });

  if (steps[noChangesPoint]) {
    // This page is reached dynamically rather than through HOF next/forks.
    steps[noChangesPoint].prereqs = [].concat(
      steps[noChangesPoint].prereqs || [],
      noChangesRoutes
    );
  }

  starts.forEach(route => {
    const step = steps[route];
    if (!step) {
      return;
    }

    step.prereqs = [].concat(
      step.prereqs || [],
      config.entryPoint,
      noChangesPoint
    );
    step.backLinks = [].concat(step.backLinks || [], config.entryPoint);
  });
};
module.exports = configureMultiSelectFollowUps;
