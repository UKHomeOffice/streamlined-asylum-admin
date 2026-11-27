'use strict';

const hof = require('hof');
const config = require('./config.js');
const busboy = require('busboy');
const { buffer } = require('node:stream/consumers');
const logger = require('hof/lib/logger')({ env: config.env });
const { sanitiseFilename } = require('./utils');

let settings = require('./hof.settings');

settings = Object.assign({}, settings, {
  behaviours: settings.behaviours.map(require),
  routes: settings.routes.map(require)
});

const app = hof(settings);

// temporary route for testing error page
// remove before merge
app.use('/test-error', (req, res, next) => {
  next(new Error('Local error-page test'));
});

app.use((req, res, next) => {
  res.locals.htmlLang = 'en';
  next();
});

app.use((req, res, next) => {
  if (!req.is('multipart/form-data')) {
    next();
    return;
  }

  req.files = req.files || {};
  req.body = req.body || {};
  const pendingFiles = [];
  let fileError;

  const bb = busboy({
    headers: req.headers,
    limits: {
      fileSize: config.upload.maxFileSizeInBytes
    }
  });

  bb.on('field', (key, value) => {
    req.body[key] = value;
  });

  bb.on('file', (key, file, fileInfo) => {
    logger.info(`Processing file: 
      filename: ${sanitiseFilename(fileInfo.filename)},
      encoding: ${fileInfo.encoding},
      mimeType: ${fileInfo.mimeType}`);

    if (!fileInfo.filename) {
      logger.warn(`File skipped due to missing filename for key: ${key}`);
      file.resume();
      return;
    }

    pendingFiles.push(
      buffer(file)
        .then(data => {
          req.files[key] = {
            data: file.truncated ? null : data,
            name: fileInfo.filename || null,
            encoding: fileInfo.encoding,
            mimetype: fileInfo.mimeType,
            truncated: file.truncated,
            size: Buffer.byteLength(data, 'binary')
          };
        })
        .catch(err => {
          const errorMessage = `Failed to process file during streaming operation: ${err}`;
          logger.error(errorMessage);
          fileError = fileError || new Error(errorMessage);
        })
    );
  });

  bb.on('error', err => {
    const errorMessage = `Error while parsing the form: ${err}`;
    logger.error(errorMessage);
    return next(new Error(errorMessage));
  });

  bb.on('finish', () => {
    // buffer() resolves asynchronously, so wait for every file before continuing
    Promise.all(pendingFiles).then(() => next(fileError));
  });

  req.pipe(bb);
});
app.use((req, res, next) => {
  const host = config.serviceUrl || req.get('host');
  const protocol = host.includes('localhost') ? 'http' : 'https';

  res.locals.formUrl = `${protocol}://${host}`;
  res.locals.htmlLang = 'en';
  res.locals.feedbackUrl = config.feedbackUrl;
  next();
});

module.exports = app;
