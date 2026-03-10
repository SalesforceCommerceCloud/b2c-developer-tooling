/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createHash} from 'node:crypto';
import {generateCodeVerifier, generateCodeChallenge} from '@salesforce/b2c-tooling-sdk/slas';

describe('slas/pkce', () => {
  describe('generateCodeVerifier', () => {
    it('generates a base64url-encoded string', () => {
      const verifier = generateCodeVerifier();
      // 96 random bytes → 128 base64url characters
      expect(verifier).to.have.lengthOf(128);
      // base64url characters only
      expect(verifier).to.match(/^[A-Za-z0-9_-]+$/);
    });

    it('generates unique values', () => {
      const a = generateCodeVerifier();
      const b = generateCodeVerifier();
      expect(a).to.not.equal(b);
    });
  });

  describe('generateCodeChallenge', () => {
    it('generates the SHA-256 hash of the verifier', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);

      // Manually compute expected challenge
      const expected = createHash('sha256').update(verifier).digest('base64url');
      expect(challenge).to.equal(expected);
    });

    it('generates a base64url-encoded string', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);
      // SHA-256 digest is 32 bytes → 43 base64url characters
      expect(challenge).to.have.lengthOf(43);
      expect(challenge).to.match(/^[A-Za-z0-9_-]+$/);
    });

    it('produces different challenges for different verifiers', () => {
      const a = generateCodeChallenge(generateCodeVerifier());
      const b = generateCodeChallenge(generateCodeVerifier());
      expect(a).to.not.equal(b);
    });

    it('produces the same challenge for the same verifier', () => {
      const verifier = generateCodeVerifier();
      const a = generateCodeChallenge(verifier);
      const b = generateCodeChallenge(verifier);
      expect(a).to.equal(b);
    });
  });
});
