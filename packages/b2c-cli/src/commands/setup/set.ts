/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {isDeepStrictEqual} from 'node:util';
import {Args} from '@oclif/core';
import {
  isSensitiveConfigField,
  locateConfigField,
  parseConfigValue,
  resolveConfigKey,
  writeConfigField,
} from '@salesforce/b2c-tooling-sdk/config';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../i18n/index.js';
import {ConfigFieldCommand, formatConfigValue} from '../../utils/setup/config-field-command.js';

interface SetupSetResponse {
  key: string;
  field: string;
  value: unknown;
  source: string;
  location: string;
  instance?: string;
}

/**
 * Set a configuration value in the source that supplies it.
 */
export default class SetupSet extends ConfigFieldCommand<typeof SetupSet> {
  static args = {
    key: Args.string({
      description: 'Configuration key (dw.json name, e.g. code-version), or key=value',
      required: true,
    }),
    value: Args.string({description: 'Value; JSON for non-string keys (true, ["a","b"], {...})'}),
  };

  static description = withDocs(
    t('commands.setup.set.description', 'Set a configuration value in the dw.json entry or .env file that supplies it'),
    '/cli/setup.html#b2c-setup-set',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> code-version version2',
    '<%= config.bin %> <%= command.id %> scapi-schemas=./scapi-schemas',
    '<%= config.bin %> <%= command.id %> cartridges \'["app_custom","app_storefront_base"]\'',
    '<%= config.bin %> <%= command.id %> safety \'{"level":"NO_DELETE"}\' --instance production',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<SetupSetResponse> {
    let input = this.args.key;
    let raw = this.args.value;
    if (raw === undefined) {
      const separator = input.indexOf('=');
      if (separator === -1) {
        this.error(t('commands.setup.set.missingValue', 'Provide a value: setup set <key> <value> or <key>=<value>.'));
      }
      raw = input.slice(separator + 1);
      input = input.slice(0, separator);
    }
    if (raw === '') {
      this.error(
        t('commands.setup.set.emptyValue', 'Empty value for {{key}}. To remove it, run: b2c setup unset {{key}}', {
          key: input,
        }),
      );
    }

    let result;
    let key;
    let value: unknown;
    try {
      key = resolveConfigKey(input);
      value = parseConfigValue(key, raw);
      result = await writeConfigField(this.resolvedConfig, key.field, value);
    } catch (error) {
      this.failWith(error);
    }

    const response: SetupSetResponse = {
      key: key.key,
      field: key.field,
      value: isSensitiveConfigField(key.field) ? formatConfigValue(key.field, value, false) : value,
      ...result,
    };

    // Confirm the write took effect; a source that can't be re-read is reported, not hidden.
    const reloaded = await this.loadConfiguration();
    const effective = isDeepStrictEqual(reloaded.values[key.field], value);
    if (!effective) {
      const {supplier} = locateConfigField(reloaded, key.field);
      this.warn(
        t('commands.setup.set.notEffective', '{{key}} was written, but the resolved value comes from {{source}}.', {
          key: key.key,
          source: supplier?.name ?? 'another source',
        }),
      );
    }
    if (this.jsonEnabled()) return response;

    this.log(
      t('commands.setup.set.done', 'Set {{key}} = {{value}} in {{location}}', {
        key: key.key,
        value: formatConfigValue(key.field, value, false),
        location: result.instance ? `${result.location} (instance ${result.instance})` : result.location,
      }),
    );
    return response;
  }
}
