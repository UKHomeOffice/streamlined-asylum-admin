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
  test('defaults to required uploads and a six-file limit', () => {
    expect(uploadConfig.required).toBe(true);
    expect(uploadConfig.limit).toBe(6);
    expect(uploadConfig.limitValidationError).toBe('fileCountLimit');
  });

  test('only requires photo identity and supporting evidence', () => {
    const requiredCategories = [
      ...Object.keys(uploadConfig.documentCategories),
      'documents-update-contact',
      'documents-help-your-claim'
    ].filter(name =>
      uploadConfig.documentCategories[name]?.required ?? uploadConfig.required
    );

    expect(requiredCategories).toEqual([
      'documents-update-contact',
      'documents-help-your-claim'
    ]);
  });

  test.each([
    ['/new-name-evidence', 'documents-new-name', false],
    [
      '/someone-else-new-name-evidence',
      'documents-someone-else-new-name',
      false
    ],
    ['/new-date-of-birth-evidence', 'documents-new-dob', false],
    [
      '/someone-else-new-date-of-birth-evidence',
      'documents-someone-else-new-dob',
      false
    ],
    ['/evidence-child-partner', 'documents-child-partner', false],
    [
      '/upload-someone-else-nationality-evidence',
      'documents-someone-else-nationality',
      false
    ],
    ['/upload-death-certificate', 'documents-death-certificate', false],
    ['/upload-supporting-evidence', 'documents-help-your-claim', true]
  ])('exposes the upload requirement for %s', (route, category, required) => {
    expect(app.steps[route].locals.documentCategory).toMatchObject({
      name: category,
      required
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
      required: false,
      limit: 6,
      limitValidationError: 'fileCountLimit'
    });
  });

  test('wires someone else nationality evidence with its caption and shared markdown intro', () => {
    const route = '/upload-someone-else-nationality-evidence';
    const step = app.steps[route];
    const pages = require('../../../apps/saa/translations/src/en/pages.json');
    const template = fs.readFileSync(
      path.resolve(__dirname, `../../../apps/saa/views${route}.html`),
      'utf8'
    );

    expect(step.fields).toEqual(['file-upload']);
    expect(step.behaviours).toEqual([
      'save:documents-someone-else-nationality:file-upload',
      'remove:documents-someone-else-nationality'
    ]);
    expect(step.next).toBe('/check-your-answers-someone-else-nationality');
    expect(pages[route.slice(1)]).toMatchObject({
      header: 'Upload evidence to support this change',
      captionHeading: 'Update personal details'
    });
    expect(pages[route.slice(1)]).not.toHaveProperty('intro');
    expect(template).toContain('{{<partials-file-upload-form-layout}}');
    expect(template).toContain('{{#markdown}}upload-nationality-evidence{{/markdown}}');
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
