/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import DocsSearch from '../../../src/commands/docs/search.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../helpers/test-setup.js';

describe('docs search', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(DocsSearch, hooks.getConfig(), flags, args);
  }

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

    const listStub = sinon.stub().returns([{id: 'a', title: 'A', filePath: 'a.md'}]);
    command.operations = {...command.operations, listDocs: listStub};

    const result = (await runSilent(() => command.run())) as {entries: unknown[]};

    expect(result.entries).to.have.length(1);
  });

  it('prints no results message when search returns empty in non-json mode', async () => {
    const command: any = await createCommand({limit: 5}, {query: 'x'});

    sinon.stub(command, 'jsonEnabled').returns(false);
    const searchStub = sinon.stub().returns([]);
    command.operations = {...command.operations, searchDocs: searchStub};

    const stdoutStub = sinon.stub(ux, 'stdout');

    const result = await command.run();

    expect(result.results).to.have.length(0);
    expect(stdoutStub.calledOnce).to.equal(true);
  });

  it('returns results in json mode', async () => {
    const command: any = await createCommand({json: true, limit: 5}, {query: 'x'});

    const searchStub = sinon.stub().returns([{entry: {id: 'a', title: 'A', filePath: 'a.md'}, score: 0.1}]);
    command.operations = {...command.operations, searchDocs: searchStub};

    const result = (await runSilent(() => command.run())) as {results: unknown[]};

    expect(result.results).to.have.length(1);
  });

  it('pages ranked results with --offset and returns continuation metadata', async () => {
    const command: any = await createCommand({json: true, limit: 1, offset: 1}, {query: 'x'});

    const searchStub = sinon.stub().returns([
      {entry: {id: 'a', title: 'A', filePath: 'a.md'}, score: 0.3},
      {entry: {id: 'b', title: 'B', filePath: 'b.md'}, score: 0.2},
      {entry: {id: 'c', title: 'C', filePath: 'c.md'}, score: 0.1},
    ]);
    command.operations = {...command.operations, searchDocs: searchStub};

    const result = (await runSilent(() => command.run())) as {
      total: number;
      offset: number;
      results: Array<{entry: {id: string}}>;
      truncated?: boolean;
      nextOffset?: number;
    };

    expect(searchStub.firstCall.args[1].limit).to.equal(Number.MAX_SAFE_INTEGER);
    expect(result.total).to.equal(3);
    expect(result.offset).to.equal(1);
    expect(result.results.map((r) => r.entry.id)).to.deep.equal(['b']);
    expect(result.truncated).to.equal(true);
    expect(result.nextOffset).to.equal(2);
  });

  it('passes an explicit --workspace through to searchDocs without detection', async () => {
    const command: any = await createCommand({json: true, limit: 5, workspace: 'storefront-next'}, {query: 'x'});

    const searchStub = sinon.stub().returns([]);
    const detectStub = sinon.stub().resolves({projectTypes: [], matchedPatterns: [], autoDiscovered: true});
    command.operations = {...command.operations, searchDocs: searchStub, detectWorkspaceType: detectStub};

    const result = (await runSilent(() => command.run())) as {workspace?: string[]};

    expect(detectStub.called, 'explicit type must not trigger detection').to.equal(false);
    expect(searchStub.firstCall.args[1].workspace).to.deep.equal(['storefront-next']);
    expect(result.workspace).to.deep.equal(['storefront-next']);
  });

  it('runs workspace detection when --workspace=auto', async () => {
    const command: any = await createCommand({json: true, limit: 5, workspace: 'auto'}, {query: 'x'});

    const searchStub = sinon.stub().returns([]);
    const detectStub = sinon
      .stub()
      .resolves({projectTypes: ['cartridges'], matchedPatterns: ['cartridges'], autoDiscovered: true});
    command.operations = {...command.operations, searchDocs: searchStub, detectWorkspaceType: detectStub};

    const result = (await runSilent(() => command.run())) as {workspace?: string[]};

    expect(detectStub.calledOnce).to.equal(true);
    expect(result.workspace).to.deep.equal(['cartridges']);
  });

  it('auto-detects the workspace by default when --workspace is unset (search)', async () => {
    const command: any = await createCommand({json: true, limit: 5}, {query: 'x'});

    const searchStub = sinon.stub().returns([]);
    const detectStub = sinon
      .stub()
      .resolves({projectTypes: ['cartridges'], matchedPatterns: ['cartridges'], autoDiscovered: true});
    command.operations = {...command.operations, searchDocs: searchStub, detectWorkspaceType: detectStub};

    const result = (await runSilent(() => command.run())) as {workspace?: string[]};

    expect(detectStub.calledOnce, 'unset --workspace must default to detection').to.equal(true);
    expect(searchStub.firstCall.args[1].workspace).to.deep.equal(['cartridges']);
    expect(result.workspace).to.deep.equal(['cartridges']);
  });

  it('--workspace=all disables detection and applies no preference (search)', async () => {
    const command: any = await createCommand({json: true, limit: 5, workspace: 'all'}, {query: 'x'});

    const searchStub = sinon.stub().returns([]);
    const detectStub = sinon.stub().resolves({projectTypes: ['cartridges'], matchedPatterns: [], autoDiscovered: true});
    command.operations = {...command.operations, searchDocs: searchStub, detectWorkspaceType: detectStub};

    const result = (await runSilent(() => command.run())) as {workspace?: string[]};

    expect(detectStub.called, '--workspace=all must not trigger detection').to.equal(false);
    expect(searchStub.firstCall.args[1].workspace).to.equal(undefined);
    expect(result.workspace).to.equal(undefined);
  });

  it('--list does not auto-detect a workspace when the flag is unset', async () => {
    const command: any = await createCommand({list: true, json: true}, {});

    const listStub = sinon.stub().returns([{id: 'a', title: 'A', category: 'script-api', filePath: 'a.md'}]);
    const detectStub = sinon.stub().resolves({projectTypes: ['cartridges'], matchedPatterns: [], autoDiscovered: true});
    command.operations = {...command.operations, listDocs: listStub, detectWorkspaceType: detectStub};

    await runSilent(() => command.run());

    expect(detectStub.called, 'list must not auto-detect without an explicit --workspace').to.equal(false);
    // No workspace filter applied -> listDocs called with an undefined category filter.
    expect(listStub.firstCall.args[0]).to.equal(undefined);
  });

  it('--workspace accepts comma-separated values', async () => {
    const command: any = await createCommand({json: true, limit: 5, workspace: 'cartridges,sfra'}, {query: 'x'});

    const searchStub = sinon.stub().returns([]);
    const detectStub = sinon.stub().resolves({projectTypes: [], matchedPatterns: [], autoDiscovered: true});
    command.operations = {...command.operations, searchDocs: searchStub, detectWorkspaceType: detectStub};

    const result = (await runSilent(() => command.run())) as {workspace?: string[]};

    expect(detectStub.called, 'explicit types must not trigger detection').to.equal(false);
    expect(searchStub.firstCall.args[1].workspace).to.deep.equal(['cartridges', 'sfra']);
    expect(result.workspace).to.deep.equal(['cartridges', 'sfra']);
  });
});
