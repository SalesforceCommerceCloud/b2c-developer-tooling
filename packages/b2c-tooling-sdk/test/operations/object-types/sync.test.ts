/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  applyObjectTypeSync,
  exportObjectTypes,
  planObjectTypeSync,
  type ObjectAttributeDefinition,
  type ObjectAttributeGroup,
  type ObjectTypeExtension,
  type ObjectTypesClient,
} from '../../../src/operations/object-types/index.js';

function fakeClient(attributes: ObjectAttributeDefinition[], groups: ObjectAttributeGroup[], calls: string[] = []) {
  const client = {
    async listAttributeDefinitions(_type: string, options: {kind?: string} = {}) {
      return options.kind === 'custom' ? attributes.filter((attr) => !attr.system) : attributes;
    },
    async listAttributeGroups() {
      return groups;
    },
    async assignAttributeToGroup(type: string, group: string, id: string) {
      calls.push(`assign ${type}/${group}/${id}`);
    },
    async createOrReplaceAttributeDefinition(type: string, body: ObjectAttributeDefinition) {
      calls.push(`put ${type}/${body.id} ${JSON.stringify(body)}`);
      return {created: true, definition: body};
    },
    async createOrReplaceAttributeGroup(type: string, body: ObjectAttributeGroup) {
      calls.push(`put-group ${type}/${body.id}`);
      return {created: true, group: body};
    },
    async updateAttributeDefinition(type: string, id: string, body: object) {
      calls.push(`patch ${type}/${id} ${JSON.stringify(body)}`);
      return {id};
    },
    async updateAttributeGroup(type: string, id: string, body: object) {
      calls.push(`patch-group ${type}/${id} ${JSON.stringify(body)}`);
      return {id};
    },
  };
  return client as unknown as ObjectTypesClient;
}

const live: ObjectAttributeDefinition[] = [
  {id: 'brand', system: true, valueType: 'string', visible: false, displayName: {default: 'Brand'}},
  {
    id: 'fabric',
    system: false,
    valueType: 'string',
    displayName: {default: 'Fabric', de: 'Stoff'},
    mandatory: false,
    minLength: 0,
  },
  {id: 'care', system: false, valueType: 'enum_of_int', valueDefinitions: [{value: '1'}]},
] as ObjectAttributeDefinition[];

describe('operations/object-types/sync', () => {
  it('plans creates, partial updates, group changes, and unsupported-field warnings', async () => {
    const desired: ObjectTypeExtension[] = [
      {
        objectType: 'Product',
        attributes: [
          {id: 'fabric', valueType: 'string', displayName: {default: 'Fabric'}, mandatory: false, minLength: 0},
          {id: 'lining', valueType: 'string', displayName: {fr: 'Doublure'}, fieldLength: 20},
          {id: 'care', valueType: 'enum_of_string', valueDefinitions: [{value: '1'}, {value: '2'}]},
        ],
        systemAttributes: [{id: 'brand', visible: true, fieldLength: 10}],
        groups: [
          {id: 'materials', displayName: {default: 'Materials'}, attributes: [{id: 'fabric'}, {id: 'lining'}]},
          {id: 'existing', displayName: {default: 'Same'}, attributes: [{id: 'fabric'}]},
        ],
      },
    ];
    const plan = await planObjectTypeSync(
      fakeClient(live, [
        {id: 'existing', displayName: {default: 'Same'}},
        {id: 'existing', displayName: {default: 'Duplicate'}, attributeDefinitions: [{id: 'fabric'}]},
      ] as ObjectAttributeGroup[]),
      desired,
    );
    expect(plan.actions.map((action) => `${action.action} ${action.id}`)).to.deep.equal([
      'create-attribute lining',
      'update-attribute brand',
      'create-group materials',
      'assign fabric',
      'assign lining',
    ]);
    expect(plan.actions[1]).to.deep.include({changes: ['visible'], body: {visible: true}});
    // fabric matches (desired locales are a subset), care differs only in unapplicable fields, existing group matches
    expect(plan.unchanged).to.equal(3);
    const messages = plan.warnings.map((warning) => `${warning.id}: ${warning.message}`);
    expect(messages.some((m) => m.startsWith('care: Enum values') && m.includes('2'))).to.equal(true);
    expect(messages.some((m) => m.startsWith('care: Value type differs'))).to.equal(true);
  });

  it('warns about missing object types and system attributes', async () => {
    const client = fakeClient([], []);
    (client as unknown as {listAttributeDefinitions: () => Promise<never>}).listAttributeDefinitions = async () => {
      throw Object.assign(new Error('not found'), {status: 404});
    };
    const plan = await planObjectTypeSync(client, [
      {objectType: 'Nope', attributes: [], systemAttributes: [], groups: []},
    ]);
    expect(plan.actions).to.deep.equal([]);
    expect(plan.warnings[0].message).to.include('does not exist');
  });

  it('applies attribute and group writes before assignments', async () => {
    const calls: string[] = [];
    const client = fakeClient([], [], calls);
    await applyObjectTypeSync(client, {
      unchanged: 0,
      warnings: [],
      actions: [
        {action: 'create-group', objectType: 'Product', id: 'g', body: {id: 'g'}},
        {action: 'assign', objectType: 'Product', group: 'g', id: 'a'},
        {action: 'create-attribute', objectType: 'Product', id: 'a', body: {id: 'a', valueType: 'string'}},
        {action: 'update-group', objectType: 'Product', id: 'h', changes: ['displayName'], body: {}},
      ],
    });
    expect(calls.map((call) => call.split(' ').slice(0, 2).join(' '))).to.deep.equal([
      'put-group Product/g',
      'put Product/a',
      'patch-group Product/h',
      'assign Product/g/a',
    ]);
  });

  it('exports custom attributes and non-internal groups, merging duplicate group IDs', async () => {
    const [product] = await exportObjectTypes(
      fakeClient(live, [
        {id: 'g', attributeDefinitions: [{id: 'fabric'}]},
        {id: 'g', attributeDefinitions: [{id: 'brand', system: true}]},
        {id: 'hidden', internal: true},
      ] as ObjectAttributeGroup[]),
      ['Product'],
    );
    expect(product.attributes.map((attr) => attr.id)).to.deep.equal(['fabric', 'care']);
    expect(product.attributes[0]).to.deep.equal({
      id: 'fabric',
      valueType: 'string',
      displayName: {default: 'Fabric', de: 'Stoff'},
      mandatory: false,
      minLength: 0,
    });
    expect(product.attributes[1].valueDefinitions).to.deep.equal([{value: '1'}]);
    expect(product.groups).to.deep.equal([{id: 'g', attributes: [{id: 'fabric'}, {id: 'brand', system: true}]}]);
  });
});
