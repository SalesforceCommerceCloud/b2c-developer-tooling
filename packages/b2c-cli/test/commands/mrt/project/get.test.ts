/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtProjectGet from '../../../../src/commands/mrt/project/get.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt project get', () => {
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
    return new MrtProjectGet([], config);
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('calls getProject with slug and returns project details', async () => {
    const command = createCommand();

    stubParse(command, {}, {slug: 'my-project'});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const getStub = sinon.stub().resolves({
      name: 'My Project',
      slug: 'my-project',
      organization: 'my-org',
      project_type: 'pwa',
      ssr_region: 'us-east-1',
      url: 'https://my-project.mobify-storefront.com',
      created_at: '2025-01-01T00:00:00Z',
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await getStub({
        projectSlug: 'my-project',
        origin: 'https://example.com',
      });
      return result;
    };

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    const [input] = getStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(result.name).to.equal('My Project');
    expect(result.slug).to.equal('my-project');
    expect(result.ssr_region).to.equal('us-east-1');
  });

  it('handles API error gracefully', async () => {
    const command = createCommand();

    stubParse(command, {}, {slug: 'nonexistent-project'});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    const getStub = sinon.stub().rejects(new Error('Project not found'));

    (command as any).run = async function () {
      this.requireMrtCredentials();
      try {
        return await getStub({projectSlug: 'nonexistent-project', origin: 'https://example.com'});
      } catch (error) {
        if (error instanceof Error) {
          this.error(`Failed to get project: ${error.message}`);
        }
        throw error;
      }
    };

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
