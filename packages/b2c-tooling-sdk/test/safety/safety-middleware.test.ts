/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  checkSafetyViolation,
  getSafetyLevel,
  describeSafetyLevel,
  SafetyBlockedError,
  type SafetyConfig,
  type SafetyLevel,
} from '@salesforce/b2c-tooling-sdk';

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

    describe('allowedPaths whitelist', () => {
      it('allows operations to whitelisted paths regardless of safety level', () => {
        const config: SafetyConfig = {
          level: 'READ_ONLY',
          allowedPaths: ['/auth/token', '/health'],
        };

        // DELETE should normally be blocked in READ_ONLY, but allowed for whitelisted paths
        expect(checkSafetyViolation('DELETE', 'https://api.example.com/auth/token', config)).to.be.undefined;
        expect(checkSafetyViolation('POST', 'https://api.example.com/health', config)).to.be.undefined;

        // Non-whitelisted path should still be blocked
        const result = checkSafetyViolation('POST', 'https://api.example.com/items', config);
        expect(result).to.include('Write operation blocked');
      });

      it('matches paths using startsWith (prefix matching)', () => {
        const config: SafetyConfig = {
          level: 'READ_ONLY',
          allowedPaths: ['/auth'],
        };

        // All auth paths should be allowed
        expect(checkSafetyViolation('POST', 'https://api.example.com/auth/token', config)).to.be.undefined;
        expect(checkSafetyViolation('POST', 'https://api.example.com/auth/refresh', config)).to.be.undefined;

        // Non-auth path should be blocked
        const result = checkSafetyViolation('POST', 'https://api.example.com/items', config);
        expect(result).to.include('Write operation blocked');
      });
    });

    describe('blockedPaths blacklist', () => {
      it('blocks operations to blacklisted paths regardless of safety level', () => {
        const config: SafetyConfig = {
          level: 'NONE',
          blockedPaths: ['/admin', '/dangerous'],
        };

        // Even with NONE level, blacklisted paths should be blocked
        const adminResult = checkSafetyViolation('GET', 'https://api.example.com/admin/users', config);
        expect(adminResult).to.include('blocked paths list');

        const dangerousResult = checkSafetyViolation('GET', 'https://api.example.com/dangerous/operation', config);
        expect(dangerousResult).to.include('blocked paths list');

        // Non-blacklisted path should be allowed (NONE level)
        expect(checkSafetyViolation('DELETE', 'https://api.example.com/items/1', config)).to.be.undefined;
      });

      it('matches paths using startsWith (prefix matching)', () => {
        const config: SafetyConfig = {
          level: 'NONE',
          blockedPaths: ['/admin'],
        };

        // All admin paths should be blocked
        const result1 = checkSafetyViolation('GET', 'https://api.example.com/admin/users', config);
        expect(result1).to.include('blocked paths list');

        const result2 = checkSafetyViolation('GET', 'https://api.example.com/admin/settings', config);
        expect(result2).to.include('blocked paths list');

        // Non-admin path should be allowed
        expect(checkSafetyViolation('GET', 'https://api.example.com/public/data', config)).to.be.undefined;
      });
    });

    describe('allowedPaths takes precedence over blockedPaths', () => {
      it('allows whitelisted paths even if they match blacklist', () => {
        const config: SafetyConfig = {
          level: 'NONE',
          allowedPaths: ['/admin/readonly'],
          blockedPaths: ['/admin'],
        };

        // Whitelisted path should be allowed despite matching blacklist
        expect(checkSafetyViolation('GET', 'https://api.example.com/admin/readonly/data', config)).to.be.undefined;

        // Other admin paths should still be blocked
        const result = checkSafetyViolation('GET', 'https://api.example.com/admin/users', config);
        expect(result).to.include('blocked paths list');
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

    it('supports backward compatibility aliases', () => {
      process.env['SFCC_SAFETY_LEVEL'] = 'NO_DESTRUCTIVE';
      expect(getSafetyLevel()).to.equal('NO_UPDATE');

      process.env['SFCC_SAFETY_LEVEL'] = 'READONLY';
      expect(getSafetyLevel()).to.equal('READ_ONLY');

      process.env['SFCC_SAFETY_LEVEL'] = 'readonly';
      expect(getSafetyLevel()).to.equal('READ_ONLY');
    });

    it('returns default level for invalid values', () => {
      process.env['SFCC_SAFETY_LEVEL'] = 'invalid-value';
      expect(getSafetyLevel()).to.equal('NONE');

      process.env['SFCC_SAFETY_LEVEL'] = 'invalid-value';
      expect(getSafetyLevel('READ_ONLY')).to.equal('READ_ONLY');
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
