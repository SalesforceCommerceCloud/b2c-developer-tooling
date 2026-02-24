/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {formatEntry, setupPathNormalizer, DEFAULT_PREFIXES} from '../../../src/utils/logs/format.js';

describe('utils/logs/format', () => {
  describe('DEFAULT_PREFIXES', () => {
    it('includes error and customerror', () => {
      expect(DEFAULT_PREFIXES).to.include('error');
      expect(DEFAULT_PREFIXES).to.include('customerror');
    });
  });

  describe('formatEntry', () => {
    const baseEntry = {
      file: 'error-2025-01-25.log',
      message: 'Test error message',
      raw: 'raw line',
      level: 'ERROR',
      timestamp: '2025-01-25 10:30:45.123 GMT',
    } as any;

    it('formats entry without color', () => {
      const result = formatEntry(baseEntry, false);
      expect(result).to.include('ERROR');
      expect(result).to.include('[2025-01-25 10:30:45.123 GMT]');
      expect(result).to.include('[error-2025-01-25.log]');
      expect(result).to.include('Test error message');
    });

    it('formats entry with color', () => {
      const result = formatEntry(baseEntry, true);
      expect(result).to.include('ERROR');
      expect(result).to.include('Test error message');
      // ANSI codes should be present
      expect(result).to.include('\u001B[');
    });

    it('handles entry without level', () => {
      const entry = {...baseEntry, level: undefined};
      const result = formatEntry(entry, false);
      expect(result).to.include('[error-2025-01-25.log]');
      expect(result).not.to.include('ERROR');
    });

    it('handles entry without timestamp', () => {
      const entry = {...baseEntry, timestamp: undefined};
      const result = formatEntry(entry, false);
      expect(result).to.include('ERROR');
      expect(result).not.to.include('[undefined]');
    });

    it('formats INFO level with color', () => {
      const entry = {...baseEntry, level: 'INFO'};
      const result = formatEntry(entry, true);
      expect(result).to.include('INFO');
    });

    it('formats WARN level with color', () => {
      const entry = {...baseEntry, level: 'WARN'};
      const result = formatEntry(entry, true);
      expect(result).to.include('WARN');
    });

    it('formats DEBUG level with color', () => {
      const entry = {...baseEntry, level: 'DEBUG'};
      const result = formatEntry(entry, true);
      expect(result).to.include('DEBUG');
    });

    it('formats unknown level with color', () => {
      const entry = {...baseEntry, level: 'CUSTOM'};
      const result = formatEntry(entry, true);
      expect(result).to.include('CUSTOM');
    });
  });

  describe('setupPathNormalizer', () => {
    it('returns undefined when noNormalize is true', () => {
      const result = setupPathNormalizer(undefined, true);
      expect(result).to.be.undefined;
    });

    it('returns undefined when noNormalize is true even with cartridgePath', () => {
      const result = setupPathNormalizer('some/path', true);
      expect(result).to.be.undefined;
    });
  });
});
