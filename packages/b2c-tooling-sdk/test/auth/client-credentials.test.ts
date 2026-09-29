/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  applyClientCredentials,
  encodeBasicClientCredentials,
  isCredentialPlaceholder,
  resolveClientAuthMethod,
} from '@salesforce/b2c-tooling-sdk/auth';

/**
 * Reverses the server side of RFC 6749 §2.3.1: base64-decode the Basic payload,
 * split on the first colon, then form-url-decode each half. Used to prove that a
 * compliant server recovers the original credentials byte-for-byte.
 */
function decodeBasicClientCredentials(basic: string): {id: string; secret: string} {
  const decoded = Buffer.from(basic, 'base64').toString('utf8');
  const idx = decoded.indexOf(':');
  const rawId = decoded.slice(0, idx);
  const rawSecret = decoded.slice(idx + 1);
  const decode = (v: string): string => new URLSearchParams(`x=${v}`).get('x') ?? '';
  return {id: decode(rawId), secret: decode(rawSecret)};
}

describe('auth/client-credentials', () => {
  describe('encodeBasicClientCredentials', () => {
    it('base64-encodes plain alphanumeric credentials unchanged (no-op case)', () => {
      const result = encodeBasicClientCredentials('my-client-id', 'plainsecret123');
      expect(result).to.equal(Buffer.from('my-client-id:plainsecret123').toString('base64'));
    });

    it('form-url-encodes a "+" in the secret to %2B before base64 (RFC 6749 §2.3.1)', () => {
      // The bug: a raw "+" is decoded to a space by a compliant server, breaking auth.
      const result = encodeBasicClientCredentials('my-client-id', 'Xy9+Kq2z');
      expect(result).to.equal(Buffer.from('my-client-id:Xy9%2BKq2z').toString('base64'));
    });

    it('encodes a space as "+" per Appendix B (W3C form rules, not %20)', () => {
      const result = encodeBasicClientCredentials('id', 'a b');
      expect(Buffer.from(result, 'base64').toString('utf8')).to.equal('id:a+b');
    });

    it('encodes reserved characters in both id and secret', () => {
      const result = encodeBasicClientCredentials('a:b', 'p&q=r');
      // colon in id is escaped (keeps the Basic split unambiguous), & and = escaped
      expect(Buffer.from(result, 'base64').toString('utf8')).to.equal('a%3Ab:p%26q%3Dr');
    });

    it('round-trips through a compliant server decode back to the originals', () => {
      const id = 'aaaabbbb-cccc-dddd-eeee-ffff00001111';
      const secret = 'Xy9+Kq/2z=';
      const {id: gotId, secret: gotSecret} = decodeBasicClientCredentials(encodeBasicClientCredentials(id, secret));
      expect(gotId).to.equal(id);
      expect(gotSecret).to.equal(secret);
    });
  });

  describe('isCredentialPlaceholder', () => {
    it('detects OpenShell canonical and alias placeholders', () => {
      expect(isCredentialPlaceholder('openshell:resolve:env:v1_SFCC_CLIENT_SECRET')).to.equal(true);
      expect(isCredentialPlaceholder('sk-OPENSHELL-RESOLVE-ENV-SFCC_CLIENT_SECRET')).to.equal(true);
    });

    it('does not flag ordinary secrets', () => {
      expect(isCredentialPlaceholder('Xy9+Kq/2z=')).to.equal(false);
      expect(isCredentialPlaceholder('resolve:env')).to.equal(false);
    });
  });

  describe('applyClientCredentials', () => {
    it('uses the Basic header and leaves the body untouched for a real secret', () => {
      const params = new URLSearchParams({grant_type: 'client_credentials'});
      const headers = applyClientCredentials(params, 'my-client-id', 'Xy9+Kq2z');
      expect(headers).to.deep.equal({
        Authorization: `Basic ${encodeBasicClientCredentials('my-client-id', 'Xy9+Kq2z')}`,
      });
      expect(params.toString()).to.equal('grant_type=client_credentials');
    });

    it('uses an unencoded Basic header for a sandbox placeholder', () => {
      const placeholder = 'openshell:resolve:env:v1_SFCC_CLIENT_SECRET';
      const params = new URLSearchParams({grant_type: 'client_credentials'});
      const headers = applyClientCredentials(params, 'my-client-id', placeholder);
      expect(headers).to.deep.equal({
        Authorization: `Basic ${Buffer.from(`my-client-id:${placeholder}`).toString('base64')}`,
      });
      expect(params.toString()).to.equal('grant_type=client_credentials');
    });

    it('sends basic-unencoded credentials without form-url-encoding', () => {
      const headers = applyClientCredentials(new URLSearchParams(), 'id', 'Xy9+Kq2z', 'basic-unencoded');
      expect(headers).to.deep.equal({Authorization: `Basic ${Buffer.from('id:Xy9+Kq2z').toString('base64')}`});
    });

    it('moves credentials into the body when the method is body', () => {
      const params = new URLSearchParams({grant_type: 'client_credentials'});
      const headers = applyClientCredentials(params, 'my-client-id', 'Xy9+Kq2z', 'body');
      expect(headers).to.deep.equal({});
      expect(params.get('client_id')).to.equal('my-client-id');
      expect(params.get('client_secret')).to.equal('Xy9+Kq2z');
    });
  });

  describe('resolveClientAuthMethod', () => {
    it('defaults to basic for a real secret and basic-unencoded for a placeholder', () => {
      expect(resolveClientAuthMethod('Xy9+Kq2z')).to.equal('basic');
      expect(resolveClientAuthMethod('openshell:resolve:env:v1_SFCC_CLIENT_SECRET')).to.equal('basic-unencoded');
    });

    it('lets an explicit method override detection', () => {
      expect(resolveClientAuthMethod('openshell:resolve:env:v1_SFCC_CLIENT_SECRET', 'body')).to.equal('body');
      expect(resolveClientAuthMethod('Xy9+Kq2z', 'basic-unencoded')).to.equal('basic-unencoded');
    });
  });
});
