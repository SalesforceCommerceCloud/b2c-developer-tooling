/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {
  setStoredSession,
  getStoredSession,
  clearStoredSession,
  resetStatefulStoreForTesting,
} from '@salesforce/b2c-tooling-sdk/auth';
import AuthClientRenew from '../../../../src/commands/auth/client/renew.js';
import {stubCommandConfigAndLogger, makeCommandThrowOnError} from '../../../helpers/test-setup.js';

const TEST_HOST = 'account.test.demandware.com';
const TOKEN_URL = `https://${TEST_HOST}/dwsso/oauth2/access_token`;

describe('auth client renew', () => {
  const server = setupServer();
  const originalEnv = process.env.NODE_ENV;

  before(() => {
    process.env.NODE_ENV = 'test';
    server.listen({onUnhandledRequest: 'error'});
  });

  afterEach(() => {
    sinon.restore();
    server.resetHandlers();
    clearStoredSession();
    resetStatefulStoreForTesting();
  });

  after(() => {
    process.env.NODE_ENV = originalEnv;
    server.close();
  });

  function createCommand(): any {
    const command = new AuthClientRenew([], {} as any);
    (command as any).flags = {};
    stubCommandConfigAndLogger(command);
    return command;
  }

  describe('command structure', () => {
    it('should have correct description', () => {
      expect(AuthClientRenew.description).to.be.a('string');
      expect(AuthClientRenew.description.length).to.be.greaterThan(0);
    });
  });

  describe('validation', () => {
    it('should error when no stored session exists', async () => {
      const command = createCommand();
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('renewal not possible');
      }
    });

    it('should error when session has no renewBase', async () => {
      setStoredSession({
        clientId: 'c',
        accessToken: 'old-token',
        refreshToken: null,
        renewBase: null,
        user: null,
      });

      const command = createCommand();
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('renewal not possible');
        expect((error as Error).message).to.include('--renew');
      }
    });
  });

  describe('token renewal', () => {
    it('should renew with client_credentials when no refresh token', async () => {
      const renewBase = Buffer.from('client-id:client-secret').toString('base64');
      setStoredSession({
        clientId: 'client-id',
        accessToken: 'old-token',
        refreshToken: null,
        renewBase,
        user: 'admin@example.com',
      });

      let capturedBody = '';
      let capturedAuth = '';

      server.use(
        http.post(TOKEN_URL, async ({request}) => {
          capturedBody = await request.text();
          capturedAuth = request.headers.get('Authorization') ?? '';
          return HttpResponse.json({
            access_token: 'renewed-token',
            expires_in: 1800,
          });
        }),
      );

      const command = createCommand();
      await command.run();

      expect(capturedBody).to.include('grant_type=client_credentials');
      expect(capturedAuth).to.equal(`Basic ${renewBase}`);

      const session = getStoredSession();
      expect(session!.accessToken).to.equal('renewed-token');
      expect(session!.clientId).to.equal('client-id');
      expect(session!.user).to.equal('admin@example.com');
    });

    it('should renew with refresh_token when available', async () => {
      const renewBase = Buffer.from('client-id:client-secret').toString('base64');
      setStoredSession({
        clientId: 'client-id',
        accessToken: 'old-token',
        refreshToken: 'my-refresh-token',
        renewBase,
        user: null,
      });

      let capturedBody = '';

      server.use(
        http.post(TOKEN_URL, async ({request}) => {
          capturedBody = await request.text();
          return HttpResponse.json({
            access_token: 'refreshed-token',
            expires_in: 1800,
            refresh_token: 'new-refresh-token',
          });
        }),
      );

      const command = createCommand();
      await command.run();

      expect(capturedBody).to.include('grant_type=refresh_token');
      expect(capturedBody).to.include('refresh_token=my-refresh-token');

      const session = getStoredSession();
      expect(session!.accessToken).to.equal('refreshed-token');
      expect(session!.refreshToken).to.equal('new-refresh-token');
    });
  });

  describe('error handling', () => {
    it('should error on failed renewal', async () => {
      const renewBase = Buffer.from('client-id:client-secret').toString('base64');
      setStoredSession({
        clientId: 'client-id',
        accessToken: 'old-token',
        refreshToken: null,
        renewBase,
        user: null,
      });

      server.use(
        http.post(TOKEN_URL, () => {
          return HttpResponse.json({error_description: 'Token expired'}, {status: 400});
        }),
      );

      const command = createCommand();
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('renewal failed');
        expect((error as Error).message).to.include('Token expired');
      }
    });
  });
});
