/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import SlasClientList from '../../../../src/commands/slas/client/list.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('slas client list', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    const command: any = new SlasClientList([], config);
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

  it('returns empty clients list when API returns no data array (JSON mode)', async () => {
    const command: any = await createCommand({'tenant-id': 'abcd_123'}, {});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const getStub = sinon.stub().resolves({data: {}, error: undefined});
    sinon.stub(command, 'getSlasClient').returns({GET: getStub} as any);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const result = await command.run();

    expect(result.clients).to.deep.equal([]);
  });

  it('calls command.error on API error when tenant exists', async () => {
    const command: any = await createCommand({'tenant-id': 'abcd_123'}, {});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const getStub = sinon.stub();
    // First call: list clients - returns error
    getStub.onFirstCall().resolves({data: undefined, error: {message: 'boom'}, response: {status: 401}});
    // Second call: check tenant - tenant exists
    getStub.onSecondCall().resolves({data: {tenantId: 'abcd_123'}, error: undefined});
    sinon.stub(command, 'getSlasClient').returns({GET: getStub} as any);

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('returns empty clients list when list errors and tenant does not exist (404)', async () => {
    const command: any = await createCommand({'tenant-id': 'abcd_123'}, {});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const getStub = sinon.stub();
    // First call: list clients - returns error
    getStub.onFirstCall().resolves({data: undefined, error: {message: 'boom'}, response: {status: 401}});
    // Second call: check tenant - tenant not found (404)
    getStub.onSecondCall().resolves({error: {message: 'not found'}, response: {status: 404}});
    sinon.stub(command, 'getSlasClient').returns({GET: getStub} as any);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const errorStub = sinon.stub(command, 'error');

    const result = await command.run();

    expect(result.clients).to.deep.equal([]);
    expect(errorStub.called).to.equal(false);
  });

  it('returns empty clients list when list errors and tenant does not exist (400 TenantNotFoundException)', async () => {
    const command: any = await createCommand({'tenant-id': 'abcd_123'}, {});

    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);

    const getStub = sinon.stub();
    // First call: list clients - returns error
    getStub.onFirstCall().resolves({data: undefined, error: {message: 'boom'}, response: {status: 401}});
    // Second call: check tenant - tenant not found (400 + TenantNotFoundException)
    getStub.onSecondCall().resolves({
      error: {exception_name: 'TenantNotFoundException'},
      response: {status: 400},
    });
    sinon.stub(command, 'getSlasClient').returns({GET: getStub} as any);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const errorStub = sinon.stub(command, 'error');

    const result = await command.run();

    expect(result.clients).to.deep.equal([]);
    expect(errorStub.called).to.equal(false);
  });
});
