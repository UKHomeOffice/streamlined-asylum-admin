/**
 * Redacts the middle of a filename while preserving its first two characters,
 * final two basename characters, and extension.
 *
 * @param {string|null|undefined} filename - The filename to sanitise.
 * @returns {string|undefined} The sanitised filename, or undefined if omitted.
 */
const sanitiseFilename = filename => {
  if (filename === undefined || filename === null) {
    return undefined;
  }

  const extensionSeparator = filename.lastIndexOf('.');

  if (extensionSeparator < 4 || extensionSeparator === filename.length - 1) {
    return filename;
  }

  return `${filename.slice(0, 2)}**REDACTED**${filename.slice(
    extensionSeparator - 2
  )}`;
};

module.exports = {
  sanitiseFilename
};
