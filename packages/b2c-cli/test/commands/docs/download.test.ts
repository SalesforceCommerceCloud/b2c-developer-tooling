/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import DocsDownload from '../../../src/commands/docs/download.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('docs download', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    return createTestCommand(DocsDownload, hooks.getConfig(), flags, args);
  }

  it('calls downloadDocs with outputDir and keepArchive', async () => {
    const command: any = await createCommand({'keep-archive': true}, {output: './docs'});

    const instance = {config: {hostname: 'example.com'}};

    sinon.stub(command, 'requireServer').returns(void 0);
    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => instance);
    sinon.stub(command, 'log').returns(void 0);

    const downloadStub = sinon.stub().resolves({outputPath: './docs', fileCount: 1, archivePath: './docs/a.zip'});
    command.operations = {...command.operations, downloadDocs: downloadStub};

    const result = await command.run();

    expect(downloadStub.calledOnce).to.equal(true);
    expect(downloadStub.getCall(0).args[0]).to.equal(instance);
    expect(downloadStub.getCall(0).args[1]).to.deep.equal({outputDir: './docs', keepArchive: true});
    expect(result.fileCount).to.equal(1);
  });

  it('returns result directly in json mode', async () => {
    const command: any = await createCommand({json: true}, {output: './docs'});

    const instance = {config: {hostname: 'example.com'}};

    sinon.stub(command, 'requireServer').returns(void 0);
    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'instance').get(() => instance);
    sinon.stub(command, 'log').returns(void 0);

    const downloadStub = sinon.stub().resolves({outputPath: './docs', fileCount: 2});
    command.operations = {...command.operations, downloadDocs: downloadStub};

    const result = await command.run();

    expect(result.fileCount).to.equal(2);
  });
});
