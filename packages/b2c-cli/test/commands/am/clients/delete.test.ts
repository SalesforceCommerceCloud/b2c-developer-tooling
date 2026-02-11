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
import ClientDelete from '../../../../src/commands/am/clients/delete.js';
import {
  stubCommandConfigAndLogger,
  stubImplicitOAuthStrategy,
  makeCommandThrowOnError,
} from '../../../helpers/test-setup.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('am clients delete', () => {
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
      expect(ClientDelete.args).to.have.property('api-client-id');
      expect(ClientDelete.args['api-client-id'].required).to.be.true;
    });

    it('should have correct description', () => {
      expect(ClientDelete.description).to.be.a('string');
      expect(ClientDelete.description.length).to.be.greaterThan(0);
    });
  });

  describe('delete', () => {
    it('should delete API client successfully', async () => {
      const command = new ClientDelete([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      stubCommandConfigAndLogger(command);
      stubImplicitOAuthStrategy(command);

      server.use(
        http.delete(`${BASE_URL}/apiclients/client-123`, () => {
          return new HttpResponse(null, {status: 204});
        }),
      );

      await command.run();
    });

    it('should throw when client must be disabled 7 days', async () => {
      const command = new ClientDelete([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubImplicitOAuthStrategy(command);

      server.use(
        http.delete(`${BASE_URL}/apiclients/client-123`, () => {
          return HttpResponse.json({error: {message: 'Precondition Failed'}}, {status: 412});
        }),
      );

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.include('disabled for at least 7 days');
      }
    });
  });
});
