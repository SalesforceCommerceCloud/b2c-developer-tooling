/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {getApiType} from '@salesforce/b2c-tooling-sdk/schemas';

describe('schemas/security-schemes', () => {
  describe('getApiType', () => {
    it('returns "Admin" for AmOAuth2 security scheme', () => {
      expect(getApiType('AmOAuth2')).to.equal('Admin');
    });

    it('returns "Shopper" for ShopperToken security scheme', () => {
      expect(getApiType('ShopperToken')).to.equal('Shopper');
    });

    it('returns "-" for undefined security scheme', () => {
      expect(getApiType(undefined)).to.equal('-');
    });

    it('returns the scheme itself for unknown security schemes', () => {
      expect(getApiType('CustomScheme')).to.equal('CustomScheme');
      expect(getApiType('BearerToken')).to.equal('BearerToken');
    });

    it('returns "-" for empty string', () => {
      expect(getApiType('')).to.equal('-');
    });
  });
});
