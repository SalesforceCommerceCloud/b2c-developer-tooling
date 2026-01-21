/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import DocsSchema from '../../../src/commands/docs/schema.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('docs schema', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(DocsSchema, hooks.getConfig(), flags, args);
  }

  it('lists schemas in json mode', async () => {
    const command: any = await createCommand({list: true, json: true}, {});

    const listStub = sinon.stub().returns([{id: 'a', title: 'a', filePath: 'a.xsd'}]);
    command.operations = {...command.operations, listSchemas: listStub};

    const result = await command.run();

    expect(result.entries).to.have.length(1);
  });

  it('errors when query is missing in read mode', async () => {
    const command: any = await createCommand({}, {});

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.calledOnce).to.equal(true);
  });

  it('writes schema content in non-json mode', async () => {
    const command: any = await createCommand({}, {query: 'catalog'});

    sinon.stub(command, 'jsonEnabled').returns(false);
    const readStub = sinon.stub().returns({entry: {id: 'catalog', title: 't', filePath: 'c.xsd'}, content: '<x/>'});
    command.operations = {...command.operations, readSchemaByQuery: readStub};

    const writeStub = sinon.stub(process.stdout, 'write');

    await command.run();

    expect(writeStub.calledOnceWithExactly('<x/>')).to.equal(true);
  });
});
