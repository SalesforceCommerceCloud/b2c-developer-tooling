/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  filterByLevel,
  filterBySearch,
  filterBySince,
  matchesLevel,
  matchesSearch,
  parseLogTimestamp,
  parseRelativeTime,
  parseSinceTime,
  type LogEntry,
} from '@salesforce/b2c-tooling-sdk/operations/logs';

describe('operations/logs/filter', () => {
  describe('parseRelativeTime', () => {
    it('parses minutes', () => {
      expect(parseRelativeTime('5m')).to.equal(5 * 60 * 1000);
      expect(parseRelativeTime('1m')).to.equal(60 * 1000);
      expect(parseRelativeTime('30m')).to.equal(30 * 60 * 1000);
    });

    it('parses hours', () => {
      expect(parseRelativeTime('1h')).to.equal(60 * 60 * 1000);
      expect(parseRelativeTime('2h')).to.equal(2 * 60 * 60 * 1000);
      expect(parseRelativeTime('24h')).to.equal(24 * 60 * 60 * 1000);
    });

    it('parses days', () => {
      expect(parseRelativeTime('1d')).to.equal(24 * 60 * 60 * 1000);
      expect(parseRelativeTime('2d')).to.equal(2 * 24 * 60 * 60 * 1000);
      expect(parseRelativeTime('7d')).to.equal(7 * 24 * 60 * 60 * 1000);
    });

    it('is case-insensitive', () => {
      expect(parseRelativeTime('5M')).to.equal(5 * 60 * 1000);
      expect(parseRelativeTime('1H')).to.equal(60 * 60 * 1000);
      expect(parseRelativeTime('2D')).to.equal(2 * 24 * 60 * 60 * 1000);
    });

    it('returns null for invalid format', () => {
      expect(parseRelativeTime('5x')).to.be.null;
      expect(parseRelativeTime('abc')).to.be.null;
      expect(parseRelativeTime('')).to.be.null;
      expect(parseRelativeTime('10')).to.be.null;
      expect(parseRelativeTime('m5')).to.be.null;
      expect(parseRelativeTime('5 m')).to.be.null;
      expect(parseRelativeTime('5mm')).to.be.null;
    });

    it('handles multi-digit values', () => {
      expect(parseRelativeTime('100m')).to.equal(100 * 60 * 1000);
      expect(parseRelativeTime('999d')).to.equal(999 * 24 * 60 * 60 * 1000);
    });
  });

  describe('parseSinceTime', () => {
    const now = new Date('2026-01-25T00:00:00Z');

    it('parses relative time correctly', () => {
      const result = parseSinceTime('5m', now);
      expect(result.getTime()).to.equal(now.getTime() - 5 * 60 * 1000);
    });

    it('parses relative hour correctly', () => {
      const result = parseSinceTime('1h', now);
      expect(result.getTime()).to.equal(now.getTime() - 60 * 60 * 1000);
    });

    it('parses relative day correctly', () => {
      const result = parseSinceTime('2d', now);
      expect(result.getTime()).to.equal(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    });

    it('parses ISO 8601 date', () => {
      const isoDate = '2026-01-24T12:00:00Z';
      const result = parseSinceTime(isoDate, now);
      expect(result.toISOString()).to.equal('2026-01-24T12:00:00.000Z');
    });

    it('parses ISO 8601 date without timezone', () => {
      const isoDate = '2026-01-24T12:00:00';
      const result = parseSinceTime(isoDate, now);
      expect(result.getFullYear()).to.equal(2026);
      expect(result.getMonth()).to.equal(0); // January
      expect(result.getDate()).to.equal(24);
    });

    it('throws TypeError for invalid input', () => {
      expect(() => parseSinceTime('garbage', now)).to.throw(TypeError, /Invalid --since value: "garbage"/);
      expect(() => parseSinceTime('not-a-date', now)).to.throw(TypeError);
      expect(() => parseSinceTime('2026-99-99', now)).to.throw(TypeError);
    });

    it('throws for empty string', () => {
      expect(() => parseSinceTime('', now)).to.throw(TypeError);
    });

    it('handles case-insensitive relative time', () => {
      const resultLower = parseSinceTime('5m', now);
      const resultUpper = parseSinceTime('5M', now);
      expect(resultLower.getTime()).to.equal(resultUpper.getTime());
    });

    it('uses injected now parameter correctly', () => {
      const customNow = new Date('2026-07-01T00:00:00Z');
      const result = parseSinceTime('1d', customNow);
      expect(result.getTime()).to.equal(customNow.getTime() - 24 * 60 * 60 * 1000);
    });
  });

  describe('parseLogTimestamp', () => {
    it('parses valid B2C log timestamp', () => {
      const timestamp = '2025-01-25 10:30:45.123 GMT';
      const result = parseLogTimestamp(timestamp);

      expect(result).to.not.be.null;
      expect(result!.getUTCFullYear()).to.equal(2025);
      expect(result!.getUTCMonth()).to.equal(0); // January
      expect(result!.getUTCDate()).to.equal(25);
      expect(result!.getUTCHours()).to.equal(10);
      expect(result!.getUTCMinutes()).to.equal(30);
      expect(result!.getUTCSeconds()).to.equal(45);
      expect(result!.getUTCMilliseconds()).to.equal(123);
    });

    it('parses timestamp without milliseconds', () => {
      const timestamp = '2025-01-25 10:30:45 GMT';
      const result = parseLogTimestamp(timestamp);

      expect(result).to.not.be.null;
      expect(result!.getUTCHours()).to.equal(10);
      expect(result!.getUTCMinutes()).to.equal(30);
      expect(result!.getUTCSeconds()).to.equal(45);
    });

    it('returns null for invalid timestamp', () => {
      expect(parseLogTimestamp('invalid')).to.be.null;
      expect(parseLogTimestamp('')).to.be.null;
      expect(parseLogTimestamp('not a date')).to.be.null;
      expect(parseLogTimestamp('2025-99-99 10:30:45 GMT')).to.be.null;
    });

    it('returns null for malformed timestamp', () => {
      // The parser is lenient with ISO-like formats, so test truly invalid cases
      expect(parseLogTimestamp('just text')).to.be.null;
      expect(parseLogTimestamp('25/01/2025 10:30:45')).to.be.null;
    });
  });

  describe('filterBySince', () => {
    const sinceDate = new Date('2025-01-25T10:00:00Z');

    function createEntry(timestamp?: string): LogEntry {
      return {
        file: 'test.log',
        timestamp,
        level: 'ERROR',
        message: 'Test message',
        raw: 'Raw line',
      };
    }

    it('includes entries without timestamp', () => {
      const entries = [createEntry(), createEntry('2025-01-25 09:00:00.000 GMT')];
      const result = filterBySince(entries, sinceDate);

      expect(result).to.have.length(1);
      expect(result[0].timestamp).to.be.undefined;
    });

    it('includes entries with unparseable timestamp', () => {
      const entries = [createEntry('invalid-timestamp')];
      const result = filterBySince(entries, sinceDate);

      expect(result).to.have.length(1);
    });

    it('includes entries on or after since date', () => {
      const entries = [
        createEntry('2025-01-25 10:00:00.000 GMT'), // exactly at
        createEntry('2025-01-25 10:00:01.000 GMT'), // after
        createEntry('2025-01-25 11:00:00.000 GMT'), // way after
      ];
      const result = filterBySince(entries, sinceDate);

      expect(result).to.have.length(3);
    });

    it('excludes entries before since date', () => {
      const entries = [
        createEntry('2025-01-25 09:59:59.999 GMT'), // just before
        createEntry('2025-01-25 09:00:00.000 GMT'), // before
        createEntry('2025-01-24 10:00:00.000 GMT'), // day before
      ];
      const result = filterBySince(entries, sinceDate);

      expect(result).to.have.length(0);
    });

    it('handles mixed valid and invalid entries', () => {
      const entries = [
        createEntry('2025-01-25 09:00:00.000 GMT'), // before - excluded
        createEntry('2025-01-25 11:00:00.000 GMT'), // after - included
        createEntry(), // no timestamp - included
        createEntry('invalid'), // unparseable - included
      ];
      const result = filterBySince(entries, sinceDate);

      expect(result).to.have.length(3);
    });

    it('handles empty array', () => {
      const result = filterBySince([], sinceDate);
      expect(result).to.be.empty;
    });
  });

  describe('filterByLevel', () => {
    function createEntry(level?: string): LogEntry {
      return {
        file: 'test.log',
        level,
        message: 'Test message',
        raw: 'Raw line',
      };
    }

    it('filters by single level', () => {
      const entries = [createEntry('ERROR'), createEntry('INFO'), createEntry('WARN')];
      const result = filterByLevel(entries, ['ERROR']);

      expect(result).to.have.length(1);
      expect(result[0].level).to.equal('ERROR');
    });

    it('filters by multiple levels', () => {
      const entries = [createEntry('ERROR'), createEntry('INFO'), createEntry('WARN'), createEntry('DEBUG')];
      const result = filterByLevel(entries, ['ERROR', 'WARN']);

      expect(result).to.have.length(2);
      expect(result.map((e) => e.level)).to.deep.equal(['ERROR', 'WARN']);
    });

    it('is case-insensitive', () => {
      const entries = [createEntry('error'), createEntry('INFO'), createEntry('WaRn')];
      const result = filterByLevel(entries, ['ERROR', 'warn']);

      expect(result).to.have.length(2);
    });

    it('excludes entries without level', () => {
      const entries = [createEntry('ERROR'), createEntry(), createEntry('INFO')];
      const result = filterByLevel(entries, ['ERROR', 'INFO']);

      expect(result).to.have.length(2);
    });

    it('handles empty levels array', () => {
      const entries = [createEntry('ERROR'), createEntry('INFO')];
      const result = filterByLevel(entries, []);

      expect(result).to.be.empty;
    });

    it('handles empty entries array', () => {
      const result = filterByLevel([], ['ERROR']);
      expect(result).to.be.empty;
    });

    it('handles no matches', () => {
      const entries = [createEntry('ERROR'), createEntry('WARN')];
      const result = filterByLevel(entries, ['INFO', 'DEBUG']);

      expect(result).to.be.empty;
    });
  });

  describe('filterBySearch', () => {
    function createEntry(message: string, raw?: string): LogEntry {
      return {
        file: 'test.log',
        level: 'ERROR',
        message,
        raw: raw ?? message,
      };
    }

    it('filters by message substring', () => {
      const entries = [createEntry('Error in Home.js'), createEntry('Error in Cart.js'), createEntry('Success')];
      const result = filterBySearch(entries, 'Error');

      expect(result).to.have.length(2);
    });

    it('is case-insensitive', () => {
      const entries = [createEntry('ERROR in module'), createEntry('error in script'), createEntry('Success')];
      const result = filterBySearch(entries, 'error');

      expect(result).to.have.length(2);
    });

    it('searches in raw field', () => {
      const entries = [
        createEntry('Processed message', '[2025-01-25 10:00:00.000 GMT] ERROR Original error'),
        createEntry('Another message', 'Simple line'),
      ];
      const result = filterBySearch(entries, 'Original');

      expect(result).to.have.length(1);
    });

    it('matches if found in either message or raw', () => {
      const entries = [
        createEntry('Message contains foo', 'Raw contains bar'),
        createEntry('No match in message', 'No match in raw'),
      ];

      const fooResult = filterBySearch(entries, 'foo');
      expect(fooResult).to.have.length(1);

      const barResult = filterBySearch(entries, 'bar');
      expect(barResult).to.have.length(1);
    });

    it('handles partial word matches', () => {
      const entries = [createEntry('Pipeline not found'), createEntry('Error in pipe processing')];
      const result = filterBySearch(entries, 'pipe');

      expect(result).to.have.length(2);
    });

    it('handles empty search string', () => {
      const entries = [createEntry('Message 1'), createEntry('Message 2')];
      const result = filterBySearch(entries, '');

      // Empty string is contained in all strings
      expect(result).to.have.length(2);
    });

    it('handles empty entries array', () => {
      const result = filterBySearch([], 'search');
      expect(result).to.be.empty;
    });

    it('handles no matches', () => {
      const entries = [createEntry('Error message'), createEntry('Warning message')];
      const result = filterBySearch(entries, 'success');

      expect(result).to.be.empty;
    });
  });

  describe('matchesLevel', () => {
    function createEntry(level?: string): LogEntry {
      return {
        file: 'test.log',
        level,
        message: 'Test message',
        raw: 'Raw line',
      };
    }

    it('matches single entry with correct level', () => {
      const entry = createEntry('ERROR');
      expect(matchesLevel(entry, ['ERROR'])).to.be.true;
    });

    it('matches single entry with multiple levels', () => {
      const entry = createEntry('WARN');
      expect(matchesLevel(entry, ['ERROR', 'WARN'])).to.be.true;
    });

    it('is case-insensitive', () => {
      const entry = createEntry('error');
      expect(matchesLevel(entry, ['ERROR'])).to.be.true;
    });

    it('returns false for non-matching level', () => {
      const entry = createEntry('DEBUG');
      expect(matchesLevel(entry, ['ERROR', 'WARN'])).to.be.false;
    });

    it('returns false for entry without level', () => {
      const entry = createEntry();
      expect(matchesLevel(entry, ['ERROR'])).to.be.false;
    });

    it('returns false for empty levels array', () => {
      const entry = createEntry('ERROR');
      expect(matchesLevel(entry, [])).to.be.false;
    });
  });

  describe('matchesSearch', () => {
    function createEntry(message: string, raw?: string): LogEntry {
      return {
        file: 'test.log',
        level: 'ERROR',
        message,
        raw: raw ?? message,
      };
    }

    it('matches message substring', () => {
      const entry = createEntry('Error in Home.js');
      expect(matchesSearch(entry, 'Error')).to.be.true;
    });

    it('is case-insensitive', () => {
      const entry = createEntry('ERROR in module');
      expect(matchesSearch(entry, 'error')).to.be.true;
    });

    it('matches raw substring', () => {
      const entry = createEntry('Processed', 'Original error');
      expect(matchesSearch(entry, 'Original')).to.be.true;
    });

    it('returns true if found in either message or raw', () => {
      const entry = createEntry('Message foo', 'Raw bar');
      expect(matchesSearch(entry, 'foo')).to.be.true;
      expect(matchesSearch(entry, 'bar')).to.be.true;
    });

    it('returns false for non-matching search', () => {
      const entry = createEntry('Error message', 'Raw line');
      expect(matchesSearch(entry, 'success')).to.be.false;
    });

    it('handles empty search string', () => {
      const entry = createEntry('Message');
      expect(matchesSearch(entry, '')).to.be.true;
    });

    it('handles partial matches', () => {
      const entry = createEntry('Pipeline not found');
      expect(matchesSearch(entry, 'pipe')).to.be.true;
    });
  });
});
