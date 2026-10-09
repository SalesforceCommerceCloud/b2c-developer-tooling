/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import cliui from 'cliui';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getEnvironmentWithBackend, type MrtEnvironmentView} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Print a backend-neutral environment view in a formatted table.
 */
export function printEnvView(env: MrtEnvironmentView, project: string): void {
  const ui = cliui({width: process.stdout.columns || 80});
  const labelWidth = 18;

  ui.div('');
  ui.div({text: 'Slug:', width: labelWidth}, {text: env.id});
  ui.div({text: 'Name:', width: labelWidth}, {text: env.name});
  ui.div({text: 'Project:', width: labelWidth}, {text: project});
  ui.div({text: 'State:', width: labelWidth}, {text: env.status ?? 'unknown'});

  // Primary is a SCAPI-only concept; omit the row on legacy where it is undefined.
  if (env.isPrimary !== undefined) {
    ui.div({text: 'Primary:', width: labelWidth}, {text: env.isPrimary ? 'Yes' : 'No'});
  }

  if (env.isProduction !== undefined) {
    ui.div({text: 'Production:', width: labelWidth}, {text: env.isProduction ? 'Yes' : 'No'});
  }

  if (env.region) {
    ui.div({text: 'Region:', width: labelWidth}, {text: env.region});
  }

  if (env.architecture) {
    ui.div({text: 'Architecture:', width: labelWidth}, {text: env.architecture});
  }

  if (env.origin) {
    ui.div({text: 'Origin:', width: labelWidth}, {text: env.origin});
  }

  // Legacy-only configuration fields, shown when present so the backend-neutral
  // view keeps the detail the old per-command printers displayed. Cookies and
  // source maps print only when enabled, matching the prior behavior.
  if (env.hostname) {
    ui.div({text: 'Hostname:', width: labelWidth}, {text: env.hostname});
  }

  if (env.externalHostname) {
    ui.div({text: 'External Host:', width: labelWidth}, {text: env.externalHostname});
  }

  if (env.externalDomain) {
    ui.div({text: 'External Domain:', width: labelWidth}, {text: env.externalDomain});
  }

  if (env.allowCookies) {
    ui.div({text: 'Allow Cookies:', width: labelWidth}, {text: 'Yes'});
  }

  if (env.enableSourceMaps) {
    ui.div({text: 'Source Maps:', width: labelWidth}, {text: 'Yes'});
  }

  if (env.logLevel) {
    ui.div({text: 'Log Level:', width: labelWidth}, {text: env.logLevel});
  }

  if (env.proxies && env.proxies.length > 0) {
    ui.div({text: 'Proxies:', width: labelWidth}, {text: ''});
    for (const proxy of env.proxies) {
      ui.div({text: '', width: labelWidth}, {text: `  ${proxy.path ?? ''} → ${proxy.host}`});
    }
  }

  if (env.createdAt) {
    ui.div({text: 'Created:', width: labelWidth}, {text: new Date(env.createdAt).toLocaleString()});
  }

  ui.div({text: 'Backend:', width: labelWidth}, {text: env.backend});

  ux.stdout(ui.toString());
}

/**
 * Get details of a Managed Runtime environment.
 */
export default class MrtEnvGet extends MrtCommand<typeof MrtEnvGet> {
  static description = withDocs(
    t('commands.mrt.env.get.description', 'Get details of a Managed Runtime environment'),
    '/cli/mrt.html#b2c-mrt-env-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront --environment staging',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --json',
    '<%= config.bin %> <%= command.id %> -p my-storefront -e production --mrt-backend scapi',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  protected operations = {
    getEnvironmentWithBackend,
  };

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

    const {preference, scapiConnection, legacyAuth} = this.getMrtBackendContext();

    this.log(
      t('commands.mrt.env.get.fetching', 'Fetching environment {{environment}} in {{project}}...', {
        project,
        environment,
      }),
    );

    const result = await this.operations.getEnvironmentWithBackend({
      preference,
      scapiConnection,
      legacyAuth,
      projectSlug: project,
      environment,
      origin: this.resolvedConfig.values.mrtOrigin,
      onFallback: (reason) => this.warn(reason),
      onResolve: (backend) => this.logger.debug({backend}, '[MRT] Getting environment via backend'),
    });

    if (!this.jsonEnabled()) {
      printEnvView(result.environment, project);
    }

    // Under --json, emit the backend's native environment response verbatim.
    return result.raw;
  }

  protected override supportsScapiMrt(): boolean {
    return true;
  }
}
