/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import type {SchemaEntry} from '../api-browser/api-browser-tree-provider.js';
import {detectApiType, injectCustomApiOrgPathPrefix} from '../api-browser/swagger-webview.js';

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
