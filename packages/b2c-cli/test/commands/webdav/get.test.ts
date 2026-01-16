/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import WebDavGet from '../../../src/commands/webdav/get.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('webdav get', () => {
  let config: Config;
  let writeFileSyncStub: sinon.SinonStub;

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>) {
    const command: any = new WebDavGet([], config);
    stubParse(command, flags, args);
    await command.init();
    return command;
  }

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();

    // Guard against any accidental real file writes.
    writeFileSyncStub = sinon.stub(fs, 'writeFileSync').throws(new Error('Unexpected fs.writeFileSync'));
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  it('downloads to a file when output is omitted (defaults to basename(remote))', async () => {
    const command: any = await createCommand({root: 'impex'}, {remote: 'src/instance/export.zip'});

    sinon.stub(command, 'ensureWebDavAuth').returns(void 0);
    sinon.stub(command, 'buildPath').returns('Impex/src/instance/export.zip');
    sinon.stub(command, 'log').returns(void 0);

    sinon.stub(command, 'instance').get(() => ({
      webdav: {
        get: sinon.stub().resolves('abc'),
      },
    }));

    // This test expects a write, but it must be fully stubbed.
    writeFileSyncStub.resetBehavior();
    writeFileSyncStub.returns(void 0 as any);
    const stdoutStub = sinon.stub(process.stdout, 'write');

    const result = await command.run();

    expect(writeFileSyncStub.calledOnce).to.equal(true);
    expect(stdoutStub.called).to.equal(false);
    expect(result.remotePath).to.equal('Impex/src/instance/export.zip');
    expect(result.localPath).to.include('export.zip');
    expect(result.size).to.equal(3);
  });

  it('writes to stdout when --output is -', async () => {
    const command: any = await createCommand({root: 'impex', output: '-'}, {remote: 'src/instance/export.zip'});

    sinon.stub(command, 'ensureWebDavAuth').returns(void 0);
    sinon.stub(command, 'buildPath').returns('Impex/src/instance/export.zip');
    sinon.stub(command, 'log').returns(void 0);

    const webdavGet = sinon.stub().resolves('abc');
    sinon.stub(command, 'instance').get(() => ({
      webdav: {
        get: webdavGet,
      },
    }));
    const stdoutStub = sinon.stub(process.stdout, 'write');

    const result = await command.run();

    expect(writeFileSyncStub.called).to.equal(false);
    expect(stdoutStub.calledOnce).to.equal(true);
    expect(webdavGet.calledOnceWithExactly('Impex/src/instance/export.zip')).to.equal(true);
    expect(result.localPath).to.equal('-');
    expect(result.size).to.equal(3);
  });
});
