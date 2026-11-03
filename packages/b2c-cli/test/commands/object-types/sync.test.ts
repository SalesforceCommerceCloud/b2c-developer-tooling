/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import ObjectTypesApply from '../../../src/commands/object-types/apply.js';
import ObjectTypesExport from '../../../src/commands/object-types/export.js';
import {stubParse} from '../../helpers/stub-parse.js';
import {createIsolatedEnvHooks} from '../../helpers/test-setup.js';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="Product">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="fabric">
                <type>string</type>
            </attribute-definition>
        </custom-attribute-definitions>
        <group-definitions>
            <attribute-group group-id="materials">
                <attribute attribute-id="fabric"/>
            </attribute-group>
        </group-definitions>
    </type-extension>
    <type-extension type-id="Order">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="erpId">
                <type>string</type>
            </attribute-definition>
        </custom-attribute-definitions>
    </type-extension>
    <custom-type type-id="MyType"/>
</metadata>`;

describe('object-types export/apply', () => {
  const hooks = createIsolatedEnvHooks();
  let config: Config;
  let fake: Record<string, sinon.SinonStub>;
  let dir: string;

  beforeEach(async () => {
    hooks.beforeEach();
    config = await Config.load();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-ot-'));
    fake = {
      assignAttributeToGroup: sinon.stub().resolves(),
      createOrReplaceAttributeDefinition: sinon.stub().resolves({created: true}),
      createOrReplaceAttributeGroup: sinon.stub().resolves({created: true}),
      listAttributeDefinitions: sinon.stub().resolves([]),
      listAttributeGroups: sinon.stub().resolves([]),
      updateAttributeDefinition: sinon.stub().resolves({}),
      updateAttributeGroup: sinon.stub().resolves({}),
    };
  });

  afterEach(() => {
    sinon.restore();
    fs.rmSync(dir, {recursive: true, force: true});
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

  it('exports metadata XML to a file', async () => {
    fake.listAttributeDefinitions.resolves([{id: 'fabric', valueType: 'string', system: false}]);
    fake.listAttributeGroups.resolves([{id: 'materials', attributeDefinitions: [{id: 'fabric'}]}]);
    const output = path.join(dir, 'meta', 'system-objecttype-extensions.xml');
    const command = await createCommand(
      ObjectTypesExport,
      {format: 'xml', output, 'include-internal': false},
      {'object-type': 'Product'},
      ['Product'],
    );
    const result = await command.run();
    expect(result.output).to.equal(output);
    const xml = fs.readFileSync(output, 'utf8');
    expect(xml).to.include('<type-extension type-id="Product">');
    expect(xml).to.include('<attribute attribute-id="fabric"/>');
    expect(fake.listAttributeDefinitions.firstCall.args[1]).to.deep.include({kind: 'custom', includeValues: true});
  });

  it('plans from a directory without writing on --dry-run', async () => {
    fs.mkdirSync(path.join(dir, 'meta'));
    fs.writeFileSync(path.join(dir, 'meta', 'system-objecttype-extensions.xml'), XML);
    const command = await createCommand(
      ObjectTypesApply,
      {'dry-run': true, force: false, type: ['Product']},
      {path: dir},
    );
    const result = await command.run();
    expect(result.applied).to.equal(false);
    expect(result.skippedCustomTypes).to.deep.equal(['MyType']);
    expect(result.actions.map((a: {action: string}) => a.action)).to.deep.equal([
      'create-attribute',
      'create-group',
      'assign',
    ]);
    expect(fake.listAttributeDefinitions.calledOnceWith('Product')).to.equal(true);
    expect(fake.createOrReplaceAttributeDefinition.called).to.equal(false);
  });

  it('applies changes from a file', async () => {
    const file = path.join(dir, 'meta.xml');
    fs.writeFileSync(file, XML);
    const command = await createCommand(ObjectTypesApply, {'dry-run': false, force: true}, {path: file});
    const result = await command.run();
    expect(result.applied).to.equal(true);
    expect(fake.createOrReplaceAttributeDefinition.callCount).to.equal(2);
    expect(fake.createOrReplaceAttributeGroup.calledOnce).to.equal(true);
    expect(fake.assignAttributeToGroup.calledOnceWith('Product', 'materials', 'fabric')).to.equal(true);
  });

  it('reads JSON produced by export --format json', async () => {
    const file = path.join(dir, 'product.json');
    fs.writeFileSync(
      file,
      JSON.stringify([
        {objectType: 'Product', attributes: [{id: 'fabric', valueType: 'string'}], systemAttributes: [], groups: []},
      ]),
    );
    const command = await createCommand(ObjectTypesApply, {'dry-run': true, force: false}, {path: file});
    const result = await command.run();
    expect(result.actions).to.have.length(1);
  });

  it('fails when no definitions are found', async () => {
    const file = path.join(dir, 'empty.xml');
    fs.writeFileSync(file, XML);
    const command = await createCommand(
      ObjectTypesApply,
      {'dry-run': true, force: false, type: ['Nope']},
      {path: file},
    );
    try {
      await command.run();
      expect.fail('expected error');
    } catch (error) {
      expect((error as Error).message).to.include('No system object type definitions');
    }
  });
});
