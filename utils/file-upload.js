'use strict';

const crypto = require('node:crypto');
const FormData = require('form-data');
const Model = require('hof').model;

const config = require('../config');
const logger = require('hof/lib/logger')({ env: config.env });

module.exports = class UploadModel extends Model {
  constructor(...args) {
    super(...args);
    this.set('id', crypto.randomUUID());
  }

  async save() {
    if (!config.upload.hostname) {
      throw new Error('File-vault hostname is not defined');
    }

    const formData = new FormData();
    formData.append('document', this.get('data'), {
      filename: this.get('name'),
      contentType: this.get('mimetype')
    });

    const requestConfig = {
      url: new URL(`${config.upload.hostname}/file`).href,
      data: formData,
      method: 'POST',
      headers: formData.getHeaders()
    };

    try {
      // hof's Model.request returns errors instead of rejecting unless the callback throws
      const response = await this.request(requestConfig, error => {
        if (error) {
          throw new Error(error.message || error.code || `status ${error.status}`);
        }
      });

      if (!response || typeof response !== 'object' || !response.url) {
        throw new Error('Did not receive a URL from file-vault');
      }

      this.set({
        url: response.url.replace('/file/', '/file/generate-link/').split('?')[0]
      });
      this.unset('data');
    } catch (error) {
      logger.error(`File upload failed: ${error.message}`);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async auth() {
    if (!config.keycloak.tokenUrl) {
      throw new Error('Keycloak token URL is not defined');
    }

    for (const property of ['clientId', 'secret']) {
      if (!config.keycloak[property]) {
        throw new Error(`Keycloak file-vault ${property} is not defined`);
      }
    }

    const tokenRequest = {
      url: config.keycloak.tokenUrl,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: {
        grant_type: 'client_credentials',
        client_id: config.keycloak.clientId,
        client_secret: config.keycloak.secret
      },
      method: 'POST'
    };

    try {
      const response = await this._request(tokenRequest);

      if (!response.data || !response.data.access_token) {
        throw new Error('No access token in response');
      }

      return { bearer: response.data.access_token };
    } catch (error) {
      logger.error(`Failed to retrieve file-vault access token: ${error.message}`);
      throw new Error(`Failed to retrieve file-vault access token: ${error.message}`);
    }
  }
};
