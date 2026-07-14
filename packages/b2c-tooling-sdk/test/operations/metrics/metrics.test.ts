/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createMetricsClient, type MetricsDataResponse} from '../../../src/clients/metrics.js';
import {
  getOverallMetrics,
  getSalesMetrics,
  getEcdnMetrics,
  getThirdPartyMetrics,
  getScapiMetrics,
  getScapiHooksMetrics,
  getMrtMetrics,
  getControllerMetrics,
  getOcapiMetrics,
  getMetricsByCategory,
  parseMetricsBound,
  resolveMetricsWindow,
  METRIC_CATEGORIES,
} from '../../../src/operations/metrics/index.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const ORG_ID = 'f_ecom_zzxy_prd';
const BASE_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/observability/metrics/v1`;

// Data-point timestamps are epoch SECONDS on the wire (as the API sends them).
const POINT_1_SECONDS = 1_620_735_785;
const POINT_2_SECONDS = 1_620_735_845;

/**
 * A minimal, valid MetricsDataResponse as returned by the API, i.e. with data
 * point timestamps in epoch SECONDS.
 */
const SAMPLE_RESPONSE: MetricsDataResponse = {
  data: [
    {
      metricId: 'requests_total',
      title: 'Total Requests',
      description: 'Total number of requests in the window',
      unit: 'requests',
      dataSeries: [
        {
          id: 'series-1',
          name: '2xx',
          data: [
            {timestamp: POINT_1_SECONDS, value: 42},
            {timestamp: POINT_2_SECONDS, value: 43.5},
          ],
        },
      ],
    },
  ],
};

describe('Metrics API operations', () => {
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

  let client: ReturnType<typeof createMetricsClient>;

  beforeEach(() => {
    client = createMetricsClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, new MockAuthStrategy());
  });

  describe('createMetricsClient', () => {
    it('targets the observability/metrics/v1 base URL and sends the auth header', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/overall`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json(SAMPLE_RESPONSE);
        }),
      );

      const result = await getOverallMetrics(client, TENANT_ID);
      expect(result.data).to.have.length(1);
      expect(result.data[0].metricId).to.equal('requests_total');
      expect(result.data[0].dataSeries[0].data[1].value).to.equal(43.5);
    });
  });

  describe('timestamp normalization (seconds → milliseconds)', () => {
    it('rewrites response data-point timestamps from epoch seconds to milliseconds', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/overall`, () => HttpResponse.json(SAMPLE_RESPONSE)),
      );

      const result = await getOverallMetrics(client, TENANT_ID);
      const points = result.data[0].dataSeries[0].data;
      // API sent seconds; operations layer returns milliseconds so new Date(...) is correct.
      expect(points[0].timestamp).to.equal(POINT_1_SECONDS * 1000);
      expect(points[1].timestamp).to.equal(POINT_2_SECONDS * 1000);
      expect(new Date(points[0].timestamp).getUTCFullYear()).to.equal(2021);
    });
  });

  describe('time-window handling', () => {
    it('converts millisecond from/to inputs to epoch seconds on the wire', async () => {
      let seenUrl = '';
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/sales`, ({request}) => {
          seenUrl = request.url;
          return HttpResponse.json(SAMPLE_RESPONSE);
        }),
      );

      // Inputs are epoch milliseconds (Date.now()-style); the API expects seconds.
      await getSalesMetrics(client, TENANT_ID, {from: 1_620_000_000_000, to: 1_620_000_600_000});
      const url = new URL(seenUrl);
      expect(url.searchParams.get('from')).to.equal('1620000000');
      expect(url.searchParams.get('to')).to.equal('1620000600');
    });

    it('accepts Date objects and converts them to epoch seconds', async () => {
      let seenUrl = '';
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/sales`, ({request}) => {
          seenUrl = request.url;
          return HttpResponse.json(SAMPLE_RESPONSE);
        }),
      );

      await getSalesMetrics(client, TENANT_ID, {
        from: new Date('2021-05-03T00:00:00.000Z'),
        to: new Date('2021-05-03T00:10:00.000Z'),
      });
      const url = new URL(seenUrl);
      expect(url.searchParams.get('from')).to.equal(String(Math.floor(Date.parse('2021-05-03T00:00:00.000Z') / 1000)));
      expect(url.searchParams.get('to')).to.equal(String(Math.floor(Date.parse('2021-05-03T00:10:00.000Z') / 1000)));
    });

    it('omits from/to when not provided', async () => {
      let seenUrl = '';
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/ecdn`, ({request}) => {
          seenUrl = request.url;
          return HttpResponse.json(SAMPLE_RESPONSE);
        }),
      );

      await getEcdnMetrics(client, TENANT_ID);
      const url = new URL(seenUrl);
      expect(url.searchParams.has('from')).to.equal(false);
      expect(url.searchParams.has('to')).to.equal(false);
    });

    it('accepts a tenant id that already has the f_ecom_ prefix', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/overall`, () => HttpResponse.json(SAMPLE_RESPONSE)),
      );
      const result = await getOverallMetrics(client, ORG_ID);
      expect(result.data).to.have.length(1);
    });
  });

  describe('category-specific filters', () => {
    it('getThirdPartyMetrics sends thirdPartyServiceId', async () => {
      let seenUrl = '';
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/third-party`, ({request}) => {
          seenUrl = request.url;
          return HttpResponse.json(SAMPLE_RESPONSE);
        }),
      );

      await getThirdPartyMetrics(client, TENANT_ID, {thirdPartyServiceId: 'my.payment.service'});
      expect(new URL(seenUrl).searchParams.get('thirdPartyServiceId')).to.equal('my.payment.service');
    });

    it('getScapiMetrics sends apiFamily and apiName', async () => {
      let seenUrl = '';
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/scapi`, ({request}) => {
          seenUrl = request.url;
          return HttpResponse.json(SAMPLE_RESPONSE);
        }),
      );

      await getScapiMetrics(client, TENANT_ID, {apiFamily: 'product', apiName: 'shopper-products'});
      const params = new URL(seenUrl).searchParams;
      expect(params.get('apiFamily')).to.equal('product');
      expect(params.get('apiName')).to.equal('shopper-products');
    });

    it('getOcapiMetrics sends ocapiCategory and ocapiApi', async () => {
      let seenUrl = '';
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/ocapi`, ({request}) => {
          seenUrl = request.url;
          return HttpResponse.json(SAMPLE_RESPONSE);
        }),
      );

      await getOcapiMetrics(client, TENANT_ID, {ocapiCategory: 'shop', ocapiApi: 'products'});
      const params = new URL(seenUrl).searchParams;
      expect(params.get('ocapiCategory')).to.equal('shop');
      expect(params.get('ocapiApi')).to.equal('products');
    });
  });

  describe('remaining category endpoints', () => {
    it('getScapiHooksMetrics hits /metrics/scapi-hooks', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/scapi-hooks`, () => HttpResponse.json(SAMPLE_RESPONSE)),
      );
      const result = await getScapiHooksMetrics(client, TENANT_ID);
      expect(result.data).to.have.length(1);
    });

    it('getMrtMetrics hits /metrics/mrt', async () => {
      server.use(http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/mrt`, () => HttpResponse.json(SAMPLE_RESPONSE)));
      const result = await getMrtMetrics(client, TENANT_ID);
      expect(result.data).to.have.length(1);
    });

    it('getControllerMetrics hits /metrics/controller', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/controller`, () => HttpResponse.json(SAMPLE_RESPONSE)),
      );
      const result = await getControllerMetrics(client, TENANT_ID);
      expect(result.data).to.have.length(1);
    });
  });

  describe('getMetricsByCategory', () => {
    it('dispatches every category in METRIC_CATEGORIES to the matching endpoint', async () => {
      for (const category of METRIC_CATEGORIES) {
        server.use(
          http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/${category}`, () => HttpResponse.json(SAMPLE_RESPONSE)),
        );
        const result = await getMetricsByCategory(client, TENANT_ID, category);
        expect(result.data, `category ${category}`).to.have.length(1);
        server.resetHandlers();
      }
    });
  });

  describe('error handling', () => {
    it('throws a descriptive error using the problem+json detail on 4xx', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/overall`, () =>
          HttpResponse.json(
            {title: 'Bad Request', type: 'about:blank', detail: 'from must be before to'},
            {status: 400},
          ),
        ),
      );

      try {
        await getOverallMetrics(client, TENANT_ID, {from: 2000, to: 1000});
        expect.fail('expected getOverallMetrics to throw');
      } catch (err) {
        expect((err as Error).message).to.contain('overall');
        expect((err as Error).message).to.contain('from must be before to');
      }
    });

    it('throws on 503 metrics-not-available', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/sales`, () =>
          HttpResponse.json(
            {title: 'Service Unavailable', type: 'about:blank', detail: 'Metrics temporarily unavailable'},
            {status: 503},
          ),
        ),
      );

      try {
        await getSalesMetrics(client, TENANT_ID);
        expect.fail('expected getSalesMetrics to throw');
      } catch (err) {
        expect((err as Error).message).to.contain('Metrics temporarily unavailable');
      }
    });
  });
});

describe('parseMetricsBound', () => {
  // Fixed reference "now" for deterministic assertions.
  const NOW = new Date('2026-07-07T12:00:00.000Z');

  it('parses a relative duration as "ago" against the reference now', () => {
    expect(parseMetricsBound('2d', NOW).toISOString()).to.equal('2026-07-05T12:00:00.000Z');
    expect(parseMetricsBound('1h', NOW).toISOString()).to.equal('2026-07-07T11:00:00.000Z');
    expect(parseMetricsBound('30m', NOW).toISOString()).to.equal('2026-07-07T11:30:00.000Z');
  });

  it('parses an ISO 8601 timestamp', () => {
    expect(parseMetricsBound('2026-07-01T00:00:00.000Z', NOW).toISOString()).to.equal('2026-07-01T00:00:00.000Z');
  });

  it('passes a Date through unchanged', () => {
    const d = new Date('2026-06-01T00:00:00.000Z');
    expect(parseMetricsBound(d, NOW)).to.equal(d);
  });

  it('treats a number as epoch milliseconds', () => {
    expect(parseMetricsBound(1_620_000_000_000, NOW).getTime()).to.equal(1_620_000_000_000);
  });

  it('throws on an invalid relative/ISO string', () => {
    expect(() => parseMetricsBound('not-a-time', NOW)).to.throw(TypeError);
  });
});

describe('resolveMetricsWindow', () => {
  const NOW = new Date('2026-07-07T12:00:00.000Z');

  it('defaults to the last 24 hours when no inputs are given', () => {
    const w = resolveMetricsWindow({}, NOW);
    expect(w.toIso).to.equal(NOW.toISOString());
    expect(w.fromIso).to.equal('2026-07-06T12:00:00.000Z');
    expect(w.toEpochSeconds - w.fromEpochSeconds).to.equal(24 * 60 * 60);
    expect(w.defaultedWindow).to.equal(true);
    expect(w.clampedFrom).to.equal(false);
  });

  it('from alone derives a 24h window forward, capped at now', () => {
    // 7d ago + 24h is still well before now, so `to` = from + 24h.
    const w = resolveMetricsWindow({from: '7d'}, NOW);
    expect(w.fromIso).to.equal('2026-06-30T12:00:00.000Z');
    expect(w.toIso).to.equal('2026-07-01T12:00:00.000Z');
    expect(w.toEpochSeconds - w.fromEpochSeconds).to.equal(24 * 60 * 60);
    expect(w.defaultedWindow).to.equal(true);
    expect(w.clampedFrom).to.equal(false);
  });

  it('from alone within the last 24h caps to at now (window shorter than 24h)', () => {
    const w = resolveMetricsWindow({from: '6h'}, NOW);
    expect(w.fromIso).to.equal('2026-07-07T06:00:00.000Z');
    expect(w.toIso).to.equal(NOW.toISOString()); // capped at now, not from+24h
    expect(w.defaultedWindow).to.equal(true);
  });

  it('to alone derives from = to - 24h', () => {
    const w = resolveMetricsWindow({to: '6h'}, NOW);
    expect(w.toIso).to.equal('2026-07-07T06:00:00.000Z');
    expect(w.fromIso).to.equal('2026-07-06T06:00:00.000Z');
    expect(w.toEpochSeconds - w.fromEpochSeconds).to.equal(24 * 60 * 60);
    expect(w.defaultedWindow).to.equal(true);
  });

  it('from + window derives to = from + window (1h window, 7 days ago)', () => {
    const w = resolveMetricsWindow({from: '7d', window: '1h'}, NOW);
    expect(w.fromIso).to.equal('2026-06-30T12:00:00.000Z');
    expect(w.toIso).to.equal('2026-06-30T13:00:00.000Z');
    expect(w.toEpochSeconds - w.fromEpochSeconds).to.equal(3600);
  });

  it('to + window derives from = to - window', () => {
    const w = resolveMetricsWindow({to: '2026-07-07T06:00:00.000Z', window: '2h'}, NOW);
    expect(w.fromIso).to.equal('2026-07-07T04:00:00.000Z');
    expect(w.toIso).to.equal('2026-07-07T06:00:00.000Z');
  });

  it('window alone means the last {window}', () => {
    const w = resolveMetricsWindow({window: '1h'}, NOW);
    expect(w.toIso).to.equal(NOW.toISOString());
    expect(w.fromIso).to.equal('2026-07-07T11:00:00.000Z');
  });

  it('uses explicit from + to as given', () => {
    const w = resolveMetricsWindow({from: '2026-07-07T00:00:00Z', to: '2026-07-07T06:00:00Z'}, NOW);
    expect(w.fromEpochSeconds).to.equal(Math.floor(Date.parse('2026-07-07T00:00:00Z') / 1000));
    expect(w.toEpochSeconds).to.equal(Math.floor(Date.parse('2026-07-07T06:00:00Z') / 1000));
  });

  it('rejects specifying from, to, and window together', () => {
    expect(() => resolveMetricsWindow({from: '2d', to: '1d', window: '1h'}, NOW)).to.throw(RangeError, /at most two/);
  });

  it('rejects from after to', () => {
    expect(() => resolveMetricsWindow({from: '2026-07-07T06:00:00Z', to: '2026-07-07T00:00:00Z'}, NOW)).to.throw(
      RangeError,
      /must be before/,
    );
  });

  it('throws on an invalid window duration', () => {
    expect(() => resolveMetricsWindow({from: '7d', window: 'nope'}, NOW)).to.throw(TypeError, /window/);
  });

  it('does not clamp a from comfortably within retention', () => {
    const w = resolveMetricsWindow({from: '7d'}, NOW);
    expect(w.clampedFrom).to.equal(false);
    expect(w.fromIso).to.equal('2026-06-30T12:00:00.000Z');
  });

  it('clamps a from at the 30-day edge forward into the retention window', () => {
    // "30d ago" on the client is exactly the retention floor; the server's later
    // clock would reject it, so it is clamped forward by the safety margin.
    const w = resolveMetricsWindow({from: '30d'}, NOW);
    expect(w.clampedFrom).to.equal(true);
    // now - 30d + 5min
    const expected = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString();
    expect(w.fromIso).to.equal(expected);
    // Clamp only ever moves from *forward* (toward now), never earlier.
    expect(new Date(w.fromIso).getTime()).to.be.greaterThan(NOW.getTime() - 30 * 24 * 60 * 60 * 1000);
  });

  it('clamps an explicit ISO from that is older than retention', () => {
    const w = resolveMetricsWindow({from: '2026-05-01T00:00:00.000Z'}, NOW);
    expect(w.clampedFrom).to.equal(true);
  });
});
