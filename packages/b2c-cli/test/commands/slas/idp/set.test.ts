/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import SlasIdpSet from '../../../../src/commands/slas/idp/set.js';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('slas idp set', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown> = {}) {
    const command: any = new SlasIdpSet([], config);
    stubParse(command, flags, args);
    await command.init();
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    return command;
  }

  async function expectError(command: any): Promise<string> {
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));
    try {
      await command.run();
    } catch {
      // expected
    }
    expect(errorStub.calledOnce).to.equal(true);
    return errorStub.firstCall.args[0] as string;
  }

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  const notFound = {error: {exception_name: 'IdpNotFoundException'}, response: {status: 404}};

  it('rejects an invalid provider name', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123'}, {name: 'myprovider'});
    expect(await expectError(command)).to.include('Invalid identity provider name');
  });

  it('lists missing fields when creating a new provider', async () => {
    const command = await createCommand(
      {'tenant-id': 'abcd_123', 'short-code': 'kv7kzm78', 'idp-client-id': 'c1'},
      {
        name: 'okta-staging',
      },
    );
    sinon.stub(command, 'getSlasClient').returns({GET: sinon.stub().resolves(notFound)});

    const message = await expectError(command);
    expect(message).to.include('does not exist yet');
    expect(message).to.include('clientSecret');
    expect(message).to.not.include('clientId,');
  });

  it('creates a provider with isPreferred and a default redirect URL', async () => {
    const command = await createCommand(
      {
        'tenant-id': 'abcd_123',
        'short-code': 'kv7kzm78',
        'idp-client-id': 'c1',
        'idp-client-secret': 'shh',
        'auth-url': 'https://idp.example.com/auth',
        'token-url': 'https://idp.example.com/token',
        'token-info-url': 'https://idp.example.com/info',
        'user-info-url': 'https://idp.example.com/user',
        'well-known-url': 'https://idp.example.com/.well-known/openid-configuration',
        scopes: ['openid', 'email'],
      },
      {name: 'okta-staging'},
    );
    const putStub = sinon.stub().resolves({data: {name: 'okta-staging', clientSecret: 'shh'}, error: undefined});
    sinon.stub(command, 'getSlasClient').returns({GET: sinon.stub().resolves(notFound), PUT: putStub});

    const result = await command.run();

    const {body} = putStub.firstCall.args[1];
    expect(body.name).to.equal('okta-staging');
    expect(body.clientId).to.equal('c1');
    expect(body.isPreferred).to.equal(false);
    expect(body).to.not.have.property('preferenceValue');
    expect(body.redirectUrl).to.equal(
      'https://kv7kzm78.api.commercecloud.salesforce.com/shopper/auth/v1/idp/callback/okta-staging',
    );
    expect(result.clientSecret).to.equal('********');
  });

  it('updates an existing provider, keeping its fields and sending clientAuthType', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123', preferred: true}, {name: 'google'});
    const existing = {
      id: 1,
      tenantId: 'abcd_123',
      idpOrigin: 'google',
      name: 'google',
      clientId: 'c1',
      clientSecret: 'shh',
      scopes: ['openid'],
      isPreferred: false,
      clientAuthType: 'client_secret',
      privateJwtKeyPair: '',
    };
    const putStub = sinon.stub().resolves({data: {...existing, isPreferred: true}, error: undefined});
    sinon.stub(command, 'getSlasClient').returns({
      GET: sinon.stub().resolves({data: existing, error: undefined}),
      PUT: putStub,
    });

    await command.run();

    const {body} = putStub.firstCall.args[1];
    expect(body.isPreferred).to.equal(true);
    expect(body.clientSecret).to.equal('shh');
    expect(body.clientAuthType).to.equal('client_secret');
    expect(body).to.not.have.any.keys('id', 'tenantId', 'idpOrigin');
  });
});
