'use strict';

const fs = require('node:fs');
const path = require('node:path');
const uploadConfig = require('../../../assets/js/file-upload-config');

// Inspect route wiring without connecting to Redis or uploading files.
jest.mock(
  '../../../apps/saa/behaviours/check-email-token',
  () => superclass => superclass
);
jest.mock('../../../apps/saa/behaviours/save-document', () =>
  jest.fn((category, fieldName) => `save:${category}:${fieldName}`)
);
jest.mock('../../../apps/saa/behaviours/remove-document', () =>
  jest.fn(category => `remove:${category}`)
);

const app = require('../../../apps/saa');

describe('file upload configuration', () => {
  test('configures child/partner evidence with a six-file limit', () => {
    expect(uploadConfig.documentCategories['documents-child-partner']).toEqual({
      limit: 6,
      limitValidationError: 'fileCountLimit'
    });
  });

  test('wires the child/partner evidence route to its upload category', () => {
    const step = app.steps['/evidence-child-partner'];

    expect(step.fields).toEqual(['file-upload']);
    expect(step.behaviours).toEqual([
      'save:documents-child-partner:file-upload',
      'remove:documents-child-partner'
    ]);
    expect(step.locals.documentCategory).toMatchObject({
      name: 'documents-child-partner',
      limit: 6,
      limitValidationError: 'fileCountLimit'
    });
  });

  test('keeps the file-vault extension whitelist aligned with the application', () => {
    const deployment = fs.readFileSync(
      path.resolve(
        __dirname,
        '../../../kube/file-vault/file-vault-deployment.yml'
      ),
      'utf8'
    );
    const whitelist = deployment.match(
      /- name: FILE_EXTENSION_WHITELIST\s+value: "([^"]+)"/
    );

    expect(whitelist).not.toBeNull();
    // File-vault expects whitelist entries without the leading dot
    expect(whitelist[1]).toBe(
      uploadConfig.acceptedFileExtensions.replaceAll('.', '')
    );
  });
});
