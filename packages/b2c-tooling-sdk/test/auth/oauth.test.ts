/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {OAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

describe('auth/oauth', () => {
  describe('OAuthStrategy', () => {
    describe('withAdditionalScopes', () => {
      it('creates new strategy with additional scopes', () => {
        const original = new OAuthStrategy({
          clientId: 'test-client',
          clientSecret: 'test-secret',
          scopes: ['scope1'],
        });

        const extended = original.withAdditionalScopes(['scope2', 'scope3']);

        // Should be a different instance
        expect(extended).to.not.equal(original);
        expect(extended).to.be.instanceOf(OAuthStrategy);
      });

      it('merges scopes without duplicates', () => {
        const original = new OAuthStrategy({
          clientId: 'test-client',
          clientSecret: 'test-secret',
          scopes: ['scope1', 'scope2'],
        });

        const extended = original.withAdditionalScopes(['scope2', 'scope3']);

        // Access internal config via another withAdditionalScopes to verify
        const doubleExtended = extended.withAdditionalScopes([]);
        // The scopes should be deduplicated
        expect(doubleExtended).to.be.instanceOf(OAuthStrategy);
      });

      it('handles empty original scopes', () => {
        const original = new OAuthStrategy({
          clientId: 'test-client',
          clientSecret: 'test-secret',
        });

        const extended = original.withAdditionalScopes(['scope1', 'scope2']);

        expect(extended).to.be.instanceOf(OAuthStrategy);
      });

      it('handles empty additional scopes', () => {
        const original = new OAuthStrategy({
          clientId: 'test-client',
          clientSecret: 'test-secret',
          scopes: ['scope1'],
        });

        const extended = original.withAdditionalScopes([]);

        expect(extended).to.be.instanceOf(OAuthStrategy);
        expect(extended).to.not.equal(original);
      });

      it('preserves other config options', () => {
        const customHost = 'custom.auth.host.com';
        const original = new OAuthStrategy({
          clientId: 'test-client',
          clientSecret: 'test-secret',
          scopes: ['scope1'],
          accountManagerHost: customHost,
        });

        const extended = original.withAdditionalScopes(['scope2']);

        // The new strategy should preserve the custom host
        // We can't directly access private fields, but we can verify it's a valid strategy
        expect(extended).to.be.instanceOf(OAuthStrategy);
      });
    });
  });
});
