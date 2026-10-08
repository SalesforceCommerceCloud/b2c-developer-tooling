/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  loadScapiSchemas,
  runScapiCode,
  searchScapiOperations,
  type ScapiSchemaDocument,
} from '@salesforce/b2c-tooling-sdk/scapi';

function document(id: string, paths: Record<string, unknown>, apiFamily = id.split('/')[0]): ScapiSchemaDocument {
  const [, apiName, apiVersion] = id.split('/');
  return {
    entry: {id, apiFamily, apiName, apiVersion, schemaVersion: '1', status: 'current', file: '', source: ''},
    schema: {paths},
  };
}

describe('SCAPI operation search', function () {
  this.timeout(10_000);

  it('ranks operations by prose that a regex over operation ids would miss', () => {
    const bundled = loadScapiSchemas();
    expect(searchScapiOperations(bundled, 'url redirect', {limit: 1})[0]).to.include({operationId: 'getUrlMapping'});
    expect(searchScapiOperations(bundled, 'stores near postal code', {limit: 1})[0]).to.include({
      api: 'store/shopper-stores/v1',
      operationId: 'searchStores',
    });
    // Typos in distinctive words still match.
    expect(searchScapiOperations(bundled, 'reservaton', {limit: 1})[0].api).to.equal('inventory/reservation/v1');
  });

  it('returns paths that index spec.paths, newest version first, with older versions listed', () => {
    const [match] = searchScapiOperations(loadScapiSchemas(), 'shipping methods for shipment', {limit: 1});
    expect(match).to.include({
      api: 'checkout/shopper-baskets/v2',
      method: 'get',
      operationId: 'getShippingMethodsForShipment',
      path: '/checkout/shopper-baskets/v2/organizations/{organizationId}/baskets/{basketId}/shipments/{shipmentId}/shipping-methods',
    });
    expect(match.otherVersions).to.deep.equal(['v1']);
  });

  it('collapses versions regardless of document order and keeps custom API organization segments', () => {
    const v2 = document('custom/loyalty/v2', {'/points': {get: {operationId: 'getPoints', summary: 'Loyalty points'}}});
    const v1 = document('custom/loyalty/v1', {'/points': {get: {operationId: 'getPoints', summary: 'Loyalty points'}}});
    const matches = searchScapiOperations([v2, v1], 'loyalty points');
    expect(matches).to.have.length(1);
    expect(matches[0]).to.include({
      api: 'custom/loyalty/v2',
      path: '/custom/loyalty/v2/organizations/{organizationId}/points',
    });
    expect(matches[0].otherVersions).to.deep.equal(['v1']);
  });

  it('bounds limits, ignores blank queries and shortens long summaries', () => {
    const long = document('product/notes/v1', {
      '/notes': {get: {operationId: 'getNotes', summary: `Product notes.\n\n${'Detail '.repeat(60)}`}},
    });
    expect(searchScapiOperations([long], '   ')).to.deep.equal([]);
    const [match] = searchScapiOperations([long], 'notes');
    expect(match.summary)
      .to.match(/^Product notes\. Detail/)
      .and.to.have.length(200);
    expect(searchScapiOperations(loadScapiSchemas(), 'product', {limit: 500})).to.have.length(50);
    expect(searchScapiOperations(loadScapiSchemas(), 'product', {limit: 0})).to.have.length(1);
  });

  it('exposes spec.search in code mode over the authType-filtered documents', async () => {
    const result = (await runScapiCode({
      documents: loadScapiSchemas(),
      authType: 'admin',
      code: `async () => {
        const matches = await spec.search('gift certificate balance', {limit: 5});
        return {matches, operation: spec.paths[matches[0].path][matches[0].method].operationId};
      }`,
    })) as {matches: Array<{api: string; operationId: string}>; operation: string};
    expect(result.matches[0].api).to.equal('pricing/gift-certificates/v1');
    expect(result.matches.map((match) => match.api)).not.to.include('pricing/shopper-gift-certificates/v1');
    expect(result.operation).to.equal(result.matches[0].operationId);
  });
});
