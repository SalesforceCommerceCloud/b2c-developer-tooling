/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import type {MrtLogEntry} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {formatMrtEntry} from '../../../src/utils/mrt-logs/format.js';

describe('utils/mrt-logs/format', () => {
  describe('formatMrtEntry', () => {
    const fullEntry: MrtLogEntry = {
      timestamp: '2025-01-15T10:30:45.123Z',
      requestId: '550e8400-e29b-41d4-a716-446655440000',
      shortRequestId: '550e8400',
      level: 'INFO',
      message: 'Request processed successfully',
      raw: '2025-01-15T10:30:45.123Z\t550e8400-e29b-41d4-a716-446655440000\tINFO\tRequest processed successfully',
    };

    describe('without color', () => {
      it('should format a full entry', () => {
        const result = formatMrtEntry(fullEntry, {useColor: false});

        expect(result).to.include('INFO');
        expect(result).to.include('[2025-01-15T10:30:45.123Z]');
        expect(result).to.include('[550e8400]');
        expect(result).to.include('Request processed successfully');
      });

      it('should format entry without timestamp', () => {
        const entry: MrtLogEntry = {
          level: 'ERROR',
          message: 'Something failed',
          raw: 'ERROR Something failed',
        };

        const result = formatMrtEntry(entry, {useColor: false});

        expect(result).to.include('ERROR');
        expect(result).to.include('Something failed');
        expect(result).not.to.include('[undefined]');
      });

      it('should format entry without level', () => {
        const entry: MrtLogEntry = {
          message: 'Just a plain message',
          raw: 'Just a plain message',
        };

        const result = formatMrtEntry(entry, {useColor: false});

        expect(result).to.include('Just a plain message');
      });

      it('should format entry without request ID', () => {
        const entry: MrtLogEntry = {
          level: 'WARN',
          message: 'Warning message',
          raw: 'WARN Warning message',
        };

        const result = formatMrtEntry(entry, {useColor: false});

        expect(result).to.include('WARN');
        expect(result).to.include('Warning message');
      });

      it('should output each log level correctly', () => {
        for (const level of ['ERROR', 'WARN', 'INFO', 'DEBUG', 'FATAL', 'TRACE']) {
          const entry: MrtLogEntry = {
            level,
            message: `${level} message`,
            raw: `${level} ${level} message`,
          };

          const result = formatMrtEntry(entry, {useColor: false});
          expect(result).to.include(level);
        }
      });

      it('should not highlight search matches without color', () => {
        const entry: MrtLogEntry = {
          level: 'INFO',
          message: 'Connection timeout occurred',
          raw: 'INFO Connection timeout occurred',
        };

        const result = formatMrtEntry(entry, {useColor: false, searchHighlight: /timeout/gi});

        expect(result).to.include('timeout');
        // No ANSI codes
        expect(result).not.to.include('\u001B[');
      });
    });

    describe('with color', () => {
      it('should include ANSI color codes for known levels', () => {
        const result = formatMrtEntry(fullEntry, {useColor: true});

        expect(result).to.include('\u001B[');
        expect(result).to.include('INFO');
      });

      it('should include BOLD for level', () => {
        const result = formatMrtEntry(fullEntry, {useColor: true});

        // BOLD = \u001B[1m
        expect(result).to.include('\u001B[1m');
      });

      it('should include DIM for timestamp and request ID', () => {
        const result = formatMrtEntry(fullEntry, {useColor: true});

        // DIM = \u001B[2m
        expect(result).to.include('\u001B[2m');
      });

      it('should use red for ERROR', () => {
        const entry: MrtLogEntry = {
          level: 'ERROR',
          message: 'Error occurred',
          raw: 'ERROR Error occurred',
        };

        const result = formatMrtEntry(entry, {useColor: true});
        // Red = \u001B[31m
        expect(result).to.include('\u001B[31m');
      });

      it('should use yellow for WARN', () => {
        const entry: MrtLogEntry = {
          level: 'WARN',
          message: 'Warning',
          raw: 'WARN Warning',
        };

        const result = formatMrtEntry(entry, {useColor: true});
        // Yellow = \u001B[33m
        expect(result).to.include('\u001B[33m');
      });

      it('should use cyan for INFO', () => {
        const entry: MrtLogEntry = {
          level: 'INFO',
          message: 'Info',
          raw: 'INFO Info',
        };

        const result = formatMrtEntry(entry, {useColor: true});
        // Cyan = \u001B[36m
        expect(result).to.include('\u001B[36m');
      });
    });

    describe('search highlighting', () => {
      it('should highlight search matches in message', () => {
        const entry: MrtLogEntry = {
          level: 'INFO',
          message: 'Connection timeout occurred',
          raw: 'INFO Connection timeout occurred',
        };

        const result = formatMrtEntry(entry, {useColor: true, searchHighlight: /timeout/gi});

        // Bold yellow = \u001B[1;33m
        expect(result).to.include('\u001B[1;33m');
        expect(result).to.include('timeout');
      });

      it('should highlight multiple matches', () => {
        const entry: MrtLogEntry = {
          level: 'INFO',
          message: 'GET /api then GET /home',
          raw: 'INFO GET /api then GET /home',
        };

        const result = formatMrtEntry(entry, {useColor: true, searchHighlight: /GET/gi});

        // Count highlight occurrences (bold yellow)
        const highlightCode = '\u001B[1;33m';
        const count = result.split(highlightCode).length - 1;
        expect(count).to.equal(2);
      });

      it('should handle regex patterns', () => {
        const entry: MrtLogEntry = {
          level: 'INFO',
          message: 'GET /api/v1/products 200 150ms',
          raw: 'INFO GET /api/v1/products 200 150ms',
        };

        const result = formatMrtEntry(entry, {useColor: true, searchHighlight: /GET|POST/gi});

        expect(result).to.include('\u001B[1;33m');
        expect(result).to.include('GET');
      });
    });
  });
});
