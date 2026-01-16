/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import CodeWatch from '../../../src/commands/code/watch.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('code watch', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    const command: any = new CodeWatch([], config);
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

  it('stops watcher on SIGINT', async () => {
    const command: any = await createCommand({}, {cartridgePath: '.'});

    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({hostname: 'example.com', codeVersion: 'v1'}));

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
    sinon.stub(command, 'resolvedConfig').get(() => ({hostname: 'example.com', codeVersion: 'v1'}));

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
