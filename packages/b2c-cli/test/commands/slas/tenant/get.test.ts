/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import SlasTenantGet from '../../../../src/commands/slas/tenant/get.js';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('slas tenant get', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown> = {}) {
    const command: any = new SlasTenantGet([], config);
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

  it('returns the tenant', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123'});
    const getStub = sinon.stub().resolves({data: {tenantId: 'abcd_123', merchantName: 'Shop'}, error: undefined});
    sinon.stub(command, 'getSlasClient').returns({GET: getStub});

    const result = await command.run();

    expect(getStub.firstCall.args[1].params.path.tenantId).to.equal('abcd_123');
    expect(result.merchantName).to.equal('Shop');
  });

  it('reports an unregistered tenant', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123'});
    sinon.stub(command, 'getSlasClient').returns({
      GET: sinon.stub().resolves({
        error: {exception_name: 'TenantNotFoundException', message: 'nope'},
        response: {status: 400},
      }),
    });

    expect(await expectError(command)).to.include('is not registered');
  });
});
