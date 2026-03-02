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
import {WebDavClient} from '../../../src/clients/webdav.js';
import {createOcapiClient} from '../../../src/clients/ocapi.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';
import JSZip from 'jszip';
import {
  siteArchiveImport,
  siteArchiveExport,
  siteArchiveExportToPath,
} from '../../../src/operations/jobs/site-archive.js';

const TEST_HOST = 'test.demandware.net';
const WEBDAV_BASE = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;
const OCAPI_BASE = `https://${TEST_HOST}/s/-/dw/data/v25_6`;

// Use short poll interval for fast tests (default is 3000ms)
const FAST_WAIT_OPTIONS = {pollInterval: 10};

describe('operations/jobs/site-archive', () => {
  const server = setupServer();
  let mockInstance: any;
  let tempDir: string;

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(() => {
    // Create temp directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-site-archive-'));

    // Create a real instance with mocked HTTP
    const auth = new MockAuthStrategy();
    const webdav = new WebDavClient(TEST_HOST, auth);
    const ocapi = createOcapiClient(TEST_HOST, auth);

    mockInstance = {
      config: {
        hostname: TEST_HOST,
      },
      webdav,
      ocapi,
    };
  });

  afterEach(() => {
    server.resetHandlers();

    // Clean up temp directory
    if (tempDir) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  after(() => {
    server.close();
  });

  describe('siteArchiveImport', () => {
    it('should import from a local directory', async () => {
      // Create a test directory structure
      const siteDir = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(siteDir, 'catalogs'), {recursive: true});
      fs.writeFileSync(path.join(siteDir, 'catalogs', 'catalog.xml'), '<catalog/>');

      let uploadedZip: Buffer | null = null;
      let jobExecuted = false;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
          const url = new URL(request.url);
          if (request.method === 'PUT' && url.pathname.includes('Impex/src/instance/')) {
            uploadedZip = Buffer.from(await request.arrayBuffer());
            return new HttpResponse(null, {status: 201});
          }
          if (request.method === 'DELETE') {
            return new HttpResponse(null, {status: 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () => {
          jobExecuted = true;
          return HttpResponse.json({
            id: 'exec-1',
            execution_status: 'finished',
            exit_status: {code: 'OK', message: 'Success'},
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/exec-1`, () => {
          return HttpResponse.json({
            id: 'exec-1',
            execution_status: 'finished',
            exit_status: {code: 'OK', message: 'Success'},
            is_log_file_existing: false,
          });
        }),
      );

      const result = await siteArchiveImport(mockInstance, siteDir, {
        archiveName: 'test-import',
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(result.execution.id).to.equal('exec-1');
      expect(result.execution.execution_status).to.equal('finished');
      expect(result.archiveFilename).to.include('test-import');
      expect(result.archiveKept).to.be.false;
      expect(uploadedZip).to.not.be.null;
      expect(uploadedZip!.length).to.be.greaterThan(0);
      expect(jobExecuted).to.be.true;
    });

    it('should import from a zip file', async () => {
      // Create a test zip file
      const zipPath = path.join(tempDir, 'test.zip');
      fs.writeFileSync(zipPath, Buffer.from('PK\x03\x04')); // Minimal zip header

      let uploadedZip: Buffer | null = null;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
          const url = new URL(request.url);
          if (request.method === 'PUT' && url.pathname.includes('Impex/src/instance/')) {
            uploadedZip = Buffer.from(await request.arrayBuffer());
            return new HttpResponse(null, {status: 201});
          }
          if (request.method === 'DELETE') {
            return new HttpResponse(null, {status: 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () => {
          return HttpResponse.json({
            id: 'exec-2',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/exec-2`, () => {
          return HttpResponse.json({
            id: 'exec-2',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          });
        }),
      );

      const result = await siteArchiveImport(mockInstance, zipPath, {
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(result.execution.id).to.equal('exec-2');
      expect(uploadedZip).to.not.be.null;
    });

    it('should import from a Buffer with archiveName (caller owns structure)', async () => {
      // When archiveName is provided, the buffer is used as-is
      const srcZip = new JSZip();
      srcZip.file('buffer-import/libraries/mylib/library.xml', '<library/>');
      const zipBuffer = await srcZip.generateAsync({type: 'nodebuffer'});

      let uploadedZip: Buffer | null = null;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
          const url = new URL(request.url);
          if (request.method === 'PUT' && url.pathname.includes('Impex/src/instance/')) {
            uploadedZip = Buffer.from(await request.arrayBuffer());
            return new HttpResponse(null, {status: 201});
          }
          if (request.method === 'DELETE') {
            return new HttpResponse(null, {status: 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () => {
          return HttpResponse.json({
            id: 'exec-3',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/exec-3`, () => {
          return HttpResponse.json({
            id: 'exec-3',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          });
        }),
      );

      const result = await siteArchiveImport(mockInstance, zipBuffer, {
        archiveName: 'buffer-import',
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(result.execution.id).to.equal('exec-3');
      expect(result.archiveFilename).to.equal('buffer-import.zip');

      // Buffer should be passed through as-is (no re-wrapping)
      const resultZip = await JSZip.loadAsync(uploadedZip!);
      const paths = Object.keys(resultZip.files).filter((p) => !resultZip.files[p].dir);
      expect(paths).to.include('buffer-import/libraries/mylib/library.xml');
    });

    it('should import from remote filename', async () => {
      server.use(
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () => {
          return HttpResponse.json({
            id: 'exec-4',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/exec-4`, () => {
          return HttpResponse.json({
            id: 'exec-4',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          });
        }),
      );

      const result = await siteArchiveImport(
        mockInstance,
        {remoteFilename: 'existing-archive.zip'},
        {
          waitOptions: FAST_WAIT_OPTIONS,
        },
      );

      expect(result.execution.id).to.equal('exec-4');
      expect(result.archiveFilename).to.equal('existing-archive.zip');
    });

    it('should keep archive when keepArchive is true', async () => {
      const zipPath = path.join(tempDir, 'test.zip');
      fs.writeFileSync(zipPath, Buffer.from('PK\x03\x04'));

      let deleteRequested = false;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
          if (request.method === 'DELETE') {
            deleteRequested = true;
          }
          return new HttpResponse(null, {status: request.method === 'PUT' ? 201 : 204});
        }),
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () => {
          return HttpResponse.json({
            id: 'exec-5',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/exec-5`, () => {
          return HttpResponse.json({
            id: 'exec-5',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          });
        }),
      );

      const result = await siteArchiveImport(mockInstance, zipPath, {
        keepArchive: true,
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(result.archiveKept).to.be.true;
      expect(deleteRequested).to.be.false;
    });

    it('should auto-wrap buffer contents when archiveName is omitted', async () => {
      // Create a zip without a root directory (like the content FS provider does)
      const srcZip = new JSZip();
      srcZip.file('libraries/mylib/library.xml', '<library/>');
      const zipBuffer = await srcZip.generateAsync({type: 'nodebuffer'});

      let uploadedZip: Buffer | null = null;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
          const url = new URL(request.url);
          if (request.method === 'PUT' && url.pathname.includes('Impex/src/instance/')) {
            uploadedZip = Buffer.from(await request.arrayBuffer());
            return new HttpResponse(null, {status: 201});
          }
          if (request.method === 'DELETE') {
            return new HttpResponse(null, {status: 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () => {
          return HttpResponse.json({
            id: 'exec-wrap',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/exec-wrap`, () => {
          return HttpResponse.json({
            id: 'exec-wrap',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          });
        }),
      );

      const result = await siteArchiveImport(mockInstance, zipBuffer, {
        waitOptions: FAST_WAIT_OPTIONS,
      });

      // SDK should auto-generate an import-{timestamp} archive name
      expect(result.archiveFilename).to.match(/^import-\d+\.zip$/);
      expect(uploadedZip).to.not.be.null;

      // Contents must be wrapped under the generated root directory
      const resultZip = await JSZip.loadAsync(uploadedZip!);
      const paths = Object.keys(resultZip.files).filter((p) => !resultZip.files[p].dir);
      const archiveRoot = result.archiveFilename.replace(/\.zip$/, '');
      expect(paths).to.include(`${archiveRoot}/libraries/mylib/library.xml`);
    });

    it('should throw JobExecutionError when import fails', async () => {
      const zipPath = path.join(tempDir, 'test.zip');
      fs.writeFileSync(zipPath, Buffer.from('PK\x03\x04'));

      server.use(
        http.all(`${WEBDAV_BASE}/*`, () => {
          return new HttpResponse(null, {status: 201});
        }),
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () => {
          return HttpResponse.json({
            id: 'exec-fail',
            execution_status: 'finished',
            exit_status: {code: 'ERROR', message: 'Import failed'},
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/exec-fail`, () => {
          return HttpResponse.json({
            id: 'exec-fail',
            execution_status: 'finished',
            exit_status: {code: 'ERROR', message: 'Import failed'},
            is_log_file_existing: false,
          });
        }),
      );

      try {
        await siteArchiveImport(mockInstance, zipPath, {
          waitOptions: FAST_WAIT_OPTIONS,
        });
        expect.fail('Should have thrown JobExecutionError');
      } catch (error: any) {
        expect(error.name).to.equal('JobExecutionError');
        // The error message includes the job ID
        expect(error.message).to.include('failed');
      }
    });
  });

  describe('siteArchiveExport', () => {
    it('should export to a local file', async () => {
      const exportPath = path.join(tempDir, 'export.zip');

      server.use(
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-export/executions`, () => {
          return HttpResponse.json({
            id: 'export-1',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-export/executions/export-1`, () => {
          return HttpResponse.json({
            id: 'export-1',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          });
        }),
        http.get(`${WEBDAV_BASE}/Impex/src/instance/*`, () => {
          // Return a minimal zip file
          return new HttpResponse(Buffer.from('PK\x03\x04test-export-data'), {
            status: 200,
            headers: {'Content-Type': 'application/zip'},
          });
        }),
        http.delete(`${WEBDAV_BASE}/Impex/src/instance/*`, () => {
          return new HttpResponse(null, {status: 204});
        }),
      );

      const result = await siteArchiveExportToPath(mockInstance, {global_data: {meta_data: true}}, exportPath, {
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(result.execution.id).to.equal('export-1');
      expect(result.localPath).to.equal(exportPath);
      expect(fs.existsSync(exportPath)).to.be.true;

      const content = fs.readFileSync(exportPath);
      expect(content.toString()).to.include('test-export-data');
    });

    it('should run export job without downloading the archive', async () => {
      let webdavGetRequested = false;

      server.use(
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-export/executions`, () => {
          return HttpResponse.json({
            id: 'export-2',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-export/executions/export-2`, () => {
          return HttpResponse.json({
            id: 'export-2',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          });
        }),
        http.get(`${WEBDAV_BASE}/Impex/src/instance/*`, () => {
          webdavGetRequested = true;
          return new HttpResponse(Buffer.from('PK\x03\x04test-data'), {
            status: 200,
            headers: {'Content-Type': 'application/zip'},
          });
        }),
      );

      const result = await siteArchiveExport(
        mockInstance,
        {global_data: {meta_data: true}},
        {waitOptions: FAST_WAIT_OPTIONS},
      );

      expect(result.execution.id).to.equal('export-2');
      expect(webdavGetRequested).to.be.false;
      expect(result).to.not.have.property('data');
    });

    it('should throw JobExecutionError when export fails', async () => {
      const exportPath = path.join(tempDir, 'export-fail.zip');

      server.use(
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-export/executions`, () => {
          return HttpResponse.json({
            id: 'export-fail',
            execution_status: 'finished',
            exit_status: {code: 'ERROR', message: 'Export failed'},
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-export/executions/export-fail`, () => {
          return HttpResponse.json({
            id: 'export-fail',
            execution_status: 'finished',
            exit_status: {code: 'ERROR', message: 'Export failed'},
            is_log_file_existing: false,
          });
        }),
      );

      try {
        await siteArchiveExportToPath(mockInstance, {}, exportPath, {
          waitOptions: FAST_WAIT_OPTIONS,
        });
        expect.fail('Should have thrown JobExecutionError');
      } catch (error: any) {
        expect(error.name).to.equal('JobExecutionError');
        // The error message includes the job ID
        expect(error.message).to.include('failed');
      }
    });

    it('should use default archive name when not provided', async () => {
      server.use(
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-export/executions`, () => {
          return HttpResponse.json({
            id: 'export-3',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-export/executions/export-3`, () => {
          return HttpResponse.json({
            id: 'export-3',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          });
        }),
      );

      const result = await siteArchiveExport(
        mockInstance,
        {global_data: {meta_data: true}},
        {waitOptions: FAST_WAIT_OPTIONS},
      );

      expect(result.archiveFilename).to.match(/\d{8}T\d{9}Z_export\.zip/);
    });
  });
});
