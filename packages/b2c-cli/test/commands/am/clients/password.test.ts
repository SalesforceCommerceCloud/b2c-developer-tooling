/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import ClientPassword from '../../../../src/commands/am/clients/password.js';
import {
  stubCommandConfigAndLogger,
  stubImplicitOAuthStrategy,
  makeCommandThrowOnError,
} from '../../../helpers/test-setup.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('am clients password', () => {
  const server = setupServer();

  before(() => {
    server.listen({onUnhandledRequest: 'error'});
  });

  beforeEach(() => {
    isolateConfig();
  });

  afterEach(() => {
    sinon.restore();
    server.resetHandlers();
    restoreConfig();
  });

  after(() => {
    server.close();
  });

  describe('command structure', () => {
    it('should require api-client-id as argument', () => {
      expect(ClientPassword.args).to.have.property('api-client-id');
      expect(ClientPassword.args['api-client-id'].required).to.be.true;
    });

    it('should require current and new password flags', () => {
      expect(ClientPassword.flags).to.have.property('current');
      expect(ClientPassword.flags).to.have.property('new');
      expect(ClientPassword.flags.current.required).to.be.true;
      expect(ClientPassword.flags.new.required).to.be.true;
    });

    it('should have correct description', () => {
      expect(ClientPassword.description).to.be.a('string');
      expect(ClientPassword.description.length).to.be.greaterThan(0);
    });
  });

  describe('validation', () => {
    it('should reject new password shorter than 12 characters', async () => {
      const command = new ClientPassword([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {current: 'OldP@ssword12', new: 'Short1'};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/New password must be at least 12 characters/);
      }
    });

    it('should reject new password longer than 128 characters', async () => {
      const command = new ClientPassword([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {current: 'OldP@ssword12', new: 'a'.repeat(129)};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/New password must be at most 128 characters/);
      }
    });
  });

  describe('password change', () => {
    it('should change password successfully', async () => {
      const command = new ClientPassword([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {current: 'OldP@ssword12', new: 'NewP@ssword123'};
      stubCommandConfigAndLogger(command);
      stubImplicitOAuthStrategy(command);

      server.use(
        http.put(`${BASE_URL}/apiclients/client-123/password`, async ({request}) => {
          const body = (await request.json()) as {old: string; new: string};
          expect(body.old).to.equal('OldP@ssword12');
          expect(body.new).to.equal('NewP@ssword123');
          return new HttpResponse(null, {status: 204});
        }),
      );

      await command.run();
    });
  });
});
