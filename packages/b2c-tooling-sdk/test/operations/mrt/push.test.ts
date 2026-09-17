/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '@salesforce/b2c-tooling-sdk/clients';
import {
  uploadBundle,
  uploadBundleV2,
  listBundles,
  deleteBundle,
  bulkDeleteBundles,
  listBundlesScapi,
  uploadBundleScapi,
  listMrtBundles,
  pushMrtBundle,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import type {Bundle, BundleV2, ScapiMrtConnection} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {ScapiRequestError} from '../../../src/clients/scapi-backend-utils.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const DEFAULT_BASE_URL = DEFAULT_MRT_ORIGIN;

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const ORGANIZATION_ID = 'f_ecom_zzxy_prd';
const STOREFRONT_ID = 'my-project';
const SCAPI_BASE = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/storefront/deployments/v1`;
const SCAPI_BUNDLES = `${SCAPI_BASE}/organizations/:organizationId/storefronts/:storefrontId/bundles`;
const SCAPI_DEPLOYMENTS = `${SCAPI_BASE}/organizations/:organizationId/storefronts/:storefrontId/environments/:environmentId/deployments`;
const LEGACY_BUNDLES = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/`;
const LEGACY_BUILDS_TARGET = `${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/:targetSlug/`;

function scapiConn(): ScapiMrtConnection {
  return {shortCode: SHORT_CODE, tenantId: TENANT_ID, auth: new MockAuthStrategy()};
}

describe('operations/mrt/push', () => {
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

  describe('uploadBundle', () => {
    const testBundle: Bundle = {
      message: 'Test bundle',
      encoding: 'base64',
      data: 'dGVzdC1kYXRh', // base64 encoded "test-data"
      ssr_parameters: {SSRFunctionNodeVersion: '22.x'},
      ssr_only: ['ssr.js'],
      ssr_shared: ['static/index.html', 'static/app.js'],
    };

    it('uploads bundle without deployment', async () => {
      let receivedBody: unknown;

      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/`, async ({request, params}) => {
          receivedBody = await request.json();
          expect(params.projectSlug).to.equal('my-project');
          return HttpResponse.json({
            bundle_id: 123,
            message: 'Bundle created',
            url: 'https://runtime.commercecloud.com/...',
            bundle_preview_url: null,
            warnings: [],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const result = await uploadBundle(client, 'my-project', testBundle);

      expect(result.bundleId).to.equal(123);
      expect(result.projectSlug).to.equal('my-project');
      expect(result.deployed).to.be.false;
      expect(result.target).to.be.undefined;
      expect(result.message).to.equal('Test bundle');
      expect(result.warnings).to.deep.equal([]);

      expect(receivedBody).to.deep.include({
        message: 'Test bundle',
        encoding: 'base64',
        data: 'dGVzdC1kYXRh',
      });
    });

    it('returns warnings from the no-target upload response', async () => {
      const warning = 'x86 support ends January 31, 2027. Switch to ARM in environment settings to avoid disruptions';

      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/`, () => {
          return HttpResponse.json({
            bundle_id: 123,
            message: 'Bundle created',
            url: 'https://runtime.commercecloud.com/...',
            bundle_preview_url: null,
            warnings: [warning],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const result = await uploadBundle(client, 'my-project', testBundle);

      expect(result.warnings).to.deep.equal([warning]);
    });

    it('uploads bundle with deployment to target', async () => {
      let receivedBody: unknown;
      let targetSlug: string | undefined;

      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/:targetSlug/`, async ({request, params}) => {
          receivedBody = await request.json();
          targetSlug = params.targetSlug as string;
          return HttpResponse.json({
            bundle_id: 456,
            message: 'Bundle created and deployed',
            url: 'https://runtime.commercecloud.com/...',
            bundle_preview_url: 'https://preview.staging.mobify.com/...',
            warnings: [],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const result = await uploadBundle(client, 'my-project', testBundle, 'staging');

      expect(result.bundleId).to.equal(456);
      expect(result.projectSlug).to.equal('my-project');
      expect(result.deployed).to.be.true;
      expect(result.target).to.equal('staging');
      expect(result.warnings).to.deep.equal([]);
      expect(targetSlug).to.equal('staging');

      expect(receivedBody).to.deep.include({
        message: 'Test bundle',
        ssr_only: ['ssr.js'],
        ssr_shared: ['static/index.html', 'static/app.js'],
      });
    });

    it('returns warnings from the with-target deploy response', async () => {
      const warning = 'x86 support ends January 31, 2027. Switch to ARM in environment settings to avoid disruptions';

      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/:targetSlug/`, () => {
          return HttpResponse.json({
            bundle_id: 456,
            message: 'Bundle created and deployed',
            url: 'https://runtime.commercecloud.com/...',
            bundle_preview_url: null,
            warnings: [warning],
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const result = await uploadBundle(client, 'my-project', testBundle, 'staging');

      expect(result.warnings).to.deep.equal([warning]);
    });

    it('defaults warnings to [] when the response omits the field', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/:targetSlug/`, () => {
          return HttpResponse.json({
            bundle_id: 789,
            message: 'Bundle created and deployed',
            url: 'https://runtime.commercecloud.com/...',
            bundle_preview_url: null,
          });
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      const result = await uploadBundle(client, 'my-project', testBundle, 'staging');

      expect(result.warnings).to.deep.equal([]);
    });

    it('throws error on upload failure without target', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/`, () => {
          return HttpResponse.json({detail: 'Project not found'}, {status: 404});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      try {
        await uploadBundle(client, 'nonexistent', testBundle);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to push bundle');
      }
    });

    it('throws error on upload failure with target', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/builds/:targetSlug/`, () => {
          return HttpResponse.json({detail: 'Target not found'}, {status: 404});
        }),
      );

      const auth = new MockAuthStrategy();
      const client = createMrtClient({}, auth);

      try {
        await uploadBundle(client, 'my-project', testBundle, 'invalid-target');
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to push bundle');
      }
    });
  });

  describe('uploadBundleV2', () => {
    const testBundleV2: BundleV2 = {
      message: 'v2 message',
      archive: Buffer.from('fake-gzip-tar-bytes'),
      rootDir: 'bld',
      configPath: '.mrt/config.json',
      matchMode: 'strict',
      config: {
        ssrOnly: ['ssr.js'],
        ssrShared: ['static/**/*'],
        ssrParameters: {SSRFunctionNodeVersion: '22.x'},
      },
    };

    it('uploads a v2 bundle as multipart and maps the response', async () => {
      let received: {
        bundleName?: string;
        bundleSize?: number;
        message?: string;
        rootDir?: string;
        configPath?: string;
        matchMode?: string;
      } = {};

      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/v2/projects/:projectSlug/bundles/`, async ({request, params}) => {
          expect(params.projectSlug).to.equal('my-project');
          const form = await request.formData();
          const bundlePart = form.get('bundle');
          const isBlob = bundlePart instanceof Blob;
          received = {
            bundleName: isBlob ? (bundlePart as {name?: string}).name : undefined,
            bundleSize: isBlob ? (bundlePart as Blob).size : undefined,
            message: form.get('message') as string,
            rootDir: form.get('rootDir') as string,
            configPath: form.get('configPath') as string,
            matchMode: form.get('matchMode') as string,
          };
          return HttpResponse.json({id: 42, warnings: [], matches: {'ssr.js': 'ssrOnly'}}, {status: 201});
        }),
      );

      const client = createMrtClient({}, new MockAuthStrategy());
      const result = await uploadBundleV2(client, 'my-project', testBundleV2);

      expect(result.bundleId).to.equal(42);
      expect(result.projectSlug).to.equal('my-project');
      expect(result.message).to.equal('v2 message');
      expect(result.warnings).to.deep.equal([]);
      expect(result.matches).to.deep.equal({'ssr.js': 'ssrOnly'});

      // The multipart request carries the archive plus sibling text fields.
      expect(received.bundleName).to.equal('bundle.tar.gz');
      expect(received.bundleSize).to.be.greaterThan(0);
      expect(received.message).to.equal('v2 message');
      expect(received.rootDir).to.equal('bld');
      expect(received.configPath).to.equal('.mrt/config.json');
      expect(received.matchMode).to.equal('strict');
    });

    it('surfaces warnings and defaults matches to {} when omitted', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/v2/projects/:projectSlug/bundles/`, () => {
          return HttpResponse.json({id: 7, warnings: ['deprecated runtime']}, {status: 201});
        }),
      );

      const client = createMrtClient({}, new MockAuthStrategy());
      const result = await uploadBundleV2(client, 'my-project', testBundleV2);

      expect(result.bundleId).to.equal(7);
      expect(result.warnings).to.deep.equal(['deprecated runtime']);
      expect(result.matches).to.deep.equal({});
    });

    it('throws on upload failure', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/v2/projects/:projectSlug/bundles/`, () => {
          return HttpResponse.json({detail: 'bundle too large'}, {status: 400});
        }),
      );

      const client = createMrtClient({}, new MockAuthStrategy());
      try {
        await uploadBundleV2(client, 'my-project', testBundleV2);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to push bundle');
      }
    });

    it('includes the HTTP status in the error so a keyword-free 403 still triggers the auth hint', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/v2/projects/:projectSlug/bundles/`, () => {
          // A 403 whose body carries no auth keywords (e.g. an empty object).
          return HttpResponse.json({}, {status: 403});
        }),
      );

      const client = createMrtClient({}, new MockAuthStrategy());
      try {
        await uploadBundleV2(client, 'my-project', testBundleV2);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to push bundle');
        expect((error as Error).message).to.include('403');
      }
    });

    it('throws on a non-OK response with a completely empty body instead of reporting success', async () => {
      // For a non-OK response with no parseable body (e.g. a 403 with no
      // payload), openapi-fetch leaves `data` undefined and `error` falsy (the
      // empty string it falls back to when there's no JSON). Guarding on
      // `response.ok` must catch this so it does not fall through to the
      // "omitted a bundle id" path and look like a partial success.
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/v2/projects/:projectSlug/bundles/`, () => {
          return new HttpResponse(null, {status: 403});
        }),
      );

      const client = createMrtClient({}, new MockAuthStrategy());
      try {
        await uploadBundleV2(client, 'my-project', testBundleV2);
        expect.fail('Should have thrown');
      } catch (error) {
        const message = (error as Error).message;
        expect(message).to.include('Failed to push bundle (HTTP 403)');
        expect(message).to.include('empty response body');
        expect(message).to.not.include('omitted a bundle id');
      }
    });

    it('throws when the response omits a bundle id', async () => {
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/v2/projects/:projectSlug/bundles/`, () => {
          return HttpResponse.json({warnings: []}, {status: 201});
        }),
      );

      const client = createMrtClient({}, new MockAuthStrategy());
      try {
        await uploadBundleV2(client, 'my-project', testBundleV2);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('omitted a bundle id');
      }
    });
  });

  describe('listBundles', () => {
    it('lists bundles for a project', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/`, ({params}) => {
          expect(params.projectSlug).to.equal('my-project');
          return HttpResponse.json({
            count: 2,
            next: null,
            previous: null,
            results: [
              {
                id: 123,
                message: 'Bundle 1',
                created_at: '2025-01-01T00:00:00Z',
                created_by: 'user@example.com',
              },
              {
                id: 124,
                message: 'Bundle 2',
                created_at: '2025-01-02T00:00:00Z',
                created_by: 'user@example.com',
              },
            ],
          });
        }),
      );

      const auth = new MockAuthStrategy();

      const result = await listBundles({projectSlug: 'my-project'}, auth);

      expect(result.bundles).to.have.length(2);
      expect(result.bundles[0]).to.deep.include({id: 123, message: 'Bundle 1'});
      expect(result.bundles[1]).to.deep.include({id: 124, message: 'Bundle 2'});
      expect(result.count).to.equal(2);
    });

    it('passes pagination options', async () => {
      let queryParams: URLSearchParams | undefined;

      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/`, ({request}) => {
          queryParams = new URL(request.url).searchParams;
          return HttpResponse.json({count: 0, results: []});
        }),
      );

      const auth = new MockAuthStrategy();

      await listBundles({projectSlug: 'my-project', limit: 10, offset: 20}, auth);

      expect(queryParams?.get('limit')).to.equal('10');
      expect(queryParams?.get('offset')).to.equal('20');
    });

    it('returns empty array when no bundles', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/`, () => {
          return HttpResponse.json({
            count: 0,
            results: [],
          });
        }),
      );

      const auth = new MockAuthStrategy();

      const result = await listBundles({projectSlug: 'my-project'}, auth);

      expect(result.bundles).to.have.length(0);
      expect(result.count).to.equal(0);
    });

    it('throws error on API failure', async () => {
      server.use(
        http.get(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/`, () => {
          return HttpResponse.json({detail: 'Unauthorized'}, {status: 401});
        }),
      );

      const auth = new MockAuthStrategy();

      try {
        await listBundles({projectSlug: 'my-project'}, auth);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('Failed to list bundles');
      }
    });
  });

  describe('deleteBundle', () => {
    it('should DELETE the bundle and resolve on 202', async () => {
      let receivedPath: string | undefined;
      server.use(
        http.delete(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/:bundleId/`, ({params}) => {
          receivedPath = `${params.projectSlug}/${params.bundleId}`;
          return new HttpResponse(null, {status: 204});
        }),
      );

      const auth = new MockAuthStrategy();
      await deleteBundle({projectSlug: 'my-project', bundleId: 42}, auth);

      expect(receivedPath).to.equal('my-project/42');
    });

    it('should throw on error response', async () => {
      server.use(
        http.delete(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/:bundleId/`, () =>
          HttpResponse.json({message: 'Bundle in use'}, {status: 403}),
        ),
      );

      const auth = new MockAuthStrategy();
      try {
        await deleteBundle({projectSlug: 'my-project', bundleId: 42}, auth);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('delete bundle');
      }
    });
  });

  describe('bulkDeleteBundles', () => {
    it('should send all bundle IDs and return queued/rejected lists', async () => {
      let receivedBody: {bundle_ids?: number[]} | undefined;
      server.use(
        http.post(`${DEFAULT_BASE_URL}/api/projects/:projectSlug/bundles/bulk-delete/`, async ({request}) => {
          receivedBody = (await request.json()) as {bundle_ids?: number[]};
          return HttpResponse.json(
            {
              bundles_queued_for_cleanup: [1, 3],
              rejected_bundles: [{bundle_id: 2, errors: 'Bundle in use'}],
            },
            {status: 202},
          );
        }),
      );

      const auth = new MockAuthStrategy();
      const result = await bulkDeleteBundles({projectSlug: 'my-project', bundleIds: [1, 2, 3]}, auth);

      expect(receivedBody?.bundle_ids).to.deep.equal([1, 2, 3]);
      expect(result.queued).to.deep.equal([1, 3]);
      expect(result.rejected).to.have.lengthOf(1);
      expect(result.rejected[0]).to.deep.equal({bundleId: 2, reason: 'Bundle in use'});
    });
  });

  describe('listBundlesScapi', () => {
    it('lists and normalizes SCAPI bundles', async () => {
      server.use(
        http.get(SCAPI_BUNDLES, ({request, params}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          expect(params.organizationId).to.equal(ORGANIZATION_ID);
          expect(params.storefrontId).to.equal(STOREFRONT_ID);
          return HttpResponse.json({
            limit: 25,
            offset: 0,
            total: 1,
            data: [
              {
                bundleId: 170,
                description: 'my bundle',
                status: 'ok',
                createdBy: 'user@example.com',
                creationDate: '2026-01-01T00:00:00Z',
              },
            ],
          });
        }),
      );

      const result = await listBundlesScapi(scapiConn(), {storefrontId: STOREFRONT_ID});

      expect(result.count).to.equal(1);
      expect(result.bundles).to.have.length(1);
      expect(result.bundles[0]).to.deep.include({
        id: 170,
        message: 'my bundle',
        status: 'ok',
        user: 'user@example.com',
        created: '2026-01-01T00:00:00Z',
        backend: 'scapi',
      });
    });

    it('forwards limit/offset as SCAPI pagination query params and reports the full total', async () => {
      let captured: URLSearchParams | undefined;
      server.use(
        http.get(SCAPI_BUNDLES, ({request}) => {
          captured = new URL(request.url).searchParams;
          return HttpResponse.json({limit: 50, offset: 100, total: 250, data: []});
        }),
      );

      const result = await listBundlesScapi(scapiConn(), {storefrontId: STOREFRONT_ID, limit: 50, offset: 100});

      expect(captured?.get('limit')).to.equal('50');
      expect(captured?.get('offset')).to.equal('100');
      expect(result.count).to.equal(250);
    });

    it('throws a ScapiRequestError carrying the status on failure', async () => {
      server.use(
        http.get(SCAPI_BUNDLES, () =>
          HttpResponse.json(
            {title: 'Forbidden', type: 'about:blank', detail: 'nope'},
            {status: 403, headers: {'Content-Type': 'application/problem+json'}},
          ),
        ),
      );

      let threw: unknown;
      try {
        await listBundlesScapi(scapiConn(), {storefrontId: STOREFRONT_ID});
      } catch (error) {
        threw = error;
      }
      expect(threw).to.be.instanceOf(ScapiRequestError);
      expect((threw as ScapiRequestError).status).to.equal(403);
    });
  });

  describe('uploadBundleScapi', () => {
    const testBundleV2: BundleV2 = {
      message: 'v2 message',
      archive: Buffer.from('fake-gzip-tar-bytes'),
      rootDir: 'bld',
      configPath: '.mrt/config.json',
      matchMode: 'strict',
      config: {
        ssrOnly: ['ssr.js'],
        ssrShared: ['static/**/*'],
        ssrParameters: {SSRFunctionNodeVersion: '22.x'},
      },
    };

    // The SCAPI multipart payload must mirror the legacy uploadBundleV2 shape
    // exactly (same field names/values) so the two backends stay in sync.
    it('uploads a v2 bundle as multipart mirroring the legacy field shape and maps the response', async () => {
      let received: {
        bundleName?: string;
        bundleSize?: number;
        message?: string;
        rootDir?: string;
        configPath?: string;
        matchMode?: string;
      } = {};
      server.use(
        http.post(SCAPI_BUNDLES, async ({request, params}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          expect(params.organizationId).to.equal(ORGANIZATION_ID);
          expect(params.storefrontId).to.equal(STOREFRONT_ID);
          const form = await request.formData();
          const bundlePart = form.get('bundle');
          const isBlob = bundlePart instanceof Blob;
          received = {
            bundleName: isBlob ? (bundlePart as {name?: string}).name : undefined,
            bundleSize: isBlob ? (bundlePart as Blob).size : undefined,
            message: form.get('message') as string,
            rootDir: form.get('rootDir') as string,
            configPath: form.get('configPath') as string,
            matchMode: form.get('matchMode') as string,
          };
          return HttpResponse.json({bundleId: 42, warnings: [], matches: {ssrOnly: ['ssr.js']}}, {status: 201});
        }),
      );

      const result = await uploadBundleScapi(scapiConn(), {storefrontId: STOREFRONT_ID, bundle: testBundleV2});

      expect(result.bundleId).to.equal(42);
      expect(result.warnings).to.deep.equal([]);
      expect(result.matches).to.deep.equal({ssrOnly: ['ssr.js']});
      expect(result.raw).to.deep.equal({bundleId: 42, warnings: [], matches: {ssrOnly: ['ssr.js']}});

      // Payload parity with the legacy v2 upload: same field names + values.
      expect(received.bundleName).to.equal('bundle.tar.gz');
      expect(received.bundleSize).to.be.greaterThan(0);
      expect(received.message).to.equal('v2 message');
      expect(received.rootDir).to.equal('bld');
      expect(received.configPath).to.equal('.mrt/config.json');
      expect(received.matchMode).to.equal('strict');
    });

    it('accepts a gzip-compressed archive with the same multipart shape', async () => {
      // A gzip tar starts with the gzip magic bytes (0x1f 0x8b); the wrapper
      // treats the archive as opaque bytes, so both uncompressed and gzip work.
      const gzipBundle: BundleV2 = {...testBundleV2, archive: Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x01, 0x02])};
      let bundleSize = 0;

      server.use(
        http.post(SCAPI_BUNDLES, async ({request}) => {
          const form = await request.formData();
          bundleSize = (form.get('bundle') as Blob).size;
          return HttpResponse.json({bundleId: 43}, {status: 201});
        }),
      );

      const result = await uploadBundleScapi(scapiConn(), {storefrontId: STOREFRONT_ID, bundle: gzipBundle});

      expect(result.bundleId).to.equal(43);
      expect(bundleSize).to.equal(gzipBundle.archive.length);
    });

    it('defaults warnings and matches when omitted', async () => {
      server.use(http.post(SCAPI_BUNDLES, () => HttpResponse.json({bundleId: 7}, {status: 201})));

      const result = await uploadBundleScapi(scapiConn(), {storefrontId: STOREFRONT_ID, bundle: testBundleV2});

      expect(result.bundleId).to.equal(7);
      expect(result.warnings).to.deep.equal([]);
      expect(result.matches).to.deep.equal({});
    });

    it('throws when the response omits a bundle id', async () => {
      server.use(http.post(SCAPI_BUNDLES, () => HttpResponse.json({warnings: []}, {status: 201})));

      let threw: unknown;
      try {
        await uploadBundleScapi(scapiConn(), {storefrontId: STOREFRONT_ID, bundle: testBundleV2});
      } catch (error) {
        threw = error;
      }
      expect((threw as Error).message).to.include('omitted a bundle id');
    });

    it('throws a ScapiRequestError carrying the status on failure', async () => {
      server.use(
        http.post(SCAPI_BUNDLES, () =>
          HttpResponse.json(
            {title: 'Forbidden', type: 'about:blank', detail: 'nope'},
            {status: 403, headers: {'Content-Type': 'application/problem+json'}},
          ),
        ),
      );

      let threw: unknown;
      try {
        await uploadBundleScapi(scapiConn(), {storefrontId: STOREFRONT_ID, bundle: testBundleV2});
      } catch (error) {
        threw = error;
      }
      expect(threw).to.be.instanceOf(ScapiRequestError);
      expect((threw as ScapiRequestError).status).to.equal(403);
    });
  });

  describe('listMrtBundles (backend-aware)', () => {
    it('routes to SCAPI when preference is scapi and surfaces the raw response', async () => {
      const raw = {limit: 25, offset: 0, total: 1, data: [{bundleId: 170, description: 'scapi bundle', status: 'ok'}]};
      server.use(http.get(SCAPI_BUNDLES, () => HttpResponse.json(raw)));

      const result = await listMrtBundles({
        preference: 'scapi',
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
      });

      expect(result.backend).to.equal('scapi');
      expect(result.count).to.equal(1);
      expect(result.bundles[0]).to.deep.include({id: 170, message: 'scapi bundle', backend: 'scapi'});
      expect(result.raw).to.deep.equal(raw);
    });

    it('routes to legacy when preference is legacy and keeps the legacy raw shape', async () => {
      server.use(
        http.get(LEGACY_BUNDLES, () =>
          HttpResponse.json({
            count: 1,
            next: null,
            previous: null,
            results: [
              {id: 5, message: 'legacy bundle', status: 1, user: 'u@example.com', created_at: '2026-01-01T00:00:00Z'},
            ],
          }),
        ),
      );

      const result = await listMrtBundles({
        preference: 'legacy',
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
      });

      expect(result.backend).to.equal('legacy');
      expect(result.bundles[0]).to.deep.include({id: 5, message: 'legacy bundle', status: 1, backend: 'legacy'});
      expect(result.raw).to.deep.include({count: 1, next: null, previous: null});
    });

    it('auto falls back from SCAPI to legacy on a safe status', async () => {
      server.use(
        http.get(SCAPI_BUNDLES, () =>
          HttpResponse.json(
            {title: 'Not Found', type: 'about:blank', detail: 'no storefront'},
            {status: 404, headers: {'Content-Type': 'application/problem+json'}},
          ),
        ),
        http.get(LEGACY_BUNDLES, () => HttpResponse.json({count: 0, next: null, previous: null, results: []})),
      );

      const fallbacks: string[] = [];
      const result = await listMrtBundles({
        preference: 'auto',
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        onFallback: (reason) => fallbacks.push(reason),
      });

      expect(result.backend).to.equal('legacy');
      expect(fallbacks).to.have.length(1);
    });

    it('does NOT fall back on an unsafe SCAPI status (409)', async () => {
      server.use(
        http.get(SCAPI_BUNDLES, () =>
          HttpResponse.json(
            {title: 'Conflict', type: 'about:blank', detail: 'conflict'},
            {status: 409, headers: {'Content-Type': 'application/problem+json'}},
          ),
        ),
      );

      let threw: unknown;
      try {
        await listMrtBundles({
          preference: 'auto',
          scapiConnection: scapiConn(),
          legacyAuth: new MockAuthStrategy(),
          projectSlug: STOREFRONT_ID,
        });
      } catch (error) {
        threw = error;
      }
      expect(threw).to.be.instanceOf(ScapiRequestError);
      expect((threw as ScapiRequestError).status).to.equal(409);
    });
  });

  describe('pushMrtBundle (backend-aware local build)', () => {
    let tempDir: string;
    let buildDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-push-'));
      buildDir = path.join(tempDir, 'build');
      fs.mkdirSync(path.join(buildDir, 'static'), {recursive: true});
      fs.writeFileSync(path.join(buildDir, 'ssr.js'), 'console.log("ssr");');
      fs.writeFileSync(path.join(buildDir, 'static', 'index.html'), '<html></html>');
    });

    afterEach(() => {
      if (tempDir) fs.rmSync(tempDir, {recursive: true, force: true});
    });

    function pushOptions(overrides: Record<string, unknown> = {}) {
      return {
        preference: 'scapi' as const,
        scapiConnection: scapiConn(),
        legacyAuth: new MockAuthStrategy(),
        projectSlug: STOREFRONT_ID,
        buildDirectory: buildDir,
        ssrOnly: ['ssr.js'],
        ssrShared: ['static/**/*'],
        message: 'local build',
        ...overrides,
      };
    }

    it('uploads then deploys over SCAPI and surfaces both native responses under raw', async () => {
      let deployBody: unknown;
      server.use(
        http.post(SCAPI_BUNDLES, () => HttpResponse.json({bundleId: 170, warnings: []}, {status: 201})),
        http.post(SCAPI_DEPLOYMENTS, async ({request, params}) => {
          expect(params.environmentId).to.equal('production');
          deployBody = await request.json();
          return HttpResponse.json({deploymentId: 'dep-uuid', status: 'queued'}, {status: 201});
        }),
      );

      const result = await pushMrtBundle(pushOptions({targetSlug: 'production'}));

      expect(result.backend).to.equal('scapi');
      expect(result.bundleId).to.equal(170);
      expect(result.deployed).to.be.true;
      expect(result.deploymentId).to.equal('dep-uuid');
      expect(result.status).to.equal('queued');
      expect(deployBody).to.deep.equal({bundleId: 170});
      expect(result.raw).to.deep.equal({
        bundle: {bundleId: 170, warnings: []},
        deployment: {deploymentId: 'dep-uuid', status: 'queued'},
      });
    });

    it('uploads only (no target) and does not call the deployment endpoint', async () => {
      let deployCalled = false;
      server.use(
        http.post(SCAPI_BUNDLES, () => HttpResponse.json({bundleId: 42, warnings: ['heads up']}, {status: 201})),
        http.post(SCAPI_DEPLOYMENTS, () => {
          deployCalled = true;
          return HttpResponse.json({deploymentId: 'x'}, {status: 201});
        }),
      );

      const result = await pushMrtBundle(pushOptions());

      expect(result.backend).to.equal('scapi');
      expect(result.bundleId).to.equal(42);
      expect(result.deployed).to.be.false;
      expect(result.deploymentId).to.be.undefined;
      expect(result.warnings).to.deep.equal(['heads up']);
      expect(result.raw).to.deep.equal({bundle: {bundleId: 42, warnings: ['heads up']}});
      expect(deployCalled).to.be.false;
    });

    it('auto falls back to legacy when the SCAPI upload fails with a safe status', async () => {
      let legacyBuildBody: unknown;
      server.use(
        http.post(SCAPI_BUNDLES, () =>
          HttpResponse.json(
            {title: 'Forbidden', type: 'about:blank', detail: 'nope'},
            {status: 403, headers: {'Content-Type': 'application/problem+json'}},
          ),
        ),
        http.post(LEGACY_BUILDS_TARGET, async ({request}) => {
          legacyBuildBody = await request.json();
          return HttpResponse.json({bundle_id: 999, message: 'ok', warnings: []});
        }),
      );

      const fallbacks: string[] = [];
      const result = await pushMrtBundle(
        pushOptions({preference: 'auto', targetSlug: 'production', onFallback: (r: string) => fallbacks.push(r)}),
      );

      expect(result.backend).to.equal('legacy');
      expect(result.bundleId).to.equal(999);
      expect(result.deployed).to.be.true;
      expect(fallbacks).to.have.length(1);
      expect(legacyBuildBody).to.have.property('message', 'local build');
    });

    it('does NOT fall back when the post-upload deploy fails (avoids a double upload)', async () => {
      let legacyCalled = false;
      let uploadCount = 0;
      server.use(
        http.post(SCAPI_BUNDLES, () => {
          uploadCount += 1;
          return HttpResponse.json({bundleId: 55, warnings: []}, {status: 201});
        }),
        http.post(SCAPI_DEPLOYMENTS, () =>
          HttpResponse.json(
            {title: 'Conflict', type: 'about:blank', detail: 'a deployment is already in progress'},
            {status: 409, headers: {'Content-Type': 'application/problem+json'}},
          ),
        ),
        http.post(LEGACY_BUILDS_TARGET, () => {
          legacyCalled = true;
          return HttpResponse.json({bundle_id: 1, message: 'ok', warnings: []});
        }),
      );

      let threw: unknown;
      try {
        await pushMrtBundle(pushOptions({preference: 'auto', targetSlug: 'production'}));
      } catch (error) {
        threw = error;
      }

      // The upload succeeded once; the deploy failure is re-thrown as a plain
      // Error (not a ScapiRequestError), so auto does not retry on legacy.
      expect(threw).to.be.instanceOf(Error);
      expect(threw).to.not.be.instanceOf(ScapiRequestError);
      expect((threw as Error).message).to.include('uploaded successfully but the deployment to production failed');
      expect(uploadCount).to.equal(1);
      expect(legacyCalled).to.be.false;
    });

    it('routes to legacy when preference is legacy (v1 combined upload+deploy)', async () => {
      server.use(
        http.post(LEGACY_BUILDS_TARGET, () =>
          HttpResponse.json({bundle_id: 321, message: 'legacy push', warnings: []}),
        ),
      );

      const result = await pushMrtBundle(pushOptions({preference: 'legacy', targetSlug: 'production'}));

      expect(result.backend).to.equal('legacy');
      expect(result.bundleId).to.equal(321);
      expect(result.deployed).to.be.true;
      expect(result.raw).to.deep.include({bundleId: 321, projectSlug: STOREFRONT_ID, deployed: true});
    });
  });
});
