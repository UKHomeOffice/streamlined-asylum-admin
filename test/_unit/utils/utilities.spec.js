const mockLogger = { error: jest.fn() };

jest.mock('hof/lib/logger', () => jest.fn(() => mockLogger));

const loggerFactory = require('hof/lib/logger');
const {
  sanitiseFilename,
  validUniqueApplicationNumber,
  normaliseEmail,
  getNotifyErrorMessage,
  isTeamOnlyNotifyError,
  formatDate,
  formatUanForDisplay,
  logAndThrow
} = require('../../../utils/index');

describe('SAA utilities tests', () => {
  test('should redact the middle of a filename while keeping the start and extension visible', () => {
    expect(sanitiseFilename('passport-scan.pdf')).toBe('pa**REDACTED**an.pdf');
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

describe('validUniqueApplicationNumber', () => {
  test.each([
    '1234567890123456',
    '1234-5678-9012-3456',
    '12 34\t-5678\n-9012 -3456',
    '12345678901234567890',
    '1234 - 5678 - 9012 - 3456 - 7890'
  ])('accepts a valid UAN: %s', value => {
    expect(validUniqueApplicationNumber(value)?.[0]).toBe(
      value.replace(/\s+/g, '')
    );
  });

  test.each([
    '123456789012345', // 15 digits
    '123456789012345678901', // 21 digits
    '1234--5678-9012-3456',
    '-1234-5678-9012-3456',
    '1234-5678-9012-345x'
  ])('rejects an invalid UAN: %s', value => {
    expect(validUniqueApplicationNumber(value)).toBeNull();
  });

  test.each([undefined, null, ''])(
    'returns null for a missing UAN: %s',
    value => {
      expect(validUniqueApplicationNumber(value)).toBeNull();
    }
  );

  test('should lower case an email address', () => {
    expect(normaliseEmail('PERSON@EXAMPLE.COM')).toBe('person@example.com');
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
    ['1234567890123456', '1234-5678-9012-3456'],
    ['12345678901234567890', '1234-5678-9012-3456-7890'],
    ['0000123456789012', '0000-1234-5678-9012']
  ])('should format UAN %s as %s', (value, expected) => {
    expect(formatUanForDisplay(value)).toBe(expected);
  });

  test.each(['1', '123', '1234'])(
    'should leave a single group unchanged: %s',
    value => {
      expect(formatUanForDisplay(value)).toBe(value);
    }
  );

  test('should preserve a final group shorter than four digits', () => {
    expect(formatUanForDisplay('12345678901234567')).toBe(
      '1234-5678-9012-3456-7'
    );
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
