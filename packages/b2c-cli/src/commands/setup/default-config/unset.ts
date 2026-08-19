/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getB2CSettingsPath, readB2CSettings, writeB2CSettings} from '@salesforce/b2c-tooling-sdk/config';
import {t, withDocs} from '../../../i18n/index.js';

interface DefaultConfigUnsetResponse {
  defaultConfigPath: null;
  removed: boolean;
  settingsPath: string;
}

/** Remove the shared global dw.json setting. */
export default class SetupDefaultConfigUnset extends BaseCommand<typeof SetupDefaultConfigUnset> {
  static description = withDocs('Unset the global dw.json path', '/cli/setup.html#b2c-setup-default-config-unset');

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --json'];

  async run(): Promise<DefaultConfigUnsetResponse> {
    const settingsOptions = {configDirectory: this.config.configDir};
    const settings = readB2CSettings(settingsOptions);
    const removed = Boolean(settings.defaultConfigPath);
    if (removed) {
      const remainingSettings = {...settings};
      delete remainingSettings.defaultConfigPath;
      writeB2CSettings(remainingSettings, settingsOptions);
    }

    const result: DefaultConfigUnsetResponse = {
      defaultConfigPath: null,
      removed,
      settingsPath: getB2CSettingsPath(settingsOptions),
    };

    if (!this.jsonEnabled()) {
      ux.stdout(
        removed
          ? t('commands.setup.defaultConfig.unset.success', 'Global dw.json unset.')
          : t('commands.setup.defaultConfig.unset.alreadyUnset', 'No global dw.json was set.'),
      );
    }
    return result;
  }
}
