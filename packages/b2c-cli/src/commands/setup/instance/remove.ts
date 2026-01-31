/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {confirm} from '@inquirer/prompts';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {DwJsonSource} from '@salesforce/b2c-tooling-sdk/config';
import {withDocs} from '../../../i18n/index.js';

/**
 * JSON output structure for the remove command.
 */
interface InstanceRemoveResponse {
  name: string;
  removed: boolean;
}

/**
 * Remove a B2C Commerce instance configuration.
 */
export default class SetupInstanceRemove extends BaseCommand<typeof SetupInstanceRemove> {
  static args = {
    name: Args.string({
      description: 'Instance name to remove',
      required: true,
    }),
  };

  static description = withDocs(
    'Remove a B2C Commerce instance configuration',
    '/cli/setup.html#b2c-setup-instance-remove',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> staging',
    '<%= config.bin %> <%= command.id %> staging --force',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<InstanceRemoveResponse> {
    const source = new DwJsonSource();
    const name = this.args.name;

    // Check if instance exists
    const instances = source.listInstances({configPath: this.flags.config});
    const instance = instances.find((i) => i.name === name);

    if (!instance) {
      const availableNames = instances.map((i) => i.name).join(', ');
      if (availableNames) {
        this.error(`Instance "${name}" not found. Available instances: ${availableNames}`);
      } else {
        this.error(`Instance "${name}" not found. No instances are configured.`);
      }
    }

    // Confirm removal
    if (!this.flags.force) {
      const proceed = await confirm({
        message: `Remove instance "${name}"? This cannot be undone.`,
        default: false,
      });

      if (!proceed) {
        ux.stdout('Instance removal cancelled.');
        return {
          name,
          removed: false,
        };
      }
    }

    // Remove the instance
    source.removeInstance(name, {configPath: this.flags.config});

    const result: InstanceRemoveResponse = {
      name,
      removed: true,
    };

    if (!this.jsonEnabled()) {
      ux.stdout(`Instance "${name}" removed successfully.`);
    }

    return result;
  }
}
