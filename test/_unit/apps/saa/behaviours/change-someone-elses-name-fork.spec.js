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
  const createRequest = (ownNameAnswer, someoneElsesNameAnswer, values = {}) => ({
    baseUrl: '/updates',
    sessionModel: {
      get: field => ({
        'do-you-need-to-change-your-name': ownNameAnswer,
        'change-someone-elses-name': someoneElsesNameAnswer,
        'changes-to-contact-details': ['name'],
        ...values
      })[field]
    }
  });

  beforeEach(() => {
    baseGetNextStep.mockReturnValue('/updates/change-your-date-of-birth');
  });

  test('routes to no changes made when only name is selected and both answers are no', () => {
    const req = createRequest('no', 'no');

    expect(behaviour.getNextStep(req, {})).toBe('/updates/no-changes-made');
  });

  test.each([
    ['name', 'date-of-birth'],
    ['name', 'nationality'],
    ['name', 'address'],
    ['name', 'email-address'],
    ['name', 'phone-number']
  ])('preserves the next step when %s and %s are selected', (name, otherUpdate) => {
    const req = createRequest('no', 'no', {
      'changes-to-contact-details': [name, otherUpdate]
    });

    expect(behaviour.getNextStep(req, {})).toBe(
      '/updates/change-your-date-of-birth'
    );
  });

  test.each([
    'add-remove-dependant',
    'send-evidence-for-your-claim',
    'someone-on-claim-died',
    'something-else'
  ])('preserves the next step when %s is yes', field => {
    const req = createRequest('no', 'no', { [field]: 'yes' });

    expect(behaviour.getNextStep(req, {})).toBe(
      '/updates/change-your-date-of-birth'
    );
  });

  test('accepts a single name selection stored as a string', () => {
    const req = createRequest('no', 'no', {
      'changes-to-contact-details': 'name'
    });

    expect(behaviour.getNextStep(req, {})).toBe('/updates/no-changes-made');
  });

  test('preserves the exit step when another selected update is already complete', () => {
    baseGetNextStep.mockReturnValue('/updates/provide-photo-identity');
    const req = createRequest('no', 'no', {
      'changes-to-contact-details': ['name', 'nationality']
    });

    expect(behaviour.getNextStep(req, {})).toBe(
      '/updates/provide-photo-identity'
    );
  });

  test('preserves the configured relationship route when someone else’s name needs changing', () => {
    baseGetNextStep.mockReturnValue('/updates/relationship-name-change');
    const req = createRequest('no', 'yes');

    expect(behaviour.getNextStep(req, {})).toBe(
      '/updates/relationship-name-change'
    );
  });

  test('does not override the inherited route for a yes answer', () => {
    const req = createRequest('yes', 'yes');

    expect(behaviour.getNextStep(req, {})).toBe(
      '/updates/change-your-date-of-birth'
    );
  });

  test('preserves the configured next step when the user needs to change their name', () => {
    const req = createRequest('yes', 'no');

    expect(behaviour.getNextStep(req, {})).toBe(
      '/updates/change-your-date-of-birth'
    );
  });
});
