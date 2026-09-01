/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import SlasClientGet from '../../../../src/commands/slas/client/get.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('slas client get', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    const command: any = new SlasClientGet([], config);
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

  it('prefers a positional client ID over the configured client ID', async () => {
    const command: any = await createCommand(
      {'tenant-id': 'abcd_123', 'slas-client-id': 'configured-client'},
      {clientId: 'my-client'},
    );

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const getStub = sinon.stub().resolves({
      data: {
        clientId: 'my-client',
        name: 'My Client',
        scopes: 'a b',
        channels: ['RefArch'],
        redirectUri: ['http://localhost/callback'],
        isPrivateClient: true,
      },
      error: undefined,
    });

    sinon.stub(command, 'getSlasClient').returns({GET: getStub} as any);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    expect(getStub.firstCall.args[1]).to.deep.equal({
      params: {
        path: {tenantId: 'abcd_123', clientId: 'my-client'},
      },
    });
    expect(result.clientId).to.equal('my-client');
    expect(result.scopes).to.deep.equal(['a', 'b']);
    expect(result.channels).to.deep.equal(['RefArch']);
  });

  it('uses the configured client ID when the positional argument is omitted', async () => {
    const command: any = await createCommand({'tenant-id': 'abcd_123', 'slas-client-id': 'configured-client'}, {});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const getStub = sinon.stub().resolves({
      data: {
        clientId: 'configured-client',
        name: 'Configured Client',
        scopes: 'a b',
        channels: ['RefArch'],
        redirectUri: ['http://localhost/callback'],
        isPrivateClient: true,
      },
      error: undefined,
    });

    sinon.stub(command, 'getSlasClient').returns({GET: getStub} as any);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    expect(getStub.firstCall.args[1]).to.deep.equal({
      params: {
        path: {tenantId: 'abcd_123', clientId: 'configured-client'},
      },
    });
    expect(result.clientId).to.equal('configured-client');
  });

  it('calls command.error when no client ID is provided or configured', async () => {
    const command: any = await createCommand({'tenant-id': 'abcd_123'}, {});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('SLAS client ID is required');
    }
  });

  it('calls command.error on API error', async () => {
    const command: any = await createCommand({'tenant-id': 'abcd_123'}, {clientId: 'my-client'});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const getStub = sinon.stub().resolves({data: undefined, error: {message: 'boom'}});
    sinon.stub(command, 'getSlasClient').returns({GET: getStub} as any);

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
