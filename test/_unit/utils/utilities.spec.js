const mockLogger = { error: jest.fn() };

jest.mock('hof/lib/logger', () => jest.fn(() => mockLogger));

const loggerFactory = require('hof/lib/logger');
const {
  sanitiseFilename,
  normaliseEmail,
  getNotifyErrorMessage,
  isTeamOnlyNotifyError,
  formatDate,
  formatUploadedDocuments,
  isValidUan,
  formatUanForDisplay,
  logAndThrow
} = require('../../../utils/index');

describe('SAA utilities tests', () => {
  test('should redact the middle of a filename while keeping the start and extension visible', () => {
    expect(sanitiseFilename('passport-scan.pdf')).toBe('pa**REDACTED**an.pdf');
  });

  describe('formatUploadedDocuments', () => {
    const req = { translate: jest.fn() };

    beforeEach(() => {
      req.translate.mockReset().mockReturnValue('No files uploaded');
    });

    test.each([[undefined], [null], [[]]])(
      'translates the empty value %p',
      documents => {
        expect(formatUploadedDocuments(documents, req)).toBe(
          'No files uploaded'
        );
        expect(req.translate).toHaveBeenCalledWith(
          'fields.file-upload.no-files-uploaded'
        );
        expect(req.translate).toHaveBeenCalledTimes(1);
      }
    );

    test('preserves uploaded filenames and their order without translating', () => {
      const documents = [{ name: 'letter.pdf' }, { name: 'photo.png' }];
      const original = structuredClone(documents);

      expect(formatUploadedDocuments(documents, req)).toBe(
        'letter.pdf\nphoto.png'
      );
      expect(req.translate).not.toHaveBeenCalled();
      expect(documents).toEqual(original);
    });

    test('uses the requested translation rather than hard-coded fallback text', () => {
      req.translate.mockReturnValue('Translated empty-upload message');

      expect(formatUploadedDocuments([], req)).toBe(
        'Translated empty-upload message'
      );
    });
  });

  test('should preserve the final two characters before the extension', () => {
    expect(sanitiseFilename('evidence-final-v2.docx')).toBe(
      'ev**REDACTED**v2.docx'
    );
  });

  test('should return the original filename when it does not include an extension', () => {
    expect(sanitiseFilename('test*64_jdgfh')).toBe('test*64_jdgfh');
  });

  test('should return the original filename when there are fewer than four characters before the extension', () => {
    expect(sanitiseFilename('abc.pdf')).toBe('abc.pdf');
  });

  test('should return the original filename when the extension is empty', () => {
    expect(sanitiseFilename('passport-scan.')).toBe('passport-scan.');
  });

  test('should return undefined when no filename is provided', () => {
    expect(sanitiseFilename(undefined)).toBeUndefined();
    expect(sanitiseFilename(null)).toBeUndefined();
  });
});

describe('getNotifyErrorMessage', () => {
  test('should prefer the first response message over the error message', () => {
    expect(
      getNotifyErrorMessage({
        message: 'Notify request failed',
        response: { data: { errors: [{ message: 'Invalid API key' }] } }
      })
    ).toBe('Invalid API key');
  });

  test('should fall back to the error message', () => {
    expect(getNotifyErrorMessage(new Error('Notify unavailable'))).toBe(
      'Notify unavailable'
    );
    expect(
      getNotifyErrorMessage({
        message: 'Notify unavailable',
        response: { data: { errors: [] } }
      })
    ).toBe('Notify unavailable');
  });

  test.each([undefined, null, {}, { response: { data: { errors: [{}] } } }])(
    'should return undefined when no message is available: %j',
    error => {
      expect(getNotifyErrorMessage(error)).toBeUndefined();
    }
  );
});

describe('isTeamOnlyNotifyError', () => {
  const message = 'Can\u2019t send to this recipient using a team-only API key';

  test('should match the first Notify response error message', () => {
    const error = {
      message: 'Notify request failed',
      response: { data: { errors: [{ message }] } }
    };

    expect(isTeamOnlyNotifyError(error)).toBe(true);
  });

  test('should fall back to the error message when the response is missing', () => {
    expect(isTeamOnlyNotifyError(new Error(message))).toBe(true);
  });

  test('should fall back to the error message when response errors are empty', () => {
    expect(
      isTeamOnlyNotifyError({
        message,
        response: { data: { errors: [] } }
      })
    ).toBe(true);
  });

  test('should prefer the response message over the error message', () => {
    expect(
      isTeamOnlyNotifyError({
        message,
        response: { data: { errors: [{ message: 'Invalid API key' }] } }
      })
    ).toBe(false);
  });

  test.each([
    'Notify unavailable',
    "Can't send to this recipient using a team-only API key"
  ])('should reject a non-matching message: %s', value => {
    expect(isTeamOnlyNotifyError(new Error(value))).toBe(false);
    expect(
      isTeamOnlyNotifyError({
        response: { data: { errors: [{ message: value }] } }
      })
    ).toBe(false);
  });

  test.each([
    undefined,
    null,
    {},
    { response: {} },
    { response: { data: {} } },
    { response: { data: { errors: [] } } },
    { response: { data: { errors: [{}] } } }
  ])('should return false for missing message data: %j', error => {
    expect(isTeamOnlyNotifyError(error)).toBe(false);
  });
});

describe('normaliseEmail', () => {
  test('should lower case an email address', () => {
    expect(normaliseEmail('PERSON@EXAMPLE.COM')).toBe('person@example.com');
  });

  test('should trim surrounding whitespace from an email address', () => {
    expect(normaliseEmail('  Person@Example.com\t\n')).toBe(
      'person@example.com'
    );
  });

  test('should return an empty string for a whitespace-only email address', () => {
    expect(normaliseEmail('   ')).toBe('');
  });

  test('should return an empty string when an email address is not provided', () => {
    expect(normaliseEmail(undefined)).toBe('');
    expect(normaliseEmail(null)).toBe('');
    expect(normaliseEmail('')).toBe('');
  });

  test('should return an empty string when the email address is not a string', () => {
    expect(normaliseEmail(123)).toBe('');
  });
});

describe('formatUanForDisplay', () => {
  test.each([
    undefined,
    null,
    1234,
    false,
    {},
    [],
    '',
    '   ',
    '--',
    ' \t-\u2013\u2014\n ',
    '1212-       1212  - 1212 1212',
    '1212-1212-1212-1212',
    ' 1212\t1212\n1212 1212 ',
    '--1212--1212--1212--1212--',
    '1212\u20131212\u20141212-1212',
    '1234abcd56789012',
    '123456789012345',
    '12345678901234567',
    '12345678901234567890',
    '1234567890123456\n',
    1234567890123456,
    '1',
    '123',
    '1234'
  ])('should reject input %p unless it is a 16-digit string', value => {
    expect(isValidUan(value)).toBe(false);
    expect(() => formatUanForDisplay(value)).toThrow(new Error('Invalid UAN'));
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Cannot format UAN: expected a 16-digit string'
    );
  });

  test.each([
    ['1234567890123456', '1234-5678-9012-3456'],
    ['0000123456789012', '0000-1234-5678-9012']
  ])('should format UAN %s as %s', (value, expected) => {
    expect(isValidUan(value)).toBe(true);
    expect(formatUanForDisplay(value)).toBe(expected);
  });
});

describe('logAndThrow', () => {
  beforeEach(() => {
    mockLogger.error.mockReset();
    loggerFactory.mockReturnValue(mockLogger);
  });

  test('should log the internal message once and throw the public message', () => {
    expect(() => logAndThrow('Internal failure', 'Unable to continue')).toThrow(
      new Error('Unable to continue')
    );
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith('Internal failure');
  });

  test('should include metadata only in the log', () => {
    const meta = { applicationId: 'application-a' };

    expect(() =>
      logAndThrow('Internal failure', 'Unable to continue', meta)
    ).toThrow(new Error('Unable to continue'));
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith('Internal failure', meta);
  });

  test.each([undefined, ''])(
    'should fall back to the internal message when the public message is %p',
    publicMessage => {
      expect(() => logAndThrow('Internal failure', publicMessage)).toThrow(
        new Error('Internal failure')
      );
      expect(mockLogger.error).toHaveBeenCalledWith('Internal failure');
    }
  );

  test.each([undefined, null, {}, { error: 'not a function' }])(
    'should still throw when error logging is unavailable: %p',
    logger => {
      loggerFactory.mockReturnValueOnce(logger);

      jest.isolateModules(() => {
        const {
          logAndThrow: isolatedLogAndThrow
        } = require('../../../utils/index');

        expect(() =>
          isolatedLogAndThrow('Internal failure', 'Unable to continue')
        ).toThrow(new Error('Unable to continue'));
      });
      expect(mockLogger.error).not.toHaveBeenCalled();
    }
  );
});

describe('formatDate', () => {
  test.each([
    ['2020-03-27', '27 March 2020'],
    ['2020-03-01', '01 March 2020']
  ])('formats %s as %s', (value, expected) => {
    expect(formatDate(value)).toBe(expected);
  });

  test('formats a Date object', () => {
    expect(formatDate(new Date(2020, 2, 27))).toBe('27 March 2020');
  });

  test.each([
    ['not-a-date'],
    [''],
    [undefined],
    [null],
    [20200327],
    [new Date('invalid')]
  ])('throws for an invalid date: %p', value => {
    expect(() => formatDate(value)).toThrow('Invalid date value');
  });
});
