/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {updateEnv, type MrtEnvironmentUpdate} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../i18n/index.js';

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
 * Print environment details in a formatted table.
 */
function printEnvDetails(env: MrtEnvironmentUpdate, project: string): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 18;

  ui.div('');
  ui.div({text: 'Slug:', width: labelWidth}, {text: env.slug ?? ''});
  ui.div({text: 'Name:', width: labelWidth}, {text: env.name ?? ''});
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
 * Valid log levels for MRT environments.
 */
const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'TRACE', 'FATAL'] as const;

type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Update a Managed Runtime environment.
 */
export default class MrtEnvUpdate extends MrtCommand<typeof MrtEnvUpdate> {
  static description = t('commands.mrt.env.update.description', 'Update a Managed Runtime environment');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment staging --name "New Name"',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --enable-source-maps',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --production',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e staging --proxy api=api.example.com',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'Display name for the environment',
    }),
    production: Flags.boolean({
      description: 'Mark as a production environment',
      allowNo: true,
    }),
    hostname: Flags.string({
      description: 'Hostname pattern for V8 Tag loading (use empty string to clear)',
    }),
    'external-hostname': Flags.string({
      description: 'Full external hostname (use empty string to clear)',
    }),
    'external-domain': Flags.string({
      description: 'External domain for Universal PWA SSR (use empty string to clear)',
    }),
    'allow-cookies': Flags.boolean({
      description: 'Forward HTTP cookies to origin',
      allowNo: true,
    }),
    'enable-source-maps': Flags.boolean({
      description: 'Enable source map support in the environment',
      allowNo: true,
    }),
    'log-level': Flags.string({
      description: 'Log level for the environment',
      options: LOG_LEVELS as unknown as string[],
    }),
    'whitelisted-ips': Flags.string({
      description: 'IP whitelist (CIDR blocks, space-separated; use empty string to clear)',
    }),
    proxy: Flags.string({
      description: 'Proxy configuration in format path=host (can be specified multiple times)',
      multiple: true,
    }),
  };

  async run(): Promise<MrtEnvironmentUpdate> {
    this.requireMrtCredentials();

    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set SFCC_MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    const {
      name,
      production,
      hostname,
      'external-hostname': externalHostname,
      'external-domain': externalDomain,
      'allow-cookies': allowCookies,
      'enable-source-maps': enableSourceMaps,
      'log-level': logLevel,
      'whitelisted-ips': whitelistedIps,
      proxy: proxyStrings,
    } = this.flags;

    // Parse proxy configurations
    const proxyConfigs = proxyStrings?.map((p) => parseProxyString(p));

    this.log(
      t('commands.mrt.env.update.updating', 'Updating environment {{environment}} in {{project}}...', {
        project,
        environment,
      }),
    );

    try {
      const result = await updateEnv(
        {
          projectSlug: project,
          slug: environment,
          name,
          isProduction: production,
          hostname: hostname === '' ? null : hostname,
          externalHostname: externalHostname === '' ? null : externalHostname,
          externalDomain: externalDomain === '' ? null : externalDomain,
          allowCookies,
          enableSourceMaps,
          logLevel: logLevel as LogLevel | undefined,
          whitelistedIps: whitelistedIps === '' ? null : whitelistedIps,
          proxyConfigs,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        this.log(t('commands.mrt.env.update.success', 'Environment updated successfully.'));
        this.log(
          t(
            'commands.mrt.env.update.note',
            'Note: SSR-related changes will trigger an automatic redeployment of the current bundle.',
          ),
        );
        printEnvDetails(result, project);
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.env.update.failed', 'Failed to update environment: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
