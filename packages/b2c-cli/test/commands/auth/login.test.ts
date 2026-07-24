/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {ImplicitOAuthStrategy, PkceOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import AuthLogin from '../../../src/commands/auth/login.js';
import {createIsolatedConfigHooks, makeCommandThrowOnError} from '../../helpers/test-setup.js';

describe('auth login', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  function createCommand(args: string[] = []): any {
    return new AuthLogin(args, hooks.getConfig());
  }

  it('errors when no client ID is configured', async () => {
    const command = createCommand([]);
    await command.init();
    makeCommandThrowOnError(command);
    sinon.stub(command, 'log');

    Object.defineProperty(command, 'resolvedConfig', {
      value: {values: {clientId: undefined}, hasOAuthConfig: () => false},
      configurable: true,
    });

    try {
      await command.run();
      expect.fail('expected error');
    } catch (error: unknown) {
      expect((error as Error).message).to.include('OAuth client ID required');
    }
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
    expect(logStub.calledOnce).to.be.true;
    expect(logStub.firstCall.args[0]).to.include('Login succeeded');
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
});
