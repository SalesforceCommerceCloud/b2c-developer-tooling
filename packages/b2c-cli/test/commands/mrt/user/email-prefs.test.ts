/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtUserEmailPrefs from '../../../../src/commands/mrt/user/email-prefs.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt user email-prefs', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  function createCommand(): any {
    return new MrtUserEmailPrefs([], config);
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('calls getEmailPreferences and returns current preferences', async () => {
    const command = createCommand();

    stubParse(command, {}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const getStub = sinon.stub().resolves({
      node_deprecation_notifications: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await getStub({origin: 'https://example.com'});
      return result;
    };

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    expect(result.node_deprecation_notifications).to.equal(true);
    expect(result.created_at).to.equal('2025-01-01T00:00:00Z');
  });

  it('calls updateEmailPreferences when node-deprecation flag is true', async () => {
    const command = createCommand();

    stubParse(command, {'node-deprecation': true}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const updateStub = sinon.stub().resolves({
      node_deprecation_notifications: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-03T00:00:00Z',
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const nodeDeprecation = this.flags['node-deprecation'];
      if (nodeDeprecation !== undefined) {
        const result = await updateStub({
          nodeDeprecationNotifications: nodeDeprecation,
          origin: 'https://example.com',
        });
        return result;
      }
      return {};
    };

    const result = await command.run();

    expect(updateStub.calledOnce).to.equal(true);
    const [input] = updateStub.firstCall.args;
    expect(input.nodeDeprecationNotifications).to.equal(true);
    expect(result.node_deprecation_notifications).to.equal(true);
  });

  it('calls updateEmailPreferences when node-deprecation flag is false', async () => {
    const command = createCommand();

    stubParse(command, {'node-deprecation': false}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const updateStub = sinon.stub().resolves({
      node_deprecation_notifications: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-03T00:00:00Z',
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const nodeDeprecation = this.flags['node-deprecation'];
      if (nodeDeprecation !== undefined) {
        const result = await updateStub({
          nodeDeprecationNotifications: nodeDeprecation,
          origin: 'https://example.com',
        });
        return result;
      }
      return {};
    };

    const result = await command.run();

    expect(updateStub.calledOnce).to.equal(true);
    const [input] = updateStub.firstCall.args;
    expect(input.nodeDeprecationNotifications).to.equal(false);
    expect(result.node_deprecation_notifications).to.equal(false);
  });

  it('handles preferences with no timestamps', async () => {
    const command = createCommand();

    stubParse(command, {}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const getStub = sinon.stub().resolves({
      node_deprecation_notifications: false,
      created_at: null,
      updated_at: null,
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await getStub({origin: 'https://example.com'});
      return result;
    };

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    expect(result.node_deprecation_notifications).to.equal(false);
    expect(result.created_at).to.equal(null);
    expect(result.updated_at).to.equal(null);
  });
});
