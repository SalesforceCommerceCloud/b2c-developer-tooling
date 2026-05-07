/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {clearStoredSession, getStoredSession, resetStatefulStoreForTesting} from '@salesforce/b2c-tooling-sdk/auth';
import AuthClient from '../../../../src/commands/auth/client/index.js';
import {stubCommandConfigAndLogger, makeCommandThrowOnError} from '../../../helpers/test-setup.js';

const TEST_HOST = 'account.test.demandware.com';
const TOKEN_URL = `https://${TEST_HOST}/dwsso/oauth2/access_token`;

function makeIdToken(sub: string): string {
  const header = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64');
  const body = Buffer.from(JSON.stringify({sub})).toString('base64');
  const sig = Buffer.from('sig').toString('base64');
  return `${header}.${body}.${sig}`;
}

describe('auth client', () => {
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

  function createCommand(flags: Record<string, unknown> = {}): any {
    const command = new AuthClient([], {} as any);
    (command as any).flags = flags;
    stubCommandConfigAndLogger(command);
    return command;
  }

  describe('command structure', () => {
    it('should have correct description', () => {
      expect(AuthClient.description).to.be.a('string');
      expect(AuthClient.description.length).to.be.greaterThan(0);
    });

    it('should have examples', () => {
      expect(AuthClient.examples).to.be.an('array');
      expect(AuthClient.examples!.length).to.be.greaterThan(0);
    });
  });

  describe('credential validation', () => {
    it('should error when client ID is missing', async () => {
      const command = new AuthClient([], {} as any);
      (command as any).flags = {};
      stubCommandConfigAndLogger(command);
      Object.defineProperty(command, 'resolvedConfig', {
        value: {values: {clientId: undefined, clientSecret: undefined}, hasOAuthConfig: () => false},
        configurable: true,
      });
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Client ID and client secret are required');
      }
    });

    it('should error when client secret is missing', async () => {
      const command = new AuthClient([], {} as any);
      (command as any).flags = {};
      stubCommandConfigAndLogger(command);
      Object.defineProperty(command, 'resolvedConfig', {
        value: {values: {clientId: 'test', clientSecret: undefined}, hasOAuthConfig: () => true},
        configurable: true,
      });
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Client ID and client secret are required');
      }
    });

    it('should error when password grant is used without user credentials', async () => {
      const command = createCommand({'grant-type': 'password'});
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Username and password are required');
      }
    });
  });

  describe('client_credentials grant', () => {
    it('should authenticate and store session', async () => {
      const command = createCommand({});

      server.use(
        http.post(TOKEN_URL, () => {
          return HttpResponse.json({
            access_token: 'new-access-token',
            expires_in: 1800,
          });
        }),
      );

      await command.run();

      const session = getStoredSession();
      expect(session).to.not.be.null;
      expect(session!.accessToken).to.equal('new-access-token');
      expect(session!.renewBase).to.be.null;
    });

    it('should store renewBase when --renew flag is set', async () => {
      const command = createCommand({renew: true});

      server.use(
        http.post(TOKEN_URL, () => {
          return HttpResponse.json({
            access_token: 'new-access-token',
            expires_in: 1800,
          });
        }),
      );

      await command.run();

      const session = getStoredSession();
      expect(session).to.not.be.null;
      expect(session!.renewBase).to.not.be.null;
      expect(session!.renewBase).to.be.a('string');
    });

    it('should extract user from id_token', async () => {
      const command = createCommand({});

      server.use(
        http.post(TOKEN_URL, () => {
          return HttpResponse.json({
            access_token: 'new-access-token',
            expires_in: 1800,
            id_token: makeIdToken('admin@example.com'),
          });
        }),
      );

      await command.run();

      const session = getStoredSession();
      expect(session!.user).to.equal('admin@example.com');
    });

    it('should store refresh_token when returned', async () => {
      const command = createCommand({renew: true});

      server.use(
        http.post(TOKEN_URL, () => {
          return HttpResponse.json({
            access_token: 'new-access-token',
            expires_in: 1800,
            refresh_token: 'new-refresh-token',
          });
        }),
      );

      await command.run();

      const session = getStoredSession();
      expect(session!.refreshToken).to.equal('new-refresh-token');
    });
  });

  describe('password grant', () => {
    it('should auto-detect password grant when user credentials provided', async () => {
      const command = createCommand({user: 'admin@example.com', 'user-password': 'secret'});
      let capturedBody = '';

      server.use(
        http.post(TOKEN_URL, async ({request}) => {
          capturedBody = await request.text();
          return HttpResponse.json({
            access_token: 'pwd-token',
            expires_in: 1800,
          });
        }),
      );

      await command.run();

      expect(capturedBody).to.include('grant_type=password');
      expect(capturedBody).to.include('username=admin');
      expect(capturedBody).to.include('password=secret');
    });
  });

  describe('error handling', () => {
    it('should error on failed authentication', async () => {
      const command = createCommand({});
      makeCommandThrowOnError(command);

      server.use(
        http.post(TOKEN_URL, () => {
          return HttpResponse.json({error_description: 'Invalid client'}, {status: 401});
        }),
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('Authentication failed');
        expect((error as Error).message).to.include('Invalid client');
      }
    });
  });
});
