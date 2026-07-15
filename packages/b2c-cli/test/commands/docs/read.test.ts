/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import DocsRead from '../../../src/commands/docs/read.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('docs read', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(DocsRead, hooks.getConfig(), flags, args);
  }

  it('errors when no match is found', async () => {
    const command: any = await createCommand({}, {query: 'Nope'});

    const readStub = sinon.stub().returns(null);
    const detectStub = sinon.stub().resolves({projectTypes: [], matchedPatterns: []});
    command.operations = {...command.operations, readDocByQuery: readStub, detectWorkspaceType: detectStub};

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.calledOnce).to.equal(true);
  });

  it('writes raw markdown when --raw is set', async () => {
    const command: any = await createCommand({raw: true}, {query: 'ProductMgr'});

    const readStub = sinon.stub().returns({entry: {id: 'x', title: 't', filePath: 'x.md'}, content: '# Hello'});
    const detectStub = sinon.stub().resolves({projectTypes: [], matchedPatterns: []});
    command.operations = {...command.operations, readDocByQuery: readStub, detectWorkspaceType: detectStub};
    sinon.stub(command, 'jsonEnabled').returns(false);

    const writeStub = sinon.stub(process.stdout, 'write');

    const result = await command.run();

    expect(writeStub.calledOnceWithExactly('# Hello')).to.equal(true);
    expect(result.entry.id).to.equal('x');
  });

  it('returns data without writing to stdout in json mode', async () => {
    const command: any = await createCommand({json: true}, {query: 'ProductMgr'});

    const readStub = sinon.stub().returns({entry: {id: 'x', title: 't', filePath: 'x.md'}, content: '# Hello'});
    const detectStub = sinon.stub().resolves({projectTypes: [], matchedPatterns: []});
    command.operations = {...command.operations, readDocByQuery: readStub, detectWorkspaceType: detectStub};
    sinon.stub(command, 'jsonEnabled').returns(true);

    const result = await command.run();

    // No workspace detected -> workspace is undefined (still passed through).
    expect(readStub.calledOnceWithExactly('ProductMgr', {enabledCategories: undefined, workspace: undefined})).to.equal(
      true,
    );
    expect(result.entry.id).to.equal('x');
  });

  it('passes the --topics allowlist through to readDocByQuery', async () => {
    const command: any = await createCommand({json: true, topics: 'sfnext, commerce-api'}, {query: 'ProductMgr'});

    const readStub = sinon.stub().returns({entry: {id: 'x', title: 't', filePath: 'x.md'}, content: '# Hello'});
    const detectStub = sinon.stub().resolves({projectTypes: [], matchedPatterns: []});
    command.operations = {...command.operations, readDocByQuery: readStub, detectWorkspaceType: detectStub};
    sinon.stub(command, 'jsonEnabled').returns(true);

    await command.run();

    expect(
      readStub.calledOnceWithExactly('ProductMgr', {
        enabledCategories: ['sfnext', 'commerce-api'],
        workspace: undefined,
      }),
    ).to.equal(true);
  });

  it('favors the auto-detected workspace when resolving a fuzzy query', async () => {
    const command: any = await createCommand({json: true}, {query: 'ProductMgr'});

    const readStub = sinon.stub().returns({entry: {id: 'x', title: 't', filePath: 'x.md'}, content: '# Hello'});
    const detectStub = sinon.stub().resolves({projectTypes: ['cartridges'], matchedPatterns: []});
    command.operations = {...command.operations, readDocByQuery: readStub, detectWorkspaceType: detectStub};
    sinon.stub(command, 'jsonEnabled').returns(true);

    await command.run();

    expect(
      readStub.calledOnceWithExactly('ProductMgr', {enabledCategories: undefined, workspace: ['cartridges']}),
    ).to.equal(true);
  });

  it('opts out of workspace preference with --workspace all', async () => {
    const command: any = await createCommand({json: true, workspace: 'all'}, {query: 'ProductMgr'});

    const readStub = sinon.stub().returns({entry: {id: 'x', title: 't', filePath: 'x.md'}, content: '# Hello'});
    const detectStub = sinon.stub().resolves({projectTypes: ['cartridges'], matchedPatterns: []});
    command.operations = {...command.operations, readDocByQuery: readStub, detectWorkspaceType: detectStub};
    sinon.stub(command, 'jsonEnabled').returns(true);

    await command.run();

    // --workspace all skips detection entirely -> no preference.
    expect(detectStub.called).to.equal(false);
    expect(readStub.calledOnceWithExactly('ProductMgr', {enabledCategories: undefined, workspace: undefined})).to.equal(
      true,
    );
  });
});
