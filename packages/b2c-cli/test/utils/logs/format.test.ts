/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {formatEntry, highlightLogText, setupPathNormalizer, DEFAULT_PREFIXES} from '../../../src/utils/logs/format.js';

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

  describe('highlightLogText', () => {
    it('highlights log levels and dims timestamps', () => {
      const input = '[2026-03-16 17:05:08.685 GMT] INFO system-job|12345 - Starting import';
      const result = highlightLogText(input);
      // Should contain ANSI codes
      expect(result).to.include('\u001B[');
      // Should still contain the text content
      expect(result).to.include('INFO');
      expect(result).to.include('Starting import');
    });

    it('highlights ERROR lines in red', () => {
      const input = '[2026-03-16 17:05:08.685 GMT] ERROR system-job|12345 - Import failed';
      const result = highlightLogText(input);
      expect(result).to.include('\u001B[31m'); // Red
      expect(result).to.include('ERROR');
    });

    it('leaves non-matching lines unchanged', () => {
      const input = '  at com.example.SomeClass.method(SomeClass.java:42)';
      const result = highlightLogText(input);
      expect(result).to.equal(input);
    });

    it('handles multi-line text with mixed content', () => {
      const input = [
        '[2026-03-16 17:05:08.685 GMT] ERROR system-job|1 - Failed',
        '  stack trace line 1',
        '  stack trace line 2',
        '[2026-03-16 17:05:09.000 GMT] INFO system-job|2 - Done',
      ].join('\n');
      const result = highlightLogText(input);
      const lines = result.split('\n');
      // First and last lines should have ANSI codes
      expect(lines[0]).to.include('\u001B[');
      expect(lines[3]).to.include('\u001B[');
      // Stack trace lines should be unchanged
      expect(lines[1]).to.equal('  stack trace line 1');
      expect(lines[2]).to.equal('  stack trace line 2');
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
