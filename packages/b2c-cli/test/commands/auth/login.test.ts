/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect} from 'chai';
import sinon from 'sinon';
import {ImplicitOAuthStrategy, PkceOAuthStrategy, saveAuthSession} from '@salesforce/b2c-tooling-sdk/auth';
import {DEFAULT_PUBLIC_CLIENT_ID} from '@salesforce/b2c-tooling-sdk';
import AuthLogin from '../../../src/commands/auth/login.js';
import {createIsolatedConfigHooks} from '../../helpers/test-setup.js';

describe('auth login', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  function createCommand(args: string[] = []): any {
    return new AuthLogin(args, hooks.getConfig());
  }

  it('signs in with the built-in client when no client ID is configured', async () => {
    let clientId: string | undefined;
    sinon.stub(PkceOAuthStrategy.prototype, 'getTokenResponse').callsFake(async function (this: any) {
      clientId = this.config.clientId;
      return {accessToken: 'fake-access-token', expires: new Date(Date.now() + 30 * 60 * 1000), scopes: []};
    });

    const command = createCommand([]);
    await command.init();
    sinon.stub(command, 'log');

    await command.run();

    expect(clientId).to.equal(DEFAULT_PUBLIC_CLIENT_ID);
  });

  it('accepts --client-id, with the positional argument taking precedence', async () => {
    const clientIds: string[] = [];
    sinon.stub(PkceOAuthStrategy.prototype, 'getTokenResponse').callsFake(async function (this: any) {
      clientIds.push(this.config.clientId);
      return {accessToken: 'fake-access-token', expires: new Date(Date.now() + 30 * 60 * 1000), scopes: []};
    });

    async function login(args: string[]) {
      const command = createCommand(args);
      await command.init();
      sinon.stub(command, 'log');
      await command.run();
    }

    await login(['--client-id', 'flag-client']);
    await login(['arg-client', '--client-id', 'flag-client']);

    expect(clientIds).to.deep.equal(['flag-client', 'arg-client']);
  });

  it('signs in with the built-in client under --default-client even when a client is configured', async () => {
    let clientId: string | undefined;
    sinon.stub(PkceOAuthStrategy.prototype, 'getTokenResponse').callsFake(async function (this: any) {
      clientId = this.config.clientId;
      return {accessToken: 'fake-access-token', expires: new Date(Date.now() + 30 * 60 * 1000), scopes: []};
    });
    process.env.SFCC_CLIENT_ID = 'env-client';
    process.env.SFCC_AUTH_METHODS = 'implicit';
    try {
      const command = createCommand(['--default-client']);
      await command.init();
      sinon.stub(command, 'log');
      await command.run();
    } finally {
      delete process.env.SFCC_CLIENT_ID;
      delete process.env.SFCC_AUTH_METHODS;
    }

    expect(clientId).to.equal(DEFAULT_PUBLIC_CLIENT_ID);
  });

  for (const args of [
    ['--default-client', '--client-id', 'flag-client'],
    ['arg-client', '--default-client'],
  ]) {
    it(`rejects --default-client with a command-line client ID (${args.join(' ')})`, async () => {
      const command = createCommand(args);
      await command.init();
      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).to.include('cannot also be provided when using --default-client');
      }
    });
  }

  it('says so when a valid sign-in that cannot renew is reused', async () => {
    saveAuthSession({
      clientId: DEFAULT_PUBLIC_CLIENT_ID,
      flow: 'pkce',
      accessToken: 'stored',
      refreshToken: null,
      sub: 'dev@example.com',
    });
    sinon.stub(PkceOAuthStrategy.prototype, 'getTokenResponse').resolves({
      accessToken: 'stored',
      expires: new Date(Date.now() + 30 * 60 * 1000),
      scopes: [],
    });

    const command = createCommand([]);
    await command.init();
    const logStub = sinon.stub(command, 'log');
    await command.run();

    expect(logStub.firstCall.args[0]).to.match(/^Already signed in to Account Manager as dev@example\.com, expires /);
  });

  it('runs the PKCE strategy and lets it persist the session', async () => {
    // Stub the prototype so any new PkceOAuthStrategy in the command
    // returns synthetic tokens without opening a browser. We're verifying
    // here that the command delegates persistence to the strategy — i.e.
    // it does NOT make its own setStoredSession-style write.
    const getTokenResponseStub = sinon.stub(PkceOAuthStrategy.prototype, 'getTokenResponse').resolves({
      accessToken: 'fake-access-token',
      expires: new Date(Date.now() + 30 * 60 * 1000),
      scopes: ['sfcc.products'],
    });

    const command = createCommand(['my-client-id']);
    await command.init();
    const logStub = sinon.stub(command, 'log');

    await command.run();

    expect(getTokenResponseStub.calledOnce).to.be.true;
    // The strategy reports a new sign-in itself.
    expect(logStub.called).to.be.false;
  });

  it('routes to ImplicitOAuthStrategy when --auth-methods implicit is passed', async () => {
    const pkceStub = sinon.stub(PkceOAuthStrategy.prototype, 'getTokenResponse').resolves({
      accessToken: 'should-not-be-used',
      expires: new Date(Date.now() + 30 * 60 * 1000),
      scopes: [],
    });
    const implicitStub = sinon.stub(ImplicitOAuthStrategy.prototype, 'getTokenResponse').resolves({
      accessToken: 'fake-implicit-token',
      expires: new Date(Date.now() + 30 * 60 * 1000),
      scopes: ['sfcc.products'],
    });

    const command = createCommand(['my-client-id', '--auth-methods', 'implicit']);
    await command.init();
    sinon.stub(command, 'log');
    sinon.stub(command, 'warn');

    await command.run();

    expect(implicitStub.calledOnce).to.be.true;
    expect(pkceStub.called).to.be.false;
  });

  it('honors an explicit implicit selection from dw.json', async () => {
    const configDir = mkdtempSync(join(tmpdir(), 'b2c-auth-login-config-'));
    const configPath = join(configDir, 'dw.json');
    writeFileSync(configPath, JSON.stringify({'client-id': 'configured-client', 'auth-methods': ['implicit']}), 'utf8');

    try {
      const pkceStub = sinon.stub(PkceOAuthStrategy.prototype, 'getTokenResponse').resolves({
        accessToken: 'should-not-be-used',
        expires: new Date(Date.now() + 30 * 60 * 1000),
        scopes: [],
      });
      const implicitStub = sinon.stub(ImplicitOAuthStrategy.prototype, 'getTokenResponse').resolves({
        accessToken: 'configured-implicit-token',
        expires: new Date(Date.now() + 30 * 60 * 1000),
        scopes: [],
      });

      const command = createCommand(['--config', configPath]);
      await command.init();
      sinon.stub(command, 'log');
      sinon.stub(command, 'warn');

      await command.run();

      expect(implicitStub.calledOnce).to.be.true;
      expect(pkceStub.called).to.be.false;
    } finally {
      rmSync(configDir, {recursive: true, force: true});
    }
  });
});
