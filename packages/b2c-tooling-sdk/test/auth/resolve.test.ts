/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {checkAvailableAuthMethods} from '@salesforce/b2c-tooling-sdk/auth';

describe('auth/resolve', () => {
  describe('checkAvailableAuthMethods', () => {
    it('returns client-credentials when clientId and clientSecret are provided', () => {
      const result = checkAvailableAuthMethods({
        clientId: 'test-client',
        clientSecret: 'test-secret',
      });

      expect(result.available).to.include('client-credentials');
    });

    it('returns implicit when only clientId is provided', () => {
      const result = checkAvailableAuthMethods({
        clientId: 'test-client',
      });

      expect(result.available).to.include('implicit');
      expect(result.available).to.not.include('client-credentials');
    });

    it('returns basic when username and password are provided', () => {
      const result = checkAvailableAuthMethods({
        username: 'test-user',
        password: 'test-pass',
      });

      expect(result.available).to.include('basic');
    });

    it('returns api-key when apiKey is provided', () => {
      const result = checkAvailableAuthMethods({
        apiKey: 'test-api-key',
      });

      expect(result.available).to.include('api-key');
    });

    it('returns unavailable with reason when clientSecret is missing for client-credentials', () => {
      const result = checkAvailableAuthMethods({clientId: 'test-client'}, ['client-credentials']);

      expect(result.available).to.have.length(0);
      expect(result.unavailable).to.have.length(1);
      expect(result.unavailable[0]).to.deep.equal({
        method: 'client-credentials',
        reason: 'clientSecret is required',
      });
    });

    it('returns unavailable with reason when clientId is missing', () => {
      const result = checkAvailableAuthMethods({}, ['client-credentials', 'implicit']);

      expect(result.unavailable).to.have.length(2);
      expect(result.unavailable[0].reason).to.equal('clientId is required');
      expect(result.unavailable[1].reason).to.equal('clientId is required');
    });

    it('only checks allowed methods', () => {
      const result = checkAvailableAuthMethods(
        {
          clientId: 'test-client',
          clientSecret: 'test-secret',
          username: 'test-user',
          password: 'test-pass',
        },
        ['basic'],
      );

      expect(result.available).to.deep.equal(['basic']);
      expect(result.unavailable).to.have.length(0);
    });

    it('returns all available methods when credentials support multiple', () => {
      const result = checkAvailableAuthMethods({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        username: 'test-user',
        password: 'test-pass',
        apiKey: 'test-key',
      });

      expect(result.available).to.have.length(4);
      expect(result.available).to.include('client-credentials');
      expect(result.available).to.include('implicit');
      expect(result.available).to.include('basic');
      expect(result.available).to.include('api-key');
    });
  });
});
