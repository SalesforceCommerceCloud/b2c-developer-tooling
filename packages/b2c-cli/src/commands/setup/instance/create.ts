/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {input, password, confirm, select} from '@inquirer/prompts';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {DwJsonSource, type NormalizedConfig} from '@salesforce/b2c-tooling-sdk/config';
import {withDocs} from '../../../i18n/index.js';

/**
 * JSON output structure for the create command.
 */
interface InstanceCreateResponse {
  name: string;
  hostname: string;
  created: boolean;
  active?: boolean;
}

/**
 * Auth type selection values.
 */
type AuthType = 'basic' | 'both' | 'none' | 'oauth';

/**
 * Create a new B2C Commerce instance configuration.
 */
export default class SetupInstanceCreate extends BaseCommand<typeof SetupInstanceCreate> {
  static args = {
    name: Args.string({
      description: 'Instance name',
    }),
  };

  static description = withDocs(
    'Create a new B2C Commerce instance configuration',
    '/cli/setup.html#b2c-setup-instance-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> staging',
    '<%= config.bin %> <%= command.id %> staging --hostname staging.example.com',
    '<%= config.bin %> <%= command.id %> staging --hostname staging.example.com --active',
    '<%= config.bin %> <%= command.id %> staging --hostname staging.example.com --username admin --force',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    hostname: Flags.string({
      char: 's',
      description: 'B2C instance hostname',
    }),
    username: Flags.string({
      description: 'WebDAV username',
    }),
    password: Flags.string({
      description: 'WebDAV password',
    }),
    'client-id': Flags.string({
      description: 'OAuth client ID',
    }),
    'client-secret': Flags.string({
      description: 'OAuth client secret',
    }),
    'code-version': Flags.string({
      description: 'Code version',
    }),
    active: Flags.boolean({
      description: 'Set as active instance',
      default: false,
    }),
    force: Flags.boolean({
      description: 'Non-interactive mode (fail if required flags missing)',
      default: false,
    }),
  };

  async run(): Promise<InstanceCreateResponse> {
    const source = new DwJsonSource();
    const force = this.flags.force;

    // Get or prompt for instance name
    let name = this.args.name;
    if (!name) {
      if (force) {
        this.error('Instance name is required in non-interactive mode. Provide as argument.');
      }
      name = await input({
        message: 'Enter instance name:',
        validate: (v) => (v.trim() ? true : 'Instance name is required'),
      });
    }

    // Check if instance already exists
    const existingInstances = source.listInstances({configPath: this.flags.config});
    if (existingInstances.some((i) => i.name === name)) {
      this.error(`Instance "${name}" already exists. Use a different name.`);
    }

    // Get or prompt for hostname
    let hostname = this.flags.hostname;
    if (!hostname) {
      if (force) {
        this.error('Hostname is required in non-interactive mode. Use --hostname flag.');
      }
      hostname = await input({
        message: 'Enter B2C instance hostname:',
        validate: (v) => (v.trim() ? true : 'Hostname is required'),
      });
    }

    // Build config
    const config: Partial<NormalizedConfig> = {
      hostname,
    };

    // Code version
    if (this.flags['code-version']) {
      config.codeVersion = this.flags['code-version'];
    }

    // Handle authentication - in non-interactive mode, use provided flags
    if (force) {
      // Basic auth
      if (this.flags.username) {
        config.username = this.flags.username;
        if (!this.flags.password) {
          this.error('Password is required when username is provided in non-interactive mode.');
        }
        config.password = this.flags.password;
      }

      // OAuth
      if (this.flags['client-id']) {
        config.clientId = this.flags['client-id'];
        if (!this.flags['client-secret']) {
          this.error('Client secret is required when client ID is provided in non-interactive mode.');
        }
        config.clientSecret = this.flags['client-secret'];
      }
    } else {
      // Interactive mode - prompt for auth type and credentials
      const authType = await select<AuthType>({
        message: 'Configure authentication:',
        choices: [
          {name: 'Basic (username/password)', value: 'basic'},
          {name: 'OAuth (client credentials)', value: 'oauth'},
          {name: 'Both', value: 'both'},
          {name: 'Skip for now', value: 'none'},
        ],
      });

      // Basic auth
      if (authType === 'basic' || authType === 'both') {
        config.username =
          this.flags.username ||
          (await input({
            message: 'Enter WebDAV username:',
            validate: (v) => (v.trim() ? true : 'Username is required'),
          }));

        config.password =
          this.flags.password ||
          (await password({
            message: 'Enter WebDAV password:',
            validate: (v) => (v.trim() ? true : 'Password is required'),
          }));
      }

      // OAuth
      if (authType === 'oauth' || authType === 'both') {
        config.clientId =
          this.flags['client-id'] ||
          (await input({
            message: 'Enter OAuth client ID:',
            validate: (v) => (v.trim() ? true : 'Client ID is required'),
          }));

        config.clientSecret =
          this.flags['client-secret'] ||
          (await password({
            message: 'Enter OAuth client secret:',
            validate: (v) => (v.trim() ? true : 'Client secret is required'),
          }));
      }
    }

    // Determine if this should be the active instance
    let setActive = this.flags.active;
    if (!force && !setActive && existingInstances.length > 0) {
      setActive = await confirm({
        message: 'Set as active instance?',
        default: false,
      });
    } else if (existingInstances.length === 0) {
      // If this is the first instance, make it active by default
      setActive = true;
    }

    // Show summary and confirm in interactive mode
    if (!force) {
      ux.stdout('');
      ux.stdout('Instance configuration:');
      ux.stdout(`  Name: ${name}`);
      ux.stdout(`  Hostname: ${hostname}`);
      if (config.codeVersion) {
        ux.stdout(`  Code Version: ${config.codeVersion}`);
      }
      if (config.username) {
        ux.stdout(`  Auth: Basic (${config.username})`);
      }
      if (config.clientId) {
        ux.stdout(`  Auth: OAuth (${config.clientId})`);
      }
      if (setActive) {
        ux.stdout('  Active: Yes');
      }
      ux.stdout('');

      const proceed = await confirm({
        message: 'Create this instance?',
        default: true,
      });

      if (!proceed) {
        ux.stdout('Instance creation cancelled.');
        return {
          name,
          hostname,
          created: false,
        };
      }
    }

    // Create the instance
    source.createInstance({
      name,
      config,
      setActive,
      configPath: this.flags.config,
    });

    const result: InstanceCreateResponse = {
      name,
      hostname,
      created: true,
      active: setActive,
    };

    if (!this.jsonEnabled()) {
      ux.stdout(`Instance "${name}" created successfully.`);
      if (setActive) {
        ux.stdout(`"${name}" is now the active instance.`);
      }
    }

    return result;
  }
}
