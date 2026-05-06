/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {cloneEnv, waitForEnv, type MrtEnvironment} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

function printEnvDetails(env: MrtEnvironment, project: string): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 18;

  ui.div('');
  ui.div({text: 'Slug:', width: labelWidth}, {text: env.slug ?? ''});
  ui.div({text: 'Name:', width: labelWidth}, {text: env.name ?? ''});
  ui.div({text: 'Project:', width: labelWidth}, {text: project});
  ui.div({text: 'State:', width: labelWidth}, {text: env.state ?? 'unknown'});

  if (env.ssr_region) {
    ui.div({text: 'Region:', width: labelWidth}, {text: env.ssr_region});
  }

  if (env.hostname) {
    ui.div({text: 'Hostname:', width: labelWidth}, {text: env.hostname});
  }

  if (env.ssr_external_hostname) {
    ui.div({text: 'External Host:', width: labelWidth}, {text: env.ssr_external_hostname});
  }

  if (env.ssr_external_domain) {
    ui.div({text: 'External Domain:', width: labelWidth}, {text: env.ssr_external_domain});
  }

  ux.stdout(ui.toString());
}

export default class MrtEnvClone extends MrtCommand<typeof MrtEnvClone> {
  static args = {
    slug: Args.string({
      description: 'Slug for the new environment created by the clone',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.mrt.env.clone.description', 'Clone a Managed Runtime environment from an existing source environment'),
    '/cli/mrt.html#b2c-mrt-env-clone',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> staging-copy -p my-storefront -e staging',
    '<%= config.bin %> <%= command.id %> qa -p my-storefront -e staging --clone-redirects --clone-env-vars',
    '<%= config.bin %> <%= command.id %> qa -p my-storefront -e staging --external-hostname qa.example.com --certificate-id 123 --wait',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    'external-hostname': Flags.string({
      description: 'Full external hostname for the new environment (required for non-MRT-managed certs)',
    }),
    'external-domain': Flags.string({
      description: 'External domain for Universal PWA SSR (e.g., example.com)',
    }),
    'certificate-id': Flags.integer({
      description: 'ID of the certificate to associate with the new environment (required for custom domains)',
    }),
    'clone-redirects': Flags.boolean({
      description: 'Clone redirects from the source environment',
      default: false,
    }),
    'clone-env-vars': Flags.boolean({
      description: 'Clone environment variables from the source environment',
      default: false,
    }),
    'clone-b2c-info': Flags.boolean({
      description: 'Clone B2C target info from the source environment',
      default: false,
    }),
    wait: Flags.boolean({
      char: 'w',
      description: 'Wait for the new environment to be ready before returning',
      default: false,
    }),
    'poll-interval': Flags.integer({
      description: 'Polling interval in seconds when using --wait',
      default: 10,
      dependsOn: ['wait'],
    }),
    timeout: Flags.integer({
      description: 'Maximum time to wait in seconds when using --wait (0 for no timeout)',
      default: 600,
      dependsOn: ['wait'],
    }),
  };

  protected operations = {
    cloneEnv,
    waitForEnv,
  };

  async run(): Promise<MrtEnvironment> {
    this.requireMrtCredentials();

    const {slug} = this.args;
    const {mrtProject: project, mrtEnvironment: fromSlug} = this.resolvedConfig.values;

    if (!project) {
      this.error('MRT project is required. Provide --project flag, set MRT_PROJECT, or set mrtProject in dw.json.');
    }
    if (!fromSlug) {
      this.error(
        'Source environment is required. Provide --environment / -e, set MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }
    if (fromSlug === slug) {
      this.error(`Source and destination environment slugs must differ (both are "${slug}").`);
    }

    const {
      'external-hostname': externalHostname,
      'external-domain': externalDomain,
      'certificate-id': certificateId,
      'clone-redirects': cloneRedirectsFlag,
      'clone-env-vars': cloneEnvVarsFlag,
      'clone-b2c-info': cloneB2cInfoFlag,
      wait,
      'poll-interval': pollInterval,
      timeout,
    } = this.flags;

    this.log(
      t('commands.mrt.env.clone.cloning', 'Cloning environment "{{fromSlug}}" → "{{slug}}" in {{project}}...', {
        fromSlug,
        slug,
        project,
      }),
    );

    try {
      let result = await this.operations.cloneEnv(
        {
          projectSlug: project,
          slug,
          fromSlug,
          externalHostname,
          externalDomain,
          certificateId,
          cloneRedirects: cloneRedirectsFlag,
          cloneEnvironmentVariables: cloneEnvVarsFlag,
          cloneB2cTargetInfo: cloneB2cInfoFlag,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (wait) {
        this.log(t('commands.mrt.env.clone.waiting', 'Waiting for environment "{{slug}}" to be ready...', {slug}));

        result = await this.operations.waitForEnv(
          {
            projectSlug: project,
            slug,
            origin: this.resolvedConfig.values.mrtOrigin,
            pollIntervalSeconds: pollInterval,
            timeoutSeconds: timeout,
            onPoll: (info) => {
              if (!this.jsonEnabled()) {
                this.log(
                  t('commands.mrt.env.clone.state', '[{{elapsed}}s] State: {{state}}', {
                    elapsed: String(info.elapsedSeconds),
                    state: info.state,
                  }),
                );
              }
            },
          },
          this.getMrtAuth(),
        );
      }

      if (this.jsonEnabled()) {
        return result;
      }

      this.log(t('commands.mrt.env.clone.success', 'Environment cloned successfully.'));
      printEnvDetails(result, project);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.env.clone.failed', 'Failed to clone environment: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
