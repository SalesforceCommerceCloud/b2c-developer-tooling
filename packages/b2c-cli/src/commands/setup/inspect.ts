/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import cliui from 'cliui';
import {join, resolve} from 'node:path';
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
import {
  loadGlobalSafetyConfig,
  parseSafetyLevelString,
  resolveEffectiveSafetyConfig,
} from '@salesforce/b2c-tooling-sdk/safety';
import {t, withDocs} from '../../i18n/index.js';

/**
 * JSON output structure for the inspect command.
 */
interface SetupInspectResponse {
  config: Record<string, unknown>;
  sources: ConfigSourceInfo[];
  warnings?: string[];
}

interface SafetyInspection {
  config?: NormalizedConfig['safety'];
  sources: ConfigSourceInfo[];
  fieldSources: Map<string, string>;
  ruleSources: string[];
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
  return source.scope === 'global' ? `${source.name} (default)` : source.name;
}

/** Format compact field-level provenance. */
function getFieldSourceDisplayName(source: ConfigSourceInfo): string {
  return source.scope === 'global' ? 'default' : source.name;
}

/** Expand configuration sources into human-readable rows. */
function getSourceRows(sources: ConfigSourceInfo[]): Array<{location: string; name: string}> {
  return sources.flatMap((source) => {
    if (!source.instanceCatalog || source.instanceCatalog.length === 0) {
      return [{location: source.location || '-', name: getSourceDisplayName(source)}];
    }

    return source.instanceCatalog.map((file) => {
      const name = file.scope === 'global' ? `${source.name} (default)` : source.name;
      return {
        location: file.location,
        name: file.selected ? `${name}*` : name,
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
    '<%= config.bin %> <%= command.id %> --verbose',
    '<%= config.bin %> <%= command.id %> --unmask',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    verbose: Flags.boolean({
      description: t('commands.setup.inspect.verbose', 'Show the full ordered safety ruleset'),
      default: false,
    }),
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
    const {warnings} = this.resolvedConfig;
    const safety = this.inspectSafety();
    const values = {...this.resolvedConfig.values, ...(safety.config ? {safety: safety.config} : {})};
    const {sources} = safety;
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

    this.printConfig(values, sources, unmask, safety);

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

  /** Use the enforcement resolver, retaining each contributor for display. */
  private inspectSafety(): SafetyInspection {
    const {values, sources} = this.resolvedConfig;
    const global = loadGlobalSafetyConfig(this.config.configDir);
    const envLevel = parseSafetyLevelString(process.env.SFCC_SAFETY_LEVEL);
    const rawConfirm = process.env.SFCC_SAFETY_CONFIRM;
    const envConfirm = rawConfirm === undefined ? undefined : rawConfirm === 'true' || rawConfirm === '1';
    const inspection: SafetyInspection = {sources: [...sources], fieldSources: new Map(), ruleSources: []};
    if (!values.safety && !global && envLevel === undefined && envConfirm === undefined) return inspection;

    const contributors: Array<{name: string; config: NormalizedConfig['safety']}> = [
      {name: this.buildFieldSourceMap(sources).get('safety') ?? 'Configuration', config: values.safety},
      {name: 'SafetyFile', config: global},
      {name: 'SafetyEnv', config: {level: envLevel, confirm: envConfirm}},
    ];
    if (global) {
      inspection.sources.push({
        name: 'SafetyFile',
        location: process.env.SFCC_SAFETY_CONFIG
          ? resolve(process.env.SFCC_SAFETY_CONFIG)
          : join(this.config.configDir, 'safety.json'),
        fields: ['safety'],
      });
    }
    if (envLevel !== undefined || envConfirm !== undefined) {
      inspection.sources.push({
        name: 'SafetyEnv',
        location: [
          envLevel === undefined ? '' : 'SFCC_SAFETY_LEVEL',
          envConfirm === undefined ? '' : 'SFCC_SAFETY_CONFIRM',
        ]
          .filter(Boolean)
          .join(', '),
        fields: ['safety'],
      });
    }

    const effective = resolveEffectiveSafetyConfig(values.safety, global);
    inspection.config = effective;
    for (const field of ['level', 'confirm'] as const) {
      const names = contributors
        .filter(({config}) => config?.[field] !== undefined && config[field] === effective[field])
        .map(({name}) => name);
      if (names.length > 0) inspection.fieldSources.set(field, names.join(', '));
    }
    for (const {name, config} of contributors) {
      inspection.ruleSources.push(...(config?.rules ?? []).map(() => name));
    }
    if (inspection.ruleSources.length > 0)
      inspection.fieldSources.set('rules', [...new Set(inspection.ruleSources)].join(', '));
    return inspection;
  }

  /**
   * Print the configuration in human-readable format.
   */
  private printConfig(
    config: NormalizedConfig,
    sources: ConfigSourceInfo[],
    unmask: boolean,
    safety: SafetyInspection,
  ): void {
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

    this.renderSafety(ui, safety);

    // Sources section
    if (sources.length > 0) {
      ui.div({text: '', padding: [0, 0, 0, 0]});
      ui.div({text: 'Sources', padding: [1, 0, 0, 0]});
      ui.div({text: '─'.repeat(60), padding: [0, 0, 0, 0]});

      for (const [index, source] of getSourceRows(sources).entries()) {
        ui.div({text: `  ${index + 1}. ${source.name}`, width: 34}, {text: source.location});
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
   * Show safety settings and ordered matchers without serializing rules as JSON.
   */
  private renderSafety(ui: ReturnType<typeof cliui>, inspection: SafetyInspection): void {
    const safety = inspection.config;
    if (!safety) return;

    const defaultLabel = t('commands.setup.inspect.default', 'default');
    const level = inspection.fieldSources.has('level') ? safety.level : `NONE (${defaultLabel})`;
    const confirmation = safety.confirm
      ? t('commands.setup.inspect.enabled', 'Enabled')
      : t('commands.setup.inspect.disabled', 'Disabled');
    const levelLabel = t('commands.setup.inspect.safetyLevel', 'Level');
    const confirmationLabel = t('commands.setup.inspect.safetyConfirm', 'Level confirmation');
    const rulesLabel = t('commands.setup.inspect.safetyRulesLabel', 'Rules');
    const rules = safety.rules ?? [];
    const fieldSources = new Map<string, string>();
    for (const [field, label] of [
      ['level', levelLabel],
      ['confirm', confirmationLabel],
      ['rules', rulesLabel],
    ]) {
      const source = inspection.fieldSources.get(field);
      if (source) fieldSources.set(label, source);
    }
    this.renderSection(
      ui,
      t('commands.setup.inspect.safety', 'Safety'),
      [
        [levelLabel, level],
        [
          confirmationLabel,
          inspection.fieldSources.has('confirm') ? confirmation : `${confirmation} (${defaultLabel})`,
        ],
        [
          rulesLabel,
          rules.length === 0
            ? t('commands.setup.inspect.noSafetyRules', 'none')
            : this.flags.verbose
              ? String(rules.length)
              : t('commands.setup.inspect.safetyRuleCount', '{{count}} (use --verbose to show)', {count: rules.length}),
        ],
      ],
      fieldSources,
      false,
    );
    if (rules.length === 0 || !this.flags.verbose) return;

    ui.div({text: t('commands.setup.inspect.safetyRules', 'Rules (first match wins):'), padding: [0, 0, 0, 2]});
    for (const [index, rule] of rules.entries()) {
      let matcher = rule.method ?? '*';
      if (rule.command !== undefined)
        matcher = t('commands.setup.inspect.commandRule', 'command {{command}}', {command: rule.command});
      else if (rule.job !== undefined) matcher = t('commands.setup.inspect.jobRule', 'job {{job}}', {job: rule.job});
      ui.div(
        {text: `${index + 1}. ${rule.action.toUpperCase()} ${matcher}`, width: 62, padding: [0, 0, 0, 4]},
        {text: `[${inspection.ruleSources[index]}]`, padding: [0, 0, 0, 2]},
      );
      if (rule.command === undefined && rule.job === undefined)
        ui.div({text: rule.path ?? '/**', padding: [0, 0, 0, 7]});
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
