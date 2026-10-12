'use strict';

const RequireSelectedSection = require('../../../../../apps/saa/behaviours/require-selected-section');

describe('require-selected-section behaviour', () => {
  const baseGetNextStep = jest.fn();

  class Base {
    getNextStep(req, res) {
      return baseGetNextStep(req, res);
    }
  }

  const Behaviour = RequireSelectedSection(Base);
  const instance = new Behaviour();

  const buildReq = values => ({
    baseUrl: '/changes',
    sessionModel: { get: key => values[key] }
  });

  const allNo = {
    'change-personal-details': 'no',
    'add-remove-dependant': 'no',
    'send-evidence-for-your-claim': 'no',
    'someone-on-claim-died': 'no'
  };

  beforeEach(() => {
    baseGetNextStep.mockReset();
    baseGetNextStep.mockReturnValue('/changes/confirm');
  });

  it.each([
    'change-personal-details',
    'add-remove-dependant',
    'send-evidence-for-your-claim',
    'someone-on-claim-died'
  ])('returns to confirm when %s is yes', field => {
    const req = buildReq({ ...allNo, [field]: 'yes' });

    expect(instance.getNextStep(req, {})).toBe('/changes/confirm');
  });

  it('goes to no-options instead of confirm when every section is no', () => {
    const req = buildReq({ ...allNo, 'something-else': 'no' });

    expect(instance.getNextStep(req, {})).toBe('/changes/no-options');
  });

  it('goes to contact-us-by-email instead of confirm when every section is no and something else is yes', () => {
    const req = buildReq({ ...allNo, 'something-else': 'yes' });

    expect(instance.getNextStep(req, {})).toBe('/changes/contact-us-by-email');
  });

  it('keeps the next step when it is not confirm', () => {
    baseGetNextStep.mockReturnValue('/changes/something-else/edit');

    expect(instance.getNextStep(buildReq(allNo), {})).toBe(
      '/changes/something-else/edit'
    );
  });
});
