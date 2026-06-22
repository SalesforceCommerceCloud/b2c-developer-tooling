/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {OAuthStrategy, JwtOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import type {AuthConfig, InstanceConfig} from '@salesforce/b2c-tooling-sdk/instance';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_FIXTURES_DIR = path.join(__dirname, '../fixtures/jwt');
const TEST_CERT_PATH = path.join(TEST_FIXTURES_DIR, 'test-cert.pem');
const TEST_KEY_PATH = path.join(TEST_FIXTURES_DIR, 'test-key.pem');

const SCAPI_COORDS: Partial<InstanceConfig> = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd'};

function instance(config: Partial<InstanceConfig>, auth: AuthConfig): B2CInstance {
  return new B2CInstance({hostname: 'test.demandware.net', ...config}, auth);
}

describe('instance/B2CInstance.scapiClientConfig', () => {
  describe('returns config (SCAPI eligible)', () => {
    it('builds a client-credentials strategy when clientId + clientSecret are present', () => {
      const scapi = instance(SCAPI_COORDS, {
        oauth: {clientId: 'client', clientSecret: 'secret'},
      }).scapiClientConfig;

      expect(scapi).to.not.equal(undefined);
      expect(scapi!.shortCode).to.equal('kv7kzm78');
      expect(scapi!.tenantId).to.equal('zzxy_prd');
      expect(scapi!.auth).to.be.instanceOf(OAuthStrategy);
    });

    it('builds a JWT strategy when cert/key paths are present (no client secret)', () => {
      const scapi = instance(SCAPI_COORDS, {
        oauth: {clientId: 'client', jwtCertPath: TEST_CERT_PATH, jwtKeyPath: TEST_KEY_PATH},
      }).scapiClientConfig;

      expect(scapi).to.not.equal(undefined);
      expect(scapi!.auth).to.be.instanceOf(JwtOAuthStrategy);
    });

    it('prefers client-credentials over JWT by default when both are configured', () => {
      const scapi = instance(SCAPI_COORDS, {
        oauth: {clientId: 'client', clientSecret: 'secret', jwtCertPath: TEST_CERT_PATH, jwtKeyPath: TEST_KEY_PATH},
      }).scapiClientConfig;

      expect(scapi!.auth).to.be.instanceOf(OAuthStrategy);
    });

    it('honors authMethods ordering to pick JWT ahead of client-credentials', () => {
      const scapi = instance(SCAPI_COORDS, {
        authMethods: ['jwt', 'client-credentials'],
        oauth: {clientId: 'client', clientSecret: 'secret', jwtCertPath: TEST_CERT_PATH, jwtKeyPath: TEST_KEY_PATH},
      }).scapiClientConfig;

      expect(scapi!.auth).to.be.instanceOf(JwtOAuthStrategy);
    });
  });

  describe('returns undefined (not SCAPI eligible)', () => {
    it('when shortCode is missing', () => {
      const scapi = instance(
        {tenantId: 'zzxy_prd'},
        {oauth: {clientId: 'client', clientSecret: 'secret'}},
      ).scapiClientConfig;
      expect(scapi).to.equal(undefined);
    });

    it('when tenantId is missing', () => {
      const scapi = instance(
        {shortCode: 'kv7kzm78'},
        {oauth: {clientId: 'client', clientSecret: 'secret'}},
      ).scapiClientConfig;
      expect(scapi).to.equal(undefined);
    });

    it('when the OAuth flow is implicit (clientId only, no secret or JWT)', () => {
      const scapi = instance(SCAPI_COORDS, {oauth: {clientId: 'client'}}).scapiClientConfig;
      expect(scapi).to.equal(undefined);
    });

    it('when only basic auth is configured', () => {
      const scapi = instance(SCAPI_COORDS, {basic: {username: 'u', password: 'p'}}).scapiClientConfig;
      expect(scapi).to.equal(undefined);
    });
  });

  describe('apiBackend', () => {
    it("defaults to 'auto' when unset", () => {
      expect(instance(SCAPI_COORDS, {}).apiBackend).to.equal('auto');
    });

    it('reflects the configured preference', () => {
      expect(instance({...SCAPI_COORDS, apiBackend: 'ocapi'}, {}).apiBackend).to.equal('ocapi');
      expect(instance({...SCAPI_COORDS, apiBackend: 'scapi'}, {}).apiBackend).to.equal('scapi');
    });
  });
});
