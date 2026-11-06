/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {
  ObjectTypesClient,
  buildCustomAttributeTypes,
  customAttributePropertyTypes,
  generateCustomAttributeTypes,
  type ObjectAttributeDefinition,
} from '../../../src/operations/object-types/index.js';
import {SafetyBlockedError} from '../../../src/safety/index.js';
import {MockAuthStrategy} from '../../helpers/mock-auth.js';

const attr = (overrides: Partial<ObjectAttributeDefinition> & {id: string}): ObjectAttributeDefinition =>
  ({system: false, valueType: 'string', ...overrides}) as ObjectAttributeDefinition;

describe('operations/object-types/script-types', () => {
  afterEach(() => sinon.restore());

  describe('customAttributePropertyTypes', () => {
    it('maps scalar value types', () => {
      expect(customAttributePropertyTypes(attr({id: 'a', valueType: 'string'}))).to.deep.equal({get: 'string'});
      expect(customAttributePropertyTypes(attr({id: 'a', valueType: 'int'}))).to.deep.equal({get: 'number'});
      expect(customAttributePropertyTypes(attr({id: 'a', valueType: 'boolean'}))).to.deep.equal({get: 'boolean'});
      expect(customAttributePropertyTypes(attr({id: 'a', valueType: 'datetime'}))).to.deep.equal({get: 'Date'});
      expect(customAttributePropertyTypes(attr({id: 'a', valueType: 'set_of_string'}))).to.deep.equal({
        get: 'string[]',
      });
    });

    it('uses platform types for html, image, and money with plain setters', () => {
      expect(customAttributePropertyTypes(attr({id: 'a', valueType: 'html'}))).to.deep.equal({
        get: 'dw.content.MarkupText',
        set: 'string',
      });
      expect(customAttributePropertyTypes(attr({id: 'a', valueType: 'image'})).get).to.equal('dw.content.MediaFile');
      expect(customAttributePropertyTypes(attr({id: 'a', valueType: 'money'})).get).to.equal('dw.value.Money');
    });

    it('narrows enum values to literal types', () => {
      const types = customAttributePropertyTypes(
        attr({
          id: 'color',
          valueType: 'enum_of_string',
          valueDefinitions: [{value: 'red'}, {value: 'blue'}],
        }),
      );
      expect(types.get).to.include('readonly value: "red" | "blue"');
      expect(types.set).to.equal('"red" | "blue"');
    });

    it('uses arrays for multi-value enums and numbers for enum_of_int', () => {
      const types = customAttributePropertyTypes(
        attr({
          id: 'size',
          valueType: 'enum_of_int',
          multiValueType: true,
          valueDefinitions: [{value: '1'}, {value: '2'}],
        }),
      );
      expect(types.get).to.match(/^Array<.*1 \| 2.*>$/);
      expect(types.set).to.equal('Array<1 | 2>');
    });

    it('falls back to plain EnumValue without values', () => {
      expect(customAttributePropertyTypes(attr({id: 'a', valueType: 'enum_of_string'}))).to.deep.equal({
        get: 'dw.value.EnumValue',
        set: 'string',
      });
    });
  });

  describe('buildCustomAttributeTypes', () => {
    it('declares ICustomAttributes interfaces with doc comments', () => {
      const content = buildCustomAttributeTypes(
        [
          {
            objectType: 'Product',
            attributes: [
              attr({id: 'bagType', displayName: {default: 'Bag Type'}, effectiveId: 'c_bagType'}),
              attr({id: 'name', system: true}),
              attr({id: 'teaser', valueType: 'html', description: {default: 'Short */ text'}}),
            ],
          },
          {objectType: 'Order', attributes: []},
        ],
        {header: 'Instance: example.com'},
      );
      expect(content).to.include('// Instance: example.com');
      expect(content).to.include('declare namespace ICustomAttributes {');
      expect(content).to.include('    interface Product {');
      expect(content).to.include('        bagType: string | null;');
      expect(content).to.include('Custom attribute `c_bagType` (string).');
      expect(content).to.include('        get teaser(): dw.content.MarkupText | null;');
      expect(content).to.include('        set teaser(value: string | null);');
      expect(content).to.include('Short *\\/ text');
      expect(content).to.not.include('name:');
      expect(content).to.not.include('interface Order');
    });

    it('quotes attribute IDs that are not identifiers', () => {
      const content = buildCustomAttributeTypes([{objectType: 'Product', attributes: [attr({id: 'my-attr'})]}]);
      expect(content).to.include('"my-attr": string | null;');
    });
  });

  describe('generateCustomAttributeTypes', () => {
    let client: ObjectTypesClient;

    beforeEach(() => {
      client = new ObjectTypesClient({shortCode: 'abc', tenantId: 'zzxy_prd', auth: new MockAuthStrategy()});
    });

    it('lists all object types and includes enum values', async () => {
      sinon.stub(client, 'listObjectTypes').resolves([{objectType: 'Product'}, {objectType: 'Order'}] as never);
      const list = sinon
        .stub(client, 'listAttributeDefinitions')
        .callsFake(async (type) =>
          type === 'Product'
            ? [attr({id: 'color', valueType: 'enum_of_string', valueDefinitions: [{value: 'red'}]})]
            : [],
        );

      const result = await generateCustomAttributeTypes(client);
      expect(list.firstCall.args[1]).to.deep.equal({kind: 'custom', includeValues: true});
      expect(result.objectTypes).to.deep.equal([{objectType: 'Product', attributes: 1}]);
      expect(result.valuesIncluded).to.equal(true);
      expect(result.content).to.include('"red"');
    });

    it('falls back to the plain listing when the search is blocked', async () => {
      const list = sinon.stub(client, 'listAttributeDefinitions');
      list
        .withArgs('Product', {kind: 'custom', includeValues: true})
        .rejects(new SafetyBlockedError('blocked', 'POST', 'https://example.com', 'READ_ONLY'));
      list.withArgs('Product').resolves([attr({id: 'name', system: true}), attr({id: 'color'})]);

      const result = await generateCustomAttributeTypes(client, {objectTypes: ['Product']});
      expect(result.valuesIncluded).to.equal(false);
      expect(result.warnings[0]).to.include('safety level');
      expect(result.objectTypes).to.deep.equal([{objectType: 'Product', attributes: 1}]);
    });

    it('skips object types that do not exist', async () => {
      sinon.stub(client, 'listAttributeDefinitions').rejects(Object.assign(new Error('nope'), {status: 404}));
      const result = await generateCustomAttributeTypes(client, {objectTypes: ['Nope']});
      expect(result.objectTypes).to.deep.equal([]);
      expect(result.warnings[0]).to.include('Nope');
    });
  });
});
