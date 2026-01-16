/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import SlasClientDelete from '../../../../src/commands/slas/client/delete.js';
import {isolateConfig, restoreConfig} from '../../../helpers/config-isolation.js';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('slas client delete', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    const command: any = new SlasClientDelete([], config);
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

  it('deletes a client via SLAS API', async () => {
    const command: any = await createCommand({'tenant-id': 'abcd_123'}, {clientId: 'my-client'});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const delStub = sinon.stub().resolves({error: undefined});
    sinon.stub(command, 'getSlasClient').returns({DELETE: delStub} as any);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const result = await command.run();

    expect(delStub.calledOnce).to.equal(true);
    const [, options] = delStub.firstCall.args as [string, any];
    expect(options.params.path.tenantId).to.equal('abcd_123');
    expect(options.params.path.clientId).to.equal('my-client');

    expect(result.clientId).to.equal('my-client');
    expect(result.deleted).to.equal(true);
  });

  it('calls command.error on API error', async () => {
    const command: any = await createCommand({'tenant-id': 'abcd_123'}, {clientId: 'my-client'});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const delStub = sinon.stub().resolves({error: {message: 'boom'}});
    sinon.stub(command, 'getSlasClient').returns({DELETE: delStub} as any);

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
