/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux, Config} from '@oclif/core';
import {expect} from 'chai';
import sinon from 'sinon';
import DocsSearch from '../../../src/commands/docs/search.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('docs search', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    const command: any = new DocsSearch([], config);
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

  it('errors when query is missing in search mode', async () => {
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

  it('lists docs in json mode', async () => {
    const command: any = await createCommand({list: true, json: true}, {});

    sinon.stub(command, 'listDocs').returns([{id: 'a', title: 'A', filePath: 'a.md'}]);

    const result = await command.run();

    expect(result.entries).to.have.length(1);
  });

  it('prints no results message when search returns empty in non-json mode', async () => {
    const command: any = await createCommand({limit: 5}, {query: 'x'});

    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'searchDocs').returns([]);

    const stdoutStub = sinon.stub(ux, 'stdout');

    const result = await command.run();

    expect(result.results).to.have.length(0);
    expect(stdoutStub.calledOnce).to.equal(true);
  });

  it('returns results in json mode', async () => {
    const command: any = await createCommand({json: true, limit: 5}, {query: 'x'});

    sinon.stub(command, 'searchDocs').returns([{entry: {id: 'a', title: 'A', filePath: 'a.md'}, score: 0.1}]);

    const result = await command.run();

    expect(result.results).to.have.length(1);
  });
});
