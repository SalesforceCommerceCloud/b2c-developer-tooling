/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  getB2CConfigDirectory,
  getB2CSettingsPath,
  mergeProjectEnvironment,
  readB2CSettings,
  readProjectEnvironment,
  writeB2CSettings,
} from '@salesforce/b2c-tooling-sdk/config';

describe('shared B2C settings and project environment', () => {
  let tempDirectory: string;

  beforeEach(() => {
    tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-settings-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDirectory, {recursive: true, force: true});
  });

  it('uses the oclif-compatible B2C config directory', () => {
    expect(
      getB2CConfigDirectory({
        environment: {XDG_CONFIG_HOME: tempDirectory},
        homeDirectory: path.join(tempDirectory, 'home'),
        platform: 'linux',
      }),
    ).to.equal(path.join(tempDirectory, 'b2c'));
  });

  it('writes and reads the default config path while preserving other settings', () => {
    const configDirectory = path.join(tempDirectory, 'config');
    const defaultConfigPath = path.join(tempDirectory, 'shared.dw.json');

    writeB2CSettings({defaultConfigPath, futureSetting: true}, {configDirectory});

    expect(readB2CSettings({configDirectory})).to.deep.equal({defaultConfigPath, futureSetting: true});
    expect(JSON.parse(fs.readFileSync(getB2CSettingsPath({configDirectory}), 'utf8'))).to.deep.equal({
      defaultConfigPath,
      futureSetting: true,
    });
  });

  it('resolves a relative default path from the settings directory', () => {
    const configDirectory = path.join(tempDirectory, 'config');
    fs.mkdirSync(configDirectory, {recursive: true});
    fs.writeFileSync(getB2CSettingsPath({configDirectory}), JSON.stringify({defaultConfigPath: 'shared.dw.json'}));

    expect(readB2CSettings({configDirectory}).defaultConfigPath).to.equal(path.join(configDirectory, 'shared.dw.json'));
  });

  it('reads arbitrary project variables and gives ambient variables precedence', () => {
    fs.writeFileSync(path.join(tempDirectory, '.env'), 'SFCC_SERVER=project.example.com\nCUSTOM_VALUE=project\n');

    const projectEnvironment = readProjectEnvironment(tempDirectory);
    expect(projectEnvironment).to.deep.include({SFCC_SERVER: 'project.example.com', CUSTOM_VALUE: 'project'});
    expect(mergeProjectEnvironment(projectEnvironment, {CUSTOM_VALUE: 'ambient', AMBIENT_ONLY: 'yes'})).to.deep.equal({
      SFCC_SERVER: 'project.example.com',
      CUSTOM_VALUE: 'ambient',
      AMBIENT_ONLY: 'yes',
    });
  });
});
