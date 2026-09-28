/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {fileURLToPath} from 'node:url';
import {Config, ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import CommandsSearch from '../../../src/commands/commands/search.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../helpers/test-setup.js';

interface SearchResponse {
  query: string;
  total: number;
  results: Array<{command: string; id: string}>;
}

describe('commands search', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  // Load the real CLI package so the search runs over actual command metadata.
  let cliConfig: Config;

  before(async () => {
    cliConfig = await Config.load({root: fileURLToPath(new URL('../../..', import.meta.url))});
  });

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(CommandsSearch, cliConfig, flags, args);
  }

  it('finds real CLI commands by task in json mode', async () => {
    const command: any = await createCommand({json: true, limit: 5}, {query: 'deploy cartridges'});

    const result = (await runSilent(() => command.run())) as SearchResponse;

    expect(result.query).to.equal('deploy cartridges');
    expect(result.results[0].id).to.equal('code:deploy');
    expect(result.results[0].command).to.equal(`${cliConfig.bin} code deploy`);
    expect(result.total).to.be.at.most(5);
  });

  it('does not return alias duplicates', async () => {
    const command: any = await createCommand({json: true}, {query: 'reset sandbox'});

    const result = (await runSilent(() => command.run())) as SearchResponse;
    const ids = result.results.map((r) => r.id);

    expect(ids[0]).to.equal('sandbox:reset');
    expect(ids).to.not.include('ods:reset');
  });

  it('restricts results to a topic', async () => {
    const command: any = await createCommand({json: true, topic: 'mrt env'}, {query: 'variables'});

    const result = (await runSilent(() => command.run())) as SearchResponse;

    expect(result.results.length).to.be.greaterThan(0);
    for (const r of result.results) expect(r.id).to.match(/^mrt:env:/);
  });

  it('prints a docs search hint when nothing matches in non-json mode', async () => {
    const command: any = await createCommand({}, {query: 'zzqqxxyy'});
    sinon.stub(command, 'jsonEnabled').returns(false);
    const stdoutStub = sinon.stub(ux, 'stdout');

    const result = (await command.run()) as SearchResponse;

    expect(result.total).to.equal(0);
    expect(stdoutStub.calledOnce).to.equal(true);
    expect(String(stdoutStub.firstCall.args[0])).to.include('docs search');
  });
});
