/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import type {SchemaEntry} from '../api-browser/api-browser-tree-provider.js';
import {prefillParameters} from '../api-browser/prefill.js';
import {detectApiType, injectCustomApiOrgPathPrefix} from '../api-browser/swagger-webview.js';
import {
  API_BROWSER_EXPAND,
  OFFLINE_TOKEN_STATUS,
  OfflineWarningGate,
  cloneBundledSpec,
  isLiveSource,
  toSchemaEntries,
} from '../api-browser/offline.js';
import {resolveApiBrowserTenantId} from '../api-browser/tenant.js';
import {fetchScapiSchemaWithFallback, listScapiSchemasWithFallback} from '@salesforce/b2c-tooling-sdk/scapi';

function entry(apiFamily: string, apiName: string): SchemaEntry {
  return {apiFamily, apiName, apiVersion: 'v1'};
}

function specWithGlobalSecurity(schemes: Record<string, string[]>[]): Record<string, unknown> {
  return {security: schemes, paths: {}};
}

function specWithOpSecurity(perOp: Record<string, string[]>[]): Record<string, unknown> {
  return {
    paths: {
      '/foo': {
        get: {security: perOp, responses: {'200': {description: 'ok'}}},
      },
    },
  };
}

suite('detectApiType', () => {
  test('returns Shopper for ShopperToken-only spec', () => {
    const spec = specWithGlobalSecurity([{ShopperToken: ['c_loyalty']}]);
    assert.strictEqual(detectApiType(spec, entry('custom', 'loyalty')), 'Shopper');
  });

  test('returns Admin for AmOAuth2-only spec', () => {
    const spec = specWithGlobalSecurity([{AmOAuth2: ['c_agentforce']}]);
    assert.strictEqual(detectApiType(spec, entry('custom', 'agentforce')), 'Admin');
  });

  test('returns Admin for BearerToken (SLAS Admin API)', () => {
    const spec = specWithOpSecurity([{BearerToken: []}]);
    assert.strictEqual(detectApiType(spec, entry('shopper', 'auth-admin')), 'Admin');
  });

  test('Shopper for shopper-named spec mixing AmOAuth2 + ShopperToken', () => {
    const spec = specWithOpSecurity([{ShopperToken: []}, {AmOAuth2: []}]);
    assert.strictEqual(detectApiType(spec, entry('checkout', 'shopper-baskets')), 'Shopper');
  });

  test('Admin for non-shopper-named spec mixing AmOAuth2 + ShopperToken', () => {
    const spec = specWithOpSecurity([{AmOAuth2: []}, {ShopperToken: []}]);
    assert.strictEqual(detectApiType(spec, entry('checkout', 'orders')), 'Admin');
  });

  test('per-op security takes precedence over global', () => {
    const spec: Record<string, unknown> = {
      security: [{AmOAuth2: ['c_admin']}],
      paths: {
        '/foo': {get: {security: [{ShopperToken: ['c_x']}], responses: {'200': {description: 'ok'}}}},
      },
    };
    assert.strictEqual(detectApiType(spec, entry('custom', 'thing')), 'Shopper');
  });

  test('falls back to apiName/family heuristic when no recognized scheme', () => {
    const spec = specWithGlobalSecurity([{UnknownScheme: []}]);
    assert.strictEqual(detectApiType(spec, entry('product', 'shopper-products')), 'Shopper');
    assert.strictEqual(detectApiType(spec, entry('product', 'products')), 'Admin');
    assert.strictEqual(detectApiType(spec, entry('shopper', 'auth')), 'Shopper');
  });

  test('respects info.x-api-type when present', () => {
    const spec: Record<string, unknown> = {
      info: {'x-api-type': 'Shopper'},
      security: [{AmOAuth2: []}],
      paths: {},
    };
    assert.strictEqual(detectApiType(spec, entry('custom', 'override')), 'Shopper');
  });
});

suite('injectCustomApiOrgPathPrefix', () => {
  test('rewrites path keys with /organizations/{organizationId} prefix', () => {
    const spec: Record<string, unknown> = {
      paths: {
        '/customers/{customerId}/loyalty': {get: {responses: {'200': {description: 'ok'}}}},
        '/groups/{ids}': {get: {responses: {'200': {description: 'ok'}}}},
      },
    };
    injectCustomApiOrgPathPrefix(spec);
    const paths = spec.paths as Record<string, unknown>;
    assert.deepStrictEqual(Object.keys(paths).sort(), [
      '/organizations/{organizationId}/customers/{customerId}/loyalty',
      '/organizations/{organizationId}/groups/{ids}',
    ]);
  });

  test('adds organizationId path parameter when missing', () => {
    const spec: Record<string, unknown> = {
      paths: {'/foo': {get: {responses: {'200': {description: 'ok'}}}}},
    };
    injectCustomApiOrgPathPrefix(spec);
    const item = (spec.paths as Record<string, Record<string, unknown>>)['/organizations/{organizationId}/foo'];
    const params = item.parameters as Array<Record<string, unknown>>;
    const orgParam = params.find((p) => p.name === 'organizationId');
    assert.ok(orgParam, 'organizationId parameter should be added');
    assert.strictEqual(orgParam.in, 'path');
    assert.strictEqual(orgParam.required, true);
  });

  test('does not duplicate organizationId parameter when already present', () => {
    const existing = {name: 'organizationId', in: 'path', required: true, schema: {type: 'string'}};
    const spec: Record<string, unknown> = {
      paths: {
        '/foo': {
          parameters: [existing],
          get: {responses: {'200': {description: 'ok'}}},
        },
      },
    };
    injectCustomApiOrgPathPrefix(spec);
    const item = (spec.paths as Record<string, Record<string, unknown>>)['/organizations/{organizationId}/foo'];
    const params = item.parameters as Array<Record<string, unknown>>;
    const orgParams = params.filter((p) => p.name === 'organizationId');
    assert.strictEqual(orgParams.length, 1);
  });

  test('is a no-op when spec has no paths', () => {
    const spec: Record<string, unknown> = {};
    injectCustomApiOrgPathPrefix(spec);
    assert.strictEqual(spec.paths, undefined);
  });
});

suite('prefillParameters', () => {
  test('replaces contract examples so Swagger UI fills the configured values', () => {
    const organizationId: Record<string, unknown> = {
      name: 'organizationId',
      in: 'path',
      schema: {$ref: '#/components/schemas/OrganizationId'},
      example: 'f_ecom_zzxy_prd',
    };
    const siteId: Record<string, unknown> = {
      name: 'siteId',
      in: 'query',
      schema: {type: 'string'},
      examples: {SiteId: {value: 'RefArch'}},
    };
    const inline: Record<string, unknown> = {name: 'organizationId', in: 'path', example: 'f_ecom_zzxy_prd'};
    const other: Record<string, unknown> = {name: 'productId', in: 'path', example: 'apple-ipod'};
    const spec = {
      components: {parameters: {organizationId, siteId}},
      paths: {'/products/{productId}': {get: {parameters: [inline, other]}}},
    };
    prefillParameters(spec, {organizationId: 'f_ecom_zzpq_019', siteId: 'MarketStreet'});
    assert.deepStrictEqual(organizationId.schema, {type: 'string', default: 'f_ecom_zzpq_019'});
    assert.strictEqual(organizationId.example, 'f_ecom_zzpq_019');
    assert.strictEqual(siteId.example, 'MarketStreet');
    assert.ok(!('examples' in siteId));
    assert.strictEqual(inline.example, 'f_ecom_zzpq_019');
    assert.strictEqual(other.example, 'apple-ipod');
  });
});

suite('resolveApiBrowserTenantId', () => {
  test('prefers and normalizes the configured tenant ID', () => {
    assert.strictEqual(
      resolveApiBrowserTenantId({tenantId: 'f_ecom_zzxy-prd', hostname: 'wrong-001.demandware.net'}),
      'zzxy_prd',
    );
  });

  test('derives the tenant ID from hostname only when configuration is absent', () => {
    assert.strictEqual(resolveApiBrowserTenantId({hostname: 'zzpq-013.dx.commercecloud.salesforce.com'}), 'zzpq_013');
  });

  test('returns an empty value when neither coordinate is available', () => {
    assert.strictEqual(resolveApiBrowserTenantId({}), '');
  });
});

suite('API Browser offline fallback', () => {
  test('always requests the full expansion', () => {
    assert.strictEqual(API_BROWSER_EXPAND, 'all');
  });

  test('lists the bundled corpus when the live listing fails', async () => {
    const result = await listScapiSchemasWithFallback({}, async () => {
      throw new Error('OAuth credentials are not configured');
    });
    assert.strictEqual(result.source, 'bundled');
    assert.ok(result.schemas.length > 0);
    assert.match(result.warning ?? '', /OAuth credentials are not configured/);
    const entries = toSchemaEntries(result.schemas);
    assert.ok(entries.some((e) => e.apiName === 'shopper-baskets' && e.apiFamily === 'checkout'));
    assert.ok(entries.every((e) => e.apiFamily && e.apiName && e.apiVersion));
  });

  test('uses a bundled contract with prose when the live fetch fails', async () => {
    const result = await fetchScapiSchemaWithFallback(
      {apiFamily: 'checkout', apiName: 'shopper-baskets', apiVersion: 'v2'},
      async () => {
        throw new Error('HTTP 403');
      },
    );
    assert.strictEqual(result.source, 'bundled');
    assert.strictEqual(isLiveSource(result.source), false);
    assert.match(result.warning ?? '', /HTTP 403/);
    const paths = result.schema.paths as Record<string, Record<string, {summary?: string}>>;
    const summaries = Object.values(paths).flatMap((item) => Object.values(item).map((op) => op.summary));
    assert.ok(summaries.some(Boolean), 'bundled contract should carry operation summaries');
  });

  test('does not fall back for custom APIs', async () => {
    await assert.rejects(
      fetchScapiSchemaWithFallback({apiFamily: 'custom', apiName: 'loyalty', apiVersion: 'v1'}, async () => {
        throw new Error('no access');
      }),
      /no access/,
    );
  });

  test('keeps a live result live', async () => {
    const result = await fetchScapiSchemaWithFallback(
      {apiFamily: 'checkout', apiName: 'shopper-baskets', apiVersion: 'v2'},
      async () => ({openapi: '3.0.0', paths: {}}),
    );
    assert.strictEqual(result.source, 'live');
    assert.strictEqual(result.warning, undefined);
  });

  test('cloneBundledSpec isolates mutations from the shared bundled contract', async () => {
    const result = await fetchScapiSchemaWithFallback(
      {apiFamily: 'checkout', apiName: 'shopper-baskets', apiVersion: 'v2'},
      async () => {
        throw new Error('offline');
      },
    );
    const copy = cloneBundledSpec(result.schema);
    copy.servers = [{url: 'https://example.invalid'}];
    assert.notDeepStrictEqual(result.schema.servers, copy.servers);
  });

  test('warns once per outage and re-arms after a live success', () => {
    const gate = new OfflineWarningGate();
    assert.strictEqual(gate.shouldWarn('bundled'), true);
    assert.strictEqual(gate.shouldWarn('bundled'), false);
    assert.strictEqual(gate.shouldWarn('live'), false);
    assert.strictEqual(gate.shouldWarn('bundled'), true);
  });

  test('offline token status says Try it out is disabled', () => {
    assert.match(OFFLINE_TOKEN_STATUS, /Offline/);
    assert.match(OFFLINE_TOKEN_STATUS, /Try it out disabled/);
  });
});
