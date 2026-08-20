/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {BaseCommand, loadConfig} from '@salesforce/b2c-tooling-sdk/cli';
import type {NormalizedConfig, ConfigSourceInfo, ResolvedB2CConfig} from '@salesforce/b2c-tooling-sdk/config';
import {
  EnvSource,
  isSensitiveConfigField,
  maskConfigValue,
  redactConfigValues,
} from '@salesforce/b2c-tooling-sdk/config';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '@salesforce/b2c-tooling-sdk';
import {DEFAULT_MRT_ORIGIN} from '@salesforce/b2c-tooling-sdk/clients';
import {withDocs} from '../../i18n/index.js';

/**
 * JSON output structure for the inspect command.
 */
interface SetupInspectResponse {
  config: Record<string, unknown>;
  sources: ConfigSourceInfo[];
  warnings?: string[];
}

/**
 * Get the display value for a config field, applying masking if needed.
 */
function getDisplayValue(field: string, value: unknown, unmask: boolean): string {
  if (value === undefined || value === null) {
    return '-';
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ')
      : '-';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  const strValue = String(value);

  if (!unmask && isSensitiveConfigField(field)) {
    return maskConfigValue(strValue);
  }

  return strValue;
}

/** Format source provenance for human-readable output. */
function getSourceDisplayName(source: ConfigSourceInfo): string {
  return source.scope === 'global' ? `${source.name} (global dw.json)` : source.name;
}

/** Format compact field-level provenance. */
function getFieldSourceDisplayName(source: ConfigSourceInfo): string {
  return source.scope === 'global' ? 'global dw.json' : source.name;
}

/** Expand configuration sources into human-readable rows. */
function getSourceRows(sources: ConfigSourceInfo[]): Array<{location: string; name: string; selected?: boolean}> {
  return sources.flatMap((source) => {
    if (!source.instanceCatalog || source.instanceCatalog.length === 0) {
      return [{location: source.location || '-', name: getSourceDisplayName(source)}];
    }

    return source.instanceCatalog.map((file) => {
      return {
        location: file.location,
        name: file.scope === 'global' ? `${source.name} (global dw.json)` : source.name,
        selected: file.selected,
      };
    });
  });
}

/**
 * Command to display resolved configuration.
 */
export default class SetupInspect extends BaseCommand<typeof SetupInspect> {
  static aliases = ['setup:config', 'config:get'];

  static description = withDocs('Display resolved configuration', '/cli/setup.html#b2c-setup-inspect');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --unmask',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    unmask: Flags.boolean({
      description: 'Show sensitive values unmasked (passwords, secrets, API keys)',
      default: false,
    }),
    'account-manager-host': Flags.string({
      description: `Account Manager hostname for OAuth (default: ${DEFAULT_ACCOUNT_MANAGER_HOST})`,
      env: 'SFCC_ACCOUNT_MANAGER_HOST',
      default: async () => process.env.SFCC_LOGIN_URL || undefined,
      helpGroup: 'AUTH',
    }),
    'cloud-origin': Flags.string({
      description: `MRT cloud origin URL (default: ${DEFAULT_MRT_ORIGIN})`,
      env: 'MRT_CLOUD_ORIGIN',
      default: async () => process.env.SFCC_MRT_CLOUD_ORIGIN || undefined,
      helpGroup: 'MRT',
    }),
  };

  static hiddenAliases = ['config:show', 'config:inspect'];

  protected override async loadConfiguration(): Promise<ResolvedB2CConfig> {
    const accountManagerHost = this.flags['account-manager-host'] as string | undefined;
    const cloudOrigin = this.flags['cloud-origin'] as string | undefined;

    // Include EnvSource so that SFCC_* environment variables are visible in inspect output.
    // Other commands handle env vars via oclif flag mappings, but inspect needs to show them
    // as a config source since it doesn't have those flags.
    return loadConfig(
      {
        accountManagerHost,
        mrtOrigin: cloudOrigin,
      },
      {
        ...this.getBaseConfigOptions(),
        accountManagerHost,
        cloudOrigin,
      },
      {before: [new EnvSource()]},
    );
  }

  async run(): Promise<SetupInspectResponse> {
    const {values, sources, warnings} = this.resolvedConfig;
    const unmask = this.flags.unmask;

    // Build output config with masking applied
    const outputConfig = redactConfigValues(values, {unmask});
    const result: SetupInspectResponse = {
      config: outputConfig,
      sources,
      warnings: warnings.length > 0 ? warnings.map((w) => w.message) : undefined,
    };

    // JSON mode - just return the data
    if (this.jsonEnabled()) {
      return result;
    }

    // Human-readable output
    if (unmask) {
      this.warn('Sensitive values are displayed unmasked.');
    }

    this.printConfig(values, sources, unmask);

    // Show warnings
    for (const warning of warnings) {
      this.warn(warning.message);
    }

    return result;
  }

  /**
   * Build a map of field -> source name for display.
   */
  private buildFieldSourceMap(sources: ConfigSourceInfo[]): Map<string, string> {
    const resultMap = new Map<string, string>();

    // Process sources in order - first source with a field (not ignored) wins
    for (const source of sources) {
      for (const field of source.fields) {
        if (!source.fieldsIgnored?.includes(field) && !resultMap.has(field)) {
          resultMap.set(field, getFieldSourceDisplayName(source));
        }
      }
    }

    return resultMap;
  }

  /**
   * Print the configuration in human-readable format.
   */
  private printConfig(config: NormalizedConfig, sources: ConfigSourceInfo[], unmask: boolean): void {
    const ui = cliui({width: process.stdout.columns || 80});
    const fieldSources = this.buildFieldSourceMap(sources);

    // Header
    ui.div({text: 'Configuration', padding: [1, 0, 0, 0]});
    ui.div({text: '─'.repeat(60), padding: [0, 0, 0, 0]});

    // Instance section
    this.renderSection(
      ui,
      'Instance',
      [
        ['hostname', config.hostname],
        ...(config.webdavHostname ? [['webdavHostname', config.webdavHostname] as [string, unknown]] : []),
        ['codeVersion', config.codeVersion],
      ],
      fieldSources,
      unmask,
    );

    // Auth (Basic) section
    this.renderSection(
      ui,
      'Authentication (Basic)',
      [
        ['username', config.username],
        ['password', config.password],
      ],
      fieldSources,
      unmask,
    );

    // Auth (OAuth) section
    this.renderSection(
      ui,
      'Authentication (OAuth)',
      [
        ['clientId', config.clientId],
        ['clientSecret', config.clientSecret],
        ...(config.scopes ? [['scopes', config.scopes] as [string, unknown]] : []),
        ...(config.authMethods ? [['authMethods', config.authMethods] as [string, unknown]] : []),
        ...(config.accountManagerHost ? [['accountManagerHost', config.accountManagerHost] as [string, unknown]] : []),
      ],
      fieldSources,
      unmask,
    );

    this.renderOptionalSection(
      ui,
      'Authentication (JWT Bearer)',
      [
        ['jwtCertPath', config.jwtCertPath],
        ['jwtKeyPath', config.jwtKeyPath],
        ['jwtPassphrase', config.jwtPassphrase],
      ],
      fieldSources,
      unmask,
    );

    this.renderOptionalSection(
      ui,
      'Authentication (SLAS)',
      [
        ['slasClientId', config.slasClientId],
        ['slasClientSecret', config.slasClientSecret],
      ],
      fieldSources,
      unmask,
    );

    // TLS/mTLS section (only shown when at least one TLS field is configured)
    if (config.certificate || config.certificatePassphrase || config.selfSigned) {
      this.renderSection(
        ui,
        'TLS/mTLS',
        [
          ['certificate', config.certificate],
          ['certificatePassphrase', config.certificatePassphrase],
          ['selfSigned', config.selfSigned],
        ],
        fieldSources,
        unmask,
      );
    }

    // SCAPI section
    this.renderSection(
      ui,
      'SCAPI',
      [
        ['shortCode', config.shortCode],
        ['tenantId', config.tenantId],
      ],
      fieldSources,
      unmask,
    );

    this.renderOptionalSection(
      ui,
      'On-Demand Sandbox (ODS)',
      [
        ['sandboxApiHost', config.sandboxApiHost],
        ['realm', config.realm],
      ],
      fieldSources,
      unmask,
    );

    this.renderOptionalSection(ui, 'Commerce Intelligence (CIP)', [['cipHost', config.cipHost]], fieldSources, unmask);

    // MRT section
    this.renderSection(
      ui,
      'Managed Runtime (MRT)',
      [
        ['mrtProject', config.mrtProject],
        ['mrtEnvironment', config.mrtEnvironment],
        ['mrtApiKey', config.mrtApiKey],
        ...(config.mrtOrigin ? [['mrtOrigin', config.mrtOrigin] as [string, unknown]] : []),
      ],
      fieldSources,
      unmask,
    );

    this.renderOptionalSection(
      ui,
      'Project',
      [
        ['autoUpload', config.autoUpload],
        ['cartridges', config.cartridges],
        ['importSetExclude', config.importSetExclude],
        ['contentLibrary', config.contentLibrary],
        ['catalogs', config.catalogs],
        ['libraries', config.libraries],
        ['assetQuery', config.assetQuery],
        ['docsCategories', config.docsCategories],
      ],
      fieldSources,
      unmask,
    );

    this.renderOptionalSection(
      ui,
      'Metadata',
      [
        ['siteId', config.siteId],
        ['instanceName', config.instanceName],
        ['projectDirectory', config.projectDirectory],
      ],
      fieldSources,
      unmask,
    );

    this.renderOptionalSection(ui, 'Safety', [['safety', config.safety]], fieldSources, unmask);

    // Sources section
    if (sources.length > 0) {
      ui.div({text: '', padding: [0, 0, 0, 0]});
      ui.div({text: 'Sources', padding: [1, 0, 0, 0]});
      ui.div({text: '─'.repeat(60), padding: [0, 0, 0, 0]});

      for (const [index, source] of getSourceRows(sources).entries()) {
        const selectionMarker = source.selected ? '→' : ' ';
        ui.div({text: `  ${index + 1}. ${selectionMarker} ${source.name}`, width: 38}, {text: source.location});
      }
    }

    ux.stdout(ui.toString());
  }

  /**
   * Render a section only when at least one field is configured.
   */
  private renderOptionalSection(
    ui: ReturnType<typeof cliui>,
    title: string,
    fields: [string, unknown][],
    fieldSources: Map<string, string>,
    unmask: boolean,
  ): void {
    const configuredFields = fields.filter(([, value]) => value !== undefined && value !== null);
    if (configuredFields.length > 0) {
      this.renderSection(ui, title, configuredFields, fieldSources, unmask);
    }
  }

  /**
   * Render a configuration section with fields.
   */
  private renderSection(
    ui: ReturnType<typeof cliui>,
    title: string,
    fields: [string, unknown][],
    fieldSources: Map<string, string>,
    unmask: boolean,
  ): void {
    ui.div({text: '', padding: [0, 0, 0, 0]});
    ui.div({text: title, padding: [0, 0, 0, 0]});

    for (const [field, value] of fields) {
      const displayValue = getDisplayValue(field, value, unmask);
      const source = fieldSources.get(field);

      ui.div(
        {text: `  ${field}`, width: 22},
        {text: displayValue, width: 40},
        {text: source ? `[${source}]` : '', padding: [0, 0, 0, 2]},
      );
    }
  }
}
