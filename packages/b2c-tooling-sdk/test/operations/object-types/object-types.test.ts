/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {ObjectTypesClient, localizedDefault, normalizeAttributeId} from '../../../src/operations/object-types/index.js';
import {ScapiRequestError} from '../../../src/clients/scapi-backend-utils.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const BASE = 'https://kv7kzm78.api.commercecloud.salesforce.com/dx/object-definitions/v1/organizations/f_ecom_zzxy_prd';
const TYPE = `${BASE}/system/object-types/Product`;

type SearchBody = {
  query?: {boolQuery?: {must?: unknown[]}; matchAllQuery?: object};
  limit?: number;
  offset?: number;
  [key: string]: unknown;
};

describe('operations/object-types', () => {
  const server = setupServer();
  let ot: ObjectTypesClient;

  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  beforeEach(() => {
    ot = new ObjectTypesClient({shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: new MockAuthStrategy()});
  });

  describe('helpers', () => {
    it('strips the c_ prefix from attribute IDs', () => {
      expect(normalizeAttributeId('c_color')).to.equal('color');
      expect(normalizeAttributeId('name')).to.equal('name');
    });

    it('returns the default localized value or the first value', () => {
      expect(localizedDefault({default: 'A', fr: 'B'})).to.equal('A');
      expect(localizedDefault({fr: 'B'})).to.equal('B');
      expect(localizedDefault(undefined)).to.equal(undefined);
    });
  });

  describe('listObjectTypes', () => {
    it('selects all fields, pages, and omits unnamed CustomObject entries', async () => {
      const offsets: string[] = [];
      server.use(
        http.get(`${BASE}/system/object-types`, ({request}) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('select')).to.equal('(**)');
          offsets.push(url.searchParams.get('offset')!);
          const offset = Number(url.searchParams.get('offset'));
          const page = offset === 0 ? [{objectType: 'Order'}, {objectType: 'CustomObject'}] : [{objectType: 'Product'}];
          return HttpResponse.json({data: page, offset, limit: page.length, total: 3});
        }),
      );

      const types = await ot.listObjectTypes();
      expect(offsets).to.deep.equal(['0', '2']);
      expect(types.map((type) => type.objectType)).to.deep.equal(['Order', 'Product']);
    });
  });

  describe('listAttributeDefinitions', () => {
    it('uses the list endpoint without filters', async () => {
      server.use(
        http.get(`${TYPE}/attribute-definitions`, () =>
          HttpResponse.json({data: [{id: 'name'}, {id: 'color'}], offset: 0, limit: 2, total: 2}),
        ),
      );
      const attrs = await ot.listAttributeDefinitions('Product');
      expect(attrs.map((attr) => attr.id)).to.deep.equal(['name', 'color']);
    });

    it('builds a search query for custom, text, and group filters', async () => {
      let body: SearchBody = {};
      server.use(
        http.post(`${TYPE}/attribute-definition-search`, async ({request}) => {
          body = (await request.json()) as SearchBody;
          return HttpResponse.json({hits: [{id: 'bagType', valueDefinitions: [{value: 'tote'}]}], total: 1, limit: 1});
        }),
      );

      const attrs = await ot.listAttributeDefinitions('Product', {kind: 'custom', text: 'bag', group: 'g1'});
      expect(attrs[0].valueDefinitions?.[0].value).to.equal('tote');
      expect(body.limit).to.equal(200);
      expect(body.offset).to.equal(0);
      expect(body.query?.boolQuery?.must).to.deep.equal([
        {termQuery: {fields: ['system'], operator: 'is', values: [false]}},
        {termQuery: {fields: ['group'], operator: 'is', values: ['g1']}},
        {textQuery: {fields: ['id', 'display_name'], searchPhrase: 'bag'}},
      ]);
    });

    it('uses matchAll search when only values are requested', async () => {
      let body: SearchBody = {};
      server.use(
        http.post(`${TYPE}/attribute-definition-search`, async ({request}) => {
          body = (await request.json()) as SearchBody;
          return HttpResponse.json({hits: [], total: 0, limit: 0});
        }),
      );
      await ot.listAttributeDefinitions('Product', {includeValues: true});
      expect(body.query).to.deep.equal({matchAllQuery: {}});
    });
  });

  describe('getAttributeDefinition', () => {
    it('addresses custom attributes by plain ID', async () => {
      server.use(
        http.get(`${TYPE}/attribute-definitions/color`, () =>
          HttpResponse.json({id: 'color', effectiveId: 'c_color', valueType: 'string'}),
        ),
      );
      const attr = await ot.getAttributeDefinition('Product', 'c_color');
      expect(attr.effectiveId).to.equal('c_color');
    });

    it('uses search to include enum values', async () => {
      server.use(
        http.post(`${TYPE}/attribute-definition-search`, () =>
          HttpResponse.json({hits: [{id: 'color', valueDefinitions: [{value: 'red'}]}], total: 1, limit: 1}),
        ),
      );
      const attr = await ot.getAttributeDefinition('Product', 'c_color', {includeValues: true});
      expect(attr.valueDefinitions).to.have.length(1);
    });

    it('throws a ScapiRequestError with the status on 404', async () => {
      server.use(
        http.get(`${TYPE}/attribute-definitions/missing`, () =>
          HttpResponse.json(
            {title: 'Attribute Definition Not Found', detail: 'No attribute definition'},
            {status: 404},
          ),
        ),
      );
      try {
        await ot.getAttributeDefinition('Product', 'missing');
        expect.fail('expected error');
      } catch (error) {
        expect(error).to.be.instanceOf(ScapiRequestError);
        expect((error as ScapiRequestError).status).to.equal(404);
      }
    });
  });

  describe('writes', () => {
    it('reports created vs replaced from the PUT status', async () => {
      let body: SearchBody = {};
      server.use(
        http.put(`${TYPE}/attribute-definitions/fabric`, async ({request}) => {
          body = (await request.json()) as SearchBody;
          return HttpResponse.json({id: 'fabric', effectiveId: 'c_fabric'}, {status: 201});
        }),
      );
      const result = await ot.createOrReplaceAttributeDefinition('Product', {id: 'c_fabric', valueType: 'string'});
      expect(result.created).to.equal(true);
      expect(body).to.deep.equal({id: 'fabric', valueType: 'string'});
    });

    it('patches with the plain ID in the body', async () => {
      let body: SearchBody = {};
      server.use(
        http.patch(`${TYPE}/attribute-definitions/fabric`, async ({request}) => {
          body = (await request.json()) as SearchBody;
          return HttpResponse.json({id: 'fabric', searchable: true});
        }),
      );
      await ot.updateAttributeDefinition('Product', 'c_fabric', {searchable: true});
      expect(body).to.deep.equal({searchable: true, id: 'fabric'});
    });

    it('assigns and unassigns attributes to groups', async () => {
      const calls: string[] = [];
      server.use(
        http.put(`${TYPE}/attribute-groups/g1/attribute-definitions/:defId`, ({params}) => {
          calls.push(`put:${params.defId}`);
          return new HttpResponse(null, {status: 204});
        }),
        http.delete(`${TYPE}/attribute-groups/g1/attribute-definitions/:defId`, ({params}) => {
          calls.push(`delete:${params.defId}`);
          return new HttpResponse(null, {status: 204});
        }),
      );
      await ot.assignAttributeToGroup('Product', 'g1', 'c_fabric');
      await ot.unassignAttributeFromGroup('Product', 'g1', 'name');
      expect(calls).to.deep.equal(['put:fabric', 'delete:name']);
    });

    it('surfaces API errors on delete', async () => {
      server.use(
        http.delete(`${TYPE}/attribute-definitions/name`, () =>
          HttpResponse.json({title: 'Attribute Definition Read Only', detail: 'read-only'}, {status: 400}),
        ),
      );
      try {
        await ot.deleteAttributeDefinition('Product', 'name');
        expect.fail('expected error');
      } catch (error) {
        expect((error as Error).message).to.include('read-only');
      }
    });
  });

  describe('groups', () => {
    it('lists groups with expand=definition', async () => {
      server.use(
        http.get(`${TYPE}/attribute-groups`, ({request}) => {
          expect(new URL(request.url).searchParams.get('expand')).to.equal('definition');
          return HttpResponse.json({
            data: [{id: 'g1', attributeDefinitions: [{id: 'fabric'}]}],
            offset: 0,
            limit: 1,
            total: 1,
          });
        }),
      );
      const groups = await ot.listAttributeGroups('Product', {expandDefinitions: true});
      expect(groups[0].attributeDefinitions?.[0].id).to.equal('fabric');
    });
  });
});
