/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {expect} from 'chai';
import sinon from 'sinon';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import JSZip from 'jszip';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {fetchContentLibrary, exportContent} from '../../../src/operations/content/export.js';
import {Library} from '../../../src/operations/content/library.js';
import {WebDavClient} from '../../../src/clients/webdav.js';
import {createOcapiClient} from '../../../src/clients/ocapi.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';
import {SAMPLE_LIBRARY_XML} from './fixtures.js';

const TEST_HOST = 'test.demandware.net';
const WEBDAV_BASE = `https://${TEST_HOST}/on/demandware.servlet/webdav/Sites`;
const OCAPI_BASE = `https://${TEST_HOST}/s/-/dw/data/v25_6`;

/** Short poll interval for fast tests */
const FAST_WAIT_OPTIONS = {pollInterval: 10};

/**
 * Library XML with attributes on <data> elements so xml2js produces
 * the {_: "text"} charkey format required for asset extraction.
 * Real B2C Commerce XML uses xml:lang attributes on data elements.
 */
const LIBRARY_XML_WITH_ASSETS = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31" library-id="TestLibrary">
  <header>
    <default-content>
      <name xml:lang="x-default">Test Library</name>
    </default-content>
  </header>
  <folder folder-id="root">
    <display-name xml:lang="x-default">Root</display-name>
  </folder>
  <folder folder-id="pages">
    <display-name xml:lang="x-default">Pages</display-name>
    <parent>root</parent>
  </folder>
  <content content-id="homepage">
    <type>page.storePage</type>
    <data xml:lang="x-default"><![CDATA[{"title": "Home Page"}]]></data>
    <folder-links>
      <classification-link folder-id="pages"/>
    </folder-links>
    <content-links>
      <content-link content-id="hero-banner"/>
      <content-link content-id="product-grid"/>
    </content-links>
  </content>
  <content content-id="hero-banner">
    <type>component.heroBanner</type>
    <data xml:lang="x-default"><![CDATA[{"heading": "Welcome", "image": {"path": "/images/hero.jpg"}}]]></data>
  </content>
  <content content-id="product-grid">
    <type>component.productGrid</type>
    <data xml:lang="x-default"><![CDATA[{"columns": 3}]]></data>
  </content>
  <content content-id="about-us">
    <type>page.storePage</type>
    <data xml:lang="x-default"><![CDATA[{"title": "About Us"}]]></data>
    <folder-links>
      <classification-link folder-id="pages"/>
    </folder-links>
    <content-links>
      <content-link content-id="text-block"/>
    </content-links>
  </content>
  <content content-id="text-block">
    <type>component.textBlock</type>
    <data xml:lang="x-default"><![CDATA[{"text": "About us text", "image": {"path": "/images/about.png"}}]]></data>
  </content>
  <content content-id="footer-content">
    <data xml:lang="x-default"><![CDATA[{"copyright": "2025"}]]></data>
  </content>
  <content content-id="orphan-component">
    <type>component.orphan</type>
    <data xml:lang="x-default"><![CDATA[{"unused": true}]]></data>
  </content>
</library>`;

/**
 * Create a mock archive zip buffer containing a library XML at the correct path.
 */
async function createMockArchive(libraryId: string, xml: string, isSite = false): Promise<Buffer> {
  const zip = new JSZip();
  const timestamp = '20250101T000000Z';
  const archiveDir = `${timestamp}_export`;
  const libPath = isSite
    ? `${archiveDir}/sites/${libraryId}/library/library.xml`
    : `${archiveDir}/libraries/${libraryId}/library.xml`;
  zip.file(libPath, xml);
  return zip.generateAsync({type: 'nodebuffer'});
}

/**
 * Create a real instance with MSW-mocked HTTP transport.
 */
function createRealInstance() {
  const auth = new MockAuthStrategy();
  const webdav = new WebDavClient(TEST_HOST, auth);
  const ocapi = createOcapiClient(TEST_HOST, auth);

  return {
    config: {hostname: TEST_HOST},
    webdav,
    ocapi,
  } as any;
}

/**
 * Create a mock instance with sinon-stubbed webdav methods.
 * Used for exportContent tests where libraryFile bypasses siteArchiveExport
 * and only webdav asset downloads need to be controlled.
 */
function createMockInstance() {
  return {
    config: {hostname: 'test.example.com'},
    webdav: {
      get: sinon.stub().resolves(new Uint8Array([1, 2, 3])),
      put: sinon.stub().resolves(),
      delete: sinon.stub().resolves(),
    },
    ocapi: {
      POST: sinon.stub().resolves({data: {id: 'exec-1', execution_status: 'finished'}}),
      GET: sinon.stub().resolves({data: {id: 'exec-1', execution_status: 'finished'}}),
    },
  } as any;
}

describe('operations/content/export', () => {
  const server = setupServer();
  let tempDir: string;

  before(() => {
    server.listen({onUnhandledRequest: 'bypass'});
  });

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-content-export-'));
  });

  afterEach(() => {
    sinon.restore();
    server.resetHandlers();
    if (tempDir) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  after(() => {
    server.close();
  });

  describe('fetchContentLibrary', () => {
    it('fetches a shared library from instance via site archive export', async () => {
      const instance = createRealInstance();
      const archiveData = await createMockArchive('TestLibrary', SAMPLE_LIBRARY_XML);

      let capturedRequestBody: any = null;

      server.use(
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-export/executions`, async ({request}) => {
          capturedRequestBody = await request.json();
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
          return new HttpResponse(archiveData, {
            status: 200,
            headers: {'Content-Type': 'application/zip'},
          });
        }),
        http.delete(`${WEBDAV_BASE}/Impex/src/instance/*`, () => {
          return new HttpResponse(null, {status: 204});
        }),
      );

      const result = await fetchContentLibrary(instance, 'TestLibrary', {
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(capturedRequestBody).to.not.be.null;
      expect(capturedRequestBody.data_units).to.deep.equal({libraries: {TestLibrary: true}});
      expect(result.library).to.be.instanceOf(Library);
      expect(result.archiveData).to.be.instanceOf(Buffer);
    });

    it('fetches a site library with correct data units', async () => {
      const instance = createRealInstance();
      const archiveData = await createMockArchive('RefArch', SAMPLE_LIBRARY_XML, true);

      let capturedRequestBody: any = null;

      server.use(
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-export/executions`, async ({request}) => {
          capturedRequestBody = await request.json();
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
          return new HttpResponse(archiveData, {
            status: 200,
            headers: {'Content-Type': 'application/zip'},
          });
        }),
        http.delete(`${WEBDAV_BASE}/Impex/src/instance/*`, () => {
          return new HttpResponse(null, {status: 204});
        }),
      );

      const result = await fetchContentLibrary(instance, 'RefArch', {
        isSiteLibrary: true,
        waitOptions: FAST_WAIT_OPTIONS,
      });

      expect(capturedRequestBody).to.not.be.null;
      expect(capturedRequestBody.data_units).to.deep.equal({sites: {RefArch: {content: true}}});
      expect(result.library).to.be.instanceOf(Library);
    });

    it('reads from a local file when libraryFile option is set', async () => {
      const instance = createMockInstance();
      const localFile = path.join(tempDir, 'library.xml');
      await fs.promises.writeFile(localFile, SAMPLE_LIBRARY_XML, 'utf8');

      const result = await fetchContentLibrary(instance, 'TestLibrary', {
        libraryFile: localFile,
      });

      expect(result.library).to.be.instanceOf(Library);
      expect(result.archiveData).to.be.undefined;
    });

    it('throws when library is not found in archive', async () => {
      const instance = createRealInstance();
      // Create archive with a different library ID so the expected one is missing
      const archiveData = await createMockArchive('OtherLibrary', SAMPLE_LIBRARY_XML);

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
        http.get(`${WEBDAV_BASE}/Impex/src/instance/*`, () => {
          return new HttpResponse(archiveData, {
            status: 200,
            headers: {'Content-Type': 'application/zip'},
          });
        }),
        http.delete(`${WEBDAV_BASE}/Impex/src/instance/*`, () => {
          return new HttpResponse(null, {status: 204});
        }),
      );

      try {
        await fetchContentLibrary(instance, 'TestLibrary', {waitOptions: FAST_WAIT_OPTIONS});
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('Library TestLibrary not found in archive');
      }
    });

    it('returns a parsed Library instance with correct tree structure', async () => {
      const instance = createMockInstance();
      const localFile = path.join(tempDir, 'library.xml');
      await fs.promises.writeFile(localFile, LIBRARY_XML_WITH_ASSETS, 'utf8');

      const result = await fetchContentLibrary(instance, 'TestLibrary', {
        libraryFile: localFile,
      });

      const library = result.library;
      expect(library.tree.id).to.equal('TestLibrary');
      expect(library.tree.type).to.equal('LIBRARY');

      // Collect root children IDs (pages and content assets)
      const rootChildIds = library.tree.children.map((c) => c.id);
      expect(rootChildIds).to.include('homepage');
      expect(rootChildIds).to.include('about-us');
      expect(rootChildIds).to.include('footer-content');
    });

    it('throws when archive download fails', async () => {
      const instance = createRealInstance();

      server.use(
        http.post(`${OCAPI_BASE}/jobs/sfcc-site-archive-export/executions`, () => {
          return HttpResponse.json({
            id: 'export-4',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
          });
        }),
        http.get(`${OCAPI_BASE}/jobs/sfcc-site-archive-export/executions/export-4`, () => {
          return HttpResponse.json({
            id: 'export-4',
            execution_status: 'finished',
            exit_status: {code: 'OK'},
            is_log_file_existing: false,
          });
        }),
        http.get(`${WEBDAV_BASE}/Impex/src/instance/*`, () => {
          return new HttpResponse(null, {status: 404});
        }),
        http.delete(`${WEBDAV_BASE}/Impex/src/instance/*`, () => {
          return new HttpResponse(null, {status: 204});
        }),
      );

      try {
        await fetchContentLibrary(instance, 'TestLibrary', {waitOptions: FAST_WAIT_OPTIONS});
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe('exportContent', () => {
    /**
     * Helper: write library XML to a temp file and return its path.
     * All exportContent tests use libraryFile to bypass siteArchiveExport.
     */
    function writeLibraryFile(xml: string = LIBRARY_XML_WITH_ASSETS): string {
      const localFile = path.join(tempDir, 'library.xml');
      fs.writeFileSync(localFile, xml, 'utf8');
      return localFile;
    }

    it('exports filtered pages with correct counts', async () => {
      const instance = createMockInstance();
      const libraryFile = writeLibraryFile();
      const outputPath = path.join(tempDir, 'output');

      const result = await exportContent(instance, ['homepage'], 'TestLibrary', outputPath, {
        libraryFile,
      });

      // homepage has 2 components: hero-banner and product-grid
      expect(result.pageCount).to.equal(1);
      expect(result.componentCount).to.equal(2);
      expect(result.outputPath).to.equal(outputPath);
    });

    it('downloads assets via webdav', async () => {
      const instance = createMockInstance();
      const libraryFile = writeLibraryFile();
      const outputPath = path.join(tempDir, 'output');

      const result = await exportContent(instance, ['homepage'], 'TestLibrary', outputPath, {
        libraryFile,
      });

      // hero-banner has image.path = /images/hero.jpg
      expect(instance.webdav.get.called).to.be.true;
      expect(result.downloadedAssets.length).to.be.greaterThan(0);
      expect(result.downloadedAssets).to.include('images/hero.jpg');
    });

    it('skips asset downloads in offline mode', async () => {
      const instance = createMockInstance();
      const libraryFile = writeLibraryFile();
      const outputPath = path.join(tempDir, 'output');

      const result = await exportContent(instance, ['homepage'], 'TestLibrary', outputPath, {
        libraryFile,
        offline: true,
      });

      expect(instance.webdav.get.called).to.be.false;
      expect(result.downloadedAssets).to.deep.equal([]);
    });

    it('supports regex page matching', async () => {
      const instance = createMockInstance();
      const libraryFile = writeLibraryFile();
      const outputPath = path.join(tempDir, 'output');

      // Match both 'homepage' and 'about-us' with regex
      const result = await exportContent(instance, ['home.*', 'about.*'], 'TestLibrary', outputPath, {
        libraryFile,
        regex: true,
      });

      // Both pages should be matched
      expect(result.pageCount).to.equal(2);
      // homepage has hero-banner + product-grid, about-us has text-block = 3 components
      expect(result.componentCount).to.equal(3);
    });

    it('filters by folder classification', async () => {
      const instance = createMockInstance();
      const libraryFile = writeLibraryFile();
      const outputPath = path.join(tempDir, 'output');

      // Filter by folder 'pages' - both homepage and about-us have folder-links to 'pages'
      const result = await exportContent(instance, ['homepage', 'about-us'], 'TestLibrary', outputPath, {
        libraryFile,
        folders: ['pages'],
      });

      expect(result.pageCount).to.equal(2);
    });

    it('excludes pages not matching folder filter', async () => {
      const instance = createMockInstance();
      const libraryFile = writeLibraryFile();
      const outputPath = path.join(tempDir, 'output');

      // Filter by a folder that doesn't exist - no pages should match
      const result = await exportContent(instance, ['homepage', 'about-us'], 'TestLibrary', outputPath, {
        libraryFile,
        folders: ['nonexistent-folder'],
        offline: true,
      });

      expect(result.pageCount).to.equal(0);
      expect(result.componentCount).to.equal(0);
    });

    it('reports failed asset downloads', async () => {
      const instance = createMockInstance();
      const libraryFile = writeLibraryFile();
      const outputPath = path.join(tempDir, 'output');

      // Make webdav.get reject for all assets
      instance.webdav.get.rejects(new Error('404 Not Found'));

      const result = await exportContent(instance, ['homepage'], 'TestLibrary', outputPath, {
        libraryFile,
      });

      expect(result.downloadedAssets).to.deep.equal([]);
      expect(result.failedAssets.length).to.be.greaterThan(0);
      expect(result.failedAssets[0].error).to.include('404 Not Found');
    });

    it('calls onAssetProgress callback', async () => {
      const instance = createMockInstance();
      const libraryFile = writeLibraryFile();
      const outputPath = path.join(tempDir, 'output');

      const progressCalls: Array<{asset: string; index: number; total: number; success: boolean}> = [];

      await exportContent(instance, ['homepage'], 'TestLibrary', outputPath, {
        libraryFile,
        onAssetProgress: (asset, index, total, success) => {
          progressCalls.push({asset, index, total, success});
        },
      });

      expect(progressCalls.length).to.be.greaterThan(0);
      for (const call of progressCalls) {
        expect(call.total).to.be.greaterThan(0);
        expect(call.success).to.be.true;
      }
    });

    it('calls onAssetProgress callback with success=false on failure', async () => {
      const instance = createMockInstance();
      const libraryFile = writeLibraryFile();
      const outputPath = path.join(tempDir, 'output');

      instance.webdav.get.rejects(new Error('Download error'));

      const progressCalls: Array<{asset: string; index: number; total: number; success: boolean}> = [];

      await exportContent(instance, ['homepage'], 'TestLibrary', outputPath, {
        libraryFile,
        onAssetProgress: (asset, index, total, success) => {
          progressCalls.push({asset, index, total, success});
        },
      });

      expect(progressCalls.length).to.be.greaterThan(0);
      for (const call of progressCalls) {
        expect(call.success).to.be.false;
      }
    });

    it('writes library XML and assets to correct output paths', async () => {
      const instance = createMockInstance();
      const libraryFile = writeLibraryFile();
      const outputPath = path.join(tempDir, 'output');

      await exportContent(instance, ['homepage'], 'TestLibrary', outputPath, {
        libraryFile,
      });

      // Verify library XML was written to the correct path
      const xmlPath = path.join(outputPath, 'libraries', 'TestLibrary', 'library.xml');
      expect(fs.existsSync(xmlPath)).to.be.true;

      const xmlContent = fs.readFileSync(xmlPath, 'utf8');
      expect(xmlContent).to.include('homepage');
      expect(xmlContent).to.include('library');

      // Verify asset was written to the correct path
      const assetPath = path.join(outputPath, 'libraries', 'TestLibrary', 'static', 'default', 'images', 'hero.jpg');
      expect(fs.existsSync(assetPath)).to.be.true;
    });

    it('writes assets to site library paths when isSiteLibrary is true', async () => {
      const instance = createMockInstance();
      const libraryFile = writeLibraryFile();
      const outputPath = path.join(tempDir, 'output');

      await exportContent(instance, ['homepage'], 'RefArch', outputPath, {
        libraryFile,
        isSiteLibrary: true,
      });

      // Verify library XML was written to the site library path
      const xmlPath = path.join(outputPath, 'sites', 'RefArch', 'library', 'library.xml');
      expect(fs.existsSync(xmlPath)).to.be.true;

      // Verify asset was written to the site library path
      const assetPath = path.join(outputPath, 'sites', 'RefArch', 'library', 'static', 'default', 'images', 'hero.jpg');
      expect(fs.existsSync(assetPath)).to.be.true;
    });

    it('exports multiple pages', async () => {
      const instance = createMockInstance();
      const libraryFile = writeLibraryFile();
      const outputPath = path.join(tempDir, 'output');

      const result = await exportContent(instance, ['homepage', 'about-us'], 'TestLibrary', outputPath, {
        libraryFile,
      });

      expect(result.pageCount).to.equal(2);
      // homepage: hero-banner + product-grid, about-us: text-block
      expect(result.componentCount).to.equal(3);
    });
  });
});
