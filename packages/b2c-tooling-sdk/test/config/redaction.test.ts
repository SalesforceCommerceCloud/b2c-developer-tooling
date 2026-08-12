/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  SENSITIVE_CONFIG_FIELDS,
  isSensitiveConfigField,
  maskConfigValue,
  redactConfigValues,
} from '../../src/config/redaction.js';

describe('config redaction', () => {
  describe('isSensitiveConfigField', () => {
    it('flags known secret fields', () => {
      expect(isSensitiveConfigField('password')).to.equal(true);
      expect(isSensitiveConfigField('clientSecret')).to.equal(true);
      expect(isSensitiveConfigField('mrtApiKey')).to.equal(true);
      expect(isSensitiveConfigField('slasClientSecret')).to.equal(true);
      expect(isSensitiveConfigField('certificatePassphrase')).to.equal(true);
      expect(isSensitiveConfigField('jwtPassphrase')).to.equal(true);
    });

    it('does not flag non-secret fields', () => {
      expect(isSensitiveConfigField('hostname')).to.equal(false);
      expect(isSensitiveConfigField('clientId')).to.equal(false);
    });
  });

  describe('maskConfigValue', () => {
    it('shows the first 4 characters of long values', () => {
      expect(maskConfigValue('super-secret-value')).to.equal('supe...REDACTED');
    });

    it('fully redacts short values', () => {
      expect(maskConfigValue('short')).to.equal('REDACTED');
      // 10 chars is the boundary — still fully redacted.
      expect(maskConfigValue('1234567890')).to.equal('REDACTED');
    });
  });

  describe('redactConfigValues', () => {
    it('masks secrets and passes through non-secrets by default', () => {
      const result = redactConfigValues({
        hostname: 'example.demandware.net',
        clientId: 'aaaa-bbbb',
        clientSecret: 'super-secret-value-1234',
        password: 'my-web-dav-password',
      });

      expect(result.hostname).to.equal('example.demandware.net');
      expect(result.clientId).to.equal('aaaa-bbbb');
      expect(result.clientSecret).to.equal('supe...REDACTED');
      expect(result.password).to.equal('my-w...REDACTED');
    });

    it('leaves secrets untouched when unmask is true', () => {
      const result = redactConfigValues({clientSecret: 'super-secret-value-1234'}, {unmask: true});
      expect(result.clientSecret).to.equal('super-secret-value-1234');
    });

    it('omits undefined values', () => {
      const result = redactConfigValues({hostname: 'example.demandware.net', codeVersion: undefined});
      expect(result).to.have.property('hostname');
      expect(result).to.not.have.property('codeVersion');
    });

    it('exports a stable set of sensitive fields', () => {
      expect(SENSITIVE_CONFIG_FIELDS.has('password')).to.equal(true);
    });
  });
});
