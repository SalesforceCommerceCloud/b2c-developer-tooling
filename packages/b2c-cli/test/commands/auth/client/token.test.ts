/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {ux} from '@oclif/core';
import {saveAuthSession, clearAllAuthSessions, resetAuthSessionStoreForTesting} from '@salesforce/b2c-tooling-sdk/auth';
import AuthClientToken from '../../../../src/commands/auth/client/token.js';
import {stubCommandConfigAndLogger, makeCommandThrowOnError} from '../../../helpers/test-setup.js';

function makeValidJWT(claims: Record<string, unknown> = {}): string {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const header = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64');
  const body = Buffer.from(JSON.stringify({sub: 'test', exp, scope: 'sfcc.products sfcc.orders', ...claims})).toString(
    'base64',
  );
  const sig = Buffer.from('sig').toString('base64');
  return `${header}.${body}.${sig}`;
}

function makeExpiredJWT(): string {
  const exp = Math.floor(Date.now() / 1000) - 120;
  const header = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64');
  const body = Buffer.from(JSON.stringify({sub: 'test', exp})).toString('base64');
  const sig = Buffer.from('sig').toString('base64');
  return `${header}.${body}.${sig}`;
}

describe('auth client token', () => {
  const originalEnv = process.env.NODE_ENV;

  before(() => {
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    sinon.restore();
    clearAllAuthSessions();
    resetAuthSessionStoreForTesting();
  });

  after(() => {
    process.env.NODE_ENV = originalEnv;
  });

  function createCommand(flags: Record<string, unknown> = {}): any {
    const command = new AuthClientToken([], {} as any);
    (command as any).flags = flags;
    stubCommandConfigAndLogger(command);
    return command;
  }

  describe('command structure', () => {
    it('should have correct description', () => {
      expect(AuthClientToken.description).to.be.a('string');
      expect(AuthClientToken.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(AuthClientToken.enableJsonFlag).to.be.true;
    });
  });

  describe('no token stored', () => {
    it('should error when no session exists', async () => {
      const command = createCommand();
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('No authentication token found');
      }
    });
  });

  describe('raw output (non-JSON mode)', () => {
    it('should print raw token to stdout', async () => {
      const token = makeValidJWT();
      saveAuthSession({
        clientId: 'my-client',
        flow: 'client-credentials',
        accessToken: token,
        refreshToken: null,
        sub: null,
      });

      const command = createCommand();
      sinon.stub(command, 'jsonEnabled').returns(false);
      const stdoutStub = ux.stdout as unknown as sinon.SinonStub;

      await command.run();

      expect(stdoutStub.calledOnce).to.be.true;
      expect(stdoutStub.firstCall.args[0]).to.equal(token);
    });
  });

  describe('JSON output', () => {
    it('should return full token metadata for the only stored session', async () => {
      const token = makeValidJWT();
      saveAuthSession({
        clientId: 'my-client',
        flow: 'client-credentials',
        accessToken: token,
        refreshToken: null,
        sub: 'admin@example.com',
      });

      const command = createCommand();
      sinon.stub(command, 'jsonEnabled').returns(true);

      const result = await command.run();

      expect(result.accessToken).to.equal(token);
      expect(result.clientId).to.equal('my-client');
      expect(result.user).to.equal('admin@example.com');
      expect(result.scopes).to.include('sfcc.products');
      expect(result.scopes).to.include('sfcc.orders');
      expect(result.expires).to.be.a('string');
    });

    it('should select session by --client-id when multiple are stored', async () => {
      saveAuthSession({
        clientId: 'client-a',
        flow: 'client-credentials',
        accessToken: makeValidJWT({sub: 'a'}),
        refreshToken: null,
      });
      saveAuthSession({
        clientId: 'client-b',
        flow: 'pkce',
        accessToken: makeValidJWT({sub: 'b'}),
        refreshToken: 'refresh-b',
      });

      const command = createCommand({'client-id': 'client-b'});
      sinon.stub(command, 'jsonEnabled').returns(true);

      const result = await command.run();

      expect(result.clientId).to.equal('client-b');
    });

    it('should error when multiple sessions exist and no --client-id is given', async () => {
      saveAuthSession({
        clientId: 'client-a',
        flow: 'client-credentials',
        accessToken: makeValidJWT(),
        refreshToken: null,
      });
      saveAuthSession({
        clientId: 'client-b',
        flow: 'pkce',
        accessToken: makeValidJWT(),
        refreshToken: 'refresh-b',
      });

      const command = createCommand();
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Multiple stored sessions');
      }
    });

    it('should warn when token is expired', async () => {
      saveAuthSession({
        clientId: 'my-client',
        flow: 'client-credentials',
        accessToken: makeExpiredJWT(),
        refreshToken: null,
      });

      const command = createCommand();
      sinon.stub(command, 'jsonEnabled').returns(true);
      const warnStub = sinon.stub(command, 'warn');

      await command.run();

      expect(warnStub.calledOnce).to.be.true;
      expect(warnStub.firstCall.args[0]).to.include('expired or invalid');
    });
  });
});
