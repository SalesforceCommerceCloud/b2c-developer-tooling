/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  parseRelativeTime,
  parseSinceTime,
  parseLogTimestamp,
  filterBySince,
  filterByLevel,
  filterBySearch,
  matchesLevel,
  matchesSearch,
} from '../../../src/utils/logs/filter.js';

describe('utils/logs/filter', () => {
  describe('parseRelativeTime', () => {
    it('parses minutes', () => {
      expect(parseRelativeTime('5m')).to.equal(5 * 60 * 1000);
      expect(parseRelativeTime('30m')).to.equal(30 * 60 * 1000);
    });

    it('parses hours', () => {
      expect(parseRelativeTime('1h')).to.equal(60 * 60 * 1000);
      expect(parseRelativeTime('24h')).to.equal(24 * 60 * 60 * 1000);
    });

    it('parses days', () => {
      expect(parseRelativeTime('1d')).to.equal(24 * 60 * 60 * 1000);
      expect(parseRelativeTime('7d')).to.equal(7 * 24 * 60 * 60 * 1000);
    });

    it('returns null for invalid formats', () => {
      expect(parseRelativeTime('')).to.be.null;
      expect(parseRelativeTime('abc')).to.be.null;
      expect(parseRelativeTime('5x')).to.be.null;
      expect(parseRelativeTime('m5')).to.be.null;
    });
  });

  describe('parseSinceTime', () => {
    it('parses relative time strings', () => {
      const result = parseSinceTime('5m');
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      expect(result.getTime()).to.be.closeTo(fiveMinutesAgo, 1000);
    });

    it('parses ISO 8601 dates', () => {
      const result = parseSinceTime('2025-01-15T10:00:00Z');
      expect(result.toISOString()).to.equal('2025-01-15T10:00:00.000Z');
    });

    it('throws on invalid input', () => {
      expect(() => parseSinceTime('not-a-date')).to.throw('Invalid --since value');
    });
  });

  describe('parseLogTimestamp', () => {
    it('parses B2C log timestamps', () => {
      const result = parseLogTimestamp('2025-01-25 10:30:45.123 GMT');
      expect(result).to.be.instanceOf(Date);
      expect(result!.getUTCHours()).to.equal(10);
    });

    it('returns null for invalid timestamps', () => {
      expect(parseLogTimestamp('not-a-date')).to.be.null;
    });
  });

  describe('filterBySince', () => {
    const entries = [
      {timestamp: '2025-01-25 10:30:45.123 GMT', message: 'msg1', file: 'f1', raw: 'r1', level: 'ERROR'},
      {timestamp: '2025-01-25 08:00:00.000 GMT', message: 'msg2', file: 'f2', raw: 'r2', level: 'INFO'},
    ] as any[];

    it('filters entries by timestamp', () => {
      const since = new Date('2025-01-25T09:00:00Z');
      const result = filterBySince(entries, since);
      expect(result).to.have.lengthOf(1);
      expect(result[0].message).to.equal('msg1');
    });

    it('includes entries without timestamps', () => {
      const entriesNoTs = [{message: 'no-ts', file: 'f', raw: 'r', level: 'ERROR'} as any];
      const since = new Date('2025-01-25T09:00:00Z');
      const result = filterBySince(entriesNoTs, since);
      expect(result).to.have.lengthOf(1);
    });
  });

  describe('filterByLevel', () => {
    const entries = [
      {message: 'err', file: 'f1', raw: 'r1', level: 'ERROR', timestamp: ''},
      {message: 'info', file: 'f2', raw: 'r2', level: 'INFO', timestamp: ''},
      {message: 'warn', file: 'f3', raw: 'r3', level: 'WARN', timestamp: ''},
    ] as any[];

    it('filters by single level', () => {
      const result = filterByLevel(entries, ['ERROR']);
      expect(result).to.have.lengthOf(1);
      expect(result[0].message).to.equal('err');
    });

    it('filters by multiple levels', () => {
      const result = filterByLevel(entries, ['ERROR', 'WARN']);
      expect(result).to.have.lengthOf(2);
    });

    it('is case-insensitive', () => {
      const result = filterByLevel(entries, ['error']);
      expect(result).to.have.lengthOf(1);
    });

    it('excludes entries without level', () => {
      const entriesNoLevel = [{message: 'no-level', file: 'f', raw: 'r'} as any];
      const result = filterByLevel(entriesNoLevel, ['ERROR']);
      expect(result).to.have.lengthOf(0);
    });
  });

  describe('filterBySearch', () => {
    const entries = [
      {message: 'OrderMgr processing error', raw: 'raw1', file: 'f1', level: 'ERROR', timestamp: ''},
      {message: 'Payment succeeded', raw: 'raw2', file: 'f2', level: 'INFO', timestamp: ''},
    ] as any[];

    it('filters by message content', () => {
      const result = filterBySearch(entries, 'OrderMgr');
      expect(result).to.have.lengthOf(1);
      expect(result[0].message).to.include('OrderMgr');
    });

    it('is case-insensitive', () => {
      const result = filterBySearch(entries, 'ordermgr');
      expect(result).to.have.lengthOf(1);
    });

    it('searches raw content too', () => {
      const entriesRaw = [{message: 'hello', raw: 'OrderMgr raw', file: 'f', level: 'INFO', timestamp: ''} as any];
      const result = filterBySearch(entriesRaw, 'OrderMgr');
      expect(result).to.have.lengthOf(1);
    });
  });

  describe('matchesLevel', () => {
    it('returns true for matching level', () => {
      const entry = {message: 'err', raw: 'r', file: 'f', level: 'ERROR', timestamp: ''} as any;
      expect(matchesLevel(entry, ['ERROR'])).to.be.true;
    });

    it('returns false for non-matching level', () => {
      const entry = {message: 'info', raw: 'r', file: 'f', level: 'INFO', timestamp: ''} as any;
      expect(matchesLevel(entry, ['ERROR'])).to.be.false;
    });

    it('returns false when entry has no level', () => {
      const entry = {message: 'msg', raw: 'r', file: 'f'} as any;
      expect(matchesLevel(entry, ['ERROR'])).to.be.false;
    });
  });

  describe('matchesSearch', () => {
    it('returns true for matching message', () => {
      const entry = {message: 'Error in OrderMgr', raw: 'raw', file: 'f', level: 'ERROR', timestamp: ''} as any;
      expect(matchesSearch(entry, 'OrderMgr')).to.be.true;
    });

    it('returns true for matching raw content', () => {
      const entry = {message: 'hello', raw: 'OrderMgr raw data', file: 'f', level: 'INFO', timestamp: ''} as any;
      expect(matchesSearch(entry, 'OrderMgr')).to.be.true;
    });

    it('returns false for no match', () => {
      const entry = {message: 'hello', raw: 'world', file: 'f', level: 'INFO', timestamp: ''} as any;
      expect(matchesSearch(entry, 'OrderMgr')).to.be.false;
    });
  });
});
