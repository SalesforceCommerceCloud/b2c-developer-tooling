/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import DocsSchema from '../../../src/commands/docs/schema.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('docs schema', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    const command: any = new DocsSchema([], config);
    stubParse(command, flags, args);
    await command.init();
    return command;
  }

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('lists schemas in json mode', async () => {
    const command: any = await createCommand({list: true, json: true}, {});

    sinon.stub(command, 'listSchemas').returns([{id: 'a', title: 'a', filePath: 'a.xsd'}]);

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
    sinon
      .stub(command, 'readSchemaByQuery')
      .returns({entry: {id: 'catalog', title: 't', filePath: 'c.xsd'}, content: '<x/>'});

    const writeStub = sinon.stub(process.stdout, 'write');

    await command.run();

    expect(writeStub.calledOnceWithExactly('<x/>')).to.equal(true);
  });
});
