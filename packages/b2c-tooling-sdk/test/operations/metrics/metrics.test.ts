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
  METRIC_CATEGORIES,
} from '../../../src/operations/metrics/index.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const ORG_ID = 'f_ecom_zzxy_prd';
const BASE_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/observability/metrics/v1`;

/** A minimal, valid MetricsDataResponse for happy-path assertions. */
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
            {timestamp: 1_620_735_785_000, value: 42},
            {timestamp: 1_620_735_845_000, value: 43.5},
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

  describe('time-window handling', () => {
    it('serializes from/to as query params when provided', async () => {
      let seenUrl = '';
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/metrics/sales`, ({request}) => {
          seenUrl = request.url;
          return HttpResponse.json(SAMPLE_RESPONSE);
        }),
      );

      await getSalesMetrics(client, TENANT_ID, {from: 1000, to: 2000});
      const url = new URL(seenUrl);
      expect(url.searchParams.get('from')).to.equal('1000');
      expect(url.searchParams.get('to')).to.equal('2000');
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
