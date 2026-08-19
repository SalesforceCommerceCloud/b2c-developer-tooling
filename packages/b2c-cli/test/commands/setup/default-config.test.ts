/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import SetupDefaultConfigGet from '../../../src/commands/setup/default-config/get.js';
import SetupDefaultConfigSet from '../../../src/commands/setup/default-config/set.js';
import SetupDefaultConfigUnset from '../../../src/commands/setup/default-config/unset.js';

function prepareCommand(command: any, configDirectory: string): void {
  Object.defineProperty(command, 'config', {value: {configDir: configDirectory}, configurable: true});
  command.jsonEnabled = () => true;
}

describe('setup default-config', () => {
  let tempDirectory: string;
  let configDirectory: string;
  let configPath: string;

  beforeEach(() => {
    tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-default-config-command-test-'));
    configDirectory = path.join(tempDirectory, 'settings');
    configPath = path.join(tempDirectory, 'dw.json');
    fs.writeFileSync(configPath, JSON.stringify({hostname: 'default.demandware.net'}));
  });

  afterEach(() => {
    fs.rmSync(tempDirectory, {recursive: true, force: true});
  });

  it('sets and gets the shared default config path', async () => {
    const setCommand = new SetupDefaultConfigSet([], {} as any);
    prepareCommand(setCommand, configDirectory);
    (setCommand as any).args = {path: configPath};

    const setResult = await setCommand.run();
    expect(setResult.defaultConfigPath).to.equal(configPath);

    const getCommand = new SetupDefaultConfigGet([], {} as any);
    prepareCommand(getCommand, configDirectory);
    const getResult = await getCommand.run();

    expect(getResult).to.deep.include({defaultConfigPath: configPath, exists: true});
  });

  it('unsets the shared default config path without removing other settings', async () => {
    fs.mkdirSync(configDirectory, {recursive: true});
    fs.writeFileSync(
      path.join(configDirectory, 'settings.json'),
      JSON.stringify({defaultConfigPath: configPath, futureSetting: true}),
    );
    const unsetCommand = new SetupDefaultConfigUnset([], {} as any);
    prepareCommand(unsetCommand, configDirectory);

    const result = await unsetCommand.run();

    expect(result.removed).to.equal(true);
    expect(JSON.parse(fs.readFileSync(path.join(configDirectory, 'settings.json'), 'utf8'))).to.deep.equal({
      futureSetting: true,
    });
  });

  it('stores a config beside settings.json as a relative path', async () => {
    fs.mkdirSync(configDirectory, {recursive: true});
    const colocatedConfigPath = path.join(configDirectory, 'dw.json');
    fs.writeFileSync(colocatedConfigPath, JSON.stringify({hostname: 'colocated.demandware.net'}));
    const setCommand = new SetupDefaultConfigSet([], {} as any);
    prepareCommand(setCommand, configDirectory);
    (setCommand as any).args = {path: colocatedConfigPath};

    await setCommand.run();

    expect(JSON.parse(fs.readFileSync(path.join(configDirectory, 'settings.json'), 'utf8'))).to.deep.include({
      defaultConfigPath: './dw.json',
    });
  });
});
