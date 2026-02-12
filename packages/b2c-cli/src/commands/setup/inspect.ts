/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import type {NormalizedConfig, ConfigSourceInfo} from '@salesforce/b2c-tooling-sdk/config';
import {withDocs} from '../../i18n/index.js';

/**
 * Sensitive fields that should be masked by default.
 */
const SENSITIVE_FIELDS = new Set<keyof NormalizedConfig>(['clientSecret', 'mrtApiKey', 'password']);

/**
 * JSON output structure for the inspect command.
 */
interface SetupInspectResponse {
  config: Record<string, unknown>;
  sources: ConfigSourceInfo[];
  warnings?: string[];
}

/**
 * Mask a sensitive value, showing first 4 characters.
 * Matches the pattern used in the logger for consistency.
 */
function maskValue(value: string): string {
  if (value.length > 10) {
    return `${value.slice(0, 4)}...REDACTED`;
  }
  return 'REDACTED';
}

/**
 * Check if a field is sensitive and should be masked.
 */
function isSensitiveField(field: string): boolean {
  return SENSITIVE_FIELDS.has(field as keyof NormalizedConfig);
}

/**
 * Get the display value for a config field, applying masking if needed.
 */
function getDisplayValue(field: string, value: unknown, unmask: boolean): string {
  if (value === undefined || value === null) {
    return '-';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '-';
  }

  const strValue = String(value);

  if (!unmask && isSensitiveField(field)) {
    return maskValue(strValue);
  }

  return strValue;
}

/**
 * Command to display resolved configuration.
 */
export default class SetupInspect extends BaseCommand<typeof SetupInspect> {
  static aliases = ['setup:config'];

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
  };

  async run(): Promise<SetupInspectResponse> {
    const {values, sources, warnings} = this.resolvedConfig;
    const unmask = this.flags.unmask;

    // Build output config with masking applied
    const outputConfig: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined) {
        outputConfig[key] = isSensitiveField(key) && !unmask ? maskValue(String(value)) : value;
      }
    }

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
          resultMap.set(field, source.name);
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
        ['webdavHostname', config.webdavHostname],
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
        ['scopes', config.scopes],
        ['authMethods', config.authMethods],
        ['accountManagerHost', config.accountManagerHost],
        ['sandboxApiHost', config.sandboxApiHost],
      ],
      fieldSources,
      unmask,
    );

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

    // MRT section
    this.renderSection(
      ui,
      'Managed Runtime (MRT)',
      [
        ['mrtProject', config.mrtProject],
        ['mrtEnvironment', config.mrtEnvironment],
        ['mrtApiKey', config.mrtApiKey],
        ['mrtOrigin', config.mrtOrigin],
      ],
      fieldSources,
      unmask,
    );

    // Metadata section
    this.renderSection(ui, 'Metadata', [['instanceName', config.instanceName]], fieldSources, unmask);

    // Sources section
    if (sources.length > 0) {
      ui.div({text: '', padding: [0, 0, 0, 0]});
      ui.div({text: 'Sources', padding: [1, 0, 0, 0]});
      ui.div({text: '─'.repeat(60), padding: [0, 0, 0, 0]});

      for (const [index, source] of sources.entries()) {
        ui.div({text: `  ${index + 1}. ${source.name}`, width: 24}, {text: source.location || '-'});
      }
    }

    ux.stdout(ui.toString());
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
