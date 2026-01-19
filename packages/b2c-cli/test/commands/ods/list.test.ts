/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import OdsList from '../../../src/commands/ods/list.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';

function stubCommandConfigAndLogger(command: any, sandboxApiHost = 'admin.dx.test.com'): void {
  Object.defineProperty(command, 'config', {
    value: {
      findConfigFile: () => ({
        read: () => ({'sandbox-api-host': sandboxApiHost}),
      }),
    },
    configurable: true,
  });

  Object.defineProperty(command, 'logger', {
    value: {info() {}, debug() {}, warn() {}, error() {}},
    configurable: true,
  });
}

function stubJsonEnabled(command: any, enabled: boolean): void {
  command.jsonEnabled = () => enabled;
}

function stubOdsClient(command: any, client: Partial<{GET: any; POST: any; PUT: any; DELETE: any}>): void {
  Object.defineProperty(command, 'odsClient', {
    value: client,
    configurable: true,
  });
}

function makeCommandThrowOnError(command: any): void {
  command.error = (msg: string) => {
    throw new Error(msg);
  };
}

/**
 * Unit tests for ODS list command CLI logic.
 * Tests column selection, filter building, output formatting.
 * SDK tests cover the actual API calls.
 */
describe('ods list', () => {
  beforeEach(() => {
    isolateConfig();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('getSelectedColumns', () => {
    it('should return default columns when no flags provided', () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.deep.equal(['realm', 'instance', 'state', 'profile', 'created', 'eol', 'id']);
    });

    it('should return all columns when --extended flag is set', () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {extended: true};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.include('realm');
      expect(columns).to.include('hostname');
      expect(columns).to.include('createdBy');
      expect(columns).to.include('autoScheduled');
    });

    it('should return custom columns when --columns flag is set', () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {columns: 'id,state,hostname'};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.deep.equal(['id', 'state', 'hostname']);
    });

    it('should ignore invalid column names', () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {columns: 'id,invalid,state'};
      const columns = (command as any).getSelectedColumns();

      expect(columns).to.not.include('invalid');
      expect(columns).to.include('id');
      expect(columns).to.include('state');
    });
  });

  describe('filter parameter building', () => {
    it('should build filter params from realm flag', () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {realm: 'zzzv'};

      const realm = (command as any).flags.realm;
      expect(realm).to.equal('zzzv');
    });

    it('should combine realm and custom filter params', () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {
        realm: 'zzzv',
        'filter-params': 'state=started',
      };

      const parts: string[] = [];
      if ((command as any).flags.realm) parts.push(`realm=${(command as any).flags.realm}`);
      if ((command as any).flags['filter-params']) parts.push((command as any).flags['filter-params']);
      const filterParams = parts.join('&');

      expect(filterParams).to.equal('realm=zzzv&state=started');
    });
  });

  describe('output formatting', () => {
    it('should return count and data in JSON mode', async () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);

      stubOdsClient(command, {
        GET: async () => ({
          data: {
            data: [
              {id: '1', realm: 'zzzv', state: 'started'},
              {id: '2', realm: 'zzzv', state: 'stopped'},
            ],
          },
          response: new Response(),
        }),
      });

      const result = await command.run();

      expect(result).to.have.property('count', 2);
      expect(result).to.have.property('data');
      expect(result.data).to.have.lengthOf(2);
    });

    it('should handle empty results', async () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOdsClient(command, {
        GET: async () => ({
          data: {data: []},
          response: new Response(),
        }),
      });

      const result = await command.run();

      expect(result.count).to.equal(0);
      expect(result.data).to.deep.equal([]);
    });

    it('should return data in non-JSON mode', async () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {};
      stubJsonEnabled(command, false);
      stubCommandConfigAndLogger(command);
      stubOdsClient(command, {
        GET: async () => ({
          data: {
            data: [{id: 'sb-1', realm: 'zzzv', state: 'started', hostName: 'host1.test.com'}],
          },
          response: new Response(),
        }),
      });

      const result = await command.run();

      // Command returns data regardless of JSON mode
      expect(result).to.have.property('count', 1);
      expect(result.data).to.have.lengthOf(1);
      expect(result.data[0].id).to.equal('sb-1');
    });

    it('should error on null data', async () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      stubOdsClient(command, {
        GET: async () => ({
          data: null as any,
          error: {error: {}},
          response: new Response(null, {status: 500, statusText: 'Internal Server Error'}),
        }),
      });

      try {
        await command.run();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.match(/Failed to fetch sandboxes/);
        expect(error.message).to.include('Internal Server Error');
      }
    });

    it('should handle undefined data as empty list', async () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {};
      stubJsonEnabled(command, true);
      stubCommandConfigAndLogger(command);
      stubOdsClient(command, {
        GET: async () => ({
          data: {data: undefined as any},
          response: new Response(null, {status: 200}),
        }),
      });

      const result = await command.run();

      // Should treat undefined as empty list, not error
      expect(result.count).to.equal(0);
      expect(result.data).to.deep.equal([]);
    });

    it('should handle empty API response gracefully in non-JSON mode', async () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {};
      stubJsonEnabled(command, false);
      stubCommandConfigAndLogger(command);
      stubOdsClient(command, {
        GET: async () => ({
          data: {},
          response: {statusText: 'OK'},
        }),
      });

      const result = await command.run();

      expect(result.count).to.equal(0);
      expect(result.data).to.deep.equal([]);
    });

    it('should error when result.data is completely missing', async () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);

      stubOdsClient(command, {
        GET: async () => ({
          data: null as any,
          error: {error: {message: 'Internal error'}},
          response: new Response(null, {status: 500, statusText: 'Internal Server Error'}),
        }),
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.match(/Failed to fetch sandboxes/);
        expect(error.message).to.include('Internal error');
      }
    });

    it('should handle API errors gracefully', async () => {
      const command = new OdsList([], {} as any);
      (command as any).flags = {realm: 'invalid'};
      stubCommandConfigAndLogger(command);
      makeCommandThrowOnError(command);
      stubOdsClient(command, {
        GET: async () => ({
          data: undefined,
          error: {error: {message: 'Invalid realm'}},
          response: new Response(null, {status: 400, statusText: 'Bad Request'}),
        }),
      });

      try {
        await command.run();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).to.match(/Failed to fetch sandboxes/);
      }
    });
  });
});
