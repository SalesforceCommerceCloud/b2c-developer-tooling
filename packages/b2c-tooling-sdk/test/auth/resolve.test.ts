/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import {
  ApiKeyStrategy,
  BasicAuthStrategy,
  ImplicitOAuthStrategy,
  OAuthStrategy,
  checkAvailableAuthMethods,
  resolveAuthStrategy,
} from '@salesforce/b2c-tooling-sdk/auth';

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

    it('returns unavailable with reason when password is missing for basic', () => {
      const result = checkAvailableAuthMethods({username: 'test-user'}, ['basic']);

      expect(result.available).to.have.length(0);
      expect(result.unavailable).to.have.length(1);
      expect(result.unavailable[0]).to.deep.equal({
        method: 'basic',
        reason: 'password is required',
      });
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

  describe('resolveAuthStrategy', () => {
    it('returns OAuthStrategy when clientId and clientSecret are provided', () => {
      const strategy = resolveAuthStrategy({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        scopes: ['scope-a'],
      });

      expect(strategy).to.be.instanceOf(OAuthStrategy);
    });

    it('returns ImplicitOAuthStrategy when only clientId is provided', () => {
      const strategy = resolveAuthStrategy({
        clientId: 'test-client',
        scopes: ['scope-a'],
      });

      expect(strategy).to.be.instanceOf(ImplicitOAuthStrategy);
    });

    it('returns BasicAuthStrategy when username and password are provided and allowedMethods restricts to basic', () => {
      const strategy = resolveAuthStrategy(
        {
          username: 'user',
          password: 'pass',
        },
        {allowedMethods: ['basic']},
      );

      expect(strategy).to.be.instanceOf(BasicAuthStrategy);
    });

    it('returns ApiKeyStrategy when apiKey is provided and allowedMethods restricts to api-key', () => {
      const strategy = resolveAuthStrategy(
        {
          apiKey: 'key',
          apiKeyHeaderName: 'X-Api-Key',
        },
        {allowedMethods: ['api-key']},
      );

      expect(strategy).to.be.instanceOf(ApiKeyStrategy);
    });

    it('respects allowedMethods ordering (picks basic before client-credentials when basic is first)', () => {
      const strategy = resolveAuthStrategy(
        {
          clientId: 'test-client',
          clientSecret: 'test-secret',
          username: 'user',
          password: 'pass',
        },
        {allowedMethods: ['basic', 'client-credentials']},
      );

      expect(strategy).to.be.instanceOf(BasicAuthStrategy);
    });

    it('throws a helpful error when no allowed method has required credentials', () => {
      try {
        resolveAuthStrategy(
          {
            clientId: 'test-client',
          },
          {allowedMethods: ['client-credentials', 'basic']},
        );
        expect.fail('Expected resolveAuthStrategy to throw');
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect((err as Error).message).to.include('No valid auth method available');
        expect((err as Error).message).to.include('Allowed methods: [client-credentials, basic]');
        expect((err as Error).message).to.include('client-credentials: clientSecret is required');
        expect((err as Error).message).to.include('basic: username is required');
      }
    });

    it('throws error for unknown allowed method', () => {
      try {
        resolveAuthStrategy(
          {
            clientId: 'test-client',
            clientSecret: 'test-secret',
          },
          {allowedMethods: ['unknown-method' as any]},
        );
        expect.fail('Expected resolveAuthStrategy to throw');
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect((err as Error).message).to.include('No valid auth method available');
        expect((err as Error).message).to.include('Allowed methods: [unknown-method]');
      }
    });

    it('throws error when allowedMethods is explicitly empty array', () => {
      // With explicitly empty allowedMethods array, no methods are allowed
      try {
        resolveAuthStrategy(
          {
            clientId: 'test-client',
            clientSecret: 'test-secret',
          },
          {allowedMethods: []},
        );
        expect.fail('Expected resolveAuthStrategy to throw');
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect((err as Error).message).to.include('No valid auth method available');
        expect((err as Error).message).to.include('Allowed methods: []');
      }
    });

    it('falls back to default when allowedMethods is undefined', () => {
      const strategy = resolveAuthStrategy({
        clientId: 'test-client',
        clientSecret: 'test-secret',
      });

      // Without allowedMethods option, should default to all methods
      expect(strategy).to.be.instanceOf(OAuthStrategy);
    });
  });
});
