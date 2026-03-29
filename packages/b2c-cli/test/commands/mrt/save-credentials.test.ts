/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtSaveCredentials from '../../../src/commands/mrt/save-credentials.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../helpers/stub-parse.js';
import {runSilent} from '../../helpers/test-setup.js';

describe('mrt save-credentials', () => {
  let config: Config;
  let tempDir: string;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b2c-save-creds-'));
  });

  afterEach(async () => {
    sinon.restore();
    restoreConfig();
    await fs.rm(tempDir, {recursive: true, force: true});
  });

  function createCommand(flags: Record<string, unknown> = {}): any {
    const command = new MrtSaveCredentials([], config);
    stubParse(command, flags, {});
    return command;
  }

  it('writes credentials to the specified file', async () => {
    const credFile = path.join(tempDir, '.mobify');
    const command = createCommand({
      user: 'user@example.com',
      'api-key': 'abc123',
      'credentials-file': credFile,
    });
    await command.init();
    sinon.stub(command, 'log');

    const result = (await runSilent(() => command.run())) as {username: string; api_key: string};

    expect(result).to.deep.equal({username: 'user@example.com', api_key: 'abc123'});

    const content = JSON.parse(await fs.readFile(credFile, 'utf8'));
    expect(content).to.deep.equal({username: 'user@example.com', api_key: 'abc123'});
  });

  it('sets file permissions to 0o600', async () => {
    const credFile = path.join(tempDir, '.mobify');
    const command = createCommand({
      user: 'user@example.com',
      'api-key': 'key123',
      'credentials-file': credFile,
    });
    await command.init();
    sinon.stub(command, 'log');

    await runSilent(() => command.run());

    const stat = await fs.stat(credFile);
    // eslint-disable-next-line no-bitwise -- checking file permission bits
    expect(stat.mode & 0o777).to.equal(0o600);
  });

  it('writes to default ~/.mobify when no --credentials-file or --cloud-origin', async () => {
    const command = createCommand({
      user: 'user@example.com',
      'api-key': 'key123',
    });
    await command.init();
    sinon.stub(command, 'log');

    // Stub getMobifyPath to use temp dir instead of real home
    sinon.stub(command as any, 'getMobifyPath').returns(path.join(tempDir, '.mobify'));

    await runSilent(() => command.run());

    const content = JSON.parse(await fs.readFile(path.join(tempDir, '.mobify'), 'utf8'));
    expect(content.api_key).to.equal('key123');
  });

  it('uses --cloud-origin hostname for file suffix', async () => {
    const command = createCommand({
      user: 'user@example.com',
      'api-key': 'key123',
      'cloud-origin': 'https://cloud-staging.example.com',
    });
    await command.init();
    sinon.stub(command, 'log');

    // Redirect getMobifyPath to use temp dir
    const expectedFile = path.join(tempDir, '.mobify--cloud-staging.example.com');
    sinon.stub(command as any, 'getMobifyPath').returns(expectedFile);

    await runSilent(() => command.run());

    const content = JSON.parse(await fs.readFile(expectedFile, 'utf8'));
    expect(content.api_key).to.equal('key123');
  });

  it('--credentials-file takes precedence over --cloud-origin', async () => {
    const credFile = path.join(tempDir, 'my-creds');
    const command = createCommand({
      user: 'user@example.com',
      'api-key': 'key123',
      'cloud-origin': 'https://cloud-staging.example.com',
      'credentials-file': credFile,
    });
    await command.init();
    sinon.stub(command, 'log');

    await runSilent(() => command.run());

    const content = JSON.parse(await fs.readFile(credFile, 'utf8'));
    expect(content.api_key).to.equal('key123');
  });

  it('creates new file without confirmation when file does not exist', async () => {
    const credFile = path.join(tempDir, '.mobify');
    const command = createCommand({
      user: 'user@example.com',
      'api-key': 'key123',
      'credentials-file': credFile,
    });
    await command.init();
    sinon.stub(command, 'log');

    // confirm should not be called
    const confirmStub = sinon.stub(command as any, 'confirm');

    await runSilent(() => command.run());

    expect(confirmStub.called).to.equal(false);
  });

  it('prompts for confirmation when file already exists', async () => {
    const credFile = path.join(tempDir, '.mobify');
    await fs.writeFile(credFile, '{"api_key": "old"}', 'utf8');

    const command = createCommand({
      user: 'user@example.com',
      'api-key': 'newkey',
      'credentials-file': credFile,
    });
    await command.init();
    sinon.stub(command, 'log');

    sinon.stub(command as any, 'confirm').resolves(true);

    await runSilent(() => command.run());

    const content = JSON.parse(await fs.readFile(credFile, 'utf8'));
    expect(content.api_key).to.equal('newkey');
  });

  it('aborts when user declines overwrite confirmation', async () => {
    const credFile = path.join(tempDir, '.mobify');
    await fs.writeFile(credFile, '{"api_key": "old"}', 'utf8');

    const command = createCommand({
      user: 'user@example.com',
      'api-key': 'newkey',
      'credentials-file': credFile,
    });
    await command.init();
    sinon.stub(command, 'log');

    const errorStub = sinon.stub(command, 'error').throws(new Error('Save cancelled.'));
    sinon.stub(command as any, 'confirm').resolves(false);

    try {
      await command.run();
      expect.fail('Expected command to throw');
    } catch {
      // Expected
    }

    expect(errorStub.calledOnce).to.equal(true);

    // File should not be modified
    const content = JSON.parse(await fs.readFile(credFile, 'utf8'));
    expect(content.api_key).to.equal('old');
  });

  it('--yes skips confirmation even when file exists', async () => {
    const credFile = path.join(tempDir, '.mobify');
    await fs.writeFile(credFile, '{"api_key": "old"}', 'utf8');

    const command = createCommand({
      user: 'user@example.com',
      'api-key': 'newkey',
      'credentials-file': credFile,
      yes: true,
    });
    await command.init();
    sinon.stub(command, 'log');

    const confirmStub = sinon.stub(command as any, 'confirm');

    await runSilent(() => command.run());

    expect(confirmStub.called).to.equal(false);

    const content = JSON.parse(await fs.readFile(credFile, 'utf8'));
    expect(content.api_key).to.equal('newkey');
  });

  it('writes pretty-printed JSON with trailing newline', async () => {
    const credFile = path.join(tempDir, '.mobify');
    const command = createCommand({
      user: 'user@example.com',
      'api-key': 'key123',
      'credentials-file': credFile,
    });
    await command.init();
    sinon.stub(command, 'log');

    await runSilent(() => command.run());

    const raw = await fs.readFile(credFile, 'utf8');
    const expected = JSON.stringify({username: 'user@example.com', api_key: 'key123'}, null, 2) + '\n';
    expect(raw).to.equal(expected);
  });
});
