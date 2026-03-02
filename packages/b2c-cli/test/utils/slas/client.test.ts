/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {ux} from '@oclif/core';
import {normalizeClientResponse, printClientDetails} from '../../../src/utils/slas/client.js';

describe('utils/slas/client', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('normalizeClientResponse', () => {
    it('normalizes scopes from space-separated string', () => {
      const client = {
        clientId: 'client-1',
        name: 'Test Client',
        scopes: 'sfcc.products sfcc.catalogs sfcc.orders',
        channels: ['SiteA'],
        redirectUri: 'https://example.com/callback',
        isPrivateClient: true,
      } as any;

      const result = normalizeClientResponse(client);
      expect(result.scopes).to.deep.equal(['sfcc.products', 'sfcc.catalogs', 'sfcc.orders']);
      expect(result.clientId).to.equal('client-1');
      expect(result.name).to.equal('Test Client');
    });

    it('normalizes scopes from array', () => {
      const client = {
        clientId: 'client-2',
        name: 'Test',
        scopes: ['sfcc.products', 'sfcc.orders'],
        channels: [],
        redirectUri: 'https://example.com',
        isPrivateClient: false,
      } as any;

      const result = normalizeClientResponse(client);
      expect(result.scopes).to.deep.equal(['sfcc.products', 'sfcc.orders']);
    });

    it('handles missing scopes', () => {
      const client = {
        clientId: 'client-3',
        name: 'Test',
        channels: [],
        redirectUri: 'https://example.com',
      } as any;

      const result = normalizeClientResponse(client);
      expect(result.scopes).to.deep.equal([]);
    });

    it('normalizes redirectUri from array', () => {
      const client = {
        clientId: 'client-4',
        name: 'Test',
        scopes: [],
        channels: ['SiteA'],
        redirectUri: ['https://example.com/a', 'https://example.com/b'],
        isPrivateClient: true,
      } as any;

      const result = normalizeClientResponse(client);
      expect(result.redirectUri).to.equal('https://example.com/a, https://example.com/b');
    });

    it('normalizes redirectUri from string', () => {
      const client = {
        clientId: 'client-5',
        name: 'Test',
        scopes: [],
        channels: [],
        redirectUri: 'https://example.com/callback',
      } as any;

      const result = normalizeClientResponse(client);
      expect(result.redirectUri).to.equal('https://example.com/callback');
    });

    it('handles undefined redirectUri', () => {
      const client = {
        clientId: 'client-6',
        name: 'Test',
        scopes: [],
        channels: [],
      } as any;

      const result = normalizeClientResponse(client);
      expect(result.redirectUri).to.equal('');
    });

    it('handles non-array channels', () => {
      const client = {
        clientId: 'client-7',
        name: 'Test',
        scopes: [],
        channels: 'not-array',
        redirectUri: '',
      } as any;

      const result = normalizeClientResponse(client);
      expect(result.channels).to.deep.equal([]);
    });

    it('includes callbackUri and secret', () => {
      const client = {
        clientId: 'client-8',
        name: 'Test',
        scopes: [],
        channels: [],
        redirectUri: '',
        callbackUri: 'https://example.com/cb',
        secret: 'super-secret',
        isPrivateClient: true,
      } as any;

      const result = normalizeClientResponse(client);
      expect(result.callbackUri).to.equal('https://example.com/cb');
      expect(result.secret).to.equal('super-secret');
    });

    it('defaults isPrivateClient to true when missing', () => {
      const client = {
        clientId: 'client-9',
        name: 'Test',
        scopes: [],
        channels: [],
        redirectUri: '',
      } as any;

      const result = normalizeClientResponse(client);
      expect(result.isPrivateClient).to.equal(true);
    });

    it('handles undefined clientId and name', () => {
      const client = {
        scopes: [],
        channels: [],
        redirectUri: '',
      } as any;

      const result = normalizeClientResponse(client);
      expect(result.clientId).to.equal('');
      expect(result.name).to.equal('');
    });
  });

  describe('printClientDetails', () => {
    it('prints basic client details', () => {
      const stdoutStub = sinon.stub(ux, 'stdout');
      const output = {
        clientId: 'client-1',
        name: 'Test Client',
        scopes: ['sfcc.products'],
        channels: ['SiteA'],
        redirectUri: 'https://example.com/callback',
        isPrivateClient: true,
      };

      printClientDetails(output);
      expect(stdoutStub.calledOnce).to.equal(true);
    });

    it('prints secret when showSecret is true', () => {
      const stdoutStub = sinon.stub(ux, 'stdout');
      const output = {
        clientId: 'client-1',
        name: 'Test',
        scopes: [],
        channels: [],
        redirectUri: '',
        isPrivateClient: true,
        secret: 'my-secret',
      };

      printClientDetails(output, true);
      expect(stdoutStub.calledOnce).to.equal(true);
      const text = stdoutStub.firstCall.args[0];
      expect(text).to.include('my-secret');
    });

    it('hides secret when showSecret is false', () => {
      const stdoutStub = sinon.stub(ux, 'stdout');
      const output = {
        clientId: 'client-1',
        name: 'Test',
        scopes: [],
        channels: [],
        redirectUri: '',
        isPrivateClient: true,
        secret: 'my-secret',
      };

      printClientDetails(output, false);
      expect(stdoutStub.calledOnce).to.equal(true);
      const text = stdoutStub.firstCall.args[0];
      expect(text).not.to.include('my-secret');
    });

    it('prints callbackUri when present', () => {
      const stdoutStub = sinon.stub(ux, 'stdout');
      const output = {
        clientId: 'client-1',
        name: 'Test',
        scopes: [],
        channels: [],
        redirectUri: '',
        isPrivateClient: false,
        callbackUri: 'https://example.com/cb',
      };

      printClientDetails(output);
      expect(stdoutStub.calledOnce).to.equal(true);
      const text = stdoutStub.firstCall.args[0];
      expect(text).to.include('https://example.com/cb');
    });
  });
});
