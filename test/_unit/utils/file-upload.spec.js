'use strict';

const mockAppend = jest.fn();
const mockGetHeaders = jest.fn().mockReturnValue({
  'content-type': 'multipart/form-data; boundary=test'
});
const mockLoggerError = jest.fn();
const mockConfig = {
  env: 'test',
  upload: {
    hostname: 'https://file-vault.test'
  },
  keycloak: {
    tokenUrl: 'https://keycloak.test/token',
    clientId: 'file-vault-client',
    secret: 'file-vault-secret'
  }
};

jest.mock('form-data', () => jest.fn().mockImplementation(() => ({
  append: mockAppend,
  getHeaders: mockGetHeaders
})));

jest.mock('hof/lib/logger', () => () => ({
  error: mockLoggerError
}));

jest.mock('../../../config', () => mockConfig);

const FileUpload = require('../../../utils/file-upload');

describe('file upload model', () => {
  const document = {
    name: 'evidence.pdf',
    data: Buffer.from('evidence'),
    mimetype: 'application/pdf'
  };

  beforeEach(() => {
    mockConfig.upload.hostname = 'https://file-vault.test';
    mockConfig.keycloak.tokenUrl = 'https://keycloak.test/token';
    mockConfig.keycloak.clientId = 'file-vault-client';
    mockConfig.keycloak.secret = 'file-vault-secret';
  });

  test('assigns a unique ID when constructed', () => {
    const upload = new FileUpload(document);

    expect(upload.get('id')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  test('posts multipart data to file-vault and stores the generate-link URL', async () => {
    const upload = new FileUpload(document);
    upload.request = jest.fn().mockResolvedValue({
      url: 'https://file-vault.test/file/document-id?token=temporary'
    });

    await upload.save();

    expect(mockAppend).toHaveBeenCalledWith('document', document.data, {
      filename: document.name,
      contentType: document.mimetype
    });
    expect(upload.request).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://file-vault.test/file',
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=test'
      }
    }), expect.any(Function));
    expect(upload.get('url')).toBe(
      'https://file-vault.test/file/generate-link/document-id'
    );
    expect(upload.get('data')).toBeUndefined();
  });

  test('rejects uploads when the file-vault hostname is missing', async () => {
    mockConfig.upload.hostname = undefined;
    const upload = new FileUpload(document);

    await expect(upload.save()).rejects.toThrow('File-vault hostname is not defined');
  });

  test.each([
    ['an empty response', undefined],
    ['a response without a URL', { id: 'document-id' }]
  ])('rejects %s from file-vault', async (description, response) => {
    const upload = new FileUpload(document);
    upload.request = jest.fn().mockResolvedValue(response);

    await expect(upload.save()).rejects.toThrow(
      'File upload failed: Did not receive a URL from file-vault'
    );
    expect(mockLoggerError).toHaveBeenCalledWith(
      'File upload failed: Did not receive a URL from file-vault'
    );
  });

  test('preserves the cause of a connection failure', async () => {
    const upload = new FileUpload(document);
    upload.auth = jest.fn().mockResolvedValue({ bearer: 'token' });
    upload._request = jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED'));

    await expect(upload.save()).rejects.toThrow('File upload failed: connect ECONNREFUSED');
  });

  test('preserves the cause of an authentication failure', async () => {
    const upload = new FileUpload(document);
    upload.auth = jest.fn().mockRejectedValue(new Error('No access token in response'));

    await expect(upload.save()).rejects.toThrow('File upload failed: No access token in response');
  });

  test('preserves the file-vault error code', async () => {
    const upload = new FileUpload(document);
    upload.auth = jest.fn().mockResolvedValue({ bearer: 'token' });
    upload._request = jest.fn().mockResolvedValue({
      status: 400,
      data: { code: 'FileExtensionNotAllowed' }
    });

    await expect(upload.save()).rejects.toThrow('File upload failed: FileExtensionNotAllowed');
  });

  test('does not expose request details from the original error', async () => {
    const upload = new FileUpload(document);
    const requestError = Object.assign(new Error('Request failed with status code 500'), {
      config: { headers: { Authorization: 'Bearer secret-token' } }
    });
    upload.auth = jest.fn().mockResolvedValue({ bearer: 'secret-token' });
    upload._request = jest.fn().mockRejectedValue(requestError);

    const error = await upload.save().catch(e => e);

    expect(error.message).toBe('File upload failed: Request failed with status code 500');
    expect(error.cause).toBeUndefined();
    expect(error.config).toBeUndefined();
  });

  test('retrieves a file-vault token using client credentials', async () => {
    const upload = new FileUpload(document);
    upload._request = jest.fn().mockResolvedValue({
      data: { access_token: 'access-token' }
    });

    await expect(upload.auth()).resolves.toEqual({ bearer: 'access-token' });
    expect(upload._request).toHaveBeenCalledWith({
      url: 'https://keycloak.test/token',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: {
        grant_type: 'client_credentials',
        client_id: 'file-vault-client',
        client_secret: 'file-vault-secret'
      },
      method: 'POST'
    });
  });

  test('rejects authentication when the token URL is missing', async () => {
    mockConfig.keycloak.tokenUrl = undefined;
    const upload = new FileUpload(document);

    await expect(upload.auth()).rejects.toThrow('Keycloak token URL is not defined');
  });

  test.each([
    ['clientId', 'Keycloak file-vault clientId is not defined'],
    ['secret', 'Keycloak file-vault secret is not defined']
  ])('rejects authentication when %s is missing', async (property, message) => {
    mockConfig.keycloak[property] = undefined;
    const upload = new FileUpload(document);

    await expect(upload.auth()).rejects.toThrow(message);
  });

  test('rejects authentication when Keycloak returns no access token', async () => {
    const upload = new FileUpload(document);
    upload._request = jest.fn().mockResolvedValue({ data: {} });

    await expect(upload.auth()).rejects.toThrow(
      'Failed to retrieve file-vault access token: No access token in response'
    );
  });

  test('wraps token request failures with file-vault context', async () => {
    const upload = new FileUpload(document);
    upload._request = jest.fn().mockRejectedValue(new Error('connection refused'));

    await expect(upload.auth()).rejects.toThrow(
      'Failed to retrieve file-vault access token: connection refused'
    );
  });
});
