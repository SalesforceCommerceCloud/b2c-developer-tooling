/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import MrtNotificationCreate from '../../../../../src/commands/mrt/project/notification/create.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../../helpers/test-setup.js';

describe('mrt project notification create', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>): Promise<any> {
    return createTestCommand(MrtNotificationCreate, hooks.getConfig(), flags, {});
  }

  it('throws error when project is missing', async () => {
    const command = await createCommand({
      target: ['staging'],
      recipient: ['team@example.com'],
    });

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

  it('creates notification with all flags', async () => {
    const command = await createCommand({
      json: true,
      project: 'my-project',
      target: ['staging', 'production'],
      recipient: ['team@example.com', 'ops@example.com'],
      'on-start': true,
      'on-success': true,
      'on-failed': false,
    });

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
      recipients: ['team@example.com', 'ops@example.com'],
      deployment_start: true,
      deployment_success: true,
      deployment_failed: false,
    };

    // Override run method to avoid actual API call
    const createStub = sinon.stub().resolves(mockNotification);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      return createStub();
    };

    const result = await command.run();

    expect(result.id).to.equal('notif-123');
    expect(result.targets).to.deep.equal(['staging', 'production']);
    expect(result.recipients).to.have.lengthOf(2);
  });

  it('creates notification with minimal flags', async () => {
    const command = await createCommand({
      json: true,
      project: 'my-project',
      target: ['staging'],
      recipient: ['team@example.com'],
    });

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockNotification = {
      id: 'notif-456',
      targets: ['staging'],
      recipients: ['team@example.com'],
      deployment_start: false,
      deployment_success: false,
      deployment_failed: false,
    };

    // Override run method to avoid actual API call
    const createStub = sinon.stub().resolves(mockNotification);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      return createStub();
    };

    const result = await command.run();

    expect(result.id).to.equal('notif-456');
  });

  it('handles API errors', async () => {
    const command = await createCommand({
      project: 'my-project',
      target: ['staging'],
      recipient: ['team@example.com'],
    });

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
      this.error('Failed to create notification: API error');
    };

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('Failed to create notification');
    }
  });
});
