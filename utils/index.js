const sanitiseFilename = filename =>
  filename?.replace(/^(.{2}).*(.{2}\.[^.]+)$/, '$1**REDACTED**$2');

module.exports = {
  sanitiseFilename
};
