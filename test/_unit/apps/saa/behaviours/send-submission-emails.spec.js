jest.mock('../../../../../config', () => ({
  govukNotify: {
    notifyApiKey: 'notify-key',
    emailTemplates: {
      submissionConfirmationTemplateId: 'submission-template-id'
    },
    caseworkerEmail: 'Caseworker@Example.com'
  },
  env: 'test'
}));

jest.mock('hof/components/notify/notify', () =>
  jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn()
  }))
);

jest.mock('hof/lib/logger', () => {
  const log = { log: jest.fn(), error: jest.fn() };
  return jest.fn(() => log);
});

const Notify = require('hof/components/notify/notify');
const logger = require('hof/lib/logger');
const SendSubmissionEmails = require('../../../../../apps/saa/behaviours/send-submission-emails');
const { formatSummaryForEmail } = SendSubmissionEmails;

describe('send submission emails behaviour', () => {
  const notifyClient = Notify.mock.results[0].value;
  const log = logger.mock.results[0].value;
  const baseSaveValues = jest.fn();
  const rows = [
    {
      section: 'Your details',
      fields: [{ label: 'Email', value: 'person@example.com' }]
    }
  ];

  class BaseBehaviour {
    saveValues(req, res, next) {
      return baseSaveValues(req, res, next);
    }
    getRowsForSummarySections() {
      return rows;
    }
  }

  const Behaviour = SendSubmissionEmails(BaseBehaviour);
  let behaviour;
  let next;
  let req;
  let session;

  beforeEach(() => {
    behaviour = new Behaviour();
    next = jest.fn();
    session = {
      'application-reference': 'COC-HV12YT3344',
      'user-email': 'Person@Example.com',
      'claimants-given-name': 'Jane',
      'claimants-family-name': 'Doe',
      'send-evidence-for-your-claim': 'yes',
      'change-personal-details': 'no',
      'add-remove-dependant': 'yes',
      'someone-on-claim-died': 'no'
    };
    req = {
      sessionModel: {
        get: jest.fn(key => session[key]),
        set: jest.fn((key, value) => { session[key] = value; })
      }
    };
    baseSaveValues.mockReset();
    baseSaveValues.mockImplementation((request, response, callback) => callback());
    notifyClient.sendEmail.mockReset();
    notifyClient.sendEmail.mockResolvedValue();
    log.error.mockReset();
  });

  test('sends the caseworker email with information types and the user email without them', async () => {
    await behaviour.saveValues(req, {}, next);

    const common = {
      submission_ref: 'COC-HV12YT3344',
      claimant_full_name: 'Jane Doe',
      submission_summary: '## Your details\n\nEmail: person@example.com'
    };
    expect(notifyClient.sendEmail).toHaveBeenNthCalledWith(
      1,
      'submission-template-id',
      'caseworker@example.com',
      {
        ...common,
        show_information_types: 'yes',
        information_types: [
          'Evidence to help your claim (Webform-EVI101)',
          'Add or remove dependant (Webform-DEP101)'
        ]
      }
    );
    expect(notifyClient.sendEmail).toHaveBeenNthCalledWith(
      2,
      'submission-template-id',
      'person@example.com',
      { ...common, show_information_types: 'no', information_types: '' }
    );
    expect(req.sessionModel.get.mock.calls.filter(([key]) => key === 'application-reference')).toHaveLength(1);
    expect(req.sessionModel.set).toHaveBeenCalledWith('application-reference', 'COC-HV12YT3344');
    expect(next).toHaveBeenCalledWith();
  });

  test('does not send emails when saving fails', async () => {
    const error = new Error('save failed');
    baseSaveValues.mockImplementation((request, response, callback) => callback(error));

    await behaviour.saveValues(req, {}, next);

    expect(notifyClient.sendEmail).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });

  test('passes an error to next when the user email is missing', async () => {
    delete session['user-email'];

    await behaviour.saveValues(req, {}, next);

    expect(notifyClient.sendEmail).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('does not send emails when the submission reference is missing', async () => {
    delete session['application-reference'];

    await expect(behaviour.sendSubmissionEmails(req)).rejects.toThrow('Submission reference is missing');

    expect(notifyClient.sendEmail).not.toHaveBeenCalled();
  });

  test('logs and propagates Notify errors without emailing the user', async () => {
    const error = new Error('Notify request failed');
    error.response = { data: { errors: [{ message: 'Invalid template' }] } };
    notifyClient.sendEmail.mockRejectedValue(error);

    await behaviour.saveValues(req, {}, next);

    expect(notifyClient.sendEmail).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith('Submission email flow failed: Invalid template');
    expect(next).toHaveBeenCalledWith(new Error('Invalid template'));
  });

  test('formatSummaryForEmail handles aggregated items with h2 headers and dividers', () => {
    const output = formatSummaryForEmail([
      {
        section: 'Add or remove dependants',
        fields: [
          { label: 'Do you need to add or remove?', value: 'Yes' },
          { isAggregatorTitle: true, value: 'Add a child or partner as a dependant' },
          { label: 'How are they related?', value: 'My child' },
          { label: 'Their name', value: 'Child Name' },
          { isAggregatorTitle: true, value: 'Remove a child or partner as a dependant' },
          { label: 'Why removing?', value: 'Gone' },
          { label: 'Their name', value: 'Old Name' }
        ]
      }
    ]);

    expect(output).toContain('## Add or remove dependants');
    expect(output).toContain('Do you need to add or remove?: Yes');
    expect(output).toContain('## Add a child or partner as a dependant');
    expect(output).toContain('How are they related?: My child');
    expect(output).toContain('## Remove a child or partner as a dependant');
    expect(output).toContain('Why removing?: Gone');
    expect(output).toMatch(/---\n\n## Remove/);
  });

  test('formatSummaryForEmail converts file names to links when documents are provided', () => {
    const output = formatSummaryForEmail(
      [
        {
          section: 'Evidence',
          fields: [{ label: 'Files uploaded', value: 'passport.pdf\nbirthcert.pdf' }]
        }
      ],
      {
        documents: [
          { name: 'passport.pdf', url: 'https://example.com/file1' },
          { name: 'birthcert.pdf', url: 'https://example.com/file2' }
        ]
      }
    );

    expect(output).toContain('## Evidence');
    expect(output).toContain('Files uploaded:');
    expect(output).toContain('[passport.pdf](https://example.com/file1)');
    expect(output).toContain('[birthcert.pdf](https://example.com/file2)');
  });

  test('formatSummaryForEmail keeps dollar-sign sequences in file names literal', () => {
    const output = formatSummaryForEmail(
      [{ section: 'Evidence', fields: [{ label: 'Files uploaded', value: 'evidence-$&.pdf' }] }],
      { documents: [{ name: 'evidence-$&.pdf', url: 'https://example.com/file1' }] }
    );

    expect(output).toContain('Files uploaded: [evidence-$&.pdf](https://example.com/file1)');
  });

  test('sends caseworker email with links and user email without links', async () => {
    session['documents-new-name'] = [
      { name: 'passport.pdf', url: 'https://example.com/file1' }
    ];

    const behaviorInstance = new Behaviour();
    behaviorInstance.getRowsForSummarySections = jest.fn().mockReturnValue([
      {
        section: 'Evidence',
        fields: [{ label: 'Files uploaded', value: 'passport.pdf' }]
      }
    ]);

    await behaviorInstance.saveValues(req, {}, next);

    const caseworkerCall = notifyClient.sendEmail.mock.calls[0];
    const userCall = notifyClient.sendEmail.mock.calls[1];

    expect(caseworkerCall[2].submission_summary).toContain(
      '[passport.pdf]'
    );
    expect(userCall[2].submission_summary).not.toContain('[');
    expect(next).toHaveBeenCalledWith();
  });
});
