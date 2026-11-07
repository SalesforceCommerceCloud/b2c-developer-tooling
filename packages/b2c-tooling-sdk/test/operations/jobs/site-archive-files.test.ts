/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import JSZip from 'jszip';
import {WebDavClient} from '../../../src/clients/webdav.js';
import {createOcapiClient} from '../../../src/clients/ocapi.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';
import type {B2CInstance} from '../../../src/instance/index.js';
import {
  checkSiteArchiveFiles,
  importSiteArchiveFiles,
  SiteArchiveFilesError,
} from '../../../src/operations/jobs/site-archive-files.js';

const TEST_HOST = 'test.demandware.net';
const WEBDAV_BASE = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;
const OCAPI_BASE = `https://${TEST_HOST}/s/-/dw/data/v25_6`;
const WAIT = {pollIntervalSeconds: 1, sleep: () => Promise.resolve()};

const PROMOTIONS = `<?xml version="1.0" encoding="UTF-8"?>
<promotions xmlns="http://www.demandware.com/xml/impex/promotion/2008-01-31">
  <promotion promotion-id="spring-10-off">
    <product-promotion-rule>
      <discounted-products>
        <included-products>
          <condition-group>
            <product-id-condition operator="is equal"><product-id>p1</product-id></product-id-condition>
          </condition-group>
        </included-products>
      </discounted-products>
      <simple-discount><percentage>10</percentage></simple-discount>
    </product-promotion-rule>
  </promotion>
</promotions>`;
const INVALID = `<?xml version="1.0"?>
<promotions xmlns="http://www.demandware.com/xml/impex/promotion/2008-01-31"><promotion promotion-id="x"><bogus/></promotion></promotions>`;

describe('operations/jobs/site-archive-files', () => {
  const server = setupServer();
  let instance: B2CInstance;

  before(() => server.listen({onUnhandledRequest: 'error'}));
  beforeEach(() => {
    const auth = new MockAuthStrategy();
    instance = {
      config: {hostname: TEST_HOST},
      webdav: new WebDavClient(TEST_HOST, auth),
      ocapi: createOcapiClient(TEST_HOST, auth),
    } as unknown as B2CInstance;
  });
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  function mockImport(exit: {code: string; message?: string} = {code: 'OK'}) {
    const uploads: Array<{path: string; body: Buffer}> = [];
    const deleted: string[] = [];
    const bodies: unknown[] = [];
    server.use(
      http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
        const {pathname} = new URL(request.url);
        if (request.method === 'PUT') {
          uploads.push({path: pathname, body: Buffer.from(await request.arrayBuffer())});
          return new HttpResponse(null, {status: 201});
        }
        if (request.method === 'DELETE') {
          deleted.push(pathname);
          return new HttpResponse(null, {status: 204});
        }
        return new HttpResponse(null, {status: 404});
      }),
      http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, async ({request}) => {
        bodies.push(await request.json());
        return HttpResponse.json({id: 'exec-1', execution_status: 'running'});
      }),
      http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/exec-1`, () =>
        HttpResponse.json({
          id: 'exec-1',
          execution_status: 'finished',
          exit_status: exit,
          log_file_path: '/Sites/LOGS/jobs/sfcc-site-archive-import/Job-exec-1.log',
          is_log_file_existing: true,
        }),
      ),
    );
    return {uploads, deleted, bodies};
  }

  it('validates, zips under the archive name, imports and removes the archive', async () => {
    const calls = mockImport();
    const result = await importSiteArchiveFiles(
      instance,
      [{path: 'sites/RefArch/promotions.xml', content: PROMOTIONS}],
      {archiveName: 'promo-rule', waitOptions: WAIT},
    );
    expect(result.outcome).to.equal('imported');
    expect(result.files).to.deep.equal([
      {path: 'sites/RefArch/promotions.xml', status: 'pass', schema: 'promotion', errors: []},
    ]);
    expect(result.execution).to.include({id: 'exec-1', status: 'finished', exitStatus: 'OK'});
    expect(calls.uploads).to.have.length(1);
    expect(calls.uploads[0].path).to.match(/\/Impex\/src\/instance\/promo-rule\.zip$/);
    const zip = await JSZip.loadAsync(calls.uploads[0].body);
    const entries = Object.values(zip.files)
      .filter((entry) => !entry.dir)
      .map((entry) => entry.name);
    expect(entries).to.deep.equal(['promo-rule/sites/RefArch/promotions.xml']);
    expect(await zip.file('promo-rule/sites/RefArch/promotions.xml')!.async('string')).to.equal(PROMOTIONS);
    expect(calls.bodies).to.deep.equal([{file_name: 'promo-rule.zip'}]);
    expect(calls.deleted).to.have.length(1);
  });

  it('uploads nothing when a file fails validation', async () => {
    const result = await importSiteArchiveFiles(instance, [{path: 'sites/RefArch/promotions.xml', content: INVALID}]);
    expect(result.outcome).to.equal('invalid');
    expect(result.files[0].status).to.equal('fail');
    expect(result.files[0].errors[0]).to.include({line: 2});
    expect(result.files[0].errors[0].message).to.include('bogus');
    expect(result.execution).to.equal(undefined);
  });

  it('validates only on a dry run, and skips files without a bundled schema', async () => {
    const result = await importSiteArchiveFiles(
      instance,
      [
        {path: 'sites/RefArch/promotions.xml', content: PROMOTIONS},
        {path: 'sites/RefArch/notes.txt', content: 'hello'},
      ],
      {dryRun: true},
    );
    expect(result.outcome).to.equal('validated');
    expect(result.files.map((file) => file.status)).to.deep.equal(['pass', 'skip']);
  });

  it('reports a failed job with its log path instead of throwing', async () => {
    mockImport({code: 'ERROR', message: 'Import failed'});
    const result = await importSiteArchiveFiles(
      instance,
      [{path: 'sites/RefArch/promotions.xml', content: PROMOTIONS}],
      {archiveName: 'promo-rule', waitOptions: WAIT},
    );
    expect(result.outcome).to.equal('failed');
    expect(result.execution).to.include({exitStatus: 'ERROR', exitMessage: 'Import failed'});
    expect(result.execution?.logFilePath).to.include('Job-exec-1.log');
  });

  it('rejects unsafe or ambiguous paths and names before doing anything', async () => {
    for (const path of [
      'promotions.xml',
      '../sites/a.xml',
      'sites//a.xml',
      'sites/a b/x.xml',
      String.raw`sites\a.xml`,
    ]) {
      expect(() => checkSiteArchiveFiles([{path, content: '<a/>'}]), path).to.throw(SiteArchiveFilesError);
    }
    expect(() =>
      checkSiteArchiveFiles([
        {path: 'sites/A/x.xml', content: '<a/>'},
        {path: 'sites/a/X.xml', content: '<a/>'},
      ]),
    ).to.throw('Duplicate');
    expect(() => checkSiteArchiveFiles([])).to.throw(SiteArchiveFilesError);
    let error: unknown;
    try {
      await importSiteArchiveFiles(instance, [{path: 'sites/A/x.xml', content: '<a/>'}], {archiveName: '../x'});
    } catch (caught) {
      error = caught;
    }
    expect(error).to.be.instanceOf(SiteArchiveFilesError);
  });
});
