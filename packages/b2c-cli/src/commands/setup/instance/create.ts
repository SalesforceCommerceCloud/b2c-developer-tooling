/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import {Args, Flags, ux} from '@oclif/core';
import {input, password, confirm, select} from '@inquirer/prompts';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  createInstanceFromConfig,
  createInstanceManager,
  type NormalizedConfig,
} from '@salesforce/b2c-tooling-sdk/config';
import {createScriptsBackend} from '@salesforce/b2c-tooling-sdk/operations/code';
import {withDocs} from '../../../i18n/index.js';

/**
 * JSON output structure for the create command.
 */
interface InstanceCreateResponse {
  name: string;
  hostname: string;
  created: boolean;
  active?: boolean;
  /** Config source that stores the instance */
  source?: string;
  /** File (or other location) the instance was written to, when the source reports one */
  location?: string;
  /** Credential fields stored in a credential store, and that store */
  credentials?: Array<{field: string; source: string}>;
}

/**
 * Auth type selection values.
 */
type AuthType = 'basic' | 'both' | 'none' | 'oauth';

/**
 * Extract the hostname from a URL or return the input as-is if it's already a hostname.
 */
function parseHostname(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    return url.hostname;
  } catch {
    return trimmed;
  }
}

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
    'Create a new B2C Commerce instance configuration\n\n' +
      'The instance is written to dw.json in the current directory (or the file selected with --config or ' +
      '--project-directory), and the CLI only reads it from there. To use it from any directory, make that ' +
      'file the global default with "<%= config.bin %> setup default-config set <path>". To change an existing ' +
      'instance, use "<%= config.bin %> setup set <key> <value> --instance <name>".',
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
    'short-code': Flags.string({
      description: 'SCAPI short code (optional; enables SCAPI-first code-version detection)',
      env: 'SFCC_SHORTCODE',
    }),
    'tenant-id': Flags.string({
      description: 'SCAPI tenant/organization ID (optional; enables SCAPI-first code-version detection)',
      env: 'SFCC_TENANT_ID',
    }),
    'api-backend': Flags.string({
      description: 'API backend preference saved for this instance',
      options: ['auto', 'scapi', 'ocapi'],
      env: 'SFCC_API_BACKEND',
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
    source: Flags.string({
      description:
        'Config source to store the instance in (default: the highest-priority source that can, normally dw.json)',
    }),
  };

  async run(): Promise<InstanceCreateResponse> {
    const manager = createInstanceManager();
    const configOptions = this.getBaseConfigOptions();
    const force = this.flags.force;

    const targetSource = this.flags.source;
    if (targetSource && !manager.getInstanceSources().some((s) => s.name === targetSource)) {
      const available = manager
        .getInstanceSources()
        .map((s) => s.name)
        .join(', ');
      this.error(`Config source "${targetSource}" can't store instances. Sources that can: ${available || 'none'}`);
    }

    if (!force) {
      ux.stdout('Create a new B2C Commerce instance configuration.');
      ux.stdout('For more information on configuration, see:');
      ux.stdout('  https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html');
      ux.stdout('');
    }

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
    const existingInstances = await manager.listAllInstances(configOptions);
    const existing = existingInstances.find((i) => i.name === name);
    if (existing) {
      const bin = this.config.bin;
      this.error(
        `Instance "${name}" already exists in ${existing.location ?? existing.source}. ` +
          `To change it, run "${bin} setup set <key> <value> --instance ${name}" ` +
          `(for example "${bin} setup set password <access-key> --instance ${name}"), ` +
          `or remove it with "${bin} setup instance remove ${name}" and create it again.`,
      );
    }

    // Get or prompt for hostname (accepts a URL or plain hostname)
    let hostname = this.flags.hostname;
    if (!hostname) {
      if (force) {
        this.error('Hostname is required in non-interactive mode. Use --hostname flag.');
      }
      hostname = await input({
        message: 'Enter B2C instance hostname or URL:',
        validate: (v) => (v.trim() ? true : 'Hostname is required'),
      });
    }
    hostname = parseHostname(hostname);

    // Build config
    const config: Partial<NormalizedConfig> = {
      hostname,
      shortCode: this.flags['short-code'],
      tenantId: this.flags['tenant-id'],
      apiBackend: this.flags['api-backend'] as NormalizedConfig['apiBackend'],
    };

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
        if (this.flags['client-secret']) {
          config.clientSecret = this.flags['client-secret'];
        }
      }
    } else {
      // Interactive mode - prompt for auth type and credentials
      const authType = await select<AuthType>({
        message: 'Configure authentication:',
        choices: [
          {name: 'WebDAV (username/password or access key)', value: 'basic'},
          {name: 'API Client (OAuth client credentials)', value: 'oauth'},
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

        const accessKeyUrl = `https://${hostname}/on/demandware.store/Sites-Site/default/ViewAccessKeys-List`;
        config.password =
          this.flags.password ||
          (await password({
            message: `Enter WebDAV password or access key (${accessKeyUrl}):`,
            validate: (v) => (v.trim() ? true : 'Password or access key is required'),
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

        const clientSecret =
          this.flags['client-secret'] ||
          (await password({
            message: 'Enter OAuth client secret (leave blank for user auth):',
          }));

        if (clientSecret.trim()) {
          config.clientSecret = clientSecret.trim();
        }
      }
    }

    // Code version - use flag, or try the configured SCAPI-first backend when
    // OAuth credentials are available. SCAPI coordinates remain optional;
    // auto mode selects OCAPI when they are absent.
    if (this.flags['code-version']) {
      config.codeVersion = this.flags['code-version'];
    } else if (!force) {
      let detectedVersion: string | undefined;

      if (config.clientId) {
        try {
          const tempInstance = createInstanceFromConfig({
            hostname,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            shortCode: config.shortCode,
            tenantId: config.tenantId,
            apiBackend: config.apiBackend,
          });
          const activeVersion = await createScriptsBackend({instance: tempInstance}).getActiveCodeVersion();
          detectedVersion = activeVersion?.id;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.warn(`Could not auto-detect the active code version: ${message}. Enter it manually.`);
        }
      }

      const codeVersion = await input({
        message: `Enter code version (optional; the cartridge code version used by code deploy and watch, "${this.config.bin} code list" shows the active one):`,
        default: detectedVersion,
      });

      if (codeVersion.trim()) {
        config.codeVersion = codeVersion.trim();
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
    const created = await manager.createInstance(
      {
        name,
        config,
        setActive,
        ...configOptions,
      },
      targetSource,
    );

    const location = (await manager.findInstance(name, configOptions))?.location;

    const result: InstanceCreateResponse = {
      name,
      hostname,
      created: true,
      active: setActive,
      source: created.source,
      location,
      credentials: created.credentials,
    };

    if (!this.jsonEnabled()) {
      ux.stdout(
        location
          ? `Instance "${name}" created in ${location} (${created.source}).`
          : `Instance "${name}" created successfully (${created.source}).`,
      );
      for (const credential of created.credentials) {
        ux.stdout(`  ${credential.field} stored in ${credential.source}`);
      }
      if (setActive) {
        ux.stdout(`"${name}" is now the active instance.`);
      }
      if (location && created.source === 'DwJsonSource') this.printLocationHint(location, configOptions);
    }

    return result;
  }

  /** Explain which directories will see a dw.json-stored instance and how to use it elsewhere. */
  private printLocationHint(location: string, options: {configPath?: string; defaultConfigPath?: string}): void {
    if (options.defaultConfigPath && path.resolve(options.defaultConfigPath) === path.resolve(location)) {
      ux.stdout('This is the global default config, so the instance is available from any directory.');
      return;
    }
    const bin = this.config.bin;
    ux.stdout('');
    if (options.configPath) {
      ux.stdout(`Commands use this file when you pass --config ${location}. To use it without --config,`);
      ux.stdout('make it the default everywhere with:');
    } else {
      ux.stdout(`The CLI reads this file when run from ${path.dirname(location)}. To use it from another directory,`);
      ux.stdout('pass --config <path> or --project-directory <dir>, or make it the default everywhere with:');
    }
    ux.stdout(`  ${bin} setup default-config set ${location}`);
  }
}
