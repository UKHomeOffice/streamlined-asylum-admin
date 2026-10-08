'use strict';

const path = require('node:path');

const commonApp = require('../../../apps/common');
const saaApp = require('../../../apps/saa');

// Mirrors the NAXSI core rule 1000 "sql keywords" pattern
const NAXSI_SQL_KEYWORDS = new RegExp(
  `\\b(${[
    'select', 'union', 'update', 'delete', 'insert', 'table', 'from', 'ascii',
    'hex', 'unhex', 'drop', 'load_file', 'substr', 'group_concat', 'dumpfile'
  ].join('|')})\\b`,
  'i'
);

const rootDir = path.resolve(__dirname, '../../..');
const apps = [commonApp, saaApp];

const stepPaths = apps.flatMap(app =>
  Object.keys({ ...app.steps, ...app.pages }).map(step => path.posix.join(app.baseUrl, step))
);

const fieldNames = [...new Set(apps.flatMap(app => [
  ...Object.keys(require(path.join(rootDir, app.fields))),
  ...Object.values(app.steps).flatMap(step => step.fields || [])
]))];

describe('NAXSI rule 1000 (SQL keywords)', () => {
  test.each(stepPaths)('step path %s does not contain a SQL keyword', stepPath => {
    expect(stepPath).not.toMatch(NAXSI_SQL_KEYWORDS);
  });

  test.each(fieldNames)('field name %s does not contain a SQL keyword', fieldName => {
    expect(fieldName).not.toMatch(NAXSI_SQL_KEYWORDS);
  });
});
