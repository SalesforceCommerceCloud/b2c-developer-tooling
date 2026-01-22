/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getEnv, type MrtEnvironment} from '@salesforce/b2c-tooling-sdk/operations/mrt';
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
 * Get details of a Managed Runtime environment.
 */
export default class MrtEnvGet extends MrtCommand<typeof MrtEnvGet> {
  static description = t('commands.mrt.env.get.description', 'Get details of a Managed Runtime environment');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment staging',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  async run(): Promise<MrtEnvironment> {
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

    this.log(
      t('commands.mrt.env.get.fetching', 'Fetching environment {{environment}} in {{project}}...', {
        project,
        environment,
      }),
    );

    try {
      const result = await getEnv(
        {
          projectSlug: project,
          slug: environment,
          origin: this.resolvedConfig.values.mrtOrigin,
        },
        this.getMrtAuth(),
      );

      if (!this.jsonEnabled()) {
        printEnvDetails(result, project);
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(
          t('commands.mrt.env.get.failed', 'Failed to get environment: {{message}}', {message: error.message}),
        );
      }
      throw error;
    }
  }
}
