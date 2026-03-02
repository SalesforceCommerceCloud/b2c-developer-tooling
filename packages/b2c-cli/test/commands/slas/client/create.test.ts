/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import SlasClientCreate from '../../../../src/commands/slas/client/create.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('slas client create', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    const command: any = new SlasClientCreate([], config);
    stubParse(command, flags, args);
    await command.init();
    return command;
  }

  function stubErrorToThrow(command: any) {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('errors when neither --scopes nor --default-scopes is provided', async () => {
    const command: any = await createCommand(
      {
        'tenant-id': 'abcd_123',
        channels: ['RefArch'],
        'redirect-uri': ['http://localhost/callback'],
        'default-scopes': false,
      },
      {clientId: 'my-client'},
    );

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('creates private client and includes secret when --public is false', async () => {
    const command: any = await createCommand(
      {
        'tenant-id': 'abcd_123',
        name: 'My Client',
        channels: ['RefArch'],
        scopes: ['sfcc.shopper-products'],
        'default-scopes': false,
        'redirect-uri': ['http://localhost/callback'],
        public: false,
        'create-tenant': false,
        secret: 'my-secret',
      },
      {clientId: 'my-client'},
    );

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const putStub = sinon.stub().resolves({
      data: {
        clientId: 'my-client',
        name: 'My Client',
        scopes: 'sfcc.shopper-products',
        channels: ['RefArch'],
        redirectUri: ['http://localhost/callback'],
        isPrivateClient: true,
        secret: 'my-secret',
      },
      error: undefined,
      response: {status: 201},
    });

    sinon.stub(command, 'getSlasClient').returns({
      PUT: putStub,
    } as any);

    sinon.stub(command, 'ensureTenantExists').resolves(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const result = await command.run();

    expect(putStub.calledOnce).to.equal(true);
    const [, options] = putStub.firstCall.args as [string, any];
    expect(options.params.path.tenantId).to.equal('abcd_123');
    expect(options.params.path.clientId).to.equal('my-client');
    expect(options.body.isPrivateClient).to.equal(true);
    expect(options.body.secret).to.equal('my-secret');

    expect(result.clientId).to.equal('my-client');
    expect(result.isPrivateClient).to.equal(true);
  });

  it('creates public client and omits secret when --public is true', async () => {
    const command: any = await createCommand(
      {
        'tenant-id': 'abcd_123',
        name: 'My Client',
        channels: ['RefArch'],
        scopes: ['sfcc.shopper-products'],
        'default-scopes': false,
        'redirect-uri': ['http://localhost/callback'],
        public: true,
        'create-tenant': false,
      },
      {clientId: 'my-client'},
    );

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const putStub = sinon.stub().resolves({
      data: {
        clientId: 'my-client',
        name: 'My Client',
        scopes: 'sfcc.shopper-products',
        channels: ['RefArch'],
        redirectUri: ['http://localhost/callback'],
        isPrivateClient: false,
      },
      error: undefined,
      response: {status: 201},
    });

    sinon.stub(command, 'getSlasClient').returns({
      PUT: putStub,
    } as any);

    sinon.stub(command, 'ensureTenantExists').resolves(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const result = await command.run();

    const [, options] = putStub.firstCall.args as [string, any];
    expect(options.body.isPrivateClient).to.equal(false);
    expect('secret' in options.body).to.equal(false);

    expect(result.clientId).to.equal('my-client');
    expect(result.isPrivateClient).to.equal(false);
  });

  it('merges custom scopes with default scopes when both --default-scopes and --scopes are provided', async () => {
    const command: any = await createCommand(
      {
        'tenant-id': 'abcd_123',
        name: 'My Client',
        channels: ['RefArch'],
        scopes: ['sfcc.shopper-products', 'my.custom.scope'],
        'default-scopes': true,
        'redirect-uri': ['http://localhost/callback'],
        public: true,
        'create-tenant': false,
      },
      {clientId: 'my-client'},
    );

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const putStub = sinon.stub().resolves({
      data: {
        clientId: 'my-client',
        name: 'My Client',
        isPrivateClient: false,
      },
      error: undefined,
      response: {status: 201},
    });

    sinon.stub(command, 'getSlasClient').returns({
      PUT: putStub,
    } as any);

    sinon.stub(command, 'ensureTenantExists').resolves(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    await command.run();

    const [, options] = putStub.firstCall.args as [string, any];
    const sentScopes = options.body.scopes as string[];

    // Should contain the custom scope
    expect(sentScopes).to.include('my.custom.scope');
    // Should contain default scopes (spot-check a few)
    expect(sentScopes).to.include('sfcc.shopper-products');
    expect(sentScopes).to.include('sfcc.shopper-baskets-orders.rw');
    expect(sentScopes).to.include('sfcc.shopper-customers.login');
    // sfcc.shopper-products appears in both --scopes and defaults; should not be duplicated
    const productScopeCount = sentScopes.filter((s: string) => s === 'sfcc.shopper-products').length;
    expect(productScopeCount).to.equal(1);
  });

  it('calls ensureTenantExists when --create-tenant is true', async () => {
    const command: any = await createCommand(
      {
        'tenant-id': 'abcd_123',
        name: 'My Client',
        channels: ['RefArch'],
        scopes: ['sfcc.shopper-products'],
        'default-scopes': false,
        'redirect-uri': ['http://localhost/callback'],
        public: true,
        'create-tenant': true,
      },
      {clientId: 'my-client'},
    );

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const putStub = sinon.stub().resolves({
      data: {
        clientId: 'my-client',
        name: 'My Client',
        isPrivateClient: false,
      },
      error: undefined,
      response: {status: 200},
    });

    const slasClient = {PUT: putStub} as any;
    sinon.stub(command, 'getSlasClient').returns(slasClient);

    const ensureStub = sinon.stub(command, 'ensureTenantExists').resolves(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    await command.run();

    expect(ensureStub.calledOnce).to.equal(true);
    expect(ensureStub.firstCall.args[0]).to.equal(slasClient);
    expect(ensureStub.firstCall.args[1]).to.equal('abcd_123');
  });
});
