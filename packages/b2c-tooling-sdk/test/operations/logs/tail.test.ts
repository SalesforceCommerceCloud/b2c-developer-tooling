/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {WebDavClient} from '@salesforce/b2c-tooling-sdk/clients';
import {
  aggregateLogEntries,
  parseLogEntry,
  parseLogLine,
  splitLines,
  tailLogs,
  getRecentLogs,
  type LogEntry,
  type LogFile,
} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const TEST_HOST = 'test.demandware.net';
const BASE_URL = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;

/**
 * Generates a PROPFIND XML response for testing.
 */
function generatePropfindXml(entries: {name: string; size: number; date: Date}[]): string {
  const responses = entries.map(({name, size, date}) => {
    return `
    <D:response>
      <D:href>/on/demandware.servlet/webdav/Sites/Logs/${name}</D:href>
      <D:propstat>
        <D:prop>
          <D:displayname>${name}</D:displayname>
          <D:resourcetype></D:resourcetype>
          <D:getcontentlength>${size}</D:getcontentlength>
          <D:getlastmodified>${date.toUTCString()}</D:getlastmodified>
        </D:prop>
        <D:status>HTTP/1.1 200 OK</D:status>
      </D:propstat>
    </D:response>`;
  });

  return `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  ${responses.join('\n')}
</D:multistatus>`;
}

describe('operations/logs/tail', () => {
  describe('parseLogLine', () => {
    it('parses standard B2C log format', () => {
      const line = '[2025-01-25 10:30:45.123 GMT] ERROR Some error message';
      const entry = parseLogLine(line, 'error-blade1-20250125.log');

      expect(entry.file).to.equal('error-blade1-20250125.log');
      expect(entry.timestamp).to.equal('2025-01-25 10:30:45.123 GMT');
      expect(entry.level).to.equal('ERROR');
      // Message is the content portion (without timestamp/level prefix)
      expect(entry.message).to.equal('Some error message');
      expect(entry.raw).to.equal(line);
    });

    it('parses INFO level', () => {
      const line = '[2025-01-25 10:30:45.123 GMT] INFO Application started';
      const entry = parseLogLine(line, 'info.log');

      expect(entry.level).to.equal('INFO');
      expect(entry.message).to.include('Application started');
    });

    it('parses WARN level', () => {
      const line = '[2025-01-25 10:30:45.123 GMT] WARN Deprecated feature used';
      const entry = parseLogLine(line, 'warn.log');

      expect(entry.level).to.equal('WARN');
    });

    it('parses DEBUG level', () => {
      const line = '[2025-01-25 10:30:45.123 GMT] DEBUG Variable value: 42';
      const entry = parseLogLine(line, 'debug.log');

      expect(entry.level).to.equal('DEBUG');
    });

    it('parses FATAL level', () => {
      const line = '[2025-01-25 10:30:45.123 GMT] FATAL Critical failure';
      const entry = parseLogLine(line, 'fatal.log');

      expect(entry.level).to.equal('FATAL');
    });

    it('handles unparseable lines', () => {
      const line = 'This is just a plain message without proper format';
      const entry = parseLogLine(line, 'error.log');

      expect(entry.file).to.equal('error.log');
      expect(entry.level).to.be.undefined;
      expect(entry.timestamp).to.be.undefined;
      expect(entry.message).to.equal(line);
      expect(entry.raw).to.equal(line);
    });

    it('applies path normalizer to message', () => {
      const line = '[2025-01-25 10:30:45.123 GMT] ERROR Error in (app_storefront/cartridge/controllers/Home.js:45)';
      const normalizer = (msg: string) => msg.replace(/app_storefront/g, 'normalized');
      const entry = parseLogLine(line, 'error.log', normalizer);

      expect(entry.message).to.include('normalized');
    });
  });

  describe('parseLogEntry (multi-line)', () => {
    it('parses multi-line error entry', () => {
      const firstLine =
        '[2026-01-26 01:39:58.871 GMT] ERROR PipelineCallServlet|167249813|Sites-Site - Error executing pipeline: QLabs';
      const fullMessage = `${firstLine}
com.demandware.beehive.core.capi.pipeline.PipelineExecutionException: Pipeline not found
System Information
------------------
RequestID: YwHMOe7FdmlClTUK-0-00`;

      const entry = parseLogEntry(firstLine, 'error.log', fullMessage);

      expect(entry.file).to.equal('error.log');
      expect(entry.timestamp).to.equal('2026-01-26 01:39:58.871 GMT');
      expect(entry.level).to.equal('ERROR');
      // Message is the content portion without the [timestamp] LEVEL prefix
      expect(entry.message).to.include('PipelineCallServlet');
      expect(entry.message).to.include('Error executing pipeline');
      expect(entry.message).to.include('Pipeline not found');
      expect(entry.message).to.include('RequestID');
      // raw contains the full original content
      expect(entry.raw).to.equal(fullMessage);
    });

    it('parses customerror with stack trace', () => {
      const firstLine =
        "[2026-01-25 18:55:56.862 GMT] ERROR PipelineCallServlet|632088076 custom []  Error while executing script 'app_storefront_controllers/cartridge/controllers/Home.js'";
      const fullMessage = `${firstLine}
\tat app_storefront_controllers/cartridge/controllers/Home.js:9 (Show)`;

      const entry = parseLogEntry(firstLine, 'customerror.log', fullMessage);

      expect(entry.level).to.equal('ERROR');
      expect(entry.message).to.include('at app_storefront_controllers');
    });

    it('applies path normalizer to full message', () => {
      const firstLine = '[2025-01-25 10:30:45.123 GMT] ERROR Script error';
      const fullMessage = `${firstLine}
\tat app_storefront/cartridge/controllers/Home.js:9`;
      const normalizer = (msg: string) => msg.replace(/app_storefront/g, './cartridges/app_storefront');

      const entry = parseLogEntry(firstLine, 'error.log', fullMessage, normalizer);

      expect(entry.message).to.include('./cartridges/app_storefront');
    });
  });

  describe('aggregateLogEntries', () => {
    it('aggregates lines into multi-line entries', () => {
      const lines = [
        '[2026-01-25 10:00:00.000 GMT] ERROR First error',
        'Stack trace line 1',
        'Stack trace line 2',
        '[2026-01-25 10:00:01.000 GMT] ERROR Second error',
        'Another stack trace',
      ];

      const {entries, pending} = aggregateLogEntries(lines);

      expect(entries).to.have.length(1);
      expect(entries[0]).to.deep.equal([
        '[2026-01-25 10:00:00.000 GMT] ERROR First error',
        'Stack trace line 1',
        'Stack trace line 2',
      ]);
      expect(pending).to.deep.equal(['[2026-01-25 10:00:01.000 GMT] ERROR Second error', 'Another stack trace']);
    });

    it('handles pending lines from previous chunk', () => {
      const pendingLines = ['[2026-01-25 09:59:59.000 GMT] ERROR Previous entry', 'Previous continuation'];
      const lines = ['More previous', '[2026-01-25 10:00:00.000 GMT] ERROR New entry'];

      const {entries, pending} = aggregateLogEntries(lines, pendingLines);

      expect(entries).to.have.length(1);
      expect(entries[0]).to.have.length(3);
      expect(entries[0][0]).to.include('Previous entry');
      expect(entries[0][2]).to.equal('More previous');
      expect(pending).to.deep.equal(['[2026-01-25 10:00:00.000 GMT] ERROR New entry']);
    });

    it('handles empty input', () => {
      const {entries, pending} = aggregateLogEntries([]);

      expect(entries).to.be.empty;
      expect(pending).to.be.empty;
    });

    it('handles single entry without continuation', () => {
      const lines = ['[2026-01-25 10:00:00.000 GMT] ERROR Single line error'];

      const {entries, pending} = aggregateLogEntries(lines);

      expect(entries).to.be.empty;
      expect(pending).to.deep.equal(lines);
    });
  });

  describe('splitLines', () => {
    it('splits content by newlines', () => {
      const content = new TextEncoder().encode('line1\nline2\nline3\n');
      const decoder = new TextDecoder('utf-8');
      const lines = splitLines(content.buffer as ArrayBuffer, decoder);

      expect(lines).to.deep.equal(['line1', 'line2', 'line3']);
    });

    it('handles Windows line endings', () => {
      const content = new TextEncoder().encode('line1\r\nline2\r\n');
      const decoder = new TextDecoder('utf-8');
      const lines = splitLines(content.buffer as ArrayBuffer, decoder);

      expect(lines).to.deep.equal(['line1', 'line2']);
    });

    it('filters out empty lines', () => {
      const content = new TextEncoder().encode('line1\n\n\nline2\n');
      const decoder = new TextDecoder('utf-8');
      const lines = splitLines(content.buffer as ArrayBuffer, decoder);

      expect(lines).to.deep.equal(['line1', 'line2']);
    });

    it('handles incomplete last line in streaming mode', () => {
      const content = new TextEncoder().encode('line1\nincomplete');
      const decoder = new TextDecoder('utf-8');
      const lines = splitLines(content.buffer as ArrayBuffer, decoder, false);

      // In streaming mode, incomplete last line should be excluded
      expect(lines).to.deep.equal(['line1']);
    });
  });

  describe('tailLogs', () => {
    const server = setupServer();

    before(() => {
      server.listen({onUnhandledRequest: 'error'});
    });

    afterEach(() => {
      server.resetHandlers();
    });

    after(() => {
      server.close();
    });

    function createMockInstance(): {webdav: WebDavClient} {
      const mockAuth = new MockAuthStrategy();
      return {
        webdav: new WebDavClient(TEST_HOST, mockAuth),
      };
    }

    it('discovers files and stops on maxEntries', async () => {
      const now = new Date();
      // Multi-line log content with two complete entries
      const logContent = `[2025-01-25 10:30:45.123 GMT] ERROR Test error 1
Stack trace line 1
[2025-01-25 10:30:46.123 GMT] ERROR Test error 2
Stack trace line 2
`;

      server.use(
        http.all(`${BASE_URL}/*`, ({request}) => {
          const url = new URL(request.url);

          if (request.method === 'PROPFIND') {
            return new HttpResponse(
              generatePropfindXml([{name: 'error-blade1-20250125.log', size: logContent.length, date: now}]),
              {status: 207, headers: {'Content-Type': 'application/xml'}},
            );
          }

          if (request.method === 'GET' && url.pathname.includes('error-blade1')) {
            // Return partial content for Range requests
            const rangeHeader = request.headers.get('Range');
            if (rangeHeader) {
              return new HttpResponse(logContent, {
                status: 206,
                headers: {'Content-Type': 'text/plain'},
              });
            }
            return new HttpResponse(logContent, {
              status: 200,
              headers: {'Content-Type': 'text/plain'},
            });
          }

          return new HttpResponse(null, {status: 404});
        }),
      );

      const instance = createMockInstance();
      const entries: LogEntry[] = [];
      const discoveredFiles: LogFile[] = [];

      const result = await tailLogs(instance as never, {
        prefixes: ['error'],
        pollInterval: 100,
        includeExisting: true,
        maxEntries: 2,
        onEntry: (entry) => entries.push(entry),
        onFileDiscovered: (file) => discoveredFiles.push(file),
      });

      await result.done;

      expect(discoveredFiles).to.have.length(1);
      expect(discoveredFiles[0].name).to.equal('error-blade1-20250125.log');
      expect(entries).to.have.length(2);
      expect(entries[0].level).to.equal('ERROR');
      // Multi-line entries should include continuation lines
      expect(entries[0].message).to.include('Stack trace line 1');
    });

    it('stop() terminates tailing', async () => {
      const now = new Date();

      server.use(
        http.all(`${BASE_URL}/*`, ({request}) => {
          if (request.method === 'PROPFIND') {
            return new HttpResponse(generatePropfindXml([{name: 'error-blade1-20250125.log', size: 0, date: now}]), {
              status: 207,
              headers: {'Content-Type': 'application/xml'},
            });
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      const instance = createMockInstance();
      const result = await tailLogs(instance as never, {
        prefixes: ['error'],
        pollInterval: 100,
      });

      // Stop after a short delay
      setTimeout(() => result.stop(), 200);

      // Should complete without hanging
      await result.done;
    });

    it('calls onError when file read fails', async () => {
      const now = new Date();

      server.use(
        http.all(`${BASE_URL}/*`, ({request}) => {
          const url = new URL(request.url);

          if (request.method === 'PROPFIND') {
            return new HttpResponse(generatePropfindXml([{name: 'error-blade1-20250125.log', size: 100, date: now}]), {
              status: 207,
              headers: {'Content-Type': 'application/xml'},
            });
          }

          if (request.method === 'GET' && url.pathname.includes('error-blade1')) {
            return new HttpResponse(null, {status: 500, statusText: 'Internal Server Error'});
          }

          return new HttpResponse(null, {status: 404});
        }),
      );

      const instance = createMockInstance();
      const errors: Error[] = [];

      const result = await tailLogs(instance as never, {
        prefixes: ['error'],
        pollInterval: 100,
        includeExisting: true,
        onError: (err) => errors.push(err),
      });

      // Let one poll cycle complete
      await new Promise((resolve) => setTimeout(resolve, 200));
      await result.stop();
      await result.done;

      expect(errors.length).to.be.greaterThan(0);
      expect(errors[0].message).to.include('500');
    });
  });

  describe('getRecentLogs', () => {
    const server = setupServer();

    before(() => {
      server.listen({onUnhandledRequest: 'error'});
    });

    afterEach(() => {
      server.resetHandlers();
    });

    after(() => {
      server.close();
    });

    function createMockInstance(): {webdav: WebDavClient} {
      const mockAuth = new MockAuthStrategy();
      return {
        webdav: new WebDavClient(TEST_HOST, mockAuth),
      };
    }

    it('returns recent log entries', async () => {
      const now = new Date();
      // Multi-line log content with two complete entries
      const logContent = `[2025-01-25 10:30:45.123 GMT] ERROR Test error 1
Continuation line 1
[2025-01-25 10:30:46.123 GMT] ERROR Test error 2
Continuation line 2
`;

      server.use(
        http.all(`${BASE_URL}/*`, ({request}) => {
          const url = new URL(request.url);

          if (request.method === 'PROPFIND') {
            return new HttpResponse(
              generatePropfindXml([{name: 'error-blade1-20250125.log', size: logContent.length, date: now}]),
              {status: 207, headers: {'Content-Type': 'application/xml'}},
            );
          }

          if (request.method === 'GET' && url.pathname.includes('error-blade1')) {
            return new HttpResponse(logContent, {
              status: 200,
              headers: {'Content-Type': 'text/plain'},
            });
          }

          return new HttpResponse(null, {status: 404});
        }),
      );

      const instance = createMockInstance();
      const entries = await getRecentLogs(instance as never, {
        prefixes: ['error'],
        maxEntries: 10,
      });

      expect(entries).to.have.length(2);
      expect(entries[0].level).to.equal('ERROR');
      // Results are reversed (most recent first), and messages include continuation lines
      expect(entries[0].message).to.include('Test error 2');
      expect(entries[0].message).to.include('Continuation line 2');
      expect(entries[1].message).to.include('Test error 1');
    });

    it('respects maxEntries limit', async () => {
      const now = new Date();
      const logContent = `[2025-01-25 10:30:45.123 GMT] ERROR Error 1
[2025-01-25 10:30:46.123 GMT] ERROR Error 2
[2025-01-25 10:30:47.123 GMT] ERROR Error 3
`;

      server.use(
        http.all(`${BASE_URL}/*`, ({request}) => {
          const url = new URL(request.url);

          if (request.method === 'PROPFIND') {
            return new HttpResponse(
              generatePropfindXml([{name: 'error-blade1-20250125.log', size: logContent.length, date: now}]),
              {status: 207, headers: {'Content-Type': 'application/xml'}},
            );
          }

          if (request.method === 'GET' && url.pathname.includes('error-blade1')) {
            return new HttpResponse(logContent, {
              status: 200,
              headers: {'Content-Type': 'text/plain'},
            });
          }

          return new HttpResponse(null, {status: 404});
        }),
      );

      const instance = createMockInstance();
      const entries = await getRecentLogs(instance as never, {
        prefixes: ['error'],
        maxEntries: 2,
      });

      expect(entries).to.have.length(2);
    });

    it('applies path normalizer to entries', async () => {
      const now = new Date();
      const logContent = `[2025-01-25 10:30:45.123 GMT] ERROR Error in (app_storefront/cartridge/controllers/Home.js:45)
\tat app_storefront/cartridge/controllers/Home.js:45
`;

      server.use(
        http.all(`${BASE_URL}/*`, ({request}) => {
          const url = new URL(request.url);

          if (request.method === 'PROPFIND') {
            return new HttpResponse(
              generatePropfindXml([{name: 'error-blade1-20250125.log', size: logContent.length, date: now}]),
              {status: 207, headers: {'Content-Type': 'application/xml'}},
            );
          }

          if (request.method === 'GET' && url.pathname.includes('error-blade1')) {
            return new HttpResponse(logContent, {
              status: 200,
              headers: {'Content-Type': 'text/plain'},
            });
          }

          return new HttpResponse(null, {status: 404});
        }),
      );

      const instance = createMockInstance();
      const entries = await getRecentLogs(instance as never, {
        prefixes: ['error'],
        pathNormalizer: (msg) => msg.replace(/app_storefront/g, './cartridges/app_storefront'),
      });

      expect(entries).to.have.length(1);
      expect(entries[0].message).to.include('./cartridges/app_storefront');
    });
  });
});
