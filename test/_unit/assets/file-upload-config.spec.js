'use strict';

const fs = require('fs');
const path = require('path');
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
    expect(whitelist[1]).toBe(uploadConfig.acceptedFileExtensions);
  });
});