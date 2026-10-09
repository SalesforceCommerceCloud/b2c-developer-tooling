/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {updateEnvironmentWithBackend} from '@salesforce/b2c-tooling-sdk/operations/mrt';
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
 * Valid log levels for MRT environments.
 */
const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'TRACE', 'FATAL'] as const;

type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Update a Managed Runtime environment.
 *
 * The SCAPI MRT backend updates the environment's display name only (`--name`);
 * all other flags configure the legacy MRT Cloud API and are legacy-only.
 */
export default class MrtEnvUpdate extends MrtCommand<typeof MrtEnvUpdate> {
  static description = withDocs(
    t('commands.mrt.env.update.description', 'Update a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-update',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment staging --name "New Name"',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --enable-source-maps',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --production',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --proxy api=api.example.com',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --name "New Name" --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'Display name for the environment',
    }),
    production: Flags.boolean({
      description: 'Mark as a production environment (legacy backend only)',
      allowNo: true,
    }),
    hostname: Flags.string({
      description: 'Hostname pattern for V8 Tag loading (use empty string to clear) (legacy backend only)',
    }),
    'external-hostname': Flags.string({
      description: 'Full external hostname (use empty string to clear) (legacy backend only)',
    }),
    'external-domain': Flags.string({
      description: 'External domain for Universal PWA SSR (use empty string to clear) (legacy backend only)',
    }),
    'allow-cookies': Flags.boolean({
      description: 'Forward HTTP cookies to origin (legacy backend only)',
      allowNo: true,
    }),
    'preserve-proxy-user-agent': Flags.boolean({
      description:
        'Forward the original client User-Agent header to proxy origins instead of overwriting it with "Amazon CloudFront" (legacy backend only)',
      allowNo: true,
    }),
    'enable-source-maps': Flags.boolean({
      description: 'Enable source map support in the environment (legacy backend only)',
      allowNo: true,
    }),
    'log-level': Flags.string({
      description: 'Log level for the environment (legacy backend only)',
      options: LOG_LEVELS as unknown as string[],
    }),
    'whitelisted-ips': Flags.string({
      description: 'IP whitelist (CIDR blocks, space-separated; use empty string to clear) (legacy backend only)',
    }),
    proxy: Flags.string({
      description: 'Proxy configuration in format path=host (can be specified multiple times) (legacy backend only)',
      multiple: true,
    }),
  };

  protected operations = {
    updateEnvironmentWithBackend,
  };

  // The SCAPI backend updates the display name (--name) only; every other flag
  // configures the legacy MRT Cloud API and is dropped on SCAPI.
  protected override mrtBackendOnlyFlags() {
    return {
      legacy: [
        {name: '--production'},
        {name: '--hostname'},
        {name: '--external-hostname'},
        {name: '--external-domain'},
        {name: '--allow-cookies'},
        {name: '--preserve-proxy-user-agent'},
        {name: '--enable-source-maps'},
        {name: '--log-level'},
        {name: '--whitelisted-ips'},
        {name: '--proxy'},
      ],
    };
  }

  async run(): Promise<unknown> {
    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project/--storefront (-p/-s), set MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const {
      name,
      production,
      hostname,
      'external-hostname': externalHostname,
      'external-domain': externalDomain,
      'allow-cookies': allowCookies,
      'preserve-proxy-user-agent': preserveProxyUserAgent,
      'enable-source-maps': enableSourceMaps,
      'log-level': logLevel,
      'whitelisted-ips': whitelistedIps,
      proxy: proxyStrings,
    } = this.flags;

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    // Each backend branch validates its own input: the SCAPI backend updates the
    // display name only and requires --name; the legacy backend accepts the full
    // configuration set below.
    // Parse proxy configurations (legacy backend only)
    const proxyConfigs = proxyStrings?.map((p) => parseProxyString(p));

    this.log(
      t('commands.mrt.env.update.updating', 'Updating environment {{environment}} in {{project}}...', {
        project,
        environment,
      }),
    );

    const result = await this.operations.updateEnvironmentWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      name,
      isProduction: production,
      hostname: hostname === '' ? null : hostname,
      externalHostname: externalHostname === '' ? null : externalHostname,
      externalDomain: externalDomain === '' ? null : externalDomain,
      allowCookies,
      preserveProxyUserAgent,
      enableSourceMaps,
      logLevel: logLevel as LogLevel | undefined,
      whitelistedIps: whitelistedIps === '' ? null : whitelistedIps,
      proxyConfigs,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Updating environment via backend'),
    });

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.env.update.success', 'Environment updated successfully.'));
      if (result.backend === 'legacy') {
        this.log(
          t(
            'commands.mrt.env.update.note',
            'Note: SSR-related changes will trigger an automatic redeployment of the current bundle.',
          ),
        );
      }
      printEnvView(result.environment, project);
    }

    // Under --json, emit the backend's native update response verbatim.
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
