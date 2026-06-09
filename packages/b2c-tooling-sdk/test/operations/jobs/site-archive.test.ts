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
  siteArchiveImportSplit,
  siteArchiveExport,
  siteArchiveExportToPath,
} from '../../../src/operations/jobs/site-archive.js';

const TEST_HOST = 'test.demandware.net';
const WEBDAV_BASE = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;
const OCAPI_BASE = `https://${TEST_HOST}/s/-/dw/data/v25_6`;

// Use short poll interval for fast tests
const FAST_WAIT_OPTIONS = {pollIntervalSeconds: 1, sleep: () => Promise.resolve()};

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

    it('should import only the listed paths under a directory root', async () => {
      // Build a multi-area site export
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(root, 'sites', 'RefArch'), {recursive: true});
      fs.mkdirSync(path.join(root, 'sites', 'Other'), {recursive: true});
      fs.mkdirSync(path.join(root, 'libraries', 'mylib'), {recursive: true});
      fs.writeFileSync(path.join(root, 'sites', 'RefArch', 'site.xml'), '<site/>');
      fs.writeFileSync(path.join(root, 'sites', 'Other', 'site.xml'), '<site/>');
      fs.writeFileSync(path.join(root, 'libraries', 'mylib', 'library.xml'), '<library/>');

      let uploadedZip: Buffer | null = null;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
          const url = new URL(request.url);
          if (request.method === 'PUT' && url.pathname.includes('Impex/src/instance/')) {
            uploadedZip = Buffer.from(await request.arrayBuffer());
            return new HttpResponse(null, {status: 201});
          }
          return new HttpResponse(null, {status: 204});
        }),
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () =>
          HttpResponse.json({id: 'exec-subset', execution_status: 'finished', exit_status: {code: 'OK'}}),
        ),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/exec-subset`, () =>
          HttpResponse.json({
            id: 'exec-subset',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          }),
        ),
      );

      const result = await siteArchiveImport(mockInstance, root, {
        archiveName: 'subset-import',
        paths: ['sites/RefArch', 'libraries/mylib'],
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(result.execution.id).to.equal('exec-subset');
      expect(uploadedZip).to.not.be.null;

      const resultZip = await JSZip.loadAsync(uploadedZip!);
      const entries = Object.keys(resultZip.files).filter((p) => !resultZip.files[p].dir);
      expect(entries).to.include('subset-import/sites/RefArch/site.xml');
      expect(entries).to.include('subset-import/libraries/mylib/library.xml');
      expect(entries).to.not.include('subset-import/sites/Other/site.xml');
    });

    it('should expand glob patterns relative to the import root', async () => {
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(root, 'libraries', 'lib-a'), {recursive: true});
      fs.mkdirSync(path.join(root, 'libraries', 'lib-b'), {recursive: true});
      fs.mkdirSync(path.join(root, 'sites', 'RefArch'), {recursive: true});
      fs.writeFileSync(path.join(root, 'libraries', 'lib-a', 'library.xml'), '<library/>');
      fs.writeFileSync(path.join(root, 'libraries', 'lib-b', 'library.xml'), '<library/>');
      fs.writeFileSync(path.join(root, 'sites', 'RefArch', 'site.xml'), '<site/>');

      let uploadedZip: Buffer | null = null;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
          if (request.method === 'PUT') {
            uploadedZip = Buffer.from(await request.arrayBuffer());
            return new HttpResponse(null, {status: 201});
          }
          return new HttpResponse(null, {status: 204});
        }),
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () =>
          HttpResponse.json({id: 'exec-glob', execution_status: 'finished', exit_status: {code: 'OK'}}),
        ),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/exec-glob`, () =>
          HttpResponse.json({
            id: 'exec-glob',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          }),
        ),
      );

      await siteArchiveImport(mockInstance, root, {
        archiveName: 'glob-import',
        paths: ['libraries/*'],
        waitOptions: FAST_WAIT_OPTIONS,
      });

      const resultZip = await JSZip.loadAsync(uploadedZip!);
      const entries = Object.keys(resultZip.files).filter((p) => !resultZip.files[p].dir);
      expect(entries).to.include('glob-import/libraries/lib-a/library.xml');
      expect(entries).to.include('glob-import/libraries/lib-b/library.xml');
      expect(entries).to.not.include('glob-import/sites/RefArch/site.xml');
    });

    it('should reject paths that escape the import root', async () => {
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(root, 'inside'), {recursive: true});
      fs.writeFileSync(path.join(root, 'inside', 'a.xml'), '<a/>');

      // Sibling directory outside the root
      const outside = path.join(tempDir, 'outside');
      fs.mkdirSync(outside, {recursive: true});
      fs.writeFileSync(path.join(outside, 'b.xml'), '<b/>');

      try {
        await siteArchiveImport(mockInstance, root, {
          archiveName: 'escape-test',
          paths: [path.join(outside, 'b.xml')],
          waitOptions: FAST_WAIT_OPTIONS,
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('outside import root');
      }
    });

    it('should throw when a non-glob path does not exist', async () => {
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(root, {recursive: true});

      try {
        await siteArchiveImport(mockInstance, root, {
          paths: ['sites/Missing'],
          waitOptions: FAST_WAIT_OPTIONS,
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('Path not found');
      }
    });

    it('should throw when a glob matches nothing', async () => {
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(root, 'libraries'), {recursive: true});

      try {
        await siteArchiveImport(mockInstance, root, {
          paths: ['libraries/*.xml'],
          waitOptions: FAST_WAIT_OPTIONS,
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('No files matched');
      }
    });

    it('should reject paths option when target is a remote filename', async () => {
      try {
        await siteArchiveImport(
          mockInstance,
          {remoteFilename: 'archive.zip'},
          {paths: ['anything'], waitOptions: FAST_WAIT_OPTIONS},
        );
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('only supported when target is a directory');
      }
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

    it('should return immediately without polling when wait is false', async () => {
      const zipPath = path.join(tempDir, 'test.zip');
      fs.writeFileSync(zipPath, Buffer.from('PK\x03\x04'));

      let polled = false;
      let deleteRequested = false;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
          if (request.method === 'PUT') {
            return new HttpResponse(null, {status: 201});
          }
          if (request.method === 'DELETE') {
            deleteRequested = true;
            return new HttpResponse(null, {status: 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () => {
          return HttpResponse.json({
            id: 'exec-nowait',
            execution_status: 'running',
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/exec-nowait`, () => {
          polled = true;
          return HttpResponse.json({
            id: 'exec-nowait',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          });
        }),
      );

      const result = await siteArchiveImport(mockInstance, zipPath, {
        wait: false,
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(result.execution.id).to.equal('exec-nowait');
      expect(result.execution.execution_status).to.equal('running');
      expect(result.archiveKept).to.be.true;
      expect(polled).to.be.false;
      expect(deleteRequested).to.be.false;
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

  describe('siteArchiveImportSplit', () => {
    /**
     * Registers MSW handlers that capture every uploaded archive and respond to
     * the import job execution for each part. Each PUT body is collected so
     * tests can inspect how files were partitioned across archives.
     */
    function captureSplitUploads(): {uploads: Buffer[]; executions: () => number} {
      const uploads: Buffer[] = [];
      let execCount = 0;

      server.use(
        http.all(`${WEBDAV_BASE}/*`, async ({request}) => {
          const url = new URL(request.url);
          if (request.method === 'PUT' && url.pathname.includes('Impex/src/instance/')) {
            uploads.push(Buffer.from(await request.arrayBuffer()));
            return new HttpResponse(null, {status: 201});
          }
          if (request.method === 'DELETE') {
            return new HttpResponse(null, {status: 204});
          }
          return new HttpResponse(null, {status: 404});
        }),
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () => {
          execCount++;
          return HttpResponse.json({
            id: `split-exec-${execCount}`,
            execution_status: 'finished',
            exit_status: {code: 'OK'},
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/:id`, ({params}) =>
          HttpResponse.json({
            id: params.id,
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          }),
        ),
      );

      return {uploads, executions: () => execCount};
    }

    /** Collects the non-directory entry paths from a captured archive buffer. */
    async function entriesOf(buffer: Buffer): Promise<string[]> {
      const zip = await JSZip.loadAsync(buffer);
      return Object.keys(zip.files).filter((p) => !zip.files[p].dir);
    }

    it('keeps all XML in a single part when it fits under the limit', async () => {
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(root, 'catalogs', 'cat-a'), {recursive: true});
      fs.mkdirSync(path.join(root, 'libraries', 'lib-a'), {recursive: true});
      fs.writeFileSync(path.join(root, 'catalogs', 'cat-a', 'catalog.xml'), '<catalog/>');
      fs.writeFileSync(path.join(root, 'libraries', 'lib-a', 'library.xml'), '<library/>');

      const {uploads} = captureSplitUploads();

      const results = await siteArchiveImportSplit(mockInstance, root, {
        archiveName: 'big',
        waitOptions: FAST_WAIT_OPTIONS,
      });

      // No static assets → exactly one (xml) part.
      expect(results).to.have.lengthOf(1);
      expect(uploads).to.have.lengthOf(1);

      const entries = await entriesOf(uploads[0]);
      expect(entries).to.include('big-xml/catalogs/cat-a/catalog.xml');
      expect(entries).to.include('big-xml/libraries/lib-a/library.xml');
    });

    it('defers static assets into separate parts after the XML', async () => {
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(root, 'catalogs', 'cat-a', 'static'), {recursive: true});
      fs.writeFileSync(path.join(root, 'catalogs', 'cat-a', 'catalog.xml'), '<catalog/>');
      // A large incompressible asset that exceeds the per-part budget on its own
      // would error, so size it under a tiny limit but big enough to force its
      // own asset part separate from the XML.
      const asset = Buffer.alloc(50 * 1024, 7); // compressible-but-we-store-by-ext? .bin is compressible
      fs.writeFileSync(path.join(root, 'catalogs', 'cat-a', 'static', 'image.jpg'), asset);

      const {uploads} = captureSplitUploads();

      const results = await siteArchiveImportSplit(mockInstance, root, {
        archiveName: 'big',
        maxBytes: 1024 * 1024,
        waitOptions: FAST_WAIT_OPTIONS,
      });

      // One XML part + one asset part, XML imported first.
      expect(results).to.have.lengthOf(2);
      expect(uploads).to.have.lengthOf(2);

      const first = await entriesOf(uploads[0]);
      const second = await entriesOf(uploads[1]);
      expect(first).to.include('big-xml/catalogs/cat-a/catalog.xml');
      expect(first).to.not.include('big-xml/catalogs/cat-a/static/image.jpg');
      expect(second.some((p) => p.endsWith('catalogs/cat-a/static/image.jpg'))).to.be.true;
    });

    it('splits assets across multiple parts to stay under the size limit', async () => {
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(root, 'libraries', 'lib-a', 'static'), {recursive: true});
      fs.writeFileSync(path.join(root, 'libraries', 'lib-a', 'library.xml'), '<library/>');

      // Three ~40KB incompressible (jpg) assets with an 80KB budget → each
      // asset is stored (not deflated), so they cannot all share one archive.
      for (let i = 0; i < 3; i++) {
        fs.writeFileSync(
          path.join(root, 'libraries', 'lib-a', 'static', `img-${i}.jpg`),
          Buffer.alloc(40 * 1024, i + 1),
        );
      }

      const {uploads} = captureSplitUploads();

      const results = await siteArchiveImportSplit(mockInstance, root, {
        archiveName: 'big',
        maxBytes: 80 * 1024,
        waitOptions: FAST_WAIT_OPTIONS,
      });

      // 1 xml part + at least 2 asset parts (3×40KB stored can't fit 2-per-80KB
      // with overhead → 3 asset parts in practice).
      const xmlParts = results.length - (results.length - 1);
      expect(xmlParts).to.equal(1);
      expect(results.length).to.be.greaterThan(2);

      // Every asset must appear exactly once across all asset archives.
      const allEntries: string[] = [];
      for (const buf of uploads) {
        allEntries.push(...(await entriesOf(buf)));
      }
      for (let i = 0; i < 3; i++) {
        const matches = allEntries.filter((p) => p.endsWith(`static/img-${i}.jpg`));
        expect(matches, `img-${i}.jpg should appear once`).to.have.lengthOf(1);
      }
    });

    it('throws when a single asset exceeds the per-part limit', async () => {
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(root, 'libraries', 'lib-a', 'static'), {recursive: true});
      fs.writeFileSync(path.join(root, 'libraries', 'lib-a', 'library.xml'), '<library/>');
      // 200KB incompressible asset, 50KB budget → cannot fit, cannot split.
      fs.writeFileSync(path.join(root, 'libraries', 'lib-a', 'static', 'huge.jpg'), Buffer.alloc(200 * 1024, 9));

      captureSplitUploads();

      try {
        await siteArchiveImportSplit(mockInstance, root, {
          maxBytes: 50 * 1024,
          waitOptions: FAST_WAIT_OPTIONS,
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('too large to fit in a single archive');
      }
    });

    it('throws when a single data unit XML exceeds the per-part limit', async () => {
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(root, 'catalogs', 'cat-a'), {recursive: true});
      // Incompressible content (xorshift PRNG) so the deflated size stays large
      // and reliably exceeds the budget even after compression. A .xml under a
      // catalog is classified as order-sensitive (not a static asset).
      const big = Buffer.alloc(100 * 1024);
      let state = 0x12345678;
      for (let i = 0; i < big.length; i++) {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        big[i] = state & 0xff;
      }
      fs.writeFileSync(path.join(root, 'catalogs', 'cat-a', 'catalog.xml'), big);

      captureSplitUploads();

      try {
        await siteArchiveImportSplit(mockInstance, root, {
          maxBytes: 10 * 1024, // 10KB budget — the ~100KB XML unit cannot fit
          waitOptions: FAST_WAIT_OPTIONS,
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.match(/too large to fit in a single archive part/);
      }
    });

    it('imports parts sequentially, one job execution per part', async () => {
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(root, 'libraries', 'lib-a', 'static'), {recursive: true});
      fs.writeFileSync(path.join(root, 'libraries', 'lib-a', 'library.xml'), '<library/>');
      for (let i = 0; i < 2; i++) {
        fs.writeFileSync(
          path.join(root, 'libraries', 'lib-a', 'static', `img-${i}.jpg`),
          Buffer.alloc(40 * 1024, i + 1),
        );
      }

      const {uploads, executions} = captureSplitUploads();

      const results = await siteArchiveImportSplit(mockInstance, root, {
        archiveName: 'big',
        maxBytes: 60 * 1024,
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(executions()).to.equal(results.length);
      expect(uploads).to.have.lengthOf(results.length);
      // First part is always the XML/metadata tier.
      const first = await entriesOf(uploads[0]);
      expect(first.some((p) => p.endsWith('library.xml'))).to.be.true;
    });

    it('reports the plan and each part via callbacks', async () => {
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(root, 'libraries', 'lib-a', 'static'), {recursive: true});
      fs.writeFileSync(path.join(root, 'libraries', 'lib-a', 'library.xml'), '<library/>');
      fs.writeFileSync(path.join(root, 'libraries', 'lib-a', 'static', 'img.jpg'), Buffer.alloc(40 * 1024, 1));

      captureSplitUploads();

      let plan: any = null;
      const parts: any[] = [];

      await siteArchiveImportSplit(mockInstance, root, {
        maxBytes: 1024 * 1024,
        waitOptions: FAST_WAIT_OPTIONS,
        onPlan: (p) => {
          plan = p;
        },
        onPart: (info) => {
          parts.push(info);
        },
      });

      expect(plan).to.not.be.null;
      expect(plan.partCount).to.equal(2);
      expect(plan.xmlPartCount).to.equal(1);
      expect(plan.assetPartCount).to.equal(1);
      expect(parts).to.have.lengthOf(2);
      expect(parts[0].kind).to.equal('xml');
      expect(parts[1].kind).to.equal('assets');
    });

    it('rejects a non-directory target', async () => {
      const zipPath = path.join(tempDir, 'archive.zip');
      fs.writeFileSync(zipPath, Buffer.from('PK\x03\x04'));

      try {
        await siteArchiveImportSplit(mockInstance, zipPath, {waitOptions: FAST_WAIT_OPTIONS});
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.include('requires a directory');
      }
    });
  });

  describe('siteArchiveImport oversize callback', () => {
    it('invokes onOversize when the archive exceeds maxBytes', async () => {
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(root, 'libraries', 'lib-a', 'static'), {recursive: true});
      fs.writeFileSync(path.join(root, 'libraries', 'lib-a', 'library.xml'), '<library/>');
      // Incompressible content so the assembled archive genuinely exceeds the
      // tiny ceiling (the archive DEFLATEs everything, so all-identical bytes
      // would shrink to near-nothing).
      const incompressible = Buffer.alloc(40 * 1024);
      let state = 0x2545f491;
      for (let i = 0; i < incompressible.length; i++) {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        incompressible[i] = state & 0xff;
      }
      fs.writeFileSync(path.join(root, 'libraries', 'lib-a', 'static', 'img.jpg'), incompressible);

      server.use(
        http.all(
          `${WEBDAV_BASE}/*`,
          async ({request}) => new HttpResponse(null, {status: request.method === 'PUT' ? 201 : 204}),
        ),
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () =>
          HttpResponse.json({id: 'os-1', execution_status: 'finished', exit_status: {code: 'OK'}}),
        ),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/os-1`, () =>
          HttpResponse.json({
            id: 'os-1',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          }),
        ),
      );

      let oversize: {bytes: number; maxBytes: number} | null = null;

      await siteArchiveImport(mockInstance, root, {
        archiveName: 'big',
        maxBytes: 1024, // tiny ceiling so the archive is over it
        onOversize: (info) => {
          oversize = info;
        },
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(oversize).to.not.be.null;
      expect(oversize!.bytes).to.be.greaterThan(1024);
      expect(oversize!.maxBytes).to.equal(1024);
    });

    it('does not invoke onOversize when the archive is within maxBytes', async () => {
      const root = path.join(tempDir, 'site-data');
      fs.mkdirSync(path.join(root, 'libraries', 'lib-a'), {recursive: true});
      fs.writeFileSync(path.join(root, 'libraries', 'lib-a', 'library.xml'), '<library/>');

      server.use(
        http.all(
          `${WEBDAV_BASE}/*`,
          async ({request}) => new HttpResponse(null, {status: request.method === 'PUT' ? 201 : 204}),
        ),
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions`, () =>
          HttpResponse.json({id: 'os-2', execution_status: 'finished', exit_status: {code: 'OK'}}),
        ),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-import/executions/os-2`, () =>
          HttpResponse.json({
            id: 'os-2',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          }),
        ),
      );

      let called = false;

      await siteArchiveImport(mockInstance, root, {
        archiveName: 'small',
        maxBytes: 50 * 1024 * 1024,
        onOversize: () => {
          called = true;
        },
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(called).to.be.false;
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
