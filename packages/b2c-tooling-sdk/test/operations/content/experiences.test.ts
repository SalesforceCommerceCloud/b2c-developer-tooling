/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import type {B2CInstance} from '../../../src/instance/index.js';
import {
  ExperiencesUnavailableError,
  PagePushError,
  fetchExperienceTypes,
  getExperiencesAvailability,
  listComponentTypes,
  pushPage,
} from '../../../src/operations/content/index.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const SHORT_CODE = 'abcd1234';
const TENANT_ID = 'zzxy_dev';
const BASE = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/experience/experiences/v1/organizations/f_ecom_${TENANT_ID}`;

function fakeInstance(opts: {scapi?: boolean; shortCode?: string} = {}): B2CInstance {
  const shortCode = 'shortCode' in opts ? opts.shortCode : SHORT_CODE;
  return {
    config: {shortCode, tenantId: TENANT_ID},
    scapiClientConfig:
      opts.scapi === false || !shortCode ? undefined : {shortCode, tenantId: TENANT_ID, auth: new MockAuthStrategy()},
  } as unknown as B2CInstance;
}

describe('operations/content/experiences', () => {
  const server = setupServer();
  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it('walks every page of component types', async () => {
    const offsets: string[] = [];
    server.use(
      http.get(`${BASE}/component-types`, ({request}) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('siteId')).to.equal('RefArch');
        const offset = Number(url.searchParams.get('offset') ?? 0);
        offsets.push(String(offset));
        const hits = offset === 0 ? Array.from({length: 200}, (_, i) => ({id: `t${i}`})) : [{id: 'last'}];
        return HttpResponse.json({hits, total: 201, limit: 200, offset});
      }),
    );
    const types = await listComponentTypes(fakeInstance(), {siteId: 'RefArch'});
    expect(types).to.have.length(201);
    expect(offsets).to.deep.equal(['0', '200']);
  });

  it('fetches page and component types together', async () => {
    server.use(
      http.get(`${BASE}/page-types`, () => HttpResponse.json({hits: [{id: 'homePage'}], total: 1})),
      http.get(`${BASE}/component-types`, () => HttpResponse.json({hits: [{id: 'Content.hero'}], total: 1})),
    );
    const types = await fetchExperienceTypes(fakeInstance(), {siteId: 'RefArch'});
    expect(types.pageTypes.map((t) => t.id)).to.deep.equal(['homePage']);
    expect(types.componentTypes.map((t) => t.id)).to.deep.equal(['Content.hero']);
  });

  describe('availability (degrades instead of failing)', () => {
    it('reports not-configured without a short code', async () => {
      const result = await getExperiencesAvailability(fakeInstance({shortCode: undefined}), {siteId: 'RefArch'});
      expect(result).to.include({available: false, reason: 'not-configured'});
    });

    it('reports unsupported-auth for browser-based auth', async () => {
      const result = await getExperiencesAvailability(fakeInstance({scapi: false}), {siteId: 'RefArch'});
      expect(result).to.include({available: false, reason: 'unsupported-auth'});
    });

    it('reports missing-scope on 403', async () => {
      server.use(http.get(`${BASE}/page-types`, () => HttpResponse.json({title: 'Forbidden'}, {status: 403})));
      const result = await getExperiencesAvailability(fakeInstance(), {siteId: 'RefArch'});
      expect(result).to.include({available: false, reason: 'missing-scope'});
    });

    it('reports available on success', async () => {
      server.use(http.get(`${BASE}/page-types`, () => HttpResponse.json({hits: [], total: 0})));
      expect(await getExperiencesAvailability(fakeInstance(), {siteId: 'RefArch'})).to.deep.equal({available: true});
    });

    it('throws a typed error from list operations on 403', async () => {
      server.use(http.get(`${BASE}/component-types`, () => HttpResponse.json({}, {status: 403})));
      try {
        await listComponentTypes(fakeInstance(), {siteId: 'RefArch'});
        expect.fail('expected error');
      } catch (error) {
        expect(error).to.be.instanceOf(ExperiencesUnavailableError);
        expect((error as ExperiencesUnavailableError).reason).to.equal('missing-scope');
      }
    });
  });

  describe('pushPage', () => {
    const page = {id: 'p1', name: 'P1', typeId: 'homePage', regions: [{id: 'main', components: []}]};

    it('PUTs the page and reports created on 201', async () => {
      let body: unknown;
      server.use(
        http.put(`${BASE}/pages/p1`, async ({request}) => {
          expect(new URL(request.url).searchParams.get('siteId')).to.equal('RefArch');
          body = await request.json();
          return HttpResponse.json({...page, regions: []}, {status: 201});
        }),
      );
      const result = await pushPage(fakeInstance(), page, {siteId: 'RefArch'});
      expect(result.status).to.equal('created');
      expect(body).to.deep.equal(page);
    });

    it('reports updated on 200', async () => {
      server.use(http.put(`${BASE}/pages/p1`, () => HttpResponse.json(page)));
      expect((await pushPage(fakeInstance(), page, {siteId: 'RefArch'})).status).to.equal('updated');
    });

    it('throws PagePushError with the API detail on 400', async () => {
      server.use(
        http.put(`${BASE}/pages/p1`, () =>
          HttpResponse.json(
            {type: 'bad-request', title: 'Bad Request', detail: "Region 'main' not found in page type 'aboutUsPage'"},
            {status: 400},
          ),
        ),
      );
      try {
        await pushPage(fakeInstance(), page, {siteId: 'RefArch'});
        expect.fail('expected error');
      } catch (error) {
        expect(error).to.be.instanceOf(PagePushError);
        expect((error as PagePushError).status).to.equal(400);
        expect((error as Error).message).to.include("Region 'main' not found");
      }
    });

    it('throws ExperiencesUnavailableError on 403', async () => {
      server.use(http.put(`${BASE}/pages/p1`, () => HttpResponse.json({}, {status: 403})));
      try {
        await pushPage(fakeInstance(), page, {siteId: 'RefArch'});
        expect.fail('expected error');
      } catch (error) {
        expect(error).to.be.instanceOf(ExperiencesUnavailableError);
      }
    });
  });
});
