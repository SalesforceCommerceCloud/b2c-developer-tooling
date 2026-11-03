/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import SlasTenantSet from '../../../../src/commands/slas/tenant/set.js';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('slas tenant set', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown> = {}) {
    const command: any = new SlasTenantSet([], config);
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

  it('merges flags into the existing tenant and always writes the path tenant', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123', contact: 'New Contact'});
    const existing = {
      tenantId: 'abcd_123',
      merchantName: 'Shop',
      description: 'Desc',
      contact: 'Old',
      emailAddress: 'a@example.com',
      phoneNo: '+1 555',
    };
    const getStub = sinon.stub().resolves({data: existing, error: undefined});
    const putStub = sinon.stub().resolves({data: {...existing, contact: 'New Contact'}, error: undefined});
    sinon.stub(command, 'getSlasClient').returns({GET: getStub, PUT: putStub});

    await command.run();

    const {body, params} = putStub.firstCall.args[1];
    expect(params.path.tenantId).to.equal('abcd_123');
    expect(body).to.deep.equal({...existing, contact: 'New Contact'});
  });

  it('fills placeholders when registering a new tenant', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123', email: 'ops@example.com'});
    const getStub = sinon
      .stub()
      .resolves({error: {exception_name: 'TenantNotFoundException'}, response: {status: 400}});
    const putStub = sinon.stub().resolves({data: {tenantId: 'abcd_123'}, error: undefined});
    sinon.stub(command, 'getSlasClient').returns({GET: getStub, PUT: putStub});

    await command.run();

    const {body} = putStub.firstCall.args[1];
    expect(body.tenantId).to.equal('abcd_123');
    expect(body.emailAddress).to.equal('ops@example.com');
    expect(body.merchantName).to.be.a('string').and.not.empty;
    expect(body).to.not.have.property('phoneNo');
  });

  it('errors when the tenant lookup fails for another reason', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123'});
    sinon.stub(command, 'getSlasClient').returns({
      GET: sinon.stub().resolves({error: {message: 'forbidden'}, response: {status: 403}}),
    });

    expect(await expectError(command)).to.include('Failed to get SLAS tenant');
  });
});
