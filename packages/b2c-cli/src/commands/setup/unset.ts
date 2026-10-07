/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args} from '@oclif/core';
import {locateConfigField, removeConfigField, resolveConfigKey} from '@salesforce/b2c-tooling-sdk/config';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../i18n/index.js';
import {ConfigFieldCommand} from '../../utils/setup/config-field-command.js';

interface SetupUnsetResponse {
  key: string;
  field: string;
  source: string;
  location: string;
  instance?: string;
  /** Source supplying the field after removal, if any */
  fallback?: string;
}

/**
 * Remove a configuration value from the source that supplies it.
 */
export default class SetupUnset extends ConfigFieldCommand<typeof SetupUnset> {
  static args = {
    key: Args.string({description: 'Configuration key (dw.json name, e.g. code-version)', required: true}),
  };

  static description = withDocs(
    t(
      'commands.setup.unset.description',
      'Remove a configuration value from the dw.json entry or .env file that supplies it',
    ),
    '/cli/setup.html#b2c-setup-unset',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> scapi-schemas',
    '<%= config.bin %> <%= command.id %> code-version --instance staging',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<SetupUnsetResponse> {
    let key;
    let result;
    try {
      key = resolveConfigKey(this.args.key);
      result = await removeConfigField(this.resolvedConfig, key.field);
    } catch (error) {
      this.failWith(error);
    }

    const reloaded = await this.loadConfiguration();
    const fallback =
      reloaded.values[key.field] === undefined ? undefined : locateConfigField(reloaded, key.field).supplier;
    const response: SetupUnsetResponse = {key: key.key, field: key.field, ...result, fallback: fallback?.name};
    if (this.jsonEnabled()) return response;

    this.log(
      t('commands.setup.unset.done', 'Removed {{key}} from {{location}}', {
        key: key.key,
        location: result.instance ? `${result.location} (instance ${result.instance})` : result.location,
      }),
    );
    if (fallback) {
      this.log(
        t('commands.setup.unset.fallback', '{{key}} is still set by {{source}}.', {
          key: key.key,
          source: fallback.location ? `${fallback.name} (${fallback.location})` : fallback.name,
        }),
      );
    }
    return response;
  }
}
