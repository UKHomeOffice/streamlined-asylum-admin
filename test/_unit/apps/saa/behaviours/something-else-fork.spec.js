const somethingElseFork = require('../../../../../apps/saa/behaviours/something-else-fork');

describe('something else fork behaviour', () => {
  const baseGetNextStep = jest.fn();

  class BaseBehaviour {
    getNextStep(req, res) {
      return baseGetNextStep(req, res);
    }
  }

  const Behaviour = somethingElseFork(BaseBehaviour);
  const behaviour = new Behaviour();
  const createRequest = answers => ({
    baseUrl: '/updates',
    sessionModel: { get: field => answers[field] }
  });

  beforeEach(() => {
    baseGetNextStep.mockReturnValue('/updates/default');
  });

  test('should go to contact us by email when something else is yes', () => {
    const req = createRequest({ 'something-else': 'yes' });

    expect(behaviour.getNextStep(req, {})).toBe('/updates/contact-us-by-email');
  });

  test('should go to no options when something else is no and nothing else was selected', () => {
    const req = createRequest({
      'change-personal-details': 'no',
      'add-remove-dependant': 'no',
      'send-evidence-for-your-claim': 'no',
      'someone-on-claim-died': 'no',
      'something-else': 'no'
    });

    expect(behaviour.getNextStep(req, {})).toBe('/updates/no-options');
  });

  test.each([
    'change-personal-details',
    'add-remove-dependant',
    'send-evidence-for-your-claim',
    'someone-on-claim-died'
  ])('should go to confirm when %s is yes and something else is no', field => {
    const req = createRequest({ [field]: 'yes', 'something-else': 'no' });

    expect(behaviour.getNextStep(req, {})).toBe('/updates/confirm');
  });

  test('should preserve the configured next step for another value', () => {
    const req = createRequest({ 'something-else': 'another-value' });

    expect(behaviour.getNextStep(req, {})).toBe('/updates/default');
  });
});
