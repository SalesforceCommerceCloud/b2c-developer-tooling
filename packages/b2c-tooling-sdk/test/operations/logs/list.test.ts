/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {WebDavClient} from '@salesforce/b2c-tooling-sdk/clients';
import {listLogFiles, extractPrefix} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const TEST_HOST = 'test.demandware.net';
const BASE_URL = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;

/**
 * Generates a PROPFIND XML response for testing.
 */
function generatePropfindXml(
  entries: {name: string; size: number; date: Date; isDir?: boolean}[],
  dirHref = 'Logs',
): string {
  const responses = entries.map(({name, size, date, isDir}) => {
    const resourceType = isDir ? '<D:collection/>' : '';
    const contentLength = isDir ? '' : `<D:getcontentlength>${size}</D:getcontentlength>`;

    return `
    <D:response>
      <D:href>/on/demandware.servlet/webdav/Sites/${dirHref}/${name}</D:href>
      <D:propstat>
        <D:prop>
          <D:displayname>${name}</D:displayname>
          <D:resourcetype>${resourceType}</D:resourcetype>
          ${contentLength}
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

describe('operations/logs/list', () => {
  describe('extractPrefix', () => {
    it('extracts error prefix', () => {
      expect(extractPrefix('error-blade1-20250125.log')).to.equal('error');
    });

    it('extracts customerror prefix', () => {
      expect(extractPrefix('customerror-blade1-20250125.log')).to.equal('customerror');
    });

    it('extracts debug prefix', () => {
      expect(extractPrefix('debug-blade1-20250125.log')).to.equal('debug');
    });

    it('extracts custom-named prefix', () => {
      expect(extractPrefix('custom-mylog-blade1-20250125.log')).to.equal('custom-mylog');
    });

    it('handles underscore separator', () => {
      expect(extractPrefix('error_blade1_20250125.log')).to.equal('error');
    });

    it('returns unknown for unrecognized format', () => {
      expect(extractPrefix('something-random.log')).to.equal('something');
    });
  });

  describe('listLogFiles', () => {
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

    it('returns list of log files', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      server.use(
        http.all(`${BASE_URL}/*`, ({request}) => {
          if (request.method === 'PROPFIND') {
            return new HttpResponse(
              generatePropfindXml([
                {name: 'error-blade1-20250125.log', size: 1234, date: now},
                {name: 'customerror-blade1-20250125.log', size: 5678, date: yesterday},
              ]),
              {status: 207, headers: {'Content-Type': 'application/xml'}},
            );
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      const instance = createMockInstance();
      const files = await listLogFiles(instance as never);

      expect(files).to.have.length(2);
      expect(files[0].name).to.equal('error-blade1-20250125.log');
      expect(files[0].prefix).to.equal('error');
      expect(files[0].size).to.equal(1234);
    });

    it('filters by prefix', async () => {
      const now = new Date();

      server.use(
        http.all(`${BASE_URL}/*`, ({request}) => {
          if (request.method === 'PROPFIND') {
            return new HttpResponse(
              generatePropfindXml([
                {name: 'error-blade1-20250125.log', size: 1234, date: now},
                {name: 'customerror-blade1-20250125.log', size: 5678, date: now},
                {name: 'debug-blade1-20250125.log', size: 9012, date: now},
              ]),
              {status: 207, headers: {'Content-Type': 'application/xml'}},
            );
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      const instance = createMockInstance();
      const files = await listLogFiles(instance as never, {prefixes: ['error', 'customerror']});

      expect(files).to.have.length(2);
      expect(files.map((f) => f.prefix)).to.deep.equal(['error', 'customerror']);
    });

    it('sorts by name ascending', async () => {
      const now = new Date();

      server.use(
        http.all(`${BASE_URL}/*`, ({request}) => {
          if (request.method === 'PROPFIND') {
            return new HttpResponse(
              generatePropfindXml([
                {name: 'error-blade1-20250125.log', size: 1234, date: now},
                {name: 'debug-blade1-20250125.log', size: 5678, date: now},
                {name: 'customerror-blade1-20250125.log', size: 9012, date: now},
              ]),
              {status: 207, headers: {'Content-Type': 'application/xml'}},
            );
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      const instance = createMockInstance();
      const files = await listLogFiles(instance as never, {sortBy: 'name', sortOrder: 'asc'});

      expect(files.map((f) => f.name)).to.deep.equal([
        'customerror-blade1-20250125.log',
        'debug-blade1-20250125.log',
        'error-blade1-20250125.log',
      ]);
    });

    it('sorts by size descending', async () => {
      const now = new Date();

      server.use(
        http.all(`${BASE_URL}/*`, ({request}) => {
          if (request.method === 'PROPFIND') {
            return new HttpResponse(
              generatePropfindXml([
                {name: 'error-blade1-20250125.log', size: 1234, date: now},
                {name: 'debug-blade1-20250125.log', size: 5678, date: now},
                {name: 'customerror-blade1-20250125.log', size: 9012, date: now},
              ]),
              {status: 207, headers: {'Content-Type': 'application/xml'}},
            );
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      const instance = createMockInstance();
      const files = await listLogFiles(instance as never, {sortBy: 'size', sortOrder: 'desc'});

      expect(files.map((f) => f.size)).to.deep.equal([9012, 5678, 1234]);
    });

    it('excludes directories and non-log files', async () => {
      const now = new Date();

      server.use(
        http.all(`${BASE_URL}/*`, ({request}) => {
          if (request.method === 'PROPFIND') {
            return new HttpResponse(
              generatePropfindXml([
                {name: 'Logs', size: 0, date: now, isDir: true},
                {name: 'error-blade1-20250125.log', size: 1234, date: now},
                {name: 'readme.txt', size: 100, date: now},
              ]),
              {status: 207, headers: {'Content-Type': 'application/xml'}},
            );
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      const instance = createMockInstance();
      const files = await listLogFiles(instance as never);

      expect(files).to.have.length(1);
      expect(files[0].name).to.equal('error-blade1-20250125.log');
    });

    it('returns empty array when no files match', async () => {
      const now = new Date();

      server.use(
        http.all(`${BASE_URL}/*`, ({request}) => {
          if (request.method === 'PROPFIND') {
            return new HttpResponse(generatePropfindXml([{name: 'error-blade1-20250125.log', size: 1234, date: now}]), {
              status: 207,
              headers: {'Content-Type': 'application/xml'},
            });
          }
          return new HttpResponse(null, {status: 404});
        }),
      );

      const instance = createMockInstance();
      const files = await listLogFiles(instance as never, {prefixes: ['debug']});

      expect(files).to.have.length(0);
    });

    /**
     * Routes PROPFIND requests by their target directory so subdirectory
     * recursion can be exercised. Maps a relative dir ("" = root) to its entries.
     */
    function useDirHandlers(dirs: Record<string, {name: string; size: number; date: Date; isDir?: boolean}[]>): void {
      server.use(
        http.all(`${BASE_URL}/*`, ({request}) => {
          if (request.method !== 'PROPFIND') {
            return new HttpResponse(null, {status: 404});
          }
          // Determine which dir is being listed from the URL suffix after /Logs
          const url = new URL(request.url);
          const afterLogs = url.pathname.split('/Logs')[1]?.replace(/^\/|\/$/g, '') ?? '';
          const entries = dirs[afterLogs];
          if (!entries) {
            return new HttpResponse(null, {status: 404});
          }
          const dirHref = afterLogs ? `Logs/${afterLogs}` : 'Logs';
          return new HttpResponse(generatePropfindXml(entries, dirHref), {
            status: 207,
            headers: {'Content-Type': 'application/xml'},
          });
        }),
      );
    }

    it('does not recurse into subdirectories without a path filter', async () => {
      const now = new Date();
      useDirHandlers({
        '': [
          {name: 'error-blade1-20250125.log', size: 1234, date: now},
          {name: 'internal', size: 0, date: now, isDir: true},
        ],
        internal: [{name: 'server-blade1-20250125.log', size: 5678, date: now}],
      });

      const instance = createMockInstance();
      const files = await listLogFiles(instance as never);

      // Only the top-level file; the directory entry is excluded and not recursed.
      expect(files).to.have.length(1);
      expect(files[0].name).to.equal('error-blade1-20250125.log');
    });

    it('recurses into a subdirectory for a path-like filter', async () => {
      const now = new Date();
      useDirHandlers({
        '': [{name: 'error-blade1-20250125.log', size: 1234, date: now}],
        internal: [
          {name: 'server-blade1-20250125.log', size: 5678, date: now},
          {name: 'ccp-blade1-20250125.log', size: 90, date: now},
        ],
      });

      const instance = createMockInstance();
      const files = await listLogFiles(instance as never, {prefixes: ['internal/server']});

      expect(files).to.have.length(1);
      expect(files[0].name).to.equal('internal/server-blade1-20250125.log');
      expect(files[0].path).to.equal('Logs/internal/server-blade1-20250125.log');
    });

    it('matches all files in a subdirectory with a trailing-slash path filter', async () => {
      const now = new Date();
      useDirHandlers({
        '': [{name: 'error-blade1-20250125.log', size: 1234, date: now}],
        internal: [
          {name: 'server-blade1-20250125.log', size: 5678, date: now},
          {name: 'ccp-blade1-20250125.log', size: 90, date: now},
        ],
      });

      const instance = createMockInstance();
      const files = await listLogFiles(instance as never, {prefixes: ['internal/']});

      expect(files.map((f) => f.name).sort()).to.deep.equal([
        'internal/ccp-blade1-20250125.log',
        'internal/server-blade1-20250125.log',
      ]);
    });

    it('combines top-level prefix filters with path filters', async () => {
      const now = new Date();
      useDirHandlers({
        '': [
          {name: 'error-blade1-20250125.log', size: 1234, date: now},
          {name: 'debug-blade1-20250125.log', size: 1, date: now},
        ],
        internal: [{name: 'server-blade1-20250125.log', size: 5678, date: now}],
      });

      const instance = createMockInstance();
      const files = await listLogFiles(instance as never, {prefixes: ['error', 'internal/server']});

      expect(files.map((f) => f.name).sort()).to.deep.equal([
        'error-blade1-20250125.log',
        'internal/server-blade1-20250125.log',
      ]);
    });

    it('treats a missing subdirectory as empty without failing', async () => {
      const now = new Date();
      useDirHandlers({
        '': [{name: 'error-blade1-20250125.log', size: 1234, date: now}],
        // no "nonexistent" dir -> PROPFIND returns 404
      });

      const instance = createMockInstance();
      const files = await listLogFiles(instance as never, {prefixes: ['error', 'nonexistent/foo']});

      expect(files).to.have.length(1);
      expect(files[0].name).to.equal('error-blade1-20250125.log');
    });
  });
});
