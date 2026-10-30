'use strict';

const changeSomeoneElsesNameFork = require('../../../../../apps/saa/behaviours/change-someone-elses-name-fork');

describe('change someone else’s name fork behaviour', () => {
  const baseGetNextStep = jest.fn();

  class BaseBehaviour {
    getNextStep(req, res) {
      return baseGetNextStep(req, res);
    }
  }

  const Behaviour = changeSomeoneElsesNameFork(BaseBehaviour);
  const behaviour = new Behaviour();
  const createRequest = (ownNameAnswer, someoneElsesNameAnswer) => ({
    baseUrl: '/updates',
    sessionModel: {
      get: field => ({
        'do-you-need-to-change-your-name': ownNameAnswer,
        'change-someone-elses-name': someoneElsesNameAnswer
      })[field]
    }
  });

  beforeEach(() => {
    baseGetNextStep.mockReturnValue('/updates/change-your-date-of-birth');
  });

  test('routes to no changes made when both answers are no', () => {
    const req = createRequest('no', 'no');

    expect(behaviour.getNextStep(req, {})).toBe('/updates/no-changes-made');
  });

  test('routes to the relationship page when someone else’s name needs changing', () => {
    const req = createRequest('no', 'yes');

    expect(behaviour.getNextStep(req, {})).toBe(
      '/updates/relationship-name-change'
    );
  });

  test('preserves the configured next step when the user needs to change their name', () => {
    const req = createRequest('yes', 'no');

    expect(behaviour.getNextStep(req, {})).toBe(
      '/updates/change-your-date-of-birth'
    );
  });
});
