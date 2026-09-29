/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import path from 'node:path';
import {Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  applyOpenShellSetup,
  buildOpenShellDockerfile,
  buildOpenShellSetup,
  OPENSHELL_ACCESS_LEVELS,
  OpenShellCommandError,
  writeOpenShellFiles,
  type OpenShellStep,
} from '@salesforce/b2c-tooling-sdk/openshell';
import {t, withDocs} from '../../i18n/index.js';

/**
 * JSON output for the setup openshell command. Contains no secret values.
 */
interface SetupOpenShellResponse {
  sandboxName: string;
  accessLevel: string;
  directory: string;
  image: string;
  hosts: string[];
  providers: Array<{name: string; envVar: string}>;
  env: Record<string, string>;
  applied: boolean;
  steps: OpenShellStep[];
}

export default class SetupOpenShell extends InstanceCommand<typeof SetupOpenShell> {
  static description = withDocs(
    t(
      'commands.setup.openshell.description',
      '[BETA] Create an NVIDIA OpenShell sandbox for the B2C CLI from the current configuration',
    ),
    '/guide/openshell.html',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --safety-level NO_DELETE',
    '<%= config.bin %> <%= command.id %> --instance staging --name b2c-staging',
    '<%= config.bin %> <%= command.id %> --mcp',
    '<%= config.bin %> <%= command.id %> --dry-run',
  ];

  static flags = {
    ...InstanceCommand.baseFlags,
    name: Flags.string({
      description: 'Sandbox name (default: b2c-<instance>)',
    }),
    directory: Flags.string({
      char: 'd',
      description: 'Directory for the generated files (default: .openshell/<sandbox name>)',
    }),
    'safety-level': Flags.option({
      description: 'Which B2C requests the sandbox may make',
      options: OPENSHELL_ACCESS_LEVELS,
      default: 'READ_ONLY',
    })(),
    'allow-host': Flags.string({
      description: 'Additional host the sandbox may reach (can be specified multiple times)',
      multiple: true,
    }),
    mcp: Flags.boolean({
      description: 'Also install the B2C DX MCP server in the sandbox image',
      default: false,
    }),
    image: Flags.string({
      description: 'Use this container image instead of building one',
    }),
    sandbox: Flags.boolean({
      description: 'Create the sandbox (use --no-sandbox to only store the credentials)',
      default: true,
      allowNo: true,
    }),
    recreate: Flags.boolean({
      description: 'Delete and recreate an existing sandbox',
      default: false,
    }),
    force: Flags.boolean({
      description: 'Overwrite an edited policy.yaml with a newly generated one',
      default: false,
    }),
    'dry-run': Flags.boolean({
      description: 'Write the files and print the commands without running them',
      default: false,
    }),
  };

  async run(): Promise<SetupOpenShellResponse> {
    const {flags} = this;
    const config = this.resolvedConfig.values;

    this.warn(
      t(
        'commands.setup.openshell.beta',
        'The OpenShell integration is in beta, and OpenShell itself is alpha software. Generated files and behavior may change.',
      ),
    );

    const setup = buildOpenShellSetup(config, {
      sandboxName: flags.name,
      accessLevel: flags['safety-level'],
      allowHosts: flags['allow-host'],
    });

    if (setup.providers.length === 0) {
      this.error(
        t(
          'commands.setup.openshell.noSecrets',
          'No credentials to store. Configure an API client ID and secret, a WebDAV username and access key, or an MRT API key.',
        ),
      );
    }
    if (!config.clientSecret) {
      this.warn(
        t(
          'commands.setup.openshell.noClientSecret',
          'No API client secret is configured, so commands that need an OAuth token will fail in the sandbox.',
        ),
      );
    }

    const version = this.config.version;
    const image = flags.image ?? `b2c-openshell:${version}${flags.mcp ? '-mcp' : ''}`;
    const dockerfile = buildOpenShellDockerfile({cliVersion: version, mcp: flags.mcp});
    const directory = flags.directory ?? path.join('.openshell', setup.sandboxName);

    const files = await writeOpenShellFiles(setup, directory, {image, dockerfile, force: flags.force});

    this.log(
      t('commands.setup.openshell.summary', 'Sandbox {{name}} ({{level}})', {
        name: setup.sandboxName,
        level: flags['safety-level'],
      }),
    );
    this.log(t('commands.setup.openshell.hosts', '  Allowed hosts: {{hosts}}', {hosts: setup.hosts.join(', ')}));
    this.log(
      t('commands.setup.openshell.secrets', '  Secrets kept on the gateway: {{secrets}}', {
        secrets: setup.providers.map((p) => p.envVar).join(', '),
      }),
    );
    this.log(t('commands.setup.openshell.files', '  Files: {{dir}}', {dir: files.dir}));
    if (!files.policyWritten) {
      this.log(
        t(
          'commands.setup.openshell.policyKept',
          '  Using the existing policy.yaml. Use --force to replace it with a newly generated one.',
        ),
      );
    }

    const response: SetupOpenShellResponse = {
      sandboxName: setup.sandboxName,
      accessLevel: flags['safety-level'],
      directory: files.dir,
      image,
      hosts: setup.hosts,
      providers: setup.providers.map((p) => ({name: p.name, envVar: p.envVar})),
      env: setup.env,
      applied: false,
      steps: [],
    };

    if (flags['dry-run']) {
      this.log('');
      this.log(
        t(
          'commands.setup.openshell.dryRun',
          'Dry run: nothing was changed. To create the sandbox yourself, export {{secrets}} and run:\n  {{script}}',
          {secrets: setup.providers.map((p) => p.envVar).join(', '), script: files.script},
        ),
      );
      return response;
    }

    const secrets: Record<string, string | undefined> = {
      SFCC_CLIENT_SECRET: config.clientSecret,
      SFCC_PASSWORD: config.password,
      MRT_API_KEY: config.mrtApiKey,
    };

    this.log('');
    try {
      response.steps = await applyOpenShellSetup(setup, files, {
        image,
        dockerfile,
        secrets,
        build: !flags.image,
        sandbox: flags.sandbox,
        recreate: flags.recreate,
        onStep: (step) => this.log(`→ ${step.description}\n    ${step.command}`),
      });
    } catch (error) {
      if (error instanceof OpenShellCommandError && error.command === 'openshell status') {
        this.error(
          t(
            'commands.setup.openshell.gatewayUnavailable',
            'Could not reach an OpenShell gateway. Install OpenShell and start a gateway, then try again. The generated files are in {{dir}}.\n{{message}}',
            {dir: files.dir, message: error.message},
          ),
        );
      }
      if (error instanceof OpenShellCommandError) this.error(error.message);
      throw error;
    }
    response.applied = true;

    this.log('');
    if (flags.sandbox) {
      this.log(
        t(
          'commands.setup.openshell.ready',
          'Sandbox {{name}} is ready.\n  Open a shell:     openshell sandbox connect {{name}}\n  Run a command:    openshell sandbox exec -n {{name}} -- b2c code list\n  View the log:     openshell logs {{name}} --source sandbox\n\nTo change what the sandbox can reach, edit {{policy}} and run this command again.',
          {name: setup.sandboxName, policy: files.policy},
        ),
      );
    } else {
      this.log(
        t(
          'commands.setup.openshell.providersReady',
          'Credentials stored. Attach these providers when you create a sandbox: {{providers}}',
          {providers: setup.providers.map((p) => p.name).join(', ')},
        ),
      );
    }

    return response;
  }
}
