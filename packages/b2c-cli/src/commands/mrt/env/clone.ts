/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  cloneEnvironmentWithBackend,
  waitForEnv,
  waitForEnvironmentScapi,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';
import {printEnvView} from './get.js';

export default class MrtEnvClone extends MrtCommand<typeof MrtEnvClone> {
  static args = {
    slug: Args.string({
      description: 'Slug for the new environment created by the clone (legacy backend; SCAPI generates the ID)',
      required: false,
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
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --name "QA" --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'Display name for the new environment (required on the SCAPI backend)',
    }),
    'external-hostname': Flags.string({
      description: 'Full external hostname for the new environment (legacy backend only)',
    }),
    'external-domain': Flags.string({
      description: 'External domain for Universal PWA SSR (e.g., example.com) (legacy backend only)',
    }),
    'certificate-id': Flags.integer({
      description: 'ID of the certificate to associate with the new environment (legacy backend only)',
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
    cloneEnvironmentWithBackend,
    waitForEnv,
    waitForEnvironmentScapi,
  };

  async run(): Promise<unknown> {
    const {slug} = this.args;
    const {mrtProject: project, mrtEnvironment: fromSlug} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!fromSlug) {
      this.error(
        'Source environment is required. Provide --environment / -e, set MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }
    if (slug && fromSlug === slug) {
      this.error(`Source and destination environment slugs must differ (both are "${slug}").`);
    }

    const {
      name: displayName,
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

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();
    const scapi = preference === 'scapi' || (preference === 'auto' && Boolean(scapiConnection));

    if (scapi) {
      if (!displayName) {
        this.error('The SCAPI MRT backend requires --name to clone an environment.');
      }
    } else if (!slug) {
      this.error('The legacy MRT backend requires a slug argument for the new environment.');
    }

    this.log(
      t('commands.mrt.env.clone.cloning', 'Cloning environment "{{fromSlug}}" → "{{slug}}" in {{project}}...', {
        fromSlug,
        slug: slug ?? displayName,
        project,
      }),
    );

    const result = await this.operations.cloneEnvironmentWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      slug,
      displayName,
      sourceEnvironment: fromSlug,
      cloneRedirects: cloneRedirectsFlag,
      cloneEnvironmentVariables: cloneEnvVarsFlag,
      cloneB2cTargetInfo: cloneB2cInfoFlag,
      externalHostname,
      externalDomain,
      certificateId,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Cloning environment via backend'),
    });

    let env = result.environment;
    let raw = result.raw;

    // --wait polls the resolved backend until the new environment is ready: the
    // legacy MRT Cloud API by slug, or the SCAPI MRT Environments API by ID
    // (`building` -> `ready`/`build_failed`).
    if (wait) {
      if (result.backend === 'legacy') {
        this.log(t('commands.mrt.env.clone.waiting', 'Waiting for environment "{{slug}}" to be ready...', {slug}));
        const ready = await this.operations.waitForEnv(
          {
            projectSlug: project,
            slug: env.id,
            origin: this.resolvedConfig.values.mrtOrigin,
            pollIntervalSeconds: pollInterval,
            timeoutSeconds: timeout,
            onPoll: (info) => {
              this.log(
                t('commands.mrt.env.clone.state', '[{{elapsed}}s] State: {{state}}', {
                  elapsed: String(info.elapsedSeconds),
                  state: info.state,
                }),
              );
            },
          },
          legacyAuth!,
        );
        raw = ready;
        env = {
          id: ready.slug ?? env.id,
          name: ready.name,
          status: ready.state || undefined,
          region: ready.ssr_region || undefined,
          architecture: ready.ssr_architecture ?? undefined,
          isProduction: ready.is_production ?? undefined,
          backend: 'legacy',
        };
      } else {
        this.log(
          t('commands.mrt.env.clone.waiting', 'Waiting for environment "{{slug}}" to be ready...', {slug: env.id}),
        );
        const ready = await this.operations.waitForEnvironmentScapi(scapiConnection!, {
          storefrontId: project,
          environmentId: env.id,
          pollIntervalSeconds: pollInterval,
          timeoutSeconds: timeout,
          onPoll: (info) => {
            this.log(
              t('commands.mrt.env.clone.state', '[{{elapsed}}s] State: {{state}}', {
                elapsed: String(info.elapsedSeconds),
                state: info.status,
              }),
            );
          },
        });
        raw = ready.raw;
        env = ready.environment;
      }
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.env.clone.success', 'Environment cloned successfully.'));
      printEnvView(env, project);
    }

    // Under --json, emit the backend's native response verbatim.
    return raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
