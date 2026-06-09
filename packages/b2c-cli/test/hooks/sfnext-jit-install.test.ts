/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';

import hook from '../../src/hooks/sfnext-jit-install.js';

interface FakeContext {
  config: {runCommand: sinon.SinonStub};
  log: sinon.SinonStub;
}

function makeContext(): FakeContext {
  return {
    config: {runCommand: sinon.stub().resolves()},
    log: sinon.stub(),
  };
}

async function invokeHook(ctx: FakeContext, opts: {pluginName: string; pluginVersion: string}): Promise<void> {
  await (hook as unknown as (this: FakeContext, opts: unknown) => Promise<void>).call(ctx, {
    ...opts,
    argv: [],
    command: {} as never,
    id: 'sfnext:create-storefront',
    config: ctx.config,
    context: {} as never,
  });
}

describe('sfnext-jit-install hook', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('runs `plugins:install <name> --jit` for the named JIT plugin', async () => {
    const ctx = makeContext();
    await invokeHook(ctx, {pluginName: '@salesforce/storefront-next-dev', pluginVersion: 'latest'});

    expect(ctx.config.runCommand.calledOnce).to.equal(true);
    expect(ctx.config.runCommand.firstCall.args[0]).to.equal('plugins:install');
    expect(ctx.config.runCommand.firstCall.args[1]).to.deep.equal(['@salesforce/storefront-next-dev', '--jit']);
  });

  it('logs an install notice including the resolved version', async () => {
    const ctx = makeContext();
    await invokeHook(ctx, {pluginName: '@salesforce/storefront-next-dev', pluginVersion: 'latest'});

    expect(ctx.log.calledOnce).to.equal(true);
    expect(ctx.log.firstCall.args[0]).to.match(/storefront-next-dev@latest/);
  });

  it('propagates install failures (oclif treats them as hook failures and rethrows)', async () => {
    const ctx = makeContext();
    ctx.config.runCommand.rejects(new Error('npm install failed'));

    let caught: Error | undefined;
    try {
      await invokeHook(ctx, {pluginName: '@salesforce/storefront-next-dev', pluginVersion: 'latest'});
    } catch (error) {
      caught = error as Error;
    }

    expect(caught?.message).to.equal('npm install failed');
  });
});
