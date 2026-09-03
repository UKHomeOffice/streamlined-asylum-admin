const { sanitiseFilename } = require('../../../utils/index');

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

  test('should return undefined when no filename is provided', () => {
    expect(sanitiseFilename(undefined)).toBeUndefined();
  });
});
