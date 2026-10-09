const {
  sanitiseFilename,
  validUniqueApplicationNumber,
  normaliseEmail,
  getNotifyErrorMessage,
  isTeamOnlyNotifyError
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
