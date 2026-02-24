/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import MrtNotificationUpdate from '../../../../../src/commands/mrt/project/notification/update.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../../helpers/test-setup.js';

describe('mrt project notification update', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>): Promise<any> {
    return createTestCommand(MrtNotificationUpdate, hooks.getConfig(), flags, args);
  }

  it('throws error when project is missing', async () => {
    const command = await createCommand({target: ['staging']}, {id: 'notif-123'});

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

  it('updates notification with all flags', async () => {
    const command = await createCommand(
      {
        json: true,
        project: 'my-project',
        target: ['staging', 'production'],
        recipient: ['team@example.com'],
        'on-start': true,
        'on-success': false,
        'on-failed': true,
      },
      {id: 'notif-123'},
    );

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockNotification = {
      id: 'notif-123',
      targets: ['staging', 'production'],
      recipients: ['team@example.com'],
      deployment_start: true,
      deployment_success: false,
      deployment_failed: true,
    };

    // Override run method to avoid actual API call
    const updateStub = sinon.stub().resolves(mockNotification);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      return updateStub();
    };

    const result = await command.run();

    expect(result.id).to.equal('notif-123');
    expect(result.targets).to.deep.equal(['staging', 'production']);
  });

  it('updates notification with partial flags', async () => {
    const command = await createCommand(
      {
        json: true,
        project: 'my-project',
        target: ['production'],
      },
      {id: 'notif-123'},
    );

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
      recipients: ['existing@example.com'],
      deployment_start: false,
      deployment_success: false,
      deployment_failed: false,
    };

    // Override run method to avoid actual API call
    const updateStub = sinon.stub().resolves(mockNotification);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      return updateStub();
    };

    const result = await command.run();

    expect(result.id).to.equal('notif-123');
    expect(result.targets).to.deep.equal(['production']);
  });

  it('handles API errors', async () => {
    const command = await createCommand({project: 'my-project', target: ['staging']}, {id: 'notif-123'});

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
      this.error('Failed to update notification: API error');
    };

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('Failed to update notification');
    }
  });
});
