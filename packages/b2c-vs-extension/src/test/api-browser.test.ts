/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import type {SchemaEntry} from '../api-browser/api-browser-tree-provider.js';
import {prefillParameters, stripParameterExamples} from '../api-browser/prefill.js';
import {detectApiType, injectCustomApiOrgPathPrefix, isCommerceCloudUrl} from '../api-browser/swagger-webview.js';
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

suite('stripParameterExamples', () => {
  test('removes parameter examples so Swagger UI leaves optional fields empty', () => {
    const inventoryIds: Record<string, unknown> = {
      name: 'inventoryIds',
      in: 'query',
      schema: {type: 'array', items: {type: 'string'}, maxItems: 5, example: ['Site1InventoryList']},
      example: 'Site1InventoryList,Site2InventoryList',
    };
    const usid: Record<string, unknown> = {
      name: 'sfdc_usid',
      in: 'header',
      examples: {Usid: {value: '550e8400-e29b-41d4-a716-446655440000'}},
    };
    const shared: Record<string, unknown> = {name: 'locale', in: 'query', example: 'en-US'};
    const requestBody = {content: {'application/json': {example: {quantity: 1}}}};
    const spec = {
      components: {parameters: {locale: shared}},
      paths: {'/products': {parameters: [usid], get: {parameters: [inventoryIds]}, post: {requestBody}}},
    };
    stripParameterExamples(spec);
    assert.ok(!('example' in inventoryIds));
    assert.deepStrictEqual(inventoryIds.schema, {type: 'array', items: {type: 'string'}, maxItems: 5});
    assert.ok(!('examples' in usid));
    assert.ok(!('example' in shared));
    assert.deepStrictEqual(requestBody.content['application/json'].example, {quantity: 1});
  });

  test('drops examples inherited from referenced component schemas without changing them', () => {
    const selectSchema = {type: 'string', example: '(name,id)'};
    const select: Record<string, unknown> = {
      name: 'select',
      in: 'query',
      schema: {$ref: '#/components/schemas/Select'},
    };
    const ids: Record<string, unknown> = {
      name: 'ids',
      in: 'query',
      schema: {type: 'array', items: {allOf: [{$ref: '#/components/schemas/ProductId'}]}},
    };
    const spec = {
      components: {
        schemas: {Select: selectSchema, ProductId: {type: 'string', maxLength: 100, example: 'apple-ipod'}},
      },
      paths: {'/products': {get: {parameters: [select, ids]}}},
    };
    stripParameterExamples(spec);
    assert.deepStrictEqual(select.schema, {type: 'string'});
    assert.deepStrictEqual(ids.schema, {type: 'array', items: {allOf: [{type: 'string', maxLength: 100}]}});
    assert.strictEqual(selectSchema.example, '(name,id)');
  });

  test('keeps configured prefill values when applied before prefillParameters', () => {
    const siteId: Record<string, unknown> = {name: 'siteId', in: 'query', example: 'RefArch'};
    const spec = {paths: {'/products': {get: {parameters: [siteId]}}}};
    stripParameterExamples(spec);
    prefillParameters(spec, {siteId: 'MarketStreet'});
    assert.strictEqual(siteId.example, 'MarketStreet');
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

suite('isCommerceCloudUrl', () => {
  test('allows HTTPS Commerce Cloud API hosts', () => {
    assert.strictEqual(isCommerceCloudUrl('https://kv7kzm78.api.commercecloud.salesforce.com/product/v1/x'), true);
  });

  test('rejects other hosts that mention the Commerce Cloud domain', () => {
    assert.strictEqual(isCommerceCloudUrl('https://example.com/?commercecloud.salesforce.com'), false);
    assert.strictEqual(isCommerceCloudUrl('https://commercecloud.salesforce.com.example.com/'), false);
    assert.strictEqual(isCommerceCloudUrl('https://example.com#.commercecloud.salesforce.com'), false);
  });

  test('rejects non-HTTPS and unparseable URLs', () => {
    assert.strictEqual(isCommerceCloudUrl('http://kv7kzm78.api.commercecloud.salesforce.com/'), false);
    assert.strictEqual(isCommerceCloudUrl('not a url'), false);
  });
});
