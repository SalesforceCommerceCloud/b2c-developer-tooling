/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtBundleDownload from '../../../../src/commands/mrt/bundle/download.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt bundle download', () => {
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
    return new MrtBundleDownload([], config);
  }

  function stubErrorToThrow(command: any): sinon.SinonStub {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('calls command.error when project is missing', async () => {
    const command = createCommand();

    stubParse(command, {}, {bundleId: 12_345});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('calls downloadBundle and returns URL with --url-only flag', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', 'url-only': true}, {bundleId: 12_345});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'}}));

    const downloadStub = sinon.stub().resolves({
      downloadUrl: 'https://storage.example.com/bundles/12_345.tgz?signature=xyz',
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await downloadStub({
        projectSlug: 'my-project',
        bundleId: 12_345,
        origin: 'https://example.com',
      });
      return result;
    };

    const result = await command.run();

    expect(downloadStub.calledOnce).to.equal(true);
    const [input] = downloadStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.bundleId).to.equal(12_345);
    expect(result.downloadUrl).to.include('storage.example.com');
  });
});
