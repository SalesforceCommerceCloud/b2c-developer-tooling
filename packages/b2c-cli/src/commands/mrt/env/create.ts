import {Args, Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createEnv, type MrtEnvironment} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../i18n/index.js';

/**
 * Print environment details in a formatted table.
 */
function printEnvDetails(env: MrtEnvironment, project: string): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 18;

  ui.div('');
  ui.div({text: 'Slug:', width: labelWidth}, {text: env.slug ?? ''});
  ui.div({text: 'Name:', width: labelWidth}, {text: env.name});
  ui.div({text: 'Project:', width: labelWidth}, {text: project});
  ui.div({text: 'State:', width: labelWidth}, {text: env.state ?? 'unknown'});
  ui.div({text: 'Production:', width: labelWidth}, {text: env.is_production ? 'Yes' : 'No'});

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

  if (env.allow_cookies) {
    ui.div({text: 'Allow Cookies:', width: labelWidth}, {text: 'Yes'});
  }

  if (env.enable_source_maps) {
    ui.div({text: 'Source Maps:', width: labelWidth}, {text: 'Yes'});
  }

  if (env.log_level) {
    ui.div({text: 'Log Level:', width: labelWidth}, {text: env.log_level});
  }

  if (env.ssr_proxy_configs && env.ssr_proxy_configs.length > 0) {
    ui.div({text: 'Proxies:', width: labelWidth}, {text: ''});
    for (const proxy of env.ssr_proxy_configs) {
      const proxyPath = (proxy as {path?: string}).path ?? '';
      ui.div({text: '', width: labelWidth}, {text: `  ${proxyPath} → ${proxy.host}`});
    }
  }

  ux.stdout(ui.toString());
}

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
 * Valid AWS regions for MRT environments.
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
      description: 'Environment slug/identifier (e.g., staging, production)',
      required: true,
    }),
  };

  static description = t('commands.mrt.env.create.description', 'Create a new Managed Runtime environment');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> staging --project my-storefront --name "Staging Environment"',
    '<%= config.bin %> <%= command.id %> production --project my-storefront --name "Production" --production',
    '<%= config.bin %> <%= command.id %> feature-test -p my-storefront -n "Feature Test" --region eu-west-1',
    '<%= config.bin %> <%= command.id %> staging -p my-storefront -n "Staging" --proxy api=api.example.com --proxy ocapi=ocapi.example.com',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'Display name for the environment',
      required: true,
    }),
    region: Flags.string({
      char: 'r',
      description: 'AWS region for SSR deployment',
      options: SSR_REGIONS as unknown as string[],
    }),
    production: Flags.boolean({
      description: 'Mark as a production environment',
      default: false,
    }),
    hostname: Flags.string({
      description: 'Hostname pattern for V8 Tag loading',
    }),
    'external-hostname': Flags.string({
      description: 'Full external hostname (e.g., www.example.com)',
    }),
    'external-domain': Flags.string({
      description: 'External domain for Universal PWA SSR (e.g., example.com)',
    }),
    'allow-cookies': Flags.boolean({
      description: 'Forward HTTP cookies to origin',
      default: false,
      allowNo: true,
    }),
    'enable-source-maps': Flags.boolean({
      description: 'Enable source map support in the environment',
      default: false,
      allowNo: true,
    }),
    proxy: Flags.string({
      description: 'Proxy configuration in format path=host (can be specified multiple times)',
      multiple: true,
    }),
  };

  async run(): Promise<MrtEnvironment> {
    this.requireMrtCredentials();

    const {slug} = this.args;
    const {mrtProject: project} = this.resolvedConfig;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    const {
      name,
      region,
      production: isProduction,
      hostname,
      'external-hostname': externalHostname,
      'external-domain': externalDomain,
      'allow-cookies': allowCookies,
      'enable-source-maps': enableSourceMaps,
      proxy: proxyStrings,
    } = this.flags;

    // Parse proxy configurations
    const proxyConfigs = proxyStrings?.map((p) => parseProxyString(p));

    this.log(
      t('commands.mrt.env.create.creating', 'Creating environment "{{slug}}" in {{project}}...', {slug, project}),
    );

    try {
      const result = await createEnv(
        {
          projectSlug: project,
          slug,
          name,
          region: region as SsrRegion | undefined,
          isProduction,
          hostname,
          externalHostname,
          externalDomain,
          allowCookies: allowCookies || undefined,
          enableSourceMaps: enableSourceMaps || undefined,
          proxyConfigs,
          origin: this.resolvedConfig.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (this.jsonEnabled()) {
        return result;
      }

      // Human-readable output
      this.log(t('commands.mrt.env.create.success', 'Environment created successfully.'));

      printEnvDetails(result, project);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.env.create.failed', 'Failed to create environment: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
