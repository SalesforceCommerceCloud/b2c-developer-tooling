/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import CodeWatch from '../../../src/commands/code/watch.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('code watch', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(CodeWatch, hooks.getConfig(), flags, args);
  }

  it('stops watcher on SIGINT', async () => {
    const command: any = await createCommand({}, {cartridgePath: '.'});

    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: 'v1'}}));

    const stopStub = sinon.stub().resolves(void 0);
    sinon.stub(command, 'watchCartridges').resolves({cartridges: [{name: 'c1'}], stop: stopStub});

    const logStub = sinon.stub(command, 'log').returns(void 0);

    const handlers: Record<string, () => void> = {};
    sinon.stub(process, 'on').callsFake(((event: string, handler: () => void) => {
      handlers[event] = handler;
      return process;
    }) as any);

    const runPromise = command.run();

    await Promise.resolve();

    expect(handlers.SIGINT).to.be.a('function');
    handlers.SIGINT();

    await runPromise;

    expect(stopStub.calledOnce).to.equal(true);
    expect(logStub.called).to.equal(true);
  });

  it('calls command.error when watcher setup fails', async () => {
    const command: any = await createCommand({}, {cartridgePath: '.'});

    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com', codeVersion: 'v1'}}));

    sinon.stub(command, 'watchCartridges').rejects(new Error('boom'));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      // expected
    }

    expect(errorStub.calledOnce).to.equal(true);
  });
});
