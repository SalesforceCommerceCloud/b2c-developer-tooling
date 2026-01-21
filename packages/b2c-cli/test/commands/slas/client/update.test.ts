/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import SlasClientUpdate from '../../../../src/commands/slas/client/update.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('slas client update', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    const command: any = new SlasClientUpdate([], config);
    stubParse(command, flags, args);
    await command.init();
    return command;
  }

  function stubAuthAndJson(command: any) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
  }

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('replaces list values when --replace is true', async () => {
    const command: any = await createCommand(
      {
        'tenant-id': 'abcd_123',
        channels: ['NewSite'],
        scopes: ['new.scope'],
        'redirect-uri': ['http://new/cb'],
        replace: true,
      },
      {clientId: 'my-client'},
    );

    stubAuthAndJson(command);

    const getStub = sinon.stub().resolves({
      data: {
        clientId: 'my-client',
        name: 'Existing',
        channels: ['OldSite'],
        scopes: 'old.scope',
        redirectUri: 'http://old/cb',
        callbackUri: 'cb1, cb2',
        isPrivateClient: true,
      },
      error: undefined,
    });

    const putStub = sinon.stub().resolves({
      data: {
        clientId: 'my-client',
        name: 'Existing',
        channels: ['NewSite'],
        scopes: 'new.scope',
        redirectUri: ['http://new/cb'],
        callbackUri: 'cb1, cb2',
        isPrivateClient: true,
      },
      error: undefined,
    });

    sinon.stub(command, 'getSlasClient').returns({GET: getStub, PUT: putStub} as any);

    const result = await command.run();

    expect(putStub.calledOnce).to.equal(true);
    const [, options] = putStub.firstCall.args as [string, any];
    expect(options.body.channels).to.deep.equal(['NewSite']);
    expect(options.body.scopes).to.deep.equal(['new.scope']);
    expect(options.body.redirectUri).to.deep.equal(['http://new/cb']);

    expect(result.clientId).to.equal('my-client');
  });

  it('appends list values with dedupe when --replace is false', async () => {
    const command: any = await createCommand(
      {
        'tenant-id': 'abcd_123',
        channels: ['Site2'],
        scopes: ['b', 'a'],
        'redirect-uri': ['http://r2'],
        replace: false,
      },
      {clientId: 'my-client'},
    );

    stubAuthAndJson(command);

    const getStub = sinon.stub().resolves({
      data: {
        clientId: 'my-client',
        name: 'Existing',
        channels: ['Site1'],
        scopes: 'a b',
        redirectUri: ['http://r1'],
        isPrivateClient: true,
      },
      error: undefined,
    });

    const putStub = sinon.stub().resolves({
      data: {
        clientId: 'my-client',
        name: 'Existing',
        channels: ['Site1', 'Site2'],
        scopes: 'a b',
        redirectUri: ['http://r1', 'http://r2'],
        isPrivateClient: true,
      },
      error: undefined,
    });

    sinon.stub(command, 'getSlasClient').returns({GET: getStub, PUT: putStub} as any);

    await command.run();

    const [, options] = putStub.firstCall.args as [string, any];
    expect(options.body.channels).to.deep.equal(['Site1', 'Site2']);
    expect(options.body.scopes).to.deep.equal(['a', 'b']);
    expect(options.body.redirectUri).to.deep.equal(['http://r1', 'http://r2']);
  });

  it('includes secret in update body when provided', async () => {
    const command: any = await createCommand({'tenant-id': 'abcd_123', secret: 'new-secret'}, {clientId: 'my-client'});

    stubAuthAndJson(command);

    const getStub = sinon.stub().resolves({
      data: {
        clientId: 'my-client',
        name: 'Existing',
        channels: ['Site1'],
        scopes: 'a',
        redirectUri: ['http://r1'],
        isPrivateClient: true,
      },
      error: undefined,
    });

    const putStub = sinon.stub().resolves({
      data: {
        clientId: 'my-client',
        name: 'Existing',
        channels: ['Site1'],
        scopes: 'a',
        redirectUri: ['http://r1'],
        isPrivateClient: true,
        secret: 'new-secret',
      },
      error: undefined,
    });

    sinon.stub(command, 'getSlasClient').returns({GET: getStub, PUT: putStub} as any);

    await command.run();

    const [, options] = putStub.firstCall.args as [string, any];
    expect(options.body.secret).to.equal('new-secret');
  });
});
