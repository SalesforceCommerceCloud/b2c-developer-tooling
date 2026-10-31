/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import type {MetricsDataResponse} from '../../../src/clients/metrics.js';
import {parseSeriesTags, enrichMetricsTags} from '../../../src/operations/metrics/tags.js';

const CTX = {tenantId: 'f_ecom_bdpx_prd'};

describe('parseSeriesTags', () => {
  describe('request-derived identity tags', () => {
    it('derives realm and environment from a prefixed organization id', () => {
      const tags = parseSeriesTags({category: 'scapi', metricId: 'totalCalls', seriesId: 'bdpx.product', context: CTX});
      expect(tags.realm).to.equal('bdpx');
      expect(tags.environment).to.equal('prd');
    });

    it('derives realm and environment from a bare tenant id', () => {
      const tags = parseSeriesTags({
        category: 'scapi',
        metricId: 'totalCalls',
        seriesId: 'bdpx.product',
        context: {tenantId: 'bdpx_prd'},
      });
      expect(tags.realm).to.equal('bdpx');
      expect(tags.environment).to.equal('prd');
    });

    it('handles a realm with no environment segment (no underscore)', () => {
      const tags = parseSeriesTags({
        category: 'overall',
        metricId: 'requests',
        seriesId: 'acme Requests',
        context: {tenantId: 'acme'},
      });
      expect(tags.realm).to.equal('acme');
      expect(tags.environment).to.equal(undefined);
    });
  });

  describe('scapi', () => {
    it('extracts apiFamily from a dot-joined family series', () => {
      const tags = parseSeriesTags({category: 'scapi', metricId: 'totalCalls', seriesId: 'bdpx.product', context: CTX});
      expect(tags.apiFamily).to.equal('product');
    });

    it('extracts statusClass when the responseCount series is an HTTP class', () => {
      const tags = parseSeriesTags({category: 'scapi', metricId: 'responseCount', seriesId: 'bdpx 4xx', context: CTX});
      expect(tags.statusClass).to.equal('4xx');
      expect(tags.apiFamily).to.equal(undefined);
    });

    it('extracts the aggregation for the latency rollup (not an apiFamily)', () => {
      const tags = parseSeriesTags({
        category: 'scapi',
        metricId: 'requestLatency',
        seriesId: 'bdpx Average overall latency',
        context: CTX,
      });
      expect(tags.aggregation).to.equal('overall');
      expect(tags.apiFamily).to.equal(undefined);
    });

    it('splits apiFamily and cacheStatus for cacheHitRate', () => {
      const tags = parseSeriesTags({
        category: 'scapi',
        metricId: 'cacheHitRate',
        seriesId: 'bdpx.product HIT',
        context: CTX,
      });
      expect(tags.apiFamily).to.equal('product');
      expect(tags.cacheStatus).to.equal('HIT');
    });
  });

  describe('ecdn', () => {
    it('extracts statusClass (before the realm) and host for successAndError', () => {
      const tags = parseSeriesTags({
        category: 'ecdn',
        metricId: 'successAndError',
        seriesId: '2xx bdpx.bdpx-prod_cc-bm_net',
        context: CTX,
      });
      expect(tags.statusClass).to.equal('2xx');
      expect(tags.host).to.equal('bdpx-prod_cc-bm_net');
    });

    it('extracts just the host for the other eCDN metrics', () => {
      const tags = parseSeriesTags({
        category: 'ecdn',
        metricId: 'totalRequests',
        seriesId: 'bdpx.bdpx-prod_cc-bm_net',
        context: CTX,
      });
      expect(tags.host).to.equal('bdpx-prod_cc-bm_net');
      expect(tags.statusClass).to.equal(undefined);
    });
  });

  describe('third-party', () => {
    it('extracts a dotted host for callsCount', () => {
      const tags = parseSeriesTags({
        category: 'third-party',
        metricId: 'callsCount',
        seriesId: 'bdpx.login.salesforce.com',
        context: CTX,
      });
      expect(tags.host).to.equal('login.salesforce.com');
    });

    it('extracts host and exceptionType for remoteExceptions (unparseable from the string alone)', () => {
      const tags = parseSeriesTags({
        category: 'third-party',
        metricId: 'remoteExceptions',
        seriesId: 'bdpx.abcd1234.api.commercecloud.salesforce.com.socketReadTimeout',
        context: CTX,
      });
      expect(tags.host).to.equal('abcd1234.api.commercecloud.salesforce.com');
      expect(tags.exceptionType).to.equal('socketReadTimeout');
    });
  });

  describe('controller / ocapi', () => {
    it('extracts the controller name for any controller metric (wildcard rule)', () => {
      const tags = parseSeriesTags({
        category: 'controller',
        metricId: 'callsMean',
        seriesId: 'bdpx.Checkout-Begin',
        context: CTX,
      });
      expect(tags.controller).to.equal('Checkout-Begin');
    });

    it('extracts ocapiCategory for ocapi call metrics', () => {
      const tags = parseSeriesTags({category: 'ocapi', metricId: 'totalCalls', seriesId: 'bdpx.shop', context: CTX});
      expect(tags.ocapiCategory).to.equal('shop');
    });
  });

  describe('realm_environment prefixed ids (observed on live tenants)', () => {
    const cases: Array<[string, string, string, Record<string, string>]> = [
      ['scapi', 'responseCount', 'bdpx_prd.shopper', {apiFamily: 'shopper'}],
      ['scapi', 'responseCount', 'bdpx_prd 4xx', {statusClass: '4xx'}],
      ['scapi', 'cacheHitRate', 'bdpx_prd.product MISS', {apiFamily: 'product', cacheStatus: 'MISS'}],
      ['scapi', 'requestLatency', 'bdpx_prd Average overall latency', {aggregation: 'overall'}],
      ['scapi', 'errors5xx', 'bdpx_prd.custom', {apiFamily: 'custom'}],
      ['controller', 'totalErrors', 'bdpx_prd.Product-Show', {controller: 'Product-Show'}],
      ['ocapi', 'errors4xx', 'bdpx_prd.shop', {ocapiCategory: 'shop'}],
      ['third-party', 'callsCount', 'bdpx_prd.www.example.com', {host: 'www.example.com'}],
      [
        'third-party',
        'remoteExceptions',
        'bdpx_prd.svc.example.com.socketReadTimeout',
        {host: 'svc.example.com', exceptionType: 'socketReadTimeout'},
      ],
      ['scapi-hooks', 'hookExecutionTimes', 'bdpx_prd Shop average', {series: 'Shop average'}],
    ];
    for (const [category, metricId, seriesId, expected] of cases) {
      it(`${category}/${metricId}: ${seriesId}`, () => {
        const tags = parseSeriesTags({
          category: category as Parameters<typeof parseSeriesTags>[0]['category'],
          metricId,
          seriesId,
          context: CTX,
        });
        expect(tags).to.deep.include(expected);
        expect(tags.realm).to.equal('bdpx');
      });
    }

    it('does not strip a realm_environment-looking prefix from an eCDN host', () => {
      const tags = parseSeriesTags({
        category: 'ecdn',
        metricId: 'totalRequests',
        seriesId: 'bdpx.bdpx_prd_my_commercecloud_salesforce_com',
        context: CTX,
      });
      expect(tags.host).to.equal('bdpx_prd_my_commercecloud_salesforce_com');
    });

    it('parses the combined 4xx/5xx eCDN status class', () => {
      const tags = parseSeriesTags({
        category: 'ecdn',
        metricId: 'successAndError',
        seriesId: '4xx/5xx bdpx.bdpx_api_commercecloud_salesforce_com',
        context: CTX,
      });
      expect(tags.statusClass).to.equal('4xx/5xx');
      expect(tags.host).to.equal('bdpx_api_commercecloud_salesforce_com');
    });

    it('adds no dimensions to value-less fallback series that echo the metric id', () => {
      for (const [category, metricId] of [
        ['scapi', 'cacheHitRate'],
        ['ocapi', 'totalCalls'],
        ['controller', 'totalErrors'],
        ['sales', 'orders'],
      ] as const) {
        const tags = parseSeriesTags({category, metricId, seriesId: metricId, context: CTX});
        expect(Object.keys(tags), `${category}/${metricId}`).to.deep.equal(['realm', 'environment']);
      }
    });
  });

  describe('fallback behavior', () => {
    it('keeps the prose label under `series` for unrecognized patterns', () => {
      const tags = parseSeriesTags({
        category: 'overall',
        metricId: 'requests',
        seriesId: 'bdpx Requests',
        context: CTX,
      });
      expect(tags.series).to.equal('Requests');
      expect(tags.realm).to.equal('bdpx');
    });

    it('does not echo the metric id back as a `series` tag (value-less fallback series)', () => {
      const tags = parseSeriesTags({category: 'mrt', metricId: 'errorRate', seriesId: 'errorRate', context: CTX});
      expect(tags.series).to.equal(undefined);
      expect(Object.keys(tags)).to.deep.equal(['realm', 'environment']);
    });
  });

  describe('applied filters (authoritative over heuristics)', () => {
    it('stamps an applied apiFamily filter, overriding the mis-parsed drill-down id', () => {
      // With apiFamily=shopper the server returns finer ids like bdpx.shopper.auth.v1;
      // the heuristic would produce apiFamily="shopper.auth.v1" — the filter corrects it.
      const tags = parseSeriesTags({
        category: 'scapi',
        metricId: 'totalCalls',
        seriesId: 'bdpx.shopper.auth.v1',
        context: {tenantId: 'f_ecom_bdpx_prd', apiFamily: 'shopper'},
      });
      expect(tags.apiFamily).to.equal('shopper');
    });

    it('adds apiName when an apiName filter was applied', () => {
      const tags = parseSeriesTags({
        category: 'scapi',
        metricId: 'totalCalls',
        seriesId: 'totalCalls',
        context: {tenantId: 'f_ecom_bdpx_prd', apiFamily: 'products', apiName: 'shopper-products'},
      });
      expect(tags.apiFamily).to.equal('products');
      expect(tags.apiName).to.equal('shopper-products');
    });

    it('stamps ocapiCategory / thirdPartyServiceId filters', () => {
      const ocapi = parseSeriesTags({
        category: 'ocapi',
        metricId: 'totalCalls',
        seriesId: 'totalCalls',
        context: {tenantId: 'f_ecom_bdpx_prd', ocapiCategory: 'shop'},
      });
      expect(ocapi.ocapiCategory).to.equal('shop');

      const tp = parseSeriesTags({
        category: 'third-party',
        metricId: 'callsCount',
        seriesId: 'bdpx.login.salesforce.com',
        context: {tenantId: 'f_ecom_bdpx_prd', thirdPartyServiceId: 'my.svc'},
      });
      expect(tp.thirdPartyServiceId).to.equal('my.svc');
      expect(tp.host).to.equal('login.salesforce.com'); // heuristic host still present
    });
  });
});

describe('enrichMetricsTags', () => {
  const RESPONSE: MetricsDataResponse = {
    data: [
      {
        metricId: 'cacheHitRate',
        title: 'Cache Hit Statistics',
        description: 'SCAPI cache hits and misses grouped by API family.',
        unit: '',
        dataSeries: [
          {id: 'bdpx.product HIT', name: 'bdpx.product HIT', data: [{timestamp: 1783444920000, value: 1}]},
          {id: 'bdpx.custom MISS', name: 'bdpx.custom MISS', data: [{timestamp: 1783444920000, value: 2}]},
        ],
      },
    ],
  };

  it('adds a tags object to every series without mutating the input', () => {
    const enriched = enrichMetricsTags(RESPONSE, 'scapi', CTX);
    const [hit, miss] = enriched.data[0].dataSeries;
    expect(hit.tags).to.deep.equal({realm: 'bdpx', environment: 'prd', apiFamily: 'product', cacheStatus: 'HIT'});
    expect(miss.tags).to.deep.equal({realm: 'bdpx', environment: 'prd', apiFamily: 'custom', cacheStatus: 'MISS'});
    // Input untouched (no tags leaked onto the original object).
    expect((RESPONSE.data[0].dataSeries[0] as {tags?: unknown}).tags).to.equal(undefined);
  });

  it('preserves the original id, name, and data verbatim', () => {
    const enriched = enrichMetricsTags(RESPONSE, 'scapi', CTX);
    const series = enriched.data[0].dataSeries[0];
    expect(series.id).to.equal('bdpx.product HIT');
    expect(series.name).to.equal('bdpx.product HIT');
    expect(series.data).to.deep.equal([{timestamp: 1783444920000, value: 1}]);
  });

  it('handles an empty response without throwing', () => {
    const enriched = enrichMetricsTags({data: []}, 'overall', CTX);
    expect(enriched.data).to.deep.equal([]);
  });
});
