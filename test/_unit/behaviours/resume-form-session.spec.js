jest.mock('../../../utils/application-service', () => ({
  findApplicationsByEmail: jest.fn()
}));

jest.mock('../../../utils', () => ({
  formatDate: jest.fn(value => value),
  formatUanForDisplay: jest.fn(value => value),
  logAndThrow: jest.fn((message, publicMessage) => {
    throw new Error(publicMessage || message);
  })
}));

jest.mock('../../../config', () => ({
  sessionDefaults: {
    preservedKeys: ['csrf-secret', 'user-email', 'valid-token'],
    preservedSteps: ['/continue-to-form', '/which-form'],
    excludedSnapshotKeys: [
      'csrf-secret',
      'user-email',
      'valid-token',
      'errors',
      'errorValues'
    ]
  }
}));

const {
  findApplicationsByEmail
} = require('../../../utils/application-service');
const {
  formatDate,
  formatUanForDisplay,
  logAndThrow
} = require('../../../utils');
const ResumeFormSession = require('../../../apps/saa/behaviours/resume-form-session');

describe('resume form session behaviour', () => {
  const baseConfigure = jest.fn();
  const baseSaveValues = jest.fn();
  const baseGetValues = jest.fn();
  class BaseBehaviour {
    configure(req, res, next) {
      return baseConfigure(req, res, next);
    }

    getValues(req, res, next) {
      return baseGetValues(req, res, next);
    }

    saveValues(req, res, next) {
      return baseSaveValues(req, res, next);
    }
  }
  const Behaviour = ResumeFormSession(BaseBehaviour);
  let behaviour;
  let req;
  let res;
  let next;
  let session;

  beforeEach(() => {
    behaviour = new Behaviour();
    behaviour.emit = jest.fn();
    behaviour.getNextStep = jest
      .fn()
      .mockReturnValue('/changes/information-given');
    session = {
      'user-email': 'person@example.com',
      'valid-token': true,
      'csrf-secret': 'current-secret',
      'application-id': 9,
      'claimants-given-name': 'Previous',
      'old-answer': 'previous application only',
      errors: { field: 'previous error' },
      errorValues: { field: 'previous value' },
      steps: ['/continue-to-form', '/which-form', '/previous-application']
    };
    req = {
      method: 'GET',
      form: { values: {}, options: { fields: {} } },
      sessionModel: {
        get: jest.fn(key => session[key]),
        toJSON: jest.fn(() => structuredClone(session)),
        unset: jest.fn(keys => keys.forEach(key => delete session[key])),
        set: jest.fn(values => Object.assign(session, values))
      },
      log: jest.fn()
    };
    res = { redirect: jest.fn() };
    next = jest.fn();
    findApplicationsByEmail.mockReset();
    findApplicationsByEmail.mockResolvedValue([]);
    baseConfigure.mockReset();
    baseSaveValues.mockReset();
    baseGetValues.mockReset();
    baseGetValues.mockImplementation((request, response, callback) => {
      const values = request.sessionModel.toJSON();
      delete values.errorValues;
      callback(null, { ...values, ...request.sessionModel.get('errorValues') });
    });
  });

  const draft = (id, createdAt) => ({
    id,
    created_at: createdAt,
    uan: '1234567890123456',
    date_of_birth: '1990-01-31'
  });

  test('should retain the selected radio when returning after loading an application', async () => {
    const drafts = [
      { ...draft(1, '2026-11-03T12:00:00Z'), session: { answer: 'saved' } },
      { ...draft(2, '2026-11-02T12:00:00Z'), session: {} }
    ];
    findApplicationsByEmail.mockResolvedValue(drafts);
    req.method = 'POST';
    await behaviour.configure(req, res, next);
    req.form.values['application-id'] = '1';
    behaviour.saveValues(req, res, next);

    req.method = 'GET';
    await behaviour.configure(req, res, next);
    const callback = jest.fn();
    behaviour.getValues(req, res, callback);

    const [error, values] = callback.mock.calls[0];
    expect(error).toBeNull();
    expect(values['application-id']).toBe(
      req.form.options.fields['application-id'].options[0].value
    );
    expect(session['application-id']).toBe(1);
    expect(session.answer).toBe('saved');
  });

  test.each([0, '9', undefined, null])(
    'should normalise display ID %p without changing the session',
    id => {
      session['application-id'] = id;
      const original = structuredClone(session);

      behaviour.getValues(req, res, next);

      expect(next).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          'application-id': id === undefined || id === null ? id : String(id)
        })
      );
      expect(session).toEqual(original);
    }
  );

  test('should preserve the validation-error selection instead of the loaded application ID', () => {
    session.errorValues = { 'application-id': '2' };

    behaviour.getValues(req, res, next);

    expect(next).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ 'application-id': '2' })
    );
    expect(session['application-id']).toBe(9);
  });

  test('should forward superclass getValues errors', () => {
    const error = new Error('Values unavailable');
    baseGetValues.mockImplementation((request, response, callback) =>
      callback(error)
    );

    behaviour.getValues(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
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

  test('should configure required radio options with formatted labels and hints', () => {
    formatUanForDisplay.mockReturnValueOnce('1234-5678-9012-3456');
    formatDate.mockReturnValueOnce('31 January 1990');

    behaviour.setupRadioButtons(req, [draft(1, '2026-11-03T12:00:00Z')]);

    expect(formatUanForDisplay).toHaveBeenCalledWith('1234567890123456');
    expect(formatDate).toHaveBeenCalledWith('1990-01-31');
    expect(req.form.options.fields['application-id']).toEqual({
      mixin: 'radio-group',
      validate: ['required'],
      legend: { className: 'visuallyhidden' },
      options: [
        {
          label: '1234-5678-9012-3456',
          value: '1',
          useHintText: true,
          hint: 'Date of birth 31 January 1990'
        }
      ]
    });
  });

  test('should use an empty date hint when the formatter returns no value', () => {
    formatDate.mockReturnValueOnce(undefined);

    behaviour.setupRadioButtons(req, [draft(1, '2026-11-03T12:00:00Z')]);

    expect(req.form.options.fields['application-id'].options[0].hint).toBe(
      'Date of birth '
    );
  });

  test.each([0, 2])(
    'should configure the GET selection page for %p drafts',
    async count => {
      const drafts = Array.from({ length: count }, (value, index) =>
        draft(index + 1, '2026-11-03T12:00:00Z')
      );
      findApplicationsByEmail.mockResolvedValue(drafts);

      await behaviour.configure(req, res, next);

      expect(findApplicationsByEmail).toHaveBeenCalledWith(
        'person@example.com'
      );
      expect(req.drafts).toBe(drafts);
      expect(req.form.options.fields['application-id'].options).toHaveLength(
        count
      );
      expect(baseConfigure).toHaveBeenCalledWith(req, res, next);
      expect(req.sessionModel.set).not.toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    }
  );

  test('should automatically load the only draft on GET and complete the step', async () => {
    findApplicationsByEmail.mockResolvedValue([
      { id: 1, session: { answer: 'saved' } }
    ]);

    await behaviour.configure(req, res, next);

    expect(session).toEqual(
      expect.objectContaining({ 'application-id': 1, answer: 'saved' })
    );
    expect(behaviour.emit).toHaveBeenCalledWith('complete', req, res);
    expect(behaviour.getNextStep).toHaveBeenCalledWith(req, res);
    expect(res.redirect).toHaveBeenCalledWith('/changes/information-given');
    expect(baseConfigure).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('should configure radios on POST even when only one draft remains', async () => {
    req.method = 'POST';
    const drafts = [draft(1, '2026-11-03T12:00:00Z')];
    findApplicationsByEmail.mockResolvedValue(drafts);

    await behaviour.configure(req, res, next);

    expect(req.drafts).toBe(drafts);
    expect(req.form.options.fields['application-id'].options[0].value).toBe(
      '1'
    );
    expect(baseConfigure).toHaveBeenCalledWith(req, res, next);
    expect(req.sessionModel.set).not.toHaveBeenCalled();
    expect(behaviour.emit).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('should reject a missing verified email before fetching drafts', async () => {
    delete session['user-email'];

    await behaviour.configure(req, res, next);

    expect(logAndThrow).toHaveBeenCalledWith(
      'Cannot fetch applications without a verified email',
      'Email is required.'
    );
    expect(next).toHaveBeenCalledWith(new Error('Email is required.'));
    expect(findApplicationsByEmail).not.toHaveBeenCalled();
    expect(baseConfigure).not.toHaveBeenCalled();
  });

  test('should pass lookup failures to next without configuring the page', async () => {
    const error = new Error('Lookup failed');
    findApplicationsByEmail.mockRejectedValue(error);

    await behaviour.configure(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(baseConfigure).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('should pass automatic loading failures to next without clearing answers', async () => {
    findApplicationsByEmail.mockResolvedValue([{ id: 1, session: '{invalid' }]);

    await behaviour.configure(req, res, next);

    expect(next).toHaveBeenCalledWith(
      new Error('Saved application session could not be read')
    );
    expect(req.sessionModel.unset).not.toHaveBeenCalled();
    expect(behaviour.emit).not.toHaveBeenCalled();
    expect(baseConfigure).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('should load the selected draft and remove the radio value before superclass saving', () => {
    req.form.values = { 'application-id': '2', answer: 'submitted' };
    req.drafts = [
      { id: 1, session: { answer: 'wrong draft' } },
      { id: 2, session: { answer: 'selected draft' } }
    ];
    baseSaveValues.mockImplementation(request => {
      expect(request.form.values).toEqual({ answer: 'submitted' });
      expect(session['application-id']).toBe(2);
    });

    behaviour.saveValues(req, res, next);

    expect(session.answer).toBe('selected draft');
    expect(baseSaveValues).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  test.each([undefined, '', '99'])(
    'should reject an unavailable selection %p without loading or saving',
    selected => {
      req.form.values['application-id'] = selected;
      req.drafts = [{ id: 1, session: {} }];

      behaviour.saveValues(req, res, next);

      expect(next).toHaveBeenCalledWith(
        new Error('Selected application could not be found')
      );
      expect(logAndThrow).toHaveBeenCalledWith(
        "Selected application is not among the verified user's drafts",
        'Selected application could not be found'
      );
      expect(req.sessionModel.unset).not.toHaveBeenCalled();
      expect(baseSaveValues).not.toHaveBeenCalled();
    }
  );

  test('should pass selected snapshot parsing errors to next without superclass saving', () => {
    req.form.values['application-id'] = '1';
    req.drafts = [{ id: 1, session: '{invalid' }];

    behaviour.saveValues(req, res, next);

    expect(next).toHaveBeenCalledWith(
      new Error('Saved application session could not be read')
    );
    expect(req.sessionModel.unset).not.toHaveBeenCalled();
    expect(baseSaveValues).not.toHaveBeenCalled();
  });

  test.each(['object', 'JSON string'])(
    'should restore a %s snapshot while preserving current authentication',
    representation => {
      const saved = {
        'application-id': 100,
        'claimants-given-name': 'Selected',
        'claimant-unique-application-number': '1234567890123456',
        'claimant-date-of-birth': '1990-01-31',
        'user-email': 'untrusted@example.com',
        'valid-token': false,
        'csrf-secret': 'saved-secret',
        errors: { field: 'saved error' },
        errorValues: { field: 'saved value' },
        steps: ['/which-form', '/claimants-name', '/claimants-name']
      };
      const original = structuredClone(saved);

      behaviour.loadApplication(req, {
        id: 1,
        session: representation === 'object' ? saved : JSON.stringify(saved)
      });

      expect(session).toEqual({
        'application-id': 1,
        'claimants-given-name': 'Selected',
        'claimant-unique-application-number': '1234567890123456',
        'claimant-date-of-birth': '1990-01-31',
        'user-email': 'person@example.com',
        'valid-token': true,
        'csrf-secret': 'current-secret',
        steps: ['/continue-to-form', '/which-form', '/claimants-name']
      });
      expect(saved).toEqual(original);
      expect(req.log).toHaveBeenCalledWith('info', 'Resuming application 1');
    }
  );

  test.each([9, '9'])(
    'should leave live answers untouched when draft %p is already loaded',
    id => {
      const original = structuredClone(session);

      behaviour.loadApplication(req, { id, session: '{invalid' });

      expect(session).toEqual(original);
      expect(req.sessionModel.unset).not.toHaveBeenCalled();
      expect(req.sessionModel.set).not.toHaveBeenCalled();
      expect(req.log).not.toHaveBeenCalled();
    }
  );

  test.each([undefined, null, 'null', {}])(
    'should load an empty snapshot %p without retaining previous application answers',
    saved => {
      delete session.steps;

      behaviour.loadApplication(req, { id: 1, session: saved });

      expect(session).toEqual({
        'application-id': 1,
        'user-email': 'person@example.com',
        'valid-token': true,
        'csrf-secret': 'current-secret',
        steps: []
      });
    }
  );

  test.each(['', '{invalid'])(
    'should report corrupt snapshot %p before changing the live session',
    saved => {
      const original = structuredClone(session);

      expect(() =>
        behaviour.loadApplication(req, { id: 1, session: saved })
      ).toThrow('Saved application session could not be read');

      expect(logAndThrow).toHaveBeenCalledWith(
        'Failed to read saved application session',
        'Saved application session could not be read',
        { applicationId: 1 }
      );
      expect(session).toEqual(original);
      expect(req.sessionModel.unset).not.toHaveBeenCalled();
      expect(req.sessionModel.set).not.toHaveBeenCalled();
    }
  );

  test('should clear all previous application keys except preserved session keys', () => {
    behaviour.clearPreviousApplication(req);

    expect(req.sessionModel.unset).toHaveBeenCalledWith([
      'application-id',
      'claimants-given-name',
      'old-answer',
      'errors',
      'errorValues',
      'steps'
    ]);
    expect(session).toEqual({
      'user-email': 'person@example.com',
      'valid-token': true,
      'csrf-secret': 'current-secret'
    });
  });
});
