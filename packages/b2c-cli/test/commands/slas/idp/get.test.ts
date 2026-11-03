/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import SlasIdpGet from '../../../../src/commands/slas/idp/get.js';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('slas idp get', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown> = {}) {
    const command: any = new SlasIdpGet([], config);
    stubParse(command, flags, args);
    await command.init();
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    return command;
  }

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  const idp = {name: 'google', clientId: 'c1', clientSecret: 'shh', privateJwtKeyPair: 'key'};

  it('masks the client secret and key pair by default', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123'}, {name: 'google'});
    sinon.stub(command, 'getSlasClient').returns({GET: sinon.stub().resolves({data: idp, error: undefined})});

    const result = await command.run();

    expect(result.clientSecret).to.equal('********');
    expect(result.privateJwtKeyPair).to.equal('********');
  });

  it('shows the secret with --show-secret', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123', 'show-secret': true}, {name: 'google'});
    sinon.stub(command, 'getSlasClient').returns({GET: sinon.stub().resolves({data: idp, error: undefined})});

    const result = await command.run();

    expect(result.clientSecret).to.equal('shh');
  });

  it('reports a missing provider', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123'}, {name: 'okta-nope'});
    sinon.stub(command, 'getSlasClient').returns({
      GET: sinon.stub().resolves({error: {exception_name: 'IdpNotFoundException'}, response: {status: 404}}),
    });
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
    } catch {
      // expected
    }

    expect(errorStub.firstCall.args[0]).to.include('Identity provider okta-nope not found');
  });
});
