/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import path from 'node:path';
import {Args, ux} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getB2CSettingsPath,
  loadFullDwJson,
  readB2CSettings,
  writeB2CSettings,
} from '@salesforce/b2c-tooling-sdk/config';
import {t, withDocs} from '../../../i18n/index.js';

interface DefaultConfigSetResponse {
  defaultConfigPath: string;
  settingsPath: string;
}

/** Set the shared global dw.json configuration file. */
export default class SetupDefaultConfigSet extends BaseCommand<typeof SetupDefaultConfigSet> {
  static args = {
    path: Args.string({
      description: 'Path to a configuration file in dw.json format',
      required: true,
    }),
  };

  static description = withDocs(
    'Set the global dw.json used alongside project configuration',
    '/cli/setup.html#b2c-setup-default-config-set',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> /path/to/dw.json',
    '<%= config.bin %> <%= command.id %> ./shared.dw.json --json',
  ];

  async run(): Promise<DefaultConfigSetResponse> {
    const defaultConfigPath = path.resolve(this.args.path);
    let loaded;
    try {
      loaded = await loadFullDwJson({path: defaultConfigPath});
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(
        t('commands.setup.defaultConfig.set.invalid', 'Cannot use {{path}} as the default config: {{message}}', {
          path: defaultConfigPath,
          message,
        }),
      );
    }
    if (!loaded) {
      this.error(
        t('commands.setup.defaultConfig.set.notFound', 'Configuration file not found: {{path}}', {
          path: defaultConfigPath,
        }),
      );
    }

    const settingsOptions = {configDirectory: this.config.configDir};
    const settingsPath = getB2CSettingsPath(settingsOptions);
    const relativePath = path.relative(path.dirname(settingsPath), defaultConfigPath);
    const storedConfigPath =
      relativePath &&
      !relativePath.startsWith(`..${path.sep}`) &&
      relativePath !== '..' &&
      !path.isAbsolute(relativePath)
        ? `./${relativePath.split(path.sep).join('/')}`
        : defaultConfigPath;
    const settings = readB2CSettings(settingsOptions);
    writeB2CSettings({...settings, defaultConfigPath: storedConfigPath}, settingsOptions);

    const result: DefaultConfigSetResponse = {
      defaultConfigPath,
      settingsPath,
    };

    if (!this.jsonEnabled()) {
      ux.stdout(
        t('commands.setup.defaultConfig.set.success', 'Global dw.json set to {{path}}', {
          path: defaultConfigPath,
        }),
      );
    }
    return result;
  }
}
