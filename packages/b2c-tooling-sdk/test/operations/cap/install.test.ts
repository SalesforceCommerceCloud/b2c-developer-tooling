/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import JSZip from 'jszip';
import {WebDavClient} from '../../../src/clients/webdav.js';
import {createOcapiClient} from '../../../src/clients/ocapi.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';
import {commerceAppInstall} from '../../../src/operations/cap/install.js';

const TEST_HOST = 'test.demandware.net';
const WEBDAV_BASE = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;
const OCAPI_BASE = `https://${TEST_HOST}/s/-/dw/data/v25_6`;
const INSTALL_EXECUTIONS = `${OCAPI_BASE}/jobs/sfcc-install-commerce-app/executions`;

// Use short poll interval and no real sleeping for fast tests.
const FAST_WAIT_OPTIONS = {pollIntervalSeconds: 1, sleep: () => Promise.resolve()};

const FIXTURE_CAP = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '../../fixtures/commerce-avalara-tax-app-v0.2.5',
);

/** Register WebDAV handlers (MKCOL/PUT/DELETE) and capture the uploaded zip + whether DELETE ran. */
function captureWebdav(): {uploaded: () => Buffer | null; deleted: () => boolean} {
  let uploadedZip: Buffer | null = null;
  let deleteRequested = false;

  server.use(
    http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
      if (request.method === 'PUT') {
        uploadedZip = Buffer.from(await request.arrayBuffer());
        return new HttpResponse(null, {status: 201});
      }
      if (request.method === 'DELETE') {
        deleteRequested = true;
        return new HttpResponse(null, {status: 204});
      }
      // MKCOL and anything else
      return new HttpResponse(null, {status: 201});
    }),
  );

  return {uploaded: () => uploadedZip, deleted: () => deleteRequested};
}

/** Register the install job execution + polling handlers, capturing the POST body. */
function captureInstallJob(
  executionId: string,
  exitStatus: {code: string; message?: string} = {code: 'OK'},
): {body: () => any} {
  let seenBody: any = null;

  server.use(
    http.post(INSTALL_EXECUTIONS, async ({request}) => {
      seenBody = await request.json();
      return HttpResponse.json({id: executionId, execution_status: 'running'});
    }),
    http.get(`${INSTALL_EXECUTIONS}/${executionId}`, () =>
      HttpResponse.json({
        id: executionId,
        execution_status: 'finished',
        exit_status: exitStatus,
        is_log_file_existing: false,
      }),
    ),
  );

  return {body: () => seenBody};
}

const server = setupServer();

describe('operations/cap/install', () => {
  let mockInstance: any;
  let tempDir: string;

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-cap-install-'));

    const auth = new MockAuthStrategy();
    mockInstance = {
      config: {hostname: TEST_HOST},
      webdav: new WebDavClient(TEST_HOST, auth),
      ocapi: createOcapiClient(TEST_HOST, auth),
    };
  });

  afterEach(() => {
    server.resetHandlers();
    if (tempDir) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  after(() => {
    server.close();
  });

  describe('commerceAppInstall', () => {
    it('uploads the CAP and runs the install job from a directory', async () => {
      const {uploaded, deleted} = captureWebdav();
      const job = captureInstallJob('exec-1');

      const result = await commerceAppInstall(mockInstance, FIXTURE_CAP, {
        siteId: 'RefArch',
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(result.execution.id).to.equal('exec-1');
      expect(result.execution.execution_status).to.equal('finished');
      expect(result.appName).to.equal('avalara-tax');
      expect(result.appVersion).to.equal('0.2.5');
      expect(result.archiveFilename).to.equal('avalara-tax-v0.2.5.zip');

      // The direct OCAPI body carries the manifest-derived fields.
      expect(job.body()).to.include({
        app_name: 'avalara-tax',
        app_source: 'WebDAV',
        app_domain: 'tax',
        site_id: 'Sites-RefArch',
        app_path: 'webdav/Sites/Impex/commerce-apps/avalara-tax-v0.2.5.zip',
      });

      // A real zip was uploaded.
      const zip = await JSZip.loadAsync(uploaded()!);
      expect(Object.keys(zip.files).some((p) => p.endsWith('commerce-app.json'))).to.be.true;

      // Archive removed by default (keepArchive defaults to false).
      expect(deleted()).to.be.true;
      expect(result.archiveKept).to.be.false;
    });

    it('defaults should_create_pr to false', async () => {
      captureWebdav();
      const job = captureInstallJob('exec-default');

      await commerceAppInstall(mockInstance, FIXTURE_CAP, {
        siteId: 'RefArch',
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(job.body().should_create_pr).to.equal(false);
    });

    it('sends should_create_pr=true when shouldCreatePr is set', async () => {
      captureWebdav();
      const job = captureInstallJob('exec-pr');

      await commerceAppInstall(mockInstance, FIXTURE_CAP, {
        siteId: 'RefArch',
        shouldCreatePr: true,
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(job.body().should_create_pr).to.equal(true);
    });

    it('keeps the uploaded archive when keepArchive is true', async () => {
      const {deleted} = captureWebdav();
      captureInstallJob('exec-keep');

      const result = await commerceAppInstall(mockInstance, FIXTURE_CAP, {
        siteId: 'RefArch',
        keepArchive: true,
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(result.archiveKept).to.be.true;
      expect(deleted()).to.be.false;
    });

    it('normalizes a site id that already has the Sites- prefix', async () => {
      captureWebdav();
      const job = captureInstallJob('exec-prefixed');

      await commerceAppInstall(mockInstance, FIXTURE_CAP, {
        siteId: 'Sites-RefArch',
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(job.body().site_id).to.equal('Sites-RefArch');
    });

    it('retries with the parameters format for internal users and includes ShouldCreatePR', async () => {
      const {uploaded} = captureWebdav();

      let directBody: any = null;
      let retryBody: any = null;
      let postCount = 0;

      server.use(
        http.post(INSTALL_EXECUTIONS, async ({request}) => {
          postCount++;
          const body = (await request.json()) as any;
          if (postCount === 1) {
            directBody = body;
            // Mirror the platform rejecting the direct document format.
            return HttpResponse.json(
              {
                fault: {
                  type: 'UnknownPropertyException',
                  message: 'Unknown property',
                  arguments: {document: 'job_execution_request'},
                },
              },
              {status: 400},
            );
          }
          retryBody = body;
          return HttpResponse.json({id: 'exec-retry', execution_status: 'running'});
        }),
        http.get(`${INSTALL_EXECUTIONS}/exec-retry`, () =>
          HttpResponse.json({
            id: 'exec-retry',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          }),
        ),
      );

      const result = await commerceAppInstall(mockInstance, FIXTURE_CAP, {
        siteId: 'RefArch',
        shouldCreatePr: true,
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(result.execution.id).to.equal('exec-retry');
      expect(postCount).to.equal(2);
      expect(directBody.should_create_pr).to.equal(true);

      // Retry uses the parameters array with PascalCase names.
      const params: Array<{name: string; value: string}> = retryBody.parameters;
      const byName = Object.fromEntries(params.map((p) => [p.name, p.value]));
      expect(byName).to.include({
        AppName: 'avalara-tax',
        AppSource: 'WebDAV',
        AppDomain: 'tax',
        SiteId: 'Sites-RefArch',
        ShouldCreatePR: 'true',
      });

      expect(uploaded()).to.not.be.null;
    });

    it('throws JobExecutionError when the install job fails', async () => {
      captureWebdav();
      captureInstallJob('exec-fail', {code: 'ERROR', message: 'Install failed'});

      try {
        await commerceAppInstall(mockInstance, FIXTURE_CAP, {
          siteId: 'RefArch',
          waitOptions: FAST_WAIT_OPTIONS,
        });
        expect.fail('Should have thrown JobExecutionError');
      } catch (error: any) {
        expect(error.name).to.equal('JobExecutionError');
        expect(error.message).to.include('failed');
      }
    });

    it('throws when the target does not exist', async () => {
      try {
        await commerceAppInstall(mockInstance, path.join(tempDir, 'missing'), {
          siteId: 'RefArch',
          waitOptions: FAST_WAIT_OPTIONS,
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('Target not found');
      }
    });

    it('installs from a prebuilt zip file', async () => {
      // Build a minimal CAP zip with the manifest one level deep.
      const srcZip = new JSZip();
      const root = srcZip.folder('my-app-v1.0.0')!;
      root.file('commerce-app.json', JSON.stringify({id: 'my-app', name: 'My App', version: '1.0.0', domain: 'tax'}));
      const zipBuffer = await srcZip.generateAsync({type: 'nodebuffer'});
      const zipPath = path.join(tempDir, 'my-app-v1.0.0.zip');
      fs.writeFileSync(zipPath, zipBuffer);

      captureWebdav();
      const job = captureInstallJob('exec-zip');

      const result = await commerceAppInstall(mockInstance, zipPath, {
        siteId: 'RefArch',
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(result.appName).to.equal('my-app');
      expect(result.appVersion).to.equal('1.0.0');
      // Zip target keeps its original filename.
      expect(result.archiveFilename).to.equal('my-app-v1.0.0.zip');
      expect(job.body().app_path).to.equal('webdav/Sites/Impex/commerce-apps/my-app-v1.0.0.zip');
    });
  });
});
