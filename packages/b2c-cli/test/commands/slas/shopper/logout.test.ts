/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import SlasShopperLogout from '../../../../src/commands/slas/shopper/logout.js';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('slas shopper logout', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown> = {}) {
    const command: any = new SlasShopperLogout([], config);
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
    process.exitCode = undefined;
    sinon.restore();
    restoreConfig();
  });

  it('requires at least one login ID', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123', 'site-id': 'RefArch', force: true});
    expect(await expectError(command)).to.include('at least one login ID');
  });

  it('requires a site ID', async () => {
    const command = await createCommand({'tenant-id': 'abcd_123', 'login-id': ['a@example.com'], force: true});
    expect(await expectError(command)).to.include('Site ID is required');
  });

  it('batches login IDs in groups of 50 and aggregates the results', async () => {
    const loginIds = Array.from({length: 51}, (_, i) => `user${i}@example.com`);
    const command = await createCommand({
      'tenant-id': 'abcd_123',
      'site-id': 'RefArch',
      'login-id': [...loginIds, 'user0@example.com'],
      force: true,
    });
    const postStub = sinon.stub().callsFake(async (_path: string, options: any) => ({
      data: {
        results: options.body.loginIds.map((loginId: string) => ({loginId, status: 'success'})),
        totalProcessed: options.body.loginIds.length,
        successCount: options.body.loginIds.length,
        failureCount: 0,
      },
      error: undefined,
    }));
    sinon.stub(command, 'getSlasClient').returns({POST: postStub});

    const result = await command.run();

    expect(postStub.callCount).to.equal(2);
    expect(postStub.firstCall.args[1].body.loginIds).to.have.length(50);
    expect(postStub.firstCall.args[1].params.query.channelId).to.equal('RefArch');
    expect(postStub.secondCall.args[1].body.loginIds).to.deep.equal(['user50@example.com']);
    expect(result.successCount).to.equal(51);
    expect(process.exitCode).to.not.equal(1);
  });

  it('sets a failing exit code when any logout fails', async () => {
    const command = await createCommand({
      'tenant-id': 'abcd_123',
      'site-id': 'RefArch',
      'login-id': ['a@example.com'],
      force: true,
    });
    sinon.stub(command, 'getSlasClient').returns({
      POST: sinon.stub().resolves({
        data: {
          results: [{loginId: 'a@example.com', status: 'failure', errorMessage: 'User not found'}],
          totalProcessed: 1,
          successCount: 0,
          failureCount: 1,
        },
        error: undefined,
      }),
    });

    const result = await command.run();

    expect(result.failureCount).to.equal(1);
    expect(process.exitCode).to.equal(1);
  });
});
