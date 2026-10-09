/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {
  ConfigWriteError,
  isSensitiveConfigField,
  locateConfigField,
  maskConfigValue,
  resolveConfigKey,
} from '@salesforce/b2c-tooling-sdk/config';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../i18n/index.js';
import {ConfigFieldCommand, formatConfigValue} from '../../utils/setup/config-field-command.js';

interface SetupGetResponse {
  key: string;
  field: string;
  value: unknown;
  source?: string;
  location?: string;
}

/**
 * Print one resolved configuration value and the source that supplies it.
 */
export default class SetupGet extends ConfigFieldCommand<typeof SetupGet> {
  static args = {
    key: Args.string({description: 'Configuration key (dw.json name, e.g. code-version)', required: true}),
  };

  static description = withDocs(
    t('commands.setup.get.description', 'Print a resolved configuration value'),
    '/cli/setup.html#b2c-setup-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> code-version',
    '<%= config.bin %> <%= command.id %> scapi-schemas --instance staging',
    '<%= config.bin %> <%= command.id %> client-secret --unmask',
    '<%= config.bin %> <%= command.id %> hostname --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    unmask: Flags.boolean({
      description: 'Show sensitive values unmasked (passwords, secrets, API keys)',
      default: false,
    }),
  };

  async run(): Promise<SetupGetResponse> {
    let key;
    try {
      key = resolveConfigKey(this.args.key);
    } catch (error) {
      this.failWith(error);
    }

    const value = this.resolvedConfig.values[key.field];
    if (value === undefined) {
      this.failWith(
        new ConfigWriteError('CONFIG_NOT_SET', t('commands.setup.get.notSet', '{{key}} is not set.', {key: key.key})),
      );
    }
    const {supplier} = locateConfigField(this.resolvedConfig, key.field);
    const {unmask} = this.flags;
    const result: SetupGetResponse = {
      key: key.key,
      field: key.field,
      value: typeof value === 'string' && !unmask && isSensitiveConfigField(key.field) ? maskConfigValue(value) : value,
      source: supplier?.name,
      location: supplier?.location,
    };
    if (this.jsonEnabled()) return result;

    if (unmask && isSensitiveConfigField(key.field)) this.warn('Sensitive values are displayed unmasked.');
    ux.stdout(formatConfigValue(key.field, value, unmask));
    if (supplier) {
      this.logToStderr(
        t('commands.setup.get.source', 'from {{source}}', {
          source: supplier.location ? `${supplier.name} (${supplier.location})` : supplier.name,
        }),
      );
    }
    return result;
  }
}
