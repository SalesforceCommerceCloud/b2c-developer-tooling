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
import ClientUpdate from '../../../../src/commands/am/clients/update.js';
import {stubCommandConfigAndLogger, stubJsonEnabled, stubImplicitOAuthStrategy} from '../../../helpers/test-setup.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('am clients update', () => {
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
      expect(ClientUpdate.args).to.have.property('api-client-id');
      expect(ClientUpdate.args['api-client-id'].required).to.be.true;
    });

    it('should have correct description', () => {
      expect(ClientUpdate.description).to.be.a('string');
      expect(ClientUpdate.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(ClientUpdate.enableJsonFlag).to.be.true;
    });
  });

  describe('output formatting', () => {
    it('should return updated client in JSON mode', async () => {
      const command = new ClientUpdate([], {} as any);
      (command as any).args = {'api-client-id': 'client-123'};
      (command as any).flags = {name: 'Updated Name'};
      stubCommandConfigAndLogger(command);
      stubJsonEnabled(command, true);
      stubImplicitOAuthStrategy(command);

      const mockUpdated = {
        id: 'client-123',
        name: 'Updated Name',
        description: 'Desc',
        active: true,
        tokenEndpointAuthMethod: 'client_secret_basic',
      };

      server.use(
        http.put(`${BASE_URL}/apiclients/client-123`, async ({request}) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.name).to.equal('Updated Name');
          expect(body).to.not.have.property('active');
          return HttpResponse.json(mockUpdated);
        }),
      );

      const result = await command.run();

      expect(result.id).to.equal('client-123');
      expect(result.name).to.equal('Updated Name');
    });
  });
});
