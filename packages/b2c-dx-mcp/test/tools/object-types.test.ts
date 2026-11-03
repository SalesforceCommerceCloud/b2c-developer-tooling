/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {stub, restore, type SinonStub} from 'sinon';
import type {ObjectTypesClient} from '@salesforce/b2c-tooling-sdk/operations/object-types';
import {compactAttribute, createObjectTypesDescribeTool} from '../../src/tools/object-types/index.js';
import {Services} from '../../src/services.js';
import {createMockResolvedConfig} from '../test-helpers.js';

type Output = {
  objectTypes?: unknown[];
  attributes?: unknown[];
  groups?: unknown[];
  notes: string[];
  [key: string]: unknown;
};

function parse(result: {content: Array<{type: string; text?: string}>; isError?: boolean}) {
  const first = result.content[0];
  return JSON.parse(first && 'text' in first ? (first.text ?? '') : '') as Output;
}

describe('tools/object-types', () => {
  let services: Services;
  let client: Record<string, SinonStub>;

  beforeEach(() => {
    services = new Services({resolvedConfig: createMockResolvedConfig({shortCode: 'sc', tenantId: 'abcd_prd'})});
    client = {
      listObjectTypes: stub().resolves([
        {objectType: 'Product', displayName: {default: 'Product'}, attributeDefinitionCount: 3, attributeGroupCount: 1},
      ]),
      listAttributeDefinitions: stub().resolves([
        {id: 'name', effectiveId: 'name', valueType: 'string', system: true, localizable: true},
        {
          id: 'color',
          effectiveId: 'c_color',
          valueType: 'enum_of_string',
          displayName: {default: 'Color'},
          valueDefinitions: [{value: 'red', displayValue: {default: 'Red'}}, {value: 'blue'}],
        },
        {id: 'fabric', effectiveId: 'c_fabric', valueType: 'string'},
      ]),
      listAttributeGroups: stub().resolves([
        {id: 'g', displayName: {default: 'G'}, attributeDefinitions: [{id: 'color', effectiveId: 'c_color'}]},
        {id: 'g', attributeDefinitions: [{id: 'name', effectiveId: 'name'}]},
        {id: 'hidden', internal: true},
      ]),
    };
    stub(services, 'getObjectTypesClient').returns(client as unknown as ObjectTypesClient);
  });

  afterEach(() => restore());

  it('is a read tool in the CARTRIDGES and SCAPI toolsets', () => {
    const tool = createObjectTypesDescribeTool(() => services);
    expect(tool.name).to.equal('object_types_describe');
    expect(tool.toolsets).to.have.members(['CARTRIDGES', 'SCAPI']);
  });

  it('lists object types without objectType', async () => {
    const tool = createObjectTypesDescribeTool(() => services);
    const out = parse(await tool.handler({}));
    expect(out.objectTypes).to.deep.equal([{objectType: 'Product', name: 'Product', attributes: 3, groups: 1}]);
  });

  it('returns compact attributes with paging, merged groups, and an enum hint', async () => {
    const tool = createObjectTypesDescribeTool(() => services);
    const out = parse(await tool.handler({objectType: 'Product', includeGroups: true, limit: 2}));
    expect(out).to.include({objectType: 'Product', total: 3, offset: 0, nextOffset: 2});
    expect(out.attributes).to.deep.equal([
      {id: 'name', type: 'string', system: true, localizable: true},
      {id: 'c_color', type: 'enum_of_string', name: 'Color'},
    ]);
    expect(out.groups).to.deep.equal([{id: 'g', name: 'G', attributes: ['c_color', 'name']}]);
    expect(out.notes[0]).to.include('includeValues');
  });

  it('builds an exact-ID search with kind and text filters', async () => {
    const tool = createObjectTypesDescribeTool(() => services);
    await tool.handler({objectType: 'Product', ids: ['c_color'], kind: 'custom', search: 'col', includeValues: true});
    const [type, options] = client.listAttributeDefinitions.firstCall.args;
    expect(type).to.equal('Product');
    expect(options.includeValues).to.equal(true);
    expect(options.query.boolQuery.must).to.deep.equal([
      {termQuery: {fields: ['id'], operator: 'one_of', values: ['color']}},
      {termQuery: {fields: ['system'], operator: 'is', values: [false]}},
      {textQuery: {fields: ['id', 'display_name'], searchPhrase: 'col'}},
    ]);
  });

  it('caps enum values per attribute', () => {
    const values = Array.from({length: 60}, (_, i) => ({value: `v${i}`}));
    const compact = compactAttribute({id: 'x', valueType: 'enum_of_string', valueDefinitions: values} as never);
    expect(compact.values).to.have.length(50);
    expect(compact.valuesTruncated).to.equal(10);
    expect(
      compactAttribute({id: 'c', valueDefinitions: [{value: 'red', displayValue: {default: 'Red'}}]} as never).values,
    ).to.deep.equal([{value: 'red', label: 'Red'}]);
  });
});
