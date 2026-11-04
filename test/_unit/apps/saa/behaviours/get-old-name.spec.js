'use strict';

const getOldName = require('../../../../../apps/saa/behaviours/get-old-name');

describe('get-old-name behaviour', () => {
  class BaseBehaviour {
    locals() {
      return { existing: true };
    }
  }

  const Behaviour = getOldName(BaseBehaviour);
  const behaviour = new Behaviour();

  it('adds the claimant’s given and family names to the page locals', () => {
    const values = {
      'claimants-given-name': 'Alex',
      'claimants-family-name': 'Smith'
    };
    const req = { sessionModel: { get: key => values[key] } };

    expect(behaviour.locals(req, {})).toEqual({
      existing: true,
      oldName: 'Alex Smith'
    });
  });

  it('omits empty name parts', () => {
    const req = {
      sessionModel: { get: key => key === 'claimants-given-name' ? 'Alex' : '' }
    };

    expect(behaviour.locals(req, {}).oldName).toBe('Alex');
  });
});
