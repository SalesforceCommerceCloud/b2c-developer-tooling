/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createPreferencesClient} from '../../src/clients/preferences.js';
import {MockAuthStrategy} from '../helpers/mock-auth.js';

const SHORT_CODE = 'kv7kzm78';
const TENANT_ID = 'zzxy_prd';
const ORG_ID = 'f_ecom_zzxy_prd';
const BASE_URL = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/configuration/preferences/v1`;

describe('Preferences Client', () => {
  const server = setupServer();
  let client: ReturnType<typeof createPreferencesClient>;
  let mockAuth: MockAuthStrategy;

  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  beforeEach(() => {
    mockAuth = new MockAuthStrategy();
    client = createPreferencesClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, mockAuth);
  });

  describe('GET /global-custom-preferences', () => {
    it('lists global custom preferences', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/global-custom-preferences`, ({request}) => {
          expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
          return HttpResponse.json({
            total: 2,
            data: [
              {id: 'c_attr1', value: 'value1', groupId: 'CustomGroup'},
              {id: 'c_attr2', value: 42, groupId: 'CustomGroup'},
            ],
          });
        }),
      );

      const result = await client.GET('/organizations/{organizationId}/global-custom-preferences', {
        params: {path: {organizationId: ORG_ID}},
      });

      expect(result.data?.total).to.equal(2);
      expect(result.data?.data).to.have.length(2);
      expect(result.data?.data?.[0].id).to.equal('c_attr1');
    });

    it('passes limit, offset, and maskPassword query params', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/global-custom-preferences`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('limit')).to.equal('50');
          expect(url.searchParams.get('offset')).to.equal('100');
          expect(url.searchParams.get('maskPassword')).to.equal('true');
          return HttpResponse.json({total: 0, data: []});
        }),
      );

      await client.GET('/organizations/{organizationId}/global-custom-preferences', {
        params: {path: {organizationId: ORG_ID}, query: {limit: 50, offset: 100, maskPassword: true}},
      });
    });

    it('handles 403 forbidden errors', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/global-custom-preferences`, () => {
          return HttpResponse.json({title: 'Forbidden', detail: 'Insufficient scope'}, {status: 403});
        }),
      );

      const result = await client.GET('/organizations/{organizationId}/global-custom-preferences', {
        params: {path: {organizationId: ORG_ID}},
      });

      expect(result.error).to.exist;
      expect(result.response.status).to.equal(403);
    });
  });

  describe('GET /site-custom-preferences', () => {
    it('lists site custom preferences with siteId', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/site-custom-preferences`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('siteId')).to.equal('RefArch');
          return HttpResponse.json({
            total: 1,
            data: [{id: 'c_attr', value: 'foo', groupId: 'SiteGroup'}],
          });
        }),
      );

      const result = await client.GET('/organizations/{organizationId}/site-custom-preferences', {
        params: {path: {organizationId: ORG_ID}, query: {siteId: 'RefArch'}},
      });

      expect(result.data?.data?.[0].id).to.equal('c_attr');
    });
  });

  describe('GET /global-preference-groups/{groupId}/{instanceType}', () => {
    it('reads a global preference group for a given instance type', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/global-preference-groups/CustomGroup/staging`, () => {
          return HttpResponse.json({c_attr: 'value'});
        }),
      );

      const result = await client.GET(
        '/organizations/{organizationId}/global-preference-groups/{groupId}/{instanceType}',
        {
          params: {path: {organizationId: ORG_ID, groupId: 'CustomGroup', instanceType: 'staging'}},
        },
      );

      expect(result.data).to.deep.include({c_attr: 'value'});
    });

    it('passes expand=sites to query string', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/global-preference-groups/CustomGroup/current`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.getAll('expand')).to.include('sites');
          return HttpResponse.json({c_attr: 'value'});
        }),
      );

      await client.GET('/organizations/{organizationId}/global-preference-groups/{groupId}/{instanceType}', {
        params: {
          path: {organizationId: ORG_ID, groupId: 'CustomGroup', instanceType: 'current'},
          query: {expand: ['sites']},
        },
      });
    });
  });

  describe('PATCH /global-preference-groups/{groupId}/{instanceType}', () => {
    it('updates global preferences and uses RW client when configured', async () => {
      const rwClient = createPreferencesClient({shortCode: SHORT_CODE, tenantId: TENANT_ID}, mockAuth, {
        readWrite: true,
      });

      server.use(
        http.patch(
          `${BASE_URL}/organizations/${ORG_ID}/global-preference-groups/CustomGroup/staging`,
          async ({request}) => {
            expect(request.headers.get('Authorization')).to.equal('Bearer test-token');
            const body = (await request.json()) as Record<string, unknown>;
            expect(body).to.deep.equal({c_attr: 'updated'});
            return HttpResponse.json({c_attr: 'updated'});
          },
        ),
      );

      const result = await rwClient.PATCH(
        '/organizations/{organizationId}/global-preference-groups/{groupId}/{instanceType}',
        {
          params: {path: {organizationId: ORG_ID, groupId: 'CustomGroup', instanceType: 'staging'}},
          body: {c_attr: 'updated'},
        },
      );

      expect(result.data).to.deep.include({c_attr: 'updated'});
    });
  });

  describe('GET /site-preference-groups/{groupId}/{instanceType}', () => {
    it('reads a site preference group with siteId query', async () => {
      server.use(
        http.get(`${BASE_URL}/organizations/${ORG_ID}/site-preference-groups/SiteGroup/staging`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('siteId')).to.equal('RefArch');
          return HttpResponse.json({c_attr: 'site-value'});
        }),
      );

      const result = await client.GET(
        '/organizations/{organizationId}/site-preference-groups/{groupId}/{instanceType}',
        {
          params: {
            path: {organizationId: ORG_ID, groupId: 'SiteGroup', instanceType: 'staging'},
            query: {siteId: 'RefArch'},
          },
        },
      );

      expect(result.data).to.deep.include({c_attr: 'site-value'});
    });
  });

  describe('PATCH /site-preference-groups/{groupId}/{instanceType}', () => {
    it('updates site preferences', async () => {
      server.use(
        http.patch(
          `${BASE_URL}/organizations/${ORG_ID}/site-preference-groups/SiteGroup/staging`,
          async ({request}) => {
            const body = (await request.json()) as Record<string, unknown>;
            expect(body).to.deep.equal({c_attr: 'site-updated'});
            return HttpResponse.json({c_attr: 'site-updated'});
          },
        ),
      );

      const result = await client.PATCH(
        '/organizations/{organizationId}/site-preference-groups/{groupId}/{instanceType}',
        {
          params: {
            path: {organizationId: ORG_ID, groupId: 'SiteGroup', instanceType: 'staging'},
            query: {siteId: 'RefArch'},
          },
          body: {c_attr: 'site-updated'},
        },
      );

      expect(result.data).to.deep.include({c_attr: 'site-updated'});
    });
  });

  describe('POST /site-preference-groups/{groupId}/{instanceType}/preference-search', () => {
    it('searches preferences with a matchAllQuery', async () => {
      server.use(
        http.post(
          `${BASE_URL}/organizations/${ORG_ID}/site-preference-groups/SiteGroup/staging/preference-search`,
          async ({request}) => {
            const body = (await request.json()) as Record<string, unknown>;
            expect(body).to.deep.include({query: {matchAllQuery: {}}});
            return HttpResponse.json({
              hits: [{id: 'WapiStringAttr', valueType: 'string'}],
              total: 1,
            });
          },
        ),
      );

      const result = await client.POST(
        '/organizations/{organizationId}/site-preference-groups/{groupId}/{instanceType}/preference-search',
        {
          params: {path: {organizationId: ORG_ID, groupId: 'SiteGroup', instanceType: 'staging'}},
          body: {query: {matchAllQuery: {}}, limit: 25, offset: 0},
        },
      );

      expect(result.data?.hits).to.have.length(1);
      expect(result.data?.total).to.equal(1);
    });

    it('passes expand=value to query string', async () => {
      server.use(
        http.post(
          `${BASE_URL}/organizations/${ORG_ID}/site-preference-groups/SiteGroup/staging/preference-search`,
          ({request}) => {
            const url = new URL(request.url);
            expect(url.searchParams.getAll('expand')).to.include('value');
            return HttpResponse.json({hits: [], total: 0});
          },
        ),
      );

      await client.POST(
        '/organizations/{organizationId}/site-preference-groups/{groupId}/{instanceType}/preference-search',
        {
          params: {
            path: {organizationId: ORG_ID, groupId: 'SiteGroup', instanceType: 'staging'},
            query: {expand: ['value']},
          },
          body: {query: {matchAllQuery: {}}},
        },
      );
    });
  });

  describe('GET /site-preference-groups/{groupId}/{instanceType}/preferences/{preferenceId}', () => {
    it('reads a single site preference', async () => {
      server.use(
        http.get(
          `${BASE_URL}/organizations/${ORG_ID}/site-preference-groups/SiteGroup/staging/preferences/WapiStringAttr`,
          () => {
            return HttpResponse.json({
              id: 'WapiStringAttr',
              valueType: 'string',
              siteValues: {RefArch: 'value'},
            });
          },
        ),
      );

      const result = await client.GET(
        '/organizations/{organizationId}/site-preference-groups/{groupId}/{instanceType}/preferences/{preferenceId}',
        {
          params: {
            path: {
              organizationId: ORG_ID,
              groupId: 'SiteGroup',
              instanceType: 'staging',
              preferenceId: 'WapiStringAttr',
            },
          },
        },
      );

      expect(result.data?.id).to.equal('WapiStringAttr');
      expect(result.data?.siteValues?.RefArch).to.equal('value');
    });

    it('handles 404 when preference does not exist', async () => {
      server.use(
        http.get(
          `${BASE_URL}/organizations/${ORG_ID}/site-preference-groups/SiteGroup/staging/preferences/Missing`,
          () => {
            return HttpResponse.json({title: 'Not Found'}, {status: 404});
          },
        ),
      );

      const result = await client.GET(
        '/organizations/{organizationId}/site-preference-groups/{groupId}/{instanceType}/preferences/{preferenceId}',
        {
          params: {
            path: {
              organizationId: ORG_ID,
              groupId: 'SiteGroup',
              instanceType: 'staging',
              preferenceId: 'Missing',
            },
          },
        },
      );

      expect(result.error).to.exist;
      expect(result.response.status).to.equal(404);
    });
  });

  describe('PATCH /site-preference-groups/{groupId}/{instanceType}/preferences/{preferenceId}', () => {
    it('updates a single site preference', async () => {
      server.use(
        http.patch(
          `${BASE_URL}/organizations/${ORG_ID}/site-preference-groups/SiteGroup/staging/preferences/WapiStringAttr`,
          async ({request}) => {
            const body = (await request.json()) as Record<string, unknown>;
            expect(body).to.deep.equal({
              id: 'WapiStringAttr',
              siteValues: {RefArch: 'new-value'},
            });
            return HttpResponse.json(body);
          },
        ),
      );

      const result = await client.PATCH(
        '/organizations/{organizationId}/site-preference-groups/{groupId}/{instanceType}/preferences/{preferenceId}',
        {
          params: {
            path: {
              organizationId: ORG_ID,
              groupId: 'SiteGroup',
              instanceType: 'staging',
              preferenceId: 'WapiStringAttr',
            },
          },
          body: {id: 'WapiStringAttr', siteValues: {RefArch: 'new-value'}},
        },
      );

      expect(result.data?.id).to.equal('WapiStringAttr');
      expect(result.data?.siteValues?.RefArch).to.equal('new-value');
    });
  });
});
