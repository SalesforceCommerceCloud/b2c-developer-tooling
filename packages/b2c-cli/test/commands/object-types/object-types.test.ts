/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import ObjectTypesList from '../../../src/commands/object-types/list.js';
import ObjectTypesAttributesList from '../../../src/commands/object-types/attributes/list.js';
import ObjectTypesAttributesCreate from '../../../src/commands/object-types/attributes/create.js';
import ObjectTypesAttributesUpdate from '../../../src/commands/object-types/attributes/update.js';
import ObjectTypesAttributesDelete from '../../../src/commands/object-types/attributes/delete.js';
import ObjectTypesGroupsCreate from '../../../src/commands/object-types/groups/create.js';
import ObjectTypesGroupsAssign from '../../../src/commands/object-types/groups/assign.js';
import ObjectTypesGroupsUnassign from '../../../src/commands/object-types/groups/unassign.js';
import {parseLocalized} from '../../../src/utils/object-types.js';
import {stubParse} from '../../helpers/stub-parse.js';
import {createIsolatedEnvHooks} from '../../helpers/test-setup.js';

function notFound(): Error {
  return Object.assign(new Error('not found'), {status: 404});
}

describe('object-types commands', () => {
  const hooks = createIsolatedEnvHooks();
  let config: Config;
  let fake: Record<string, sinon.SinonStub>;

  beforeEach(async () => {
    hooks.beforeEach();
    config = await Config.load();
    fake = {
      assignAttributeToGroup: sinon.stub().resolves(),
      createOrReplaceAttributeDefinition: sinon.stub(),
      createOrReplaceAttributeGroup: sinon.stub(),
      deleteAttributeDefinition: sinon.stub().resolves(),
      getAttributeDefinition: sinon.stub(),
      getAttributeGroup: sinon.stub(),
      listAttributeDefinitions: sinon.stub().resolves([]),
      listObjectTypes: sinon.stub().resolves([]),
      unassignAttributeFromGroup: sinon.stub().resolves(),
      updateAttributeDefinition: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
    hooks.afterEach();
  });

  async function createCommand(
    Cls: any,
    flags: Record<string, unknown>,
    args: Record<string, unknown>,
    argv: string[] = [],
  ): Promise<any> {
    const command: any = new Cls([], config);
    stubParse(command, flags, args, argv);
    await command.init();
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'objectTypes').get(() => fake);
    sinon.stub(command, 'error').callsFake((msg: unknown) => {
      throw new Error(String(msg));
    });
    return command;
  }

  describe('parseLocalized', () => {
    it('maps plain values to default and locale-prefixed values to their locale', () => {
      expect(parseLocalized(['Fabric', 'fr=Tissu', 'en_US=Fabric (US)'])).to.deep.equal({
        default: 'Fabric',
        fr: 'Tissu',
        en_US: 'Fabric (US)',
      });
      expect(parseLocalized([])).to.equal(undefined);
    });
  });

  it('list returns object types with a total', async () => {
    fake.listObjectTypes.resolves([{objectType: 'Product'}, {objectType: 'Order'}]);
    const command = await createCommand(ObjectTypesList, {}, {});
    const result = await command.run();
    expect(result.total).to.equal(2);
  });

  it('attributes list maps filter flags to list options', async () => {
    const command = await createCommand(
      ObjectTypesAttributesList,
      {custom: true, search: 'bag', group: 'g1', extended: true},
      {'object-type': 'Product'},
    );
    await command.run();
    expect(fake.listAttributeDefinitions.firstCall.args).to.deep.equal([
      'Product',
      {kind: 'custom', text: 'bag', group: 'g1', includeValues: true},
    ]);
  });

  describe('attributes create', () => {
    it('creates an attribute from flags with the plain ID', async () => {
      fake.getAttributeDefinition.rejects(notFound());
      fake.createOrReplaceAttributeDefinition.resolves({created: true, definition: {id: 'fabric'}});
      const command = await createCommand(
        ObjectTypesAttributesCreate,
        {type: 'string', 'display-name': ['Fabric', 'fr=Tissu'], localizable: true, replace: false},
        {'object-type': 'Product', id: 'c_fabric'},
      );
      await command.run();
      const [objectType, body] = fake.createOrReplaceAttributeDefinition.firstCall.args;
      expect(objectType).to.equal('Product');
      expect(body).to.deep.include({
        id: 'fabric',
        valueType: 'string',
        localizable: true,
        displayName: {default: 'Fabric', fr: 'Tissu'},
      });
    });

    it('refuses to overwrite an existing attribute without --replace', async () => {
      fake.getAttributeDefinition.resolves({id: 'fabric'});
      const command = await createCommand(
        ObjectTypesAttributesCreate,
        {type: 'string', replace: false},
        {'object-type': 'Product', id: 'fabric'},
      );
      try {
        await command.run();
        expect.fail('expected error');
      } catch (error) {
        expect((error as Error).message).to.include('already exists');
      }
      expect(fake.createOrReplaceAttributeDefinition.called).to.equal(false);
    });

    it('skips the existence check with --replace', async () => {
      fake.createOrReplaceAttributeDefinition.resolves({created: false, definition: {id: 'fabric'}});
      const command = await createCommand(
        ObjectTypesAttributesCreate,
        {type: 'string', replace: true},
        {'object-type': 'Product', id: 'fabric'},
      );
      await command.run();
      expect(fake.getAttributeDefinition.called).to.equal(false);
    });

    it('requires a value type', async () => {
      const command = await createCommand(
        ObjectTypesAttributesCreate,
        {replace: false},
        {'object-type': 'Product', id: 'x'},
      );
      try {
        await command.run();
        expect.fail('expected error');
      } catch (error) {
        expect((error as Error).message).to.include('value type is required');
      }
    });

    it('rethrows non-404 errors from the existence check', async () => {
      fake.getAttributeDefinition.rejects(Object.assign(new Error('forbidden'), {status: 403}));
      const command = await createCommand(
        ObjectTypesAttributesCreate,
        {type: 'string', replace: false},
        {'object-type': 'Product', id: 'x'},
      );
      try {
        await command.run();
        expect.fail('expected error');
      } catch (error) {
        expect((error as Error).message).to.equal('forbidden');
      }
    });
  });

  describe('attributes update', () => {
    it('sends only the changed properties', async () => {
      fake.updateAttributeDefinition.resolves({id: 'fabric', searchable: true});
      const command = await createCommand(
        ObjectTypesAttributesUpdate,
        {searchable: true},
        {'object-type': 'Product', id: 'c_fabric'},
      );
      await command.run();
      expect(fake.updateAttributeDefinition.firstCall.args).to.deep.equal(['Product', 'c_fabric', {searchable: true}]);
    });

    it('errors when nothing would change', async () => {
      const command = await createCommand(ObjectTypesAttributesUpdate, {}, {'object-type': 'Product', id: 'fabric'});
      try {
        await command.run();
        expect.fail('expected error');
      } catch (error) {
        expect(fake.updateAttributeDefinition.called).to.equal(false);
        expect((error as Error).message).to.not.equal('expected error');
      }
    });
  });

  it('attributes delete deletes without prompting in JSON mode', async () => {
    const command = await createCommand(
      ObjectTypesAttributesDelete,
      {force: false},
      {'object-type': 'Product', id: 'c_fabric'},
    );
    const result = await command.run();
    expect(fake.deleteAttributeDefinition.firstCall.args).to.deep.equal(['Product', 'fabric']);
    expect(result).to.deep.equal({deleted: true, objectType: 'Product', id: 'fabric'});
  });

  it('groups create writes the group and assigns attributes', async () => {
    fake.getAttributeGroup.onFirstCall().rejects(notFound());
    fake.getAttributeGroup.onSecondCall().resolves({id: 'materials', attributeDefinitions: [{id: 'fabric'}]});
    fake.createOrReplaceAttributeGroup.resolves({created: true, group: {id: 'materials'}});
    const command = await createCommand(
      ObjectTypesGroupsCreate,
      {'display-name': ['Materials'], attribute: ['c_fabric', 'name']},
      {'object-type': 'Product', id: 'materials'},
    );
    const result = await command.run();
    expect(fake.createOrReplaceAttributeGroup.firstCall.args[1]).to.deep.include({
      id: 'materials',
      displayName: {default: 'Materials'},
    });
    expect(fake.assignAttributeToGroup.args).to.deep.equal([
      ['Product', 'materials', 'c_fabric'],
      ['Product', 'materials', 'name'],
    ]);
    expect(result.attributeDefinitions).to.have.length(1);
  });

  it('groups assign takes variadic attribute IDs', async () => {
    const command = await createCommand(ObjectTypesGroupsAssign, {}, {'object-type': 'Product', group: 'materials'}, [
      'Product',
      'materials',
      'c_fabric',
      'c_lining',
    ]);
    const result = await command.run();
    expect(result.attributes).to.deep.equal(['fabric', 'lining']);
    expect(fake.assignAttributeToGroup.callCount).to.equal(2);
  });

  it('groups unassign requires at least one attribute', async () => {
    const command = await createCommand(ObjectTypesGroupsUnassign, {}, {'object-type': 'Product', group: 'materials'}, [
      'Product',
      'materials',
    ]);
    try {
      await command.run();
      expect.fail('expected error');
    } catch (error) {
      expect((error as Error).message).to.include('one or more attribute IDs');
    }
    expect(fake.unassignAttributeFromGroup.called).to.equal(false);
  });
});
