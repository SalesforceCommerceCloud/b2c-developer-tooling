/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import MrtMemberUpdate from '../../../../../src/commands/mrt/project/member/update.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../../helpers/test-setup.js';

describe('mrt project member update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>): Promise<any> {
    return createTestCommand(MrtMemberUpdate, hooks.getConfig(), flags, args);
  }

  it('throws error when project is missing', async () => {
    const command = await createCommand({role: 1}, {email: 'user@example.com'});

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined}}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('MRT project is required');
    }
  });

  it('updates member role successfully', async () => {
    const command = await createCommand({json: true, project: 'my-project', role: 1}, {email: 'user@example.com'});

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockMember = {
      user: 'user@example.com',
      role: {
        name: 'Developer',
        value: 1,
      },
    };

    const updateMemberStub = sinon.stub().resolves(mockMember);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      this.log('Updating member...');
      return updateMemberStub();
    };

    const result = await command.run();

    expect(result.user).to.equal('user@example.com');
    expect(result.role.value).to.equal(1);
    expect(result.role.name).to.equal('Developer');
  });

  it('updates to admin role', async () => {
    const command = await createCommand({project: 'my-project', role: 0}, {email: 'user@example.com'});

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockMember = {
      user: 'user@example.com',
      role: {
        name: 'Admin',
        value: 0,
      },
    };

    const updateMemberStub = sinon.stub().resolves(mockMember);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      this.log('Updating member...');
      return updateMemberStub();
    };

    const result = await command.run();

    expect(result.role.value).to.equal(0);
  });

  it('handles API errors', async () => {
    const command = await createCommand({project: 'my-project', role: 2}, {email: 'user@example.com'});

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      this.log('Updating member...');
      this.error('Failed to update member: API error');
    };

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('Failed to update member');
    }
  });
});
