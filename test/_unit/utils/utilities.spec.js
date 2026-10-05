const { sanitiseFilename, validUniqueApplicationNumber } = require('../../../utils/index');

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

describe('validUniqueApplicationNumber', () => {
  test.each([
    '1234567890123456',
    '1234-5678-9012-3456',
    '12 34\t-5678\n-9012 -3456',
    '12345678901234567890'
  ])('accepts a valid UAN: %s', value => {
    expect(validUniqueApplicationNumber(value)?.[0]).toBe(value.replace(/\s+/g, ''));
  });

  test.each([
    '123456789012345',        // 15 digits
    '123456789012345678901',  // 21 digits
    '1234--5678-9012-3456',
    '-1234-5678-9012-3456',
    '1234-5678-9012-345x'
  ])('rejects an invalid UAN: %s', value => {
    expect(validUniqueApplicationNumber(value)).toBeNull();
  });

  test.each([undefined, null, ''])('returns null for a missing UAN: %s', value => {
    expect(validUniqueApplicationNumber(value)).toBeNull();
  });
});
