/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import DocsDownload from '../../../src/commands/docs/download.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('docs download', () => {
  let config: Config;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    const command: any = new DocsDownload([], config);
    stubParse(command, flags, args);
    await command.init();
    return command;
  }

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('calls downloadDocs with outputDir and keepArchive', async () => {
    const command: any = await createCommand({'keep-archive': true}, {output: './docs'});

    sinon.stub(command, 'requireServer').returns(void 0);
    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({hostname: 'example.com'}));
    sinon.stub(command, 'log').returns(void 0);

    const downloadStub = sinon
      .stub(command, 'downloadDocs')
      .resolves({outputPath: './docs', fileCount: 1, archivePath: './docs/a.zip'});

    const result = await command.run();

    expect(downloadStub.calledOnce).to.equal(true);
    expect(downloadStub.getCall(0).args[0]).to.deep.equal({outputDir: './docs', keepArchive: true});
    expect(result.fileCount).to.equal(1);
  });

  it('returns result directly in json mode', async () => {
    const command: any = await createCommand({json: true}, {output: './docs'});

    sinon.stub(command, 'requireServer').returns(void 0);
    sinon.stub(command, 'requireWebDavCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({hostname: 'example.com'}));
    sinon.stub(command, 'log').returns(void 0);

    sinon.stub(command, 'downloadDocs').resolves({outputPath: './docs', fileCount: 2});

    const result = await command.run();

    expect(result.fileCount).to.equal(2);
  });
});
