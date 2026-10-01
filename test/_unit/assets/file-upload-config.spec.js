'use strict';

const fs = require('node:fs');
const path = require('node:path');
const uploadConfig = require('../../../assets/js/file-upload-config');

describe('file upload configuration', () => {
  test('keeps the file-vault extension whitelist aligned with the application', () => {
    const deployment = fs.readFileSync(
      path.resolve(__dirname, '../../../kube/file-vault/file-vault-deployment.yml'),
      'utf8'
    );
    const whitelist = deployment.match(
      /- name: FILE_EXTENSION_WHITELIST\s+value: "([^"]+)"/
    );

    expect(whitelist).not.toBeNull();
    // file-vault 3.0.1 compares extensions without the leading dot
    expect(whitelist[1]).toBe(uploadConfig.acceptedFileExtensions.replaceAll('.', ''));
  });
});
