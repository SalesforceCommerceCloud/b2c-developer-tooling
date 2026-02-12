/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import {search} from '@inquirer/prompts';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {DwJsonSource} from '@salesforce/b2c-tooling-sdk/config';
import {withDocs} from '../../../i18n/index.js';

/**
 * JSON output structure for the set-active command.
 */
interface InstanceSetActiveResponse {
  name: string;
  active: boolean;
}

/**
 * Set a B2C Commerce instance as the default (active) instance.
 */
export default class SetupInstanceSetActive extends BaseCommand<typeof SetupInstanceSetActive> {
  static args = {
    name: Args.string({
      description: 'Instance name to set as active',
    }),
  };

  static description = withDocs(
    'Set a B2C Commerce instance as the default (active) instance',
    '/cli/setup.html#b2c-setup-instance-set-active',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %> staging', '<%= config.bin %> <%= command.id %> production'];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<InstanceSetActiveResponse> {
    const source = new DwJsonSource();
    const instances = source.listInstances({configPath: this.flags.config});

    let name = this.args.name;

    if (!name) {
      if (instances.length === 0) {
        this.error('No instances are configured. Use `b2c setup instance create` to add one.');
      }

      name = await search({
        message: 'Select instance:',
        source: (term) => {
          const filtered = term ? instances.filter((i) => i.name.includes(term)) : instances;
          const sorted = [...filtered].sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));
          return sorted.map((i) => ({
            name: `${i.name}${i.hostname ? ` (${i.hostname})` : ''}${i.active ? ' [active]' : ''}`,
            value: i.name,
          }));
        },
      });
    }

    const instance = instances.find((i) => i.name === name);

    if (!instance) {
      const availableNames = instances.map((i) => i.name).join(', ');
      if (availableNames) {
        this.error(`Instance "${name}" not found. Available instances: ${availableNames}`);
      } else {
        this.error(`Instance "${name}" not found. No instances are configured.`);
      }
    }

    // Check if already active
    if (instance.active) {
      if (!this.jsonEnabled()) {
        ux.stdout(`Instance "${name}" is already the active instance.`);
      }
      return {
        name,
        active: true,
      };
    }

    // Set as active
    source.setActiveInstance(name, {configPath: this.flags.config});

    const result: InstanceSetActiveResponse = {
      name,
      active: true,
    };

    if (!this.jsonEnabled()) {
      ux.stdout(`Instance "${name}" is now the active instance.`);
    }

    return result;
  }
}
