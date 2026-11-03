/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import SlasShopperDelete from '../../../../src/commands/slas/shopper/delete.js';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('slas shopper delete', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown> = {}) {
    const command: any = new SlasShopperDelete([], config);
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

  it('deletes the shopper and passes the email address', async () => {
    const command = await createCommand(
      {'tenant-id': 'abcd_123', email: 'a@example.com', force: true},
      {customerId: 'abcd1234'},
    );
    const delStub = sinon.stub().resolves({error: undefined, response: {status: 204}});
    sinon.stub(command, 'getSlasClient').returns({DELETE: delStub});

    const result = await command.run();

    const options = delStub.firstCall.args[1];
    expect(options.params.path).to.deep.equal({tenantId: 'abcd_123', customerId: 'abcd1234'});
    expect(options.params.query).to.deep.equal({emailAddress: 'a@example.com'});
    expect(result.deleted).to.equal(true);
  });

  it('reports an unknown shopper', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123', force: true}, {customerId: 'abcd1234'});
    sinon.stub(command, 'getSlasClient').returns({
      DELETE: sinon.stub().resolves({error: {exception_name: 'ShopperNotFoundException'}, response: {status: 404}}),
    });

    expect(await expectError(command)).to.include('not found');
  });
});
