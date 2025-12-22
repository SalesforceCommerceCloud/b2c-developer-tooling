/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {WebDavClient} from '@salesforce/b2c-tooling-sdk/clients';
import {HTTPError} from '@salesforce/b2c-tooling-sdk/errors';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const TEST_HOST = 'test.demandware.net';
const BASE_URL = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;

// Sample PROPFIND XML response
const PROPFIND_RESPONSE = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/on/demandware.servlet/webdav/Sites/Cartridges/</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>Cartridges</D:displayname>
        <D:resourcetype><D:collection/></D:resourcetype>
        <D:getlastmodified>Mon, 01 Jan 2024 00:00:00 GMT</D:getlastmodified>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
  <D:response>
    <D:href>/on/demandware.servlet/webdav/Sites/Cartridges/app_storefront.zip</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>app_storefront.zip</D:displayname>
        <D:resourcetype/>
        <D:getcontentlength>12345</D:getcontentlength>
        <D:getlastmodified>Tue, 02 Jan 2024 12:00:00 GMT</D:getlastmodified>
        <D:getcontenttype>application/zip</D:getcontenttype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`;

describe('clients/webdav', () => {
  describe('WebDavClient', () => {
    let client: WebDavClient;
    let mockAuth: MockAuthStrategy;

    // Track requests for assertions
    const requests: {method: string; url: string; headers: Headers; body?: string}[] = [];

    const server = setupServer();

    before(() => {
      server.listen({onUnhandledRequest: 'error'});
    });

    afterEach(() => {
      server.resetHandlers();
      requests.length = 0;
    });

    after(() => {
      server.close();
    });

    beforeEach(() => {
      mockAuth = new MockAuthStrategy();
      client = new WebDavClient(TEST_HOST, mockAuth);
    });

    describe('buildUrl', () => {
      it('builds correct URL for path without leading slash', () => {
        const url = client.buildUrl('Cartridges/v1');
        expect(url).to.equal(`${BASE_URL}/Cartridges/v1`);
      });

      it('builds correct URL for path with leading slash', () => {
        const url = client.buildUrl('/Cartridges/v1');
        expect(url).to.equal(`${BASE_URL}/Cartridges/v1`);
      });
    });

    describe('mkcol', () => {
      it('creates a directory successfully', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, async ({request}) => {
            requests.push({
              method: request.method,
              url: request.url,
              headers: request.headers,
            });

            if (request.method === 'MKCOL') {
              return new HttpResponse(null, {status: 201});
            }
            return new HttpResponse(null, {status: 405});
          }),
        );

        await client.mkcol('Cartridges/v1');

        expect(requests).to.have.length(1);
        expect(requests[0].method).to.equal('MKCOL');
        expect(requests[0].url).to.equal(`${BASE_URL}/Cartridges/v1`);
        expect(requests[0].headers.get('Authorization')).to.equal('Bearer test-token');
      });

      it('does not throw when directory already exists (405)', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, ({request}) => {
            if (request.method === 'MKCOL') {
              return new HttpResponse(null, {status: 405, statusText: 'Method Not Allowed'});
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        // Should not throw
        await client.mkcol('Cartridges/existing');
      });

      it('throws HTTPError on failure', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, ({request}) => {
            if (request.method === 'MKCOL') {
              return new HttpResponse(null, {status: 403, statusText: 'Forbidden'});
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        try {
          await client.mkcol('Cartridges/forbidden');
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).to.be.instanceOf(HTTPError);
          expect((error as HTTPError).message).to.include('MKCOL failed');
          expect((error as HTTPError).message).to.include('403');
        }
      });
    });

    describe('put', () => {
      it('uploads a file successfully', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, async ({request}) => {
            const body = await request.text();
            requests.push({
              method: request.method,
              url: request.url,
              headers: request.headers,
              body,
            });

            if (request.method === 'PUT') {
              return new HttpResponse(null, {status: 201});
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        await client.put('Cartridges/v1/test.zip', Buffer.from('zip content'), 'application/zip');

        expect(requests).to.have.length(1);
        expect(requests[0].method).to.equal('PUT');
        expect(requests[0].url).to.equal(`${BASE_URL}/Cartridges/v1/test.zip`);
        expect(requests[0].headers.get('Content-Type')).to.equal('application/zip');
        expect(requests[0].body).to.equal('zip content');
      });

      it('uploads string content', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, async ({request}) => {
            const body = await request.text();
            requests.push({
              method: request.method,
              url: request.url,
              headers: request.headers,
              body,
            });

            if (request.method === 'PUT') {
              return new HttpResponse(null, {status: 201});
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        await client.put('Cartridges/v1/config.xml', '<config>test</config>', 'application/xml');

        expect(requests[0].body).to.equal('<config>test</config>');
      });

      it('throws HTTPError on failure', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, ({request}) => {
            if (request.method === 'PUT') {
              return new HttpResponse(null, {status: 507, statusText: 'Insufficient Storage'});
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        try {
          await client.put('Cartridges/v1/large.zip', Buffer.from('content'));
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).to.be.instanceOf(HTTPError);
          expect((error as HTTPError).message).to.include('PUT failed');
          expect((error as HTTPError).message).to.include('507');
        }
      });
    });

    describe('get', () => {
      it('downloads a file successfully', async () => {
        const fileContent = 'file content here';

        server.use(
          http.all(`${BASE_URL}/*`, ({request}) => {
            requests.push({
              method: request.method,
              url: request.url,
              headers: request.headers,
            });

            if (request.method === 'GET') {
              return new HttpResponse(fileContent, {
                status: 200,
                headers: {'Content-Type': 'application/octet-stream'},
              });
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        const result = await client.get('Cartridges/v1/test.zip');

        expect(requests).to.have.length(1);
        expect(requests[0].method).to.equal('GET');
        expect(result).to.be.instanceOf(ArrayBuffer);

        const text = new TextDecoder().decode(result);
        expect(text).to.equal(fileContent);
      });

      it('throws HTTPError when file not found', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, ({request}) => {
            if (request.method === 'GET') {
              return new HttpResponse(null, {status: 404, statusText: 'Not Found'});
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        try {
          await client.get('Cartridges/v1/nonexistent.zip');
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).to.be.instanceOf(HTTPError);
          expect((error as HTTPError).message).to.include('GET failed');
          expect((error as HTTPError).message).to.include('404');
        }
      });
    });

    describe('delete', () => {
      it('deletes a file successfully', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, ({request}) => {
            requests.push({
              method: request.method,
              url: request.url,
              headers: request.headers,
            });

            if (request.method === 'DELETE') {
              return new HttpResponse(null, {status: 204});
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        await client.delete('Cartridges/v1/old.zip');

        expect(requests).to.have.length(1);
        expect(requests[0].method).to.equal('DELETE');
        expect(requests[0].url).to.equal(`${BASE_URL}/Cartridges/v1/old.zip`);
      });

      it('throws HTTPError when file not found', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, ({request}) => {
            if (request.method === 'DELETE') {
              return new HttpResponse(null, {status: 404, statusText: 'Not Found'});
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        try {
          await client.delete('Cartridges/v1/nonexistent.zip');
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).to.be.instanceOf(HTTPError);
          expect((error as HTTPError).message).to.include('DELETE failed');
        }
      });
    });

    describe('propfind', () => {
      it('lists directory contents', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, ({request}) => {
            requests.push({
              method: request.method,
              url: request.url,
              headers: request.headers,
            });

            if (request.method === 'PROPFIND') {
              return new HttpResponse(PROPFIND_RESPONSE, {
                status: 207,
                headers: {'Content-Type': 'application/xml'},
              });
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        const entries = await client.propfind('Cartridges');

        expect(requests).to.have.length(1);
        expect(requests[0].method).to.equal('PROPFIND');
        expect(requests[0].headers.get('Depth')).to.equal('1');
        expect(requests[0].headers.get('Content-Type')).to.equal('application/xml');

        expect(entries).to.have.length(2);

        // First entry is a collection (directory)
        expect(entries[0].displayName).to.equal('Cartridges');
        expect(entries[0].isCollection).to.equal(true);

        // Second entry is a file
        expect(entries[1].displayName).to.equal('app_storefront.zip');
        expect(entries[1].isCollection).to.equal(false);
        expect(entries[1].contentLength).to.equal(12345);
        expect(entries[1].contentType).to.equal('application/zip');
      });

      it('uses specified depth', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, ({request}) => {
            requests.push({
              method: request.method,
              url: request.url,
              headers: request.headers,
            });

            if (request.method === 'PROPFIND') {
              return new HttpResponse(PROPFIND_RESPONSE, {
                status: 207,
                headers: {'Content-Type': 'application/xml'},
              });
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        await client.propfind('Cartridges', '0');

        expect(requests[0].headers.get('Depth')).to.equal('0');
      });

      it('throws HTTPError on failure', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, ({request}) => {
            if (request.method === 'PROPFIND') {
              return new HttpResponse(null, {status: 403, statusText: 'Forbidden'});
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        try {
          await client.propfind('Cartridges/forbidden');
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).to.be.instanceOf(HTTPError);
          expect((error as HTTPError).message).to.include('PROPFIND failed');
        }
      });

      it('handles empty response', async () => {
        const emptyResponse = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
</D:multistatus>`;

        server.use(
          http.all(`${BASE_URL}/*`, ({request}) => {
            if (request.method === 'PROPFIND') {
              return new HttpResponse(emptyResponse, {
                status: 207,
                headers: {'Content-Type': 'application/xml'},
              });
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        const entries = await client.propfind('Cartridges/empty');
        expect(entries).to.have.length(0);
      });
    });

    describe('exists', () => {
      it('returns true when path exists', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, ({request}) => {
            requests.push({
              method: request.method,
              url: request.url,
              headers: request.headers,
            });

            if (request.method === 'HEAD') {
              return new HttpResponse(null, {status: 200});
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        const result = await client.exists('Cartridges/v1');

        expect(result).to.equal(true);
        expect(requests[0].method).to.equal('HEAD');
      });

      it('returns false when path does not exist', async () => {
        server.use(
          http.all(`${BASE_URL}/*`, ({request}) => {
            if (request.method === 'HEAD') {
              return new HttpResponse(null, {status: 404});
            }
            return new HttpResponse(null, {status: 404});
          }),
        );

        const result = await client.exists('Cartridges/nonexistent');

        expect(result).to.equal(false);
      });
    });
  });
});
