/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import {expect} from 'chai';
import sinon from 'sinon';
import MrtNotificationGet from '../../../../../src/commands/mrt/project/notification/get.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../../helpers/test-setup.js';

describe('mrt project notification get', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>): Promise<any> {
    return createTestCommand(MrtNotificationGet, hooks.getConfig(), flags, args);
  }

  it('throws error when project is missing', async () => {
    const command = await createCommand({}, {id: 'notif-123'});

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

  it('fetches and returns notification in JSON mode', async () => {
    const command = await createCommand({json: true, project: 'my-project'}, {id: 'notif-123'});

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockNotification = {
      id: 'notif-123',
      targets: ['production'],
      recipients: ['team@example.com'],
      deployment_start: true,
      deployment_success: true,
      deployment_failed: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    };

    // Override run method to avoid actual API call
    const getStub = sinon.stub().resolves(mockNotification);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      return getStub();
    };

    const result = await command.run();

    expect(result.id).to.equal('notif-123');
    expect(result.targets).to.deep.equal(['production']);
    expect(result.recipients).to.deep.equal(['team@example.com']);
  });

  it('prints notification details in non-JSON mode', async () => {
    const command = await createCommand({project: 'my-project'}, {id: 'notif-123'});

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(ux, 'stdout');
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockNotification = {
      id: 'notif-123',
      targets: ['production'],
      recipients: ['team@example.com'],
      deployment_start: true,
      deployment_success: false,
      deployment_failed: false,
    };

    // Override run method to avoid actual API call
    const getStub = sinon.stub().resolves(mockNotification);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      return getStub();
    };

    const result = await command.run();

    expect(result.id).to.equal('notif-123');
  });

  it('handles API errors', async () => {
    const command = await createCommand({project: 'my-project'}, {id: 'notif-123'});

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    // Override run method to simulate API error
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      this.error('Failed to get notification: API error');
    };

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('Failed to get notification');
    }
  });
});
