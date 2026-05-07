/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {
  checkSafetyViolation,
  getSafetyLevel,
  describeSafetyLevel,
  SafetyBlockedError,
  type SafetyConfig,
  type SafetyLevel,
} from '@salesforce/b2c-tooling-sdk';
import {getLogger} from '@salesforce/b2c-tooling-sdk/logging';

describe('safety/safety-middleware', () => {
  describe('checkSafetyViolation', () => {
    describe('NONE level', () => {
      it('allows all operations', () => {
        const config: SafetyConfig = {level: 'NONE'};

        expect(checkSafetyViolation('GET', 'https://api.example.com/items', config)).to.be.undefined;
        expect(checkSafetyViolation('POST', 'https://api.example.com/items', config)).to.be.undefined;
        expect(checkSafetyViolation('PUT', 'https://api.example.com/items/1', config)).to.be.undefined;
        expect(checkSafetyViolation('PATCH', 'https://api.example.com/items/1', config)).to.be.undefined;
        expect(checkSafetyViolation('DELETE', 'https://api.example.com/items/1', config)).to.be.undefined;
      });
    });

    describe('NO_DELETE level', () => {
      it('blocks DELETE operations', () => {
        const config: SafetyConfig = {level: 'NO_DELETE'};

        const result = checkSafetyViolation('DELETE', 'https://api.example.com/items/1', config);
        expect(result).to.include('Delete operation blocked');
        expect(result).to.include('NO_DELETE mode');
      });

      it('allows GET, POST, PUT, PATCH operations', () => {
        const config: SafetyConfig = {level: 'NO_DELETE'};

        expect(checkSafetyViolation('GET', 'https://api.example.com/items', config)).to.be.undefined;
        expect(checkSafetyViolation('POST', 'https://api.example.com/items', config)).to.be.undefined;
        expect(checkSafetyViolation('PUT', 'https://api.example.com/items/1', config)).to.be.undefined;
        expect(checkSafetyViolation('PATCH', 'https://api.example.com/items/1', config)).to.be.undefined;
      });

      it('is case-insensitive for method', () => {
        const config: SafetyConfig = {level: 'NO_DELETE'};

        expect(checkSafetyViolation('delete', 'https://api.example.com/items/1', config)).to.include(
          'Delete operation blocked',
        );
        expect(checkSafetyViolation('Delete', 'https://api.example.com/items/1', config)).to.include(
          'Delete operation blocked',
        );
        expect(checkSafetyViolation('DELETE', 'https://api.example.com/items/1', config)).to.include(
          'Delete operation blocked',
        );
      });
    });

    describe('NO_UPDATE level', () => {
      it('blocks DELETE operations', () => {
        const config: SafetyConfig = {level: 'NO_UPDATE'};

        const result = checkSafetyViolation('DELETE', 'https://api.example.com/sandboxes/123', config);
        expect(result).to.include('Delete operation blocked');
        expect(result).to.include('NO_UPDATE mode');
      });

      it('blocks destructive POST operations (reset, stop, restart)', () => {
        const config: SafetyConfig = {level: 'NO_UPDATE'};

        const resetResult = checkSafetyViolation('POST', 'https://api.example.com/sandboxes/123/reset', config);
        expect(resetResult).to.include('Destructive operation blocked');
        expect(resetResult).to.include('NO_UPDATE mode');

        const stopResult = checkSafetyViolation('POST', 'https://api.example.com/sandboxes/123/stop', config);
        expect(stopResult).to.include('Destructive operation blocked');

        const restartResult = checkSafetyViolation('POST', 'https://api.example.com/sandboxes/123/restart', config);
        expect(restartResult).to.include('Destructive operation blocked');
      });

      it('blocks POST to /operations paths', () => {
        const config: SafetyConfig = {level: 'NO_UPDATE'};

        const result = checkSafetyViolation('POST', 'https://api.example.com/sandboxes/123/operations', config);
        expect(result).to.include('Destructive operation blocked');
      });

      it('allows normal POST operations', () => {
        const config: SafetyConfig = {level: 'NO_UPDATE'};

        expect(checkSafetyViolation('POST', 'https://api.example.com/sandboxes', config)).to.be.undefined;
        expect(checkSafetyViolation('POST', 'https://api.example.com/items', config)).to.be.undefined;
      });

      it('allows GET, PUT, PATCH operations', () => {
        const config: SafetyConfig = {level: 'NO_UPDATE'};

        expect(checkSafetyViolation('GET', 'https://api.example.com/items', config)).to.be.undefined;
        expect(checkSafetyViolation('PUT', 'https://api.example.com/items/1', config)).to.be.undefined;
        expect(checkSafetyViolation('PATCH', 'https://api.example.com/items/1', config)).to.be.undefined;
      });
    });

    describe('READ_ONLY level', () => {
      it('blocks all write operations (POST, PUT, PATCH, DELETE)', () => {
        const config: SafetyConfig = {level: 'READ_ONLY'};

        const postResult = checkSafetyViolation('POST', 'https://api.example.com/items', config);
        expect(postResult).to.include('Write operation blocked');
        expect(postResult).to.include('READ_ONLY mode');

        const putResult = checkSafetyViolation('PUT', 'https://api.example.com/items/1', config);
        expect(putResult).to.include('Write operation blocked');

        const patchResult = checkSafetyViolation('PATCH', 'https://api.example.com/items/1', config);
        expect(patchResult).to.include('Write operation blocked');

        const deleteResult = checkSafetyViolation('DELETE', 'https://api.example.com/items/1', config);
        expect(deleteResult).to.include('Write operation blocked');
      });

      it('allows GET operations', () => {
        const config: SafetyConfig = {level: 'READ_ONLY'};

        expect(checkSafetyViolation('GET', 'https://api.example.com/items', config)).to.be.undefined;
        expect(checkSafetyViolation('GET', 'https://api.example.com/items/1', config)).to.be.undefined;
      });
    });

    describe('URL parsing', () => {
      it('extracts pathname correctly from full URLs', () => {
        const config: SafetyConfig = {level: 'NO_DELETE'};

        const result = checkSafetyViolation(
          'DELETE',
          'https://api.example.com:8080/items/1?query=value#fragment',
          config,
        );

        expect(result).to.include('/items/1');
      });

      it('handles URLs without protocol', () => {
        const config: SafetyConfig = {level: 'NO_DELETE'};

        // Should not throw error
        const result = checkSafetyViolation('DELETE', '/items/1', config);
        expect(result).to.include('Delete operation blocked');
      });
    });
  });

  describe('getSafetyLevel', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env['SFCC_SAFETY_LEVEL'];
    });

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env['SFCC_SAFETY_LEVEL'] = originalEnv;
      } else {
        delete process.env['SFCC_SAFETY_LEVEL'];
      }
    });

    it('returns default level when env var is not set', () => {
      delete process.env['SFCC_SAFETY_LEVEL'];

      expect(getSafetyLevel()).to.equal('NONE');
      expect(getSafetyLevel('READ_ONLY')).to.equal('READ_ONLY');
    });

    it('reads from SFCC_SAFETY_LEVEL environment variable', () => {
      process.env['SFCC_SAFETY_LEVEL'] = 'NO_DELETE';
      expect(getSafetyLevel()).to.equal('NO_DELETE');

      process.env['SFCC_SAFETY_LEVEL'] = 'NO_UPDATE';
      expect(getSafetyLevel()).to.equal('NO_UPDATE');

      process.env['SFCC_SAFETY_LEVEL'] = 'READ_ONLY';
      expect(getSafetyLevel()).to.equal('READ_ONLY');

      process.env['SFCC_SAFETY_LEVEL'] = 'NONE';
      expect(getSafetyLevel()).to.equal('NONE');
    });

    it('is case-insensitive', () => {
      process.env['SFCC_SAFETY_LEVEL'] = 'no_delete';
      expect(getSafetyLevel()).to.equal('NO_DELETE');

      process.env['SFCC_SAFETY_LEVEL'] = 'No_Delete';
      expect(getSafetyLevel()).to.equal('NO_DELETE');

      process.env['SFCC_SAFETY_LEVEL'] = 'read_only';
      expect(getSafetyLevel()).to.equal('READ_ONLY');
    });

    it('handles dash separators (converts to underscore)', () => {
      process.env['SFCC_SAFETY_LEVEL'] = 'no-delete';
      expect(getSafetyLevel()).to.equal('NO_DELETE');

      process.env['SFCC_SAFETY_LEVEL'] = 'read-only';
      expect(getSafetyLevel()).to.equal('READ_ONLY');
    });

    it('returns default level for invalid values', () => {
      process.env['SFCC_SAFETY_LEVEL'] = 'invalid-value';
      expect(getSafetyLevel()).to.equal('NONE');

      process.env['SFCC_SAFETY_LEVEL'] = 'invalid-value';
      expect(getSafetyLevel('READ_ONLY')).to.equal('READ_ONLY');
    });

    it('logs a warning when env is set to an invalid value', () => {
      const warnStub = sinon.stub(getLogger(), 'warn');
      try {
        process.env['SFCC_SAFETY_LEVEL'] = 'INVALID_LEVEL';

        getSafetyLevel('NONE');

        expect(warnStub.calledOnce).to.be.true;
        expect(warnStub.firstCall.args[0]).to.deep.include({envValue: 'INVALID_LEVEL'});
        expect(warnStub.firstCall.args[1]).to.include('invalid value');
      } finally {
        warnStub.restore();
      }
    });

    it('ignores empty string', () => {
      process.env['SFCC_SAFETY_LEVEL'] = '';
      expect(getSafetyLevel()).to.equal('NONE');
      expect(getSafetyLevel('NO_DELETE')).to.equal('NO_DELETE');
    });
  });

  describe('describeSafetyLevel', () => {
    it('returns description for NONE', () => {
      expect(describeSafetyLevel('NONE')).to.equal('No safety restrictions');
    });

    it('returns description for NO_DELETE', () => {
      expect(describeSafetyLevel('NO_DELETE')).to.equal('Delete operations blocked');
    });

    it('returns description for NO_UPDATE', () => {
      const desc = describeSafetyLevel('NO_UPDATE');
      expect(desc).to.include('Destructive operations blocked');
      expect(desc).to.include('delete');
      expect(desc).to.include('reset');
    });

    it('returns description for READ_ONLY', () => {
      const desc = describeSafetyLevel('READ_ONLY');
      expect(desc).to.include('Read-only mode');
      expect(desc).to.include('write operations blocked');
    });

    it('returns unknown for invalid level', () => {
      expect(describeSafetyLevel('INVALID' as SafetyLevel)).to.equal('Unknown safety level');
    });
  });

  describe('SafetyBlockedError', () => {
    it('creates error with correct properties', () => {
      const error = new SafetyBlockedError(
        'Test error message',
        'DELETE',
        'https://api.example.com/items/1',
        'NO_DELETE',
      );

      expect(error).to.be.instanceOf(Error);
      expect(error).to.be.instanceOf(SafetyBlockedError);
      expect(error.name).to.equal('SafetyBlockedError');
      expect(error.message).to.equal('Test error message');
      expect(error.method).to.equal('DELETE');
      expect(error.url).to.equal('https://api.example.com/items/1');
      expect(error.safetyLevel).to.equal('NO_DELETE');
    });

    it('includes message in error string', () => {
      const error = new SafetyBlockedError(
        'Delete operation blocked',
        'DELETE',
        'https://api.example.com/items/1',
        'NO_DELETE',
      );

      expect(error.toString()).to.include('Delete operation blocked');
    });

    it('is catchable as standard Error', () => {
      try {
        throw new SafetyBlockedError('Test', 'DELETE', '/test', 'NO_DELETE');
      } catch (e) {
        expect(e).to.be.instanceOf(Error);
        expect(e).to.be.instanceOf(SafetyBlockedError);
      }
    });
  });
});
