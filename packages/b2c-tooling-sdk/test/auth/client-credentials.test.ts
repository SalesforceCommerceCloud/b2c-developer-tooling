/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {encodeBasicClientCredentials} from '@salesforce/b2c-tooling-sdk/auth';

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
});
