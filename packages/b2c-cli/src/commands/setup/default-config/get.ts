/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {existsSync} from 'node:fs';
import {ux} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getB2CSettingsPath, readB2CSettings} from '@salesforce/b2c-tooling-sdk/config';
import {t, withDocs} from '../../../i18n/index.js';

interface DefaultConfigGetResponse {
  defaultConfigPath: null | string;
  exists: boolean;
  settingsPath: string;
}

/** Show the shared global dw.json configuration file. */
export default class SetupDefaultConfigGet extends BaseCommand<typeof SetupDefaultConfigGet> {
  static description = withDocs('Show the global dw.json path', '/cli/setup.html#b2c-setup-default-config-get');

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --json'];

  async run(): Promise<DefaultConfigGetResponse> {
    const settingsOptions = {configDirectory: this.config.configDir};
    const {defaultConfigPath} = readB2CSettings(settingsOptions);
    const exists = Boolean(defaultConfigPath && existsSync(defaultConfigPath));
    const result: DefaultConfigGetResponse = {
      defaultConfigPath: defaultConfigPath ?? null,
      exists,
      settingsPath: getB2CSettingsPath(settingsOptions),
    };

    if (!this.jsonEnabled()) {
      if (defaultConfigPath) {
        ux.stdout(
          t('commands.setup.defaultConfig.get.value', 'Global dw.json: {{path}}{{status}}', {
            path: defaultConfigPath,
            status: exists ? '' : ' (file not found)',
          }),
        );
      } else {
        ux.stdout(t('commands.setup.defaultConfig.get.unset', 'No global dw.json is set.'));
      }
    }

    return result;
  }
}
