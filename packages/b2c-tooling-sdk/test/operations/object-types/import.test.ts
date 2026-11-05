/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import JSZip from 'jszip';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createOcapiClient} from '../../../src/clients/ocapi.js';
import {WebDavClient} from '../../../src/clients/webdav.js';
import type {B2CInstance} from '../../../src/instance/index.js';
import {importObjectTypeExtensions} from '../../../src/operations/object-types/index.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const HOST = 'test.demandware.net';
const WEBDAV_BASE = `https://${HOST}/on/demandware.servlet/webdav/Sites`;
const OCAPI_BASE = `https://${HOST}/s/-/dw/data/v25_6`;

describe('operations/object-types/importObjectTypeExtensions', () => {
  const server = setupServer();
  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it('imports only the listed attributes as system-objecttype-extensions.xml', async () => {
    const auth = new MockAuthStrategy();
    const instance = {
      config: {hostname: HOST},
      webdav: new WebDavClient(HOST, auth),
      ocapi: createOcapiClient(HOST, auth),
    } as unknown as B2CInstance;
    let uploaded: Buffer | undefined;
    server.use(
      http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
        if (request.method === 'PUT') {
          uploaded = Buffer.from(await request.arrayBuffer());
          return new HttpResponse(null, {status: 201});
        }
        return new HttpResponse(null, {status: 204});
      }),
      http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () =>
        HttpResponse.json({id: 'e1', execution_status: 'finished', exit_status: {code: 'OK'}}),
      ),
      http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/e1`, () =>
        HttpResponse.json({id: 'e1', execution_status: 'finished', exit_status: {code: 'OK'}}),
      ),
    );

    await importObjectTypeExtensions(
      instance,
      [
        {
          objectType: 'Product',
          id: 'activity',
          changes: ['display value of Hiking'],
          attribute: {
            id: 'activity',
            valueType: 'enum_of_string',
            valueDefinitions: [{value: 'Hiking', displayValue: {default: 'Hiking2'}}, {value: 'Climbing'}],
          },
        },
      ],
      {waitOptions: {pollIntervalSeconds: 1, sleep: () => Promise.resolve()}},
    );

    const zip = await JSZip.loadAsync(uploaded!);
    const file = Object.keys(zip.files).find((name) => name.endsWith('meta/system-objecttype-extensions.xml'));
    expect(file).to.match(/^import-\d+\/meta\/system-objecttype-extensions\.xml$/);
    const xml = await zip.file(file!)!.async('string');
    expect(xml).to.include('<type-extension type-id="Product">');
    expect(xml).to.include('<attribute-definition attribute-id="activity">');
    expect(xml).to.include('<type>enum-of-string</type>');
    expect(xml).to.include('<display xml:lang="x-default">Hiking2</display>');
    expect(xml).to.include('<value>Climbing</value>');
    expect(xml).to.not.include('group-definitions');
  });
});
