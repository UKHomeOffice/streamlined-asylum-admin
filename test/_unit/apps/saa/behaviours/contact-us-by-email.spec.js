'use strict';

const ContactUsByEmail = require('../../../../../apps/saa/behaviours/contact-us-by-email');

class Base {
  locals() {
    return { existing: true };
  }
}

const buildReq = values => ({
  sessionModel: {
    get: key => values[key]
  }
});

describe('contact-us-by-email behaviour', () => {
  const Behaviour = ContactUsByEmail(Base);
  const instance = new Behaviour();

  it('keeps locals from the superclass', () => {
    expect(instance.locals(buildReq({}), {})).toEqual(
      expect.objectContaining({ existing: true })
    );
  });

  it.each([
    'change-personal-details',
    'add-remove-dependant',
    'send-evidence-for-your-claim',
    'someone-on-claim-died'
  ])('sets hasSelectedSection to true when %s is yes', field => {
    const locals = instance.locals(buildReq({ [field]: 'yes' }), {});
    expect(locals.hasSelectedSection).toBe(true);
  });

  it('sets hasSelectedSection to false when no other journey is selected', () => {
    const locals = instance.locals(
      buildReq({
        'change-personal-details': 'no',
        'add-remove-dependant': 'no',
        'send-evidence-for-your-claim': 'no',
        'someone-on-claim-died': 'no'
      }),
      {}
    );
    expect(locals.hasSelectedSection).toBe(false);
  });
});
