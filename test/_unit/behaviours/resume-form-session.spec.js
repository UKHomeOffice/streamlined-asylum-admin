jest.mock('../../../utils/application-service', () => ({
  findApplicationsByEmail: jest.fn()
}));

jest.mock('../../../utils', () => ({
  formatDate: jest.fn(value => value),
  formatUanForDisplay: jest.fn(value => value),
  logAndThrow: jest.fn()
}));

jest.mock('../../../config', () => ({ sessionDefaults: {} }));

const ResumeFormSession = require('../../../apps/saa/behaviours/resume-form-session');

describe('resume form session radio ordering', () => {
  class BaseBehaviour {}
  const Behaviour = ResumeFormSession(BaseBehaviour);
  let behaviour;
  let req;

  beforeEach(() => {
    behaviour = new Behaviour();
    req = { form: { options: { fields: {} } } };
  });

  const draft = (id, createdAt) => ({
    id,
    created_at: createdAt,
    uan: '1234567890123456',
    date_of_birth: '1990-01-31'
  });

  test('should show most recently created drafts first without changing the input order', () => {
    const drafts = [
      draft(3, '2026-11-01T12:00:00Z'),
      draft(1, '2026-11-03T12:00:00Z'),
      draft(2, '2026-11-02T12:00:00Z')
    ];

    behaviour.setupRadioButtons(req, drafts);

    expect(
      req.form.options.fields['application-id'].options.map(
        option => option.value
      )
    ).toEqual(['1', '2', '3']);
    expect(drafts.map(record => record.id)).toEqual([3, 1, 2]);
  });

  test('should compare timestamps chronologically across time zones', () => {
    const drafts = [
      draft(1, '2026-11-03T12:00:00+02:00'),
      draft(2, '2026-11-03T11:00:00Z')
    ];

    behaviour.setupRadioButtons(req, drafts);

    expect(
      req.form.options.fields['application-id'].options.map(
        option => option.value
      )
    ).toEqual(['2', '1']);
  });

  test('should preserve API order when timestamps are equal', () => {
    const drafts = [
      draft(1, '2026-11-03T12:00:00Z'),
      draft(2, '2026-11-03T12:00:00Z')
    ];

    behaviour.setupRadioButtons(req, drafts);

    expect(
      req.form.options.fields['application-id'].options.map(
        option => option.value
      )
    ).toEqual(['1', '2']);
  });
});
