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
import ClientList from '../../../../src/commands/am/clients/list.js';
import {
  stubCommandConfigAndLogger,
  stubJsonEnabled,
  stubImplicitOAuthStrategy,
  makeCommandThrowOnError,
} from '../../../helpers/test-setup.js';

const TEST_HOST = 'account.test.demandware.com';
const BASE_URL = `https://${TEST_HOST}/dw/rest/v1`;

describe('am clients list', () => {
  const server = setupServer();

  const mockClients = [
    {
      id: 'client-1',
      name: 'Test Client',
      description: 'A test client',
      active: true,
      tokenEndpointAuthMethod: 'client_secret_basic',
      createdAt: '2025-01-15T10:30:00.000Z',
      disabledTimestamp: null,
    },
  ];

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
    it('should have correct description', () => {
      expect(ClientList.description).to.be.a('string');
      expect(ClientList.description.length).to.be.greaterThan(0);
    });

    it('should enable JSON flag', () => {
      expect(ClientList.enableJsonFlag).to.be.true;
    });
  });

  describe('pagination validation', () => {
    it('should validate size parameter - minimum', async () => {
      const command = new ClientList([], {} as any);
      (command as any).flags = {size: 0};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Page size must be between 1 and 4000/);
      }
    });

    it('should validate size parameter - maximum', async () => {
      const command = new ClientList([], {} as any);
      (command as any).flags = {size: 5000};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Page size must be between 1 and 4000/);
      }
    });

    it('should validate page parameter - negative', async () => {
      const command = new ClientList([], {} as any);
      (command as any).flags = {page: -1};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/Page number must be a non-negative integer/);
      }
    });
  });

  describe('output formatting', () => {
    it('should return client collection in JSON mode', async () => {
      const command = new ClientList([], {} as any);
      (command as any).flags = {};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubImplicitOAuthStrategy(command);

      server.use(
        http.get(`${BASE_URL}/apiclients`, () => {
          return HttpResponse.json({content: mockClients});
        }),
      );

      const result = await command.run();

      expect(result).to.have.property('content');
      expect(result.content).to.have.lengthOf(1);
      expect(result.content![0].name).to.equal('Test Client');
    });

    it('should use default pagination when not specified', async () => {
      const command = new ClientList([], {} as any);
      (command as any).flags = {};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubImplicitOAuthStrategy(command);

      let capturedSize: null | string = null;
      let capturedPage: null | string = null;

      server.use(
        http.get(`${BASE_URL}/apiclients`, ({request}) => {
          const url = new URL(request.url);
          capturedSize = url.searchParams.get('size');
          capturedPage = url.searchParams.get('page');
          return HttpResponse.json({content: []});
        }),
      );

      await command.run();

      expect(capturedSize).to.equal('20');
      expect(capturedPage).to.equal('0');
    });

    it('should pass custom pagination parameters', async () => {
      const command = new ClientList([], {} as any);
      (command as any).flags = {size: 50, page: 2};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubImplicitOAuthStrategy(command);

      let capturedSize: null | string = null;
      let capturedPage: null | string = null;

      server.use(
        http.get(`${BASE_URL}/apiclients`, ({request}) => {
          const url = new URL(request.url);
          capturedSize = url.searchParams.get('size');
          capturedPage = url.searchParams.get('page');
          return HttpResponse.json({content: []});
        }),
      );

      await command.run();

      expect(capturedSize).to.equal('50');
      expect(capturedPage).to.equal('2');
    });
  });
});
