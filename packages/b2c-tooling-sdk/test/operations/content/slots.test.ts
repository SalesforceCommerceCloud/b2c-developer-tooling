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
  ExperiencesRequestError,
  ExperiencesUnavailableError,
  deleteSlotConfiguration,
  getSlot,
  putSlotConfiguration,
  searchSlotConfigurations,
  searchSlots,
  toWireSlotContentType,
  updateSlotConfiguration,
} from '../../../src/operations/content/index.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const SHORT_CODE = 'abcd1234';
const TENANT_ID = 'zzxy_dev';
const BASE = `https://${SHORT_CODE}.api.commercecloud.salesforce.com/experience/experiences/v1/organizations/f_ecom_${TENANT_ID}`;
const CONFIG_URL = `${BASE}/slots/home-banner/slot-configurations/summer`;

function fakeInstance(): B2CInstance {
  return {
    config: {shortCode: SHORT_CODE, tenantId: TENANT_ID},
    scapiClientConfig: {shortCode: SHORT_CODE, tenantId: TENANT_ID, auth: new MockAuthStrategy()},
  } as unknown as B2CInstance;
}

const CONFIG = {
  configurationId: 'summer',
  slotId: 'home-banner',
  context: 'global',
  enabled: true,
  template: 'slots/content/banner.isml',
  slotContent: {type: 'content_assets', contentAssetIds: ['a1']},
};

describe('operations/content/slots', () => {
  const server = setupServer();
  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it('normalizes slot content types to the snake_case wire values', () => {
    expect(toWireSlotContentType('contentAssets')).to.equal('content_assets');
    expect(toWireSlotContentType('content-assets')).to.equal('content_assets');
    expect(toWireSlotContentType('recommendedProducts')).to.equal('recommended_products');
    expect(toWireSlotContentType('HTML')).to.equal('html');
    expect(() => toWireSlotContentType('video')).to.throw(/Unknown slot content type/);
  });

  it('searches configurations with a term query and walks every page', async () => {
    const bodies: Array<{query: unknown; offset: number}> = [];
    server.use(
      http.post(`${BASE}/slot-configurations-search`, async ({request}) => {
        expect(new URL(request.url).searchParams.get('siteId')).to.equal('RefArch');
        const body = (await request.json()) as {query: unknown; offset: number};
        bodies.push(body);
        const hits = body.offset === 0 ? Array.from({length: 200}, () => CONFIG) : [CONFIG];
        return HttpResponse.json({hits, total: 201});
      }),
    );
    const result = await searchSlotConfigurations(fakeInstance(), {
      siteId: 'RefArch',
      slotId: 'home-banner',
      all: true,
    });
    expect(result.total).to.equal(201);
    expect(result.hits).to.have.length(201);
    expect(bodies.map((b) => b.offset)).to.deep.equal([0, 200]);
    expect(bodies[0].query).to.deep.equal({
      termQuery: {fields: ['slotId'], operator: 'is', values: ['home-banner']},
    });
  });

  it('combines slot and context filters and defaults to match-all', async () => {
    const queries: unknown[] = [];
    server.use(
      http.post(`${BASE}/slot-configurations-search`, async ({request}) => {
        queries.push(((await request.json()) as {query: unknown}).query);
        return HttpResponse.json({hits: [], total: 0});
      }),
    );
    await searchSlotConfigurations(fakeInstance(), {siteId: 'RefArch'});
    await searchSlotConfigurations(fakeInstance(), {siteId: 'RefArch', slotId: 's', context: 'category'});
    expect(queries[0]).to.deep.equal({matchAllQuery: {}});
    expect(queries[1]).to.have.nested.property('boolQuery.must').with.length(2);
  });

  it('creates a configuration with a normalized content type and reports created vs updated', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.put(CONFIG_URL, async ({request}) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(CONFIG, {status: 201});
      }),
    );
    const result = await putSlotConfiguration(
      fakeInstance(),
      'home-banner',
      'summer',
      {template: 't.isml', slotContent: {type: 'contentAssets', contentAssetIds: ['a1']}},
      {siteId: 'RefArch'},
    );
    expect(result.status).to.equal('created');
    expect(sent).to.deep.include({configurationId: 'summer', context: 'global'});
    expect(sent?.slotContent).to.deep.equal({type: 'content_assets', contentAssetIds: ['a1']});
  });

  it('merges the current slot content into a patch that omits it', async () => {
    let patched: Record<string, unknown> | undefined;
    server.use(
      http.get(CONFIG_URL, () => HttpResponse.json(CONFIG)),
      http.patch(CONFIG_URL, async ({request}) => {
        patched = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({...CONFIG, enabled: false});
      }),
    );
    const updated = await updateSlotConfiguration(
      fakeInstance(),
      'home-banner',
      'summer',
      {enabled: false},
      {
        siteId: 'RefArch',
      },
    );
    expect(updated.enabled).to.equal(false);
    expect(patched).to.deep.equal({enabled: false, slotContent: CONFIG.slotContent});
  });

  it('raises a request error with status for an unknown slot', async () => {
    server.use(
      http.get(`${BASE}/slots/nope/global`, () =>
        HttpResponse.json({title: 'Slot Not Found', detail: "No slot with ID 'nope'"}, {status: 404}),
      ),
    );
    try {
      await getSlot(fakeInstance(), 'nope', 'global', {siteId: 'RefArch'});
      expect.fail('should throw');
    } catch (error) {
      expect(error).to.be.instanceOf(ExperiencesRequestError);
      expect((error as ExperiencesRequestError).status).to.equal(404);
    }
  });

  it('maps access denied to an unavailable error and accepts 204 deletes', async () => {
    server.use(
      http.delete(CONFIG_URL, () => new HttpResponse(null, {status: 204})),
      http.post(`${BASE}/slot-search`, () => HttpResponse.json({title: 'Forbidden'}, {status: 403})),
    );
    await deleteSlotConfiguration(fakeInstance(), 'home-banner', 'summer', {siteId: 'RefArch'});
    try {
      await searchSlots(fakeInstance(), {siteId: 'RefArch'});
      expect.fail('should throw');
    } catch (error) {
      expect(error).to.be.instanceOf(ExperiencesUnavailableError);
      expect((error as ExperiencesUnavailableError).reason).to.equal('missing-scope');
    }
  });
});
