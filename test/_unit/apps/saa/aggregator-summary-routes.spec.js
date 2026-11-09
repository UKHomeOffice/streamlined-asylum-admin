'use strict';

jest.mock(
  '../../../../apps/saa/behaviours/check-email-token',
  () => superclass => superclass
);

const app = require('../../../../apps/saa');
const Controller = require('hof/controller/controller');
const Model = require('hof/model');

// Add every new aggregator summary (mini CYA) route here.
const aggregatorSummaryRoutes = [
  '/check-your-answers-add-child-partner',
  '/check-your-answers-death',
  '/check-your-answers-someone-else-date-of-birth'
];

const aggregatorQuestionRoutes = [
  '/add-remove-child-partner',
  '/reason-for-removing-child-partner',
  '/relationship-to-child-partner',
  '/child-partner-name',
  '/child-partner-date-of-birth',
  '/child-partner-nationality',
  '/evidence-child-partner',
  '/about-who-has-died',
  '/main-claimant-died',
  '/name-person-who-died',
  '/date-of-birth-person-who-died',
  '/nationality-person-who-died',
  '/upload-death-certificate'
];

describe('SAA aggregator summary routes', () => {
  test.each(aggregatorSummaryRoutes)('%s disables the back link', route => {
    expect(app.steps[route]).toBeDefined();
    expect(app.steps[route].backLink).toBe(false);
  });

  test.each(aggregatorQuestionRoutes)(
    '%s continues editing even when the next page was previously completed',
    route => {
      const options = app.steps[route];
      const controller = new Controller(options);
      const req = {
        baseUrl: app.baseUrl,
        params: { action: 'edit' },
        form: { options: { ...options }, values: {} },
        sessionModel: new Model({
          steps: [...aggregatorQuestionRoutes, ...aggregatorSummaryRoutes],
          'add-remove-child-partner': 'remove-child-partner'
        })
      };

      expect(controller.getNextStep(req, {})).toBe(
        `${app.baseUrl}${options.next}/edit`
      );
    }
  );

  test('the add-child fork continues editing to the relationship question', () => {
    const options = app.steps['/add-remove-child-partner'];
    const controller = new Controller(options);
    const req = {
      baseUrl: app.baseUrl,
      params: { action: 'edit' },
      form: {
        options: { ...options },
        values: { 'add-remove-child-partner': 'add-child-partner' }
      },
      sessionModel: new Model({ steps: aggregatorQuestionRoutes })
    };

    expect(controller.getNextStep(req, {})).toBe(
      `${app.baseUrl}/relationship-to-child-partner/edit`
    );
  });

  test.each(aggregatorSummaryRoutes)(
    '%s retains its edit return boundary',
    route => {
      expect(app.steps[route].continueOnEdit).not.toBe(true);
    }
  );

  test('every aggregator step is listed in aggregatorSummaryRoutes', () => {
    const aggregatorSteps = Object.keys(app.steps).filter(
      route => app.steps[route].aggregateTo
    );

    expect(aggregatorSteps.sort()).toEqual([...aggregatorSummaryRoutes].sort());
  });
});
