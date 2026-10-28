'use strict';

jest.mock(
  '../../../../apps/saa/behaviours/check-email-token',
  () => superclass => superclass
);

const app = require('../../../../apps/saa');

// Add every new aggregator summary (mini CYA) route here.
const aggregatorSummaryRoutes = [
  '/check-your-answers-add-child-partner',
  '/check-your-answers-death'
];

describe('SAA aggregator summary routes', () => {
  test.each(aggregatorSummaryRoutes)('%s disables the back link', route => {
    expect(app.steps[route]).toBeDefined();
    expect(app.steps[route].backLink).toBe(false);
  });

  test('every aggregator step is listed in aggregatorSummaryRoutes', () => {
    const aggregatorSteps = Object.keys(app.steps).filter(
      route => app.steps[route].aggregateTo
    );

    expect(aggregatorSteps.sort()).toEqual([...aggregatorSummaryRoutes].sort());
  });
});
