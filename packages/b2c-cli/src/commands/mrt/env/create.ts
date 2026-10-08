/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createEnvironmentWithBackend, waitForEnv} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';
import {printEnvView} from './get.js';

/**
 * Proxy configuration for SSR.
 */
interface SsrProxyConfig {
  host: string;
  path: string;
}

/**
 * Parse a proxy string in format "path=host" into a proxy config object.
 */
function parseProxyString(proxyStr: string): SsrProxyConfig {
  const eqIndex = proxyStr.indexOf('=');
  if (eqIndex === -1) {
    throw new Error(`Invalid proxy format: "${proxyStr}". Expected format: path=host.example.com`);
  }

  const path = proxyStr.slice(0, eqIndex);
  const host = proxyStr.slice(eqIndex + 1);

  if (!path) {
    throw new Error(`Invalid proxy format: "${proxyStr}". Path cannot be empty.`);
  }

  if (!host) {
    throw new Error(`Invalid proxy format: "${proxyStr}". Host cannot be empty.`);
  }

  return {path, host};
}

/**
 * Valid AWS regions for MRT environments (hyphenated legacy form; the SCAPI
 * backend only accepts the display name on create, so region is legacy-only).
 */
const SSR_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-south-1',
  'ap-south-2',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-southeast-3',
  'ap-northeast-1',
  'ap-northeast-3',
  'ca-central-1',
  'eu-central-1',
  'eu-central-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'eu-south-1',
  'il-central-1',
  'me-central-1',
  'sa-east-1',
] as const;

type SsrRegion = (typeof SSR_REGIONS)[number];

/**
 * Create a new environment (target) in a Managed Runtime project.
 */
export default class MrtEnvCreate extends MrtCommand<typeof MrtEnvCreate> {
  static args = {
    slug: Args.string({
      description: 'Environment slug/identifier (e.g., staging, production; or provide it via --environment / -e)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.mrt.env.create.description', 'Create a new Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-create',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> staging --project my-storefront',
    '<%= config.bin %> <%= command.id %> staging --project my-storefront --name "Staging Environment"',
    '<%= config.bin %> <%= command.id %> production --project my-storefront --production',
    '<%= config.bin %> <%= command.id %> feature-test -p my-storefront --region eu-west-1',
    '<%= config.bin %> <%= command.id %> staging -p my-storefront --proxy api=api.example.com --proxy ocapi=ocapi.example.com',
    '<%= config.bin %> <%= command.id %> staging -p my-storefront --wait',
    '<%= config.bin %> <%= command.id %> --project my-storefront --name "Staging" --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'Display name for the environment (defaults to slug on the legacy backend; required on SCAPI)',
    }),
    region: Flags.string({
      char: 'r',
      description: 'AWS region for SSR deployment (legacy backend only)',
      options: SSR_REGIONS as unknown as string[],
    }),
    production: Flags.boolean({
      description: 'Mark as a production environment (legacy backend only)',
      default: false,
    }),
    hostname: Flags.string({
      description: 'Hostname pattern for V8 Tag loading (legacy backend only)',
    }),
    'external-hostname': Flags.string({
      description: 'Full external hostname (e.g., www.example.com) (legacy backend only)',
    }),
    'external-domain': Flags.string({
      description: 'External domain for Universal PWA SSR (e.g., example.com) (legacy backend only)',
    }),
    'allow-cookies': Flags.boolean({
      description: 'Forward HTTP cookies to origin (legacy backend only)',
      default: false,
      allowNo: true,
    }),
    'enable-source-maps': Flags.boolean({
      description: 'Enable source map support in the environment (legacy backend only)',
      default: false,
      allowNo: true,
    }),
    proxy: Flags.string({
      description: 'Proxy configuration in format path=host (can be specified multiple times) (legacy backend only)',
      multiple: true,
    }),
    wait: Flags.boolean({
      char: 'w',
      description: 'Wait for the environment to be ready before returning (legacy backend only)',
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
    createEnvironmentWithBackend,
    waitForEnv,
  };

  async run(): Promise<unknown> {
    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {
      name: nameFlag,
      region,
      production: isProduction,
      hostname,
      'external-hostname': externalHostname,
      'external-domain': externalDomain,
      'allow-cookies': allowCookies,
      'enable-source-maps': enableSourceMaps,
      proxy: proxyStrings,
      wait,
      'poll-interval': pollInterval,
      timeout,
    } = this.flags;

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();
    // Whether the resolved preference + config will route this run to SCAPI, so
    // required fields can be validated against the backend that actually runs.
    const scapi = preference === 'scapi' || (preference === 'auto' && Boolean(scapiConnection));

    // The slug positional/flag is the legacy environment identifier. SCAPI
    // generates the environment ID, so it only requires a display name.
    const slug = scapi ? this.args.slug : this.resolveEnvironmentSlug(this.args.slug);

    if (scapi && !nameFlag) {
      this.error('The SCAPI MRT backend requires --name to create an environment.');
    }

    // Default name to slug on the legacy backend when not provided.
    const name = nameFlag ?? slug;
    if (!name) {
      this.error('An environment name is required. Provide --name (or a slug argument on the legacy backend).');
    }

    // Parse proxy configurations (legacy backend only)
    const proxyConfigs = proxyStrings?.map((p) => parseProxyString(p));

    this.log(
      t('commands.mrt.env.create.creating', 'Creating environment "{{slug}}" in {{project}}...', {
        slug: slug ?? name,
        project,
      }),
    );

    const result = await this.operations.createEnvironmentWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      name,
      slug,
      region: region as SsrRegion | undefined,
      isProduction,
      hostname,
      externalHostname,
      externalDomain,
      allowCookies: allowCookies || undefined,
      enableSourceMaps: enableSourceMaps || undefined,
      proxyConfigs,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Creating environment via backend'),
    });

    let env = result.environment;
    // The native payload returned under --json. For legacy --wait we swap in the
    // ready-state env (preserving the pre-SCAPI behavior); otherwise it is the
    // backend's native create response.
    let raw = result.raw;

    // --wait polls the legacy MRT Cloud API until the environment is ready. The
    // SCAPI backend has no equivalent polling helper yet, so warn rather than
    // silently ignoring the flag.
    if (wait) {
      if (result.backend === 'legacy') {
        this.log(t('commands.mrt.env.create.waiting', 'Waiting for environment "{{slug}}" to be ready...', {slug}));
        const ready = await this.operations.waitForEnv(
          {
            projectSlug: project,
            slug: env.id,
            origin: this.resolvedConfig.values.mrtOrigin,
            pollIntervalSeconds: pollInterval,
            timeoutSeconds: timeout,
            onPoll: (info) => {
              this.log(
                t('commands.mrt.env.create.state', '[{{elapsed}}s] State: {{state}}', {
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
        this.warn(
          '--wait is not supported on the SCAPI MRT backend yet; returning the created environment immediately.',
        );
      }
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.env.create.success', 'Environment created successfully.'));
      printEnvView(env, project);
    }

    // Under --json, emit the backend's native response verbatim.
    return raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
