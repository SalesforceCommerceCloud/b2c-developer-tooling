/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {
  normalizeWebDavPath,
  readWebDavTextRange,
  WebDavClient,
  WebDavReadError,
} from '@salesforce/b2c-tooling-sdk/clients';
import {HTTPError} from '@salesforce/b2c-tooling-sdk/errors';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const HOST = 'my-sandbox.example.com';
const BASE = `https://${HOST}/on/demandware.servlet/webdav/Sites`;

describe('clients/webdav-paths', () => {
  describe('normalizeWebDavPath', () => {
    it('accepts server paths and canonicalizes the root', () => {
      expect(normalizeWebDavPath('/Sites/LOGS/jobs/Job a.log')).to.equal('Logs/jobs/Job%20a.log');
      expect(normalizeWebDavPath('/on/demandware.servlet/webdav/Sites/impex/src/a.xml')).to.equal('Impex/src/a.xml');
    });

    it('rejects traversal, unknown roots and malformed escapes with a code', () => {
      for (const bad of ['Impex/../Cartridges', 'Nope/a', 'Impex/%E0%A4%A']) {
        expect(() => normalizeWebDavPath(bad), bad)
          .to.throw(WebDavReadError)
          .with.property('code', 'invalid-path');
      }
    });
  });

  describe('WebDavClient.getTextRange', () => {
    const server = setupServer();
    before(() => server.listen({onUnhandledRequest: 'error'}));
    afterEach(() => server.resetHandlers());
    after(() => server.close());

    it('sends a suffix range for tail reads and skips a split leading character', async () => {
      let range: null | string = null;
      const bytes = Buffer.from('xé line\n');
      server.use(
        http.get(`${BASE}/Logs/error.log`, ({request}) => {
          range = request.headers.get('range');
          const body = bytes.subarray(2);
          return new HttpResponse(body, {
            status: 206,
            headers: {'content-range': `bytes 2-${bytes.length - 1}/${bytes.length}`},
          });
        }),
      );
      const client = new WebDavClient(HOST, new MockAuthStrategy());
      const result = await client.getTextRange('Logs/error.log', {tail: true, maxBytes: 7});
      expect(range).to.equal('bytes=-7');
      expect(result).to.deep.equal({content: ' line\n', size: bytes.length, offset: 3, bytesRead: 7, nextOffset: null});
    });

    it('throws HTTPError for a refused read, like the other methods', async () => {
      server.use(http.get(`${BASE}/Logs/missing.log`, () => new HttpResponse('nope', {status: 404})));
      const client = new WebDavClient(HOST, new MockAuthStrategy());
      const error = await client.getTextRange('Logs/missing.log', {maxBytes: 10}).then(
        () => undefined,
        (error_: unknown) => error_,
      );
      expect(error).to.be.instanceOf(HTTPError);
      expect((error as HTTPError).response.status).to.equal(404);
    });

    it('reports a server that ignores the range', async () => {
      // A real Response: MSW-mocked bodies never settle body.cancel().
      const error = await readWebDavTextRange(new Response('whole file', {status: 200}), 5, 4).then(
        () => undefined,
        (error_: WebDavReadError) => error_,
      );
      expect(error?.code).to.equal('range-ignored');
    });
  });
});
