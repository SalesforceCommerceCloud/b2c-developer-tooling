/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags, type Interfaces} from '@oclif/core';
import {loadConfig} from './config.js';
import type {LoadConfigOptions} from './config.js';
import type {ResolvedB2CConfig} from '../config/index.js';
import {parseFriendlySandboxId} from '../operations/ods/sandbox-lookup.js';
import type {
  ConfigSourcesHookOptions,
  ConfigSourcesHookResult,
  HttpMiddlewareHookOptions,
  HttpMiddlewareHookResult,
  AuthMiddlewareHookOptions,
  AuthMiddlewareHookResult,
} from './hooks.js';
import {setLanguage, t} from '../i18n/index.js';
import {configureLogger, getLogger, type LogLevel, type Logger} from '../logging/index.js';
import {createExtraParamsMiddleware, createSafetyMiddleware, type ExtraParamsConfig} from '../clients/middleware.js';
import {
  getSafetyLevel,
  describeSafetyLevel,
  resolveEffectiveSafetyConfig,
  loadGlobalSafetyConfig,
} from '../safety/index.js';
import {SafetyGuard} from '../safety/safety-guard.js';
import type {SafetyEvaluation} from '../safety/types.js';
import {confirm as safetyConfirm} from '../ux/confirm.js';
import {globalConfigSourceRegistry} from '../config/config-source-registry.js';
import {globalMiddlewareRegistry} from '../clients/middleware-registry.js';
import {globalAuthMiddlewareRegistry} from '../auth/middleware.js';
import {initializeStatefulStore} from '../auth/stateful-store.js';
import {setUserAgent} from '../clients/user-agent.js';
import {createTelemetry, Telemetry, type TelemetryAttributes} from '../telemetry/index.js';

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<(typeof BaseCommand)['baseFlags'] & T['flags']>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent'] as const;

/**
 * Type for oclif pjson custom telemetry config.
 */
interface TelemetryConfig {
  connectionString?: string;
}

/**
 * Base command class for B2C CLI tools.
 *
 * Environment variables for logging:
 * - SFCC_JSON_LOGS: Output log messages as JSON lines (for log aggregation)
 * - SFCC_LOG_TO_STDOUT: Send logs to stdout instead of stderr
 * - SFCC_LOG_COLORIZE: Force colors on/off (default: auto-detect TTY)
 * - SFCC_REDACT_SECRETS: Set to 'false' to disable secret redaction
 * - NO_COLOR: Industry standard to disable colors
 *
 * Environment variables for telemetry:
 * - SF_DISABLE_TELEMETRY: Set to 'true' to disable telemetry (sf CLI standard)
 * - SFCC_DISABLE_TELEMETRY: Set to 'true' to disable telemetry
 * - SFCC_APP_INSIGHTS_KEY: Override connection string from package.json
 */
export abstract class BaseCommand<T extends typeof Command> extends Command {
  static baseFlags = {
    'log-level': Flags.option({
      description: 'Set logging verbosity level',
      env: 'SFCC_LOG_LEVEL',
      options: LOG_LEVELS,
      helpGroup: 'GLOBAL',
    })(),
    debug: Flags.boolean({
      char: 'D',
      description: 'Enable debug logging (shorthand for --log-level debug)',
      env: 'SFCC_DEBUG',
      default: false,
      helpGroup: 'GLOBAL',
    }),
    json: Flags.boolean({
      description: 'Output result as JSON',
      default: false,
      helpGroup: 'GLOBAL',
    }),
    jsonl: Flags.boolean({
      aliases: ['json-logs'],
      description: 'Output log messages as JSON lines',
      env: 'SFCC_JSON_LOGS',
      default: false,
      helpGroup: 'GLOBAL',
    }),
    lang: Flags.string({
      char: 'L',
      description: 'Language for messages (e.g., en, de). Also respects LANGUAGE env var.',
      helpGroup: 'GLOBAL',
    }),
    config: Flags.string({
      description: 'Path to config file (in dw.json format; defaults to ./dw.json)',
      env: 'SFCC_CONFIG',
      helpGroup: 'GLOBAL',
    }),
    instance: Flags.string({
      char: 'i',
      description: 'Instance name from configuration file (i.e. dw.json, etc)',
      env: 'SFCC_INSTANCE',
      helpGroup: 'GLOBAL',
    }),
    'project-directory': Flags.string({
      aliases: ['working-directory'],
      description: 'Project directory',
      env: 'SFCC_PROJECT_DIRECTORY',
      default: async () => process.env.SFCC_WORKING_DIRECTORY || undefined,
      helpGroup: 'GLOBAL',
    }),
    'extra-query': Flags.string({
      description: 'Extra query parameters as JSON (e.g., \'{"debug":"true"}\')',
      env: 'SFCC_EXTRA_QUERY',
      helpGroup: 'GLOBAL',
      hidden: true,
    }),
    'extra-body': Flags.string({
      description: 'Extra body fields to merge as JSON (e.g., \'{"_internal":true}\')',
      env: 'SFCC_EXTRA_BODY',
      helpGroup: 'GLOBAL',
      hidden: true,
    }),
    'extra-headers': Flags.string({
      description: 'Extra HTTP headers as JSON (e.g., \'{"X-Custom-Header": "value"}\')',
      env: 'SFCC_EXTRA_HEADERS',
      helpGroup: 'GLOBAL',
      hidden: true,
    }),
  };

  protected flags!: Flags<T>;
  protected args!: Args<T>;
  protected resolvedConfig!: ResolvedB2CConfig;
  protected logger!: Logger;

  /** Safety guard for evaluating operations against safety rules and levels. */
  protected safetyGuard: SafetyGuard = new SafetyGuard({level: 'NONE'});

  /** Telemetry instance for tracking command events */
  protected telemetry?: Telemetry;

  /** Start time for command duration tracking */
  private commandStartTime?: number;

  public async init(): Promise<void> {
    await super.init();

    const {args, flags} = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      args: this.ctor.args,
      strict: this.ctor.strict,
    });

    this.flags = flags as Flags<T>;
    this.args = args as Args<T>;

    if (this.flags.lang) {
      setLanguage(this.flags.lang);
    }

    this.configureLogging();

    // Initialize stateful auth store with oclif's data directory so session
    // files are stored alongside other CLI data (e.g. ~/Library/Application Support/@salesforce/b2c-cli)
    initializeStatefulStore(this.config.dataDir);

    // Set CLI User-Agent (CLI name/version only, without @salesforce/ prefix)
    // This must happen before any API clients are created
    setUserAgent(`${this.config.name.replace(/^@salesforce\//, '')}/${this.config.version}`);

    // Register extra params middleware (from --extra-query, --extra-body, --extra-headers flags)
    // This must happen before any API clients are created
    this.registerExtraParamsMiddleware();

    // Initialize safety guard with env-var-only config (before config resolution).
    // The guard is updated with the full config after loadConfiguration().
    this.safetyGuard = new SafetyGuard({level: getSafetyLevel('NONE')});

    // Register safety middleware FIRST (before any other middleware)
    // The middleware reads this.safetyGuard lazily via closure, so it picks up
    // the full config after initializeSafetyGuard() runs.
    this.registerSafetyMiddleware();

    // Collect middleware from plugins before any API clients are created
    await this.collectPluginHttpMiddleware();

    // Collect auth middleware from plugins before any authentication is performed
    await this.collectPluginAuthMiddleware();

    // Collect config sources from plugins before loading configuration
    await this.collectPluginConfigSources();

    // Auto-initialize telemetry from oclif pjson config
    await this.initTelemetryFromConfig();

    this.resolvedConfig = await this.loadConfiguration();

    // Update safety guard with config-provided safety settings (merges env + config)
    this.initializeSafetyGuard();

    // Evaluate command-level safety rules for every command.
    // This enforces rules like { command: "code:deploy", action: "block" } generically.
    await this.evaluateCommandSafety();

    this.addTelemetryContext();
  }

  /**
   * Auto-initialize telemetry from package.json oclif.telemetry config.
   * Called during init() to enable automatic telemetry for all commands.
   */
  private async initTelemetryFromConfig(): Promise<void> {
    const pjsonTelemetry = (this.config.pjson.oclif as {telemetry?: TelemetryConfig} | undefined)?.telemetry;
    const connectionString = Telemetry.getConnectionString(pjsonTelemetry?.connectionString);

    if (!connectionString) return;

    this.telemetry = createTelemetry({
      project: this.config.name,
      appInsightsKey: connectionString,
      version: this.config.version,
      dataDir: this.config.dataDir,
      initialAttributes: {command: this.id},
    });
    await this.telemetry.start();

    // Track command start
    this.commandStartTime = Date.now();
    this.telemetry.sendEvent('COMMAND_START', {command: this.id});
  }

  /**
   * Manual telemetry initialization for non-pjson usage (e.g., MCP server with additional attributes).
   * Use this when you need to pass custom initial attributes or use a different connection string.
   *
   * @param options - Telemetry options
   * @returns The telemetry instance, or undefined if telemetry is disabled
   */
  protected async initTelemetry(options: {
    appInsightsKey?: string;
    initialAttributes?: TelemetryAttributes;
  }): Promise<Telemetry | undefined> {
    // If telemetry was already initialized by initTelemetryFromConfig, stop it first
    if (this.telemetry) {
      await this.telemetry.stop();
    }

    const connectionString = Telemetry.getConnectionString(options.appInsightsKey);
    if (!connectionString) return undefined;

    this.telemetry = createTelemetry({
      project: this.config.name,
      appInsightsKey: connectionString,
      version: this.config.version,
      dataDir: this.config.dataDir,
      initialAttributes: {command: this.id, ...options.initialAttributes},
    });
    await this.telemetry.start();

    // Track command start
    this.commandStartTime = Date.now();
    this.telemetry.sendEvent('COMMAND_START', {command: this.id});

    return this.telemetry;
  }

  /**
   * Determine colorize setting based on env vars and TTY.
   * Priority: NO_COLOR > SFCC_LOG_COLORIZE > TTY detection
   */
  private shouldColorize(): boolean {
    if (process.env.NO_COLOR !== undefined) {
      return false;
    }

    // Default: colorize if stderr is a TTY
    return process.stderr.isTTY ?? false;
  }

  protected configureLogging(): void {
    let level: LogLevel = 'info';

    if (this.flags['log-level']) {
      level = this.flags['log-level'] as LogLevel;
    } else if (this.flags.debug) {
      level = 'debug';
    }

    // Default to stderr (fd 2), allow override to stdout (fd 1)
    const fd = process.env.SFCC_LOG_TO_STDOUT ? 1 : 2;

    // Redaction: default true, can be disabled
    const redact = process.env.SFCC_REDACT_SECRETS !== 'false';

    configureLogger({
      level,
      fd,
      baseContext: {command: this.id},
      json: this.flags.jsonl,
      colorize: this.shouldColorize(),
      redact,
    });

    this.logger = getLogger();
  }

  /**
   * Override oclif's log() to use pino.
   */
  log(message?: string, ...args: unknown[]): void {
    if (message !== undefined) {
      this.logger.info(args.length > 0 ? `${message} ${args.join(' ')}` : message);
    }
  }

  /**
   * Override oclif's warn() to use pino.
   */
  warn(input: string | Error): string | Error {
    const message = input instanceof Error ? input.message : input;
    this.logger.warn(message);
    return input;
  }

  /**
   * Gets base configuration options from common flags.
   *
   * Subclasses should spread these options when overriding loadConfiguration()
   * to ensure common options like projectDirectory are always included.
   *
   * @example
   * ```typescript
   * protected override loadConfiguration(): ResolvedB2CConfig {
   *   const options: LoadConfigOptions = {
   *     ...this.getBaseConfigOptions(),
   *     // Add subclass-specific options here
   *   };
   *   return loadConfig(extractMyFlags(this.flags), options);
   * }
   * ```
   */
  protected getBaseConfigOptions(): LoadConfigOptions {
    return {
      instance: this.flags.instance,
      configPath: this.flags.config,
      projectDirectory: this.flags['project-directory'],
      workingDirectory: this.flags['project-directory'],
    };
  }

  protected async loadConfiguration(): Promise<ResolvedB2CConfig> {
    return loadConfig({}, this.getBaseConfigOptions());
  }

  /**
   * Enrich telemetry with realm/tenant context from the resolved configuration.
   * Called after loadConfiguration() in init() so that COMMAND_SUCCESS and
   * COMMAND_EXCEPTION events include organizational context.
   */
  protected addTelemetryContext(): void {
    if (!this.telemetry) return;

    try {
      const attributes: TelemetryAttributes = {};
      const {values, sources} = this.resolvedConfig;

      // Extract realm from tenantId (e.g., "zzpq_019" or "f_ecom_zzpq_019")
      if (values.tenantId) {
        attributes.tenantId = values.tenantId;
        const parsed = parseFriendlySandboxId(values.tenantId);
        if (parsed) {
          attributes.realm = parsed.realm;
        }
      }

      // Fallback: extract realm from hostname (e.g., "zzpq-019.dx.commercecloud.salesforce.com")
      if (!attributes.realm && values.hostname) {
        const parsed = parseFriendlySandboxId(values.hostname.split('.')[0]);
        if (parsed) {
          attributes.realm = parsed.realm;
        }
      }

      if (values.hostname) {
        attributes.hostname = values.hostname;
      }

      if (values.clientId) {
        attributes.clientId = values.clientId;
      }

      if (values.shortCode) {
        attributes.shortCode = values.shortCode;
      }

      if (values.mrtProject) {
        attributes.mrtProject = values.mrtProject;
      }

      // Record which config sources contributed
      if (sources.length > 0) {
        attributes.configSources = sources.map((s) => s.name).join(', ');
      }

      if (Object.keys(attributes).length > 0) {
        this.telemetry.addAttributes(attributes);
        if (process.env.SFCC_TELEMETRY_LOG === 'true') {
          this.logger.debug({attributes}, 'telemetry context enriched');
        }
      }
    } catch {
      // Best-effort: telemetry context enrichment must never prevent command execution
    }
  }

  /**
   * Collects config sources from plugins via the `b2c:config-sources` hook.
   *
   * This method is called during command initialization, after flags are parsed
   * but before configuration is resolved. It allows CLI plugins to provide
   * custom ConfigSource implementations.
   *
   * Plugin sources are registered with the global config source registry
   * and automatically included in all subsequent `resolveConfig()` calls.
   *
   * Priority mapping:
   * - 'before' → -1 (higher priority than defaults)
   * - 'after' → 10 (lower priority than defaults)
   * - number → used directly
   */
  protected async collectPluginConfigSources(): Promise<void> {
    if (process.env.B2C_SKIP_PLUGIN_HOOKS) return;

    // Access flags that may be defined in subclasses (OAuthCommand, InstanceCommand)
    const flags = this.flags as Record<string, unknown>;

    const hookOptions: ConfigSourcesHookOptions = {
      instance: this.flags.instance,
      configPath: this.flags.config,
      flags,
      resolveOptions: {
        instance: this.flags.instance,
        configPath: this.flags.config,
        accountManagerHost: flags['account-manager-host'] as string | undefined,
      },
    };

    const hookResult = await this.config.runHook('b2c:config-sources', hookOptions);

    // Collect sources from all plugins and register with global registry
    for (const success of hookResult.successes) {
      const result = success.result as ConfigSourcesHookResult | undefined;
      if (!result?.sources?.length) continue;

      // Map priority: 'before' → -1, 'after' → 10, number → as-is, undefined → 10
      const numericPriority =
        result.priority === 'before'
          ? -1
          : result.priority === 'after'
            ? 10
            : typeof result.priority === 'number'
              ? result.priority
              : 10; // default 'after'

      // Apply priority to sources that don't already have one set, then register globally
      for (const source of result.sources) {
        if (source.priority === undefined) {
          (source as {priority?: number}).priority = numericPriority;
        }
        globalConfigSourceRegistry.register(source);
      }
    }

    // Log warnings for hook failures (don't break the CLI)
    for (const failure of hookResult.failures) {
      this.logger?.warn(`Plugin ${failure.plugin.name} b2c:config-sources hook failed: ${failure.error.message}`);
    }
  }

  /**
   * Collects HTTP middleware from plugins via the `b2c:http-middleware` hook.
   *
   * This method is called during command initialization, after flags are parsed
   * but before any API clients are created. It allows CLI plugins to provide
   * custom middleware that will be applied to all HTTP clients.
   *
   * Plugin middleware is registered with the global middleware registry.
   */
  protected async collectPluginHttpMiddleware(): Promise<void> {
    if (process.env.B2C_SKIP_PLUGIN_HOOKS) return;

    const hookOptions: HttpMiddlewareHookOptions = {
      flags: this.flags as Record<string, unknown>,
    };

    const hookResult = await this.config.runHook('b2c:http-middleware', hookOptions);

    // Register middleware from all plugins that responded
    for (const success of hookResult.successes) {
      const result = success.result as HttpMiddlewareHookResult | undefined;
      if (!result?.providers?.length) continue;

      for (const provider of result.providers) {
        globalMiddlewareRegistry.register(provider);
        this.logger?.debug(`Registered HTTP middleware provider: ${provider.name}`);
      }
    }

    // Log warnings for hook failures (don't break the CLI)
    for (const failure of hookResult.failures) {
      this.logger?.warn(`Plugin ${failure.plugin.name} b2c:http-middleware hook failed: ${failure.error.message}`);
    }
  }

  /**
   * Collects auth middleware from plugins via the `b2c:auth-middleware` hook.
   *
   * This method is called during command initialization, after flags are parsed
   * but before any authentication is performed. It allows CLI plugins to provide
   * custom middleware that will be applied to OAuth token requests.
   *
   * Plugin middleware is registered with the global auth middleware registry.
   */
  protected async collectPluginAuthMiddleware(): Promise<void> {
    if (process.env.B2C_SKIP_PLUGIN_HOOKS) return;

    const hookOptions: AuthMiddlewareHookOptions = {
      flags: this.flags as Record<string, unknown>,
    };

    const hookResult = await this.config.runHook('b2c:auth-middleware', hookOptions);

    // Register middleware from all plugins that responded
    for (const success of hookResult.successes) {
      const result = success.result as AuthMiddlewareHookResult | undefined;
      if (!result?.providers?.length) continue;

      for (const provider of result.providers) {
        globalAuthMiddlewareRegistry.register(provider);
        this.logger?.debug(`Registered auth middleware provider: ${provider.name}`);
      }
    }

    // Log warnings for hook failures (don't break the CLI)
    for (const failure of hookResult.failures) {
      this.logger?.warn(`Plugin ${failure.plugin.name} b2c:auth-middleware hook failed: ${failure.error.message}`);
    }
  }

  /**
   * Handle errors thrown during command execution.
   *
   * Logs the error using the structured logger (including cause if available).
   * In JSON mode, outputs a JSON error object to stdout instead of oclif's default format.
   * Sends exception to telemetry if initialized.
   */
  protected async catch(err: Error & {exitCode?: number}): Promise<never> {
    const exitCode = err.exitCode ?? 1;
    const duration = this.commandStartTime ? Date.now() - this.commandStartTime : undefined;

    // Send exception and COMMAND_ERROR event so the error appears in custom events (same view as COMMAND_START)
    // Flush explicitly before stop to ensure events are sent before process exits
    if (this.telemetry) {
      this.telemetry.sendException(err, {command: this.id, exitCode, duration});
      this.telemetry.sendEvent('COMMAND_ERROR', {
        command: this.id,
        exitCode,
        duration,
        errorMessage: err.message,
        ...(err.cause ? {errorCause: String(err.cause)} : {}),
      });
      await this.telemetry.flush();
      await this.telemetry.stop();
    }

    // Log if logger is available (may not be if error during init)
    if (this.logger) {
      this.logger.error({cause: err?.cause}, err.message);
    }

    // In JSON mode, output structured error to stderr and exit
    if (this.jsonEnabled()) {
      const errorOutput = {
        error: {
          message: err.message,
          code: exitCode,
          ...(err.cause ? {cause: String(err.cause)} : {}),
        },
      };
      process.stderr.write(JSON.stringify(errorOutput) + '\n');
      process.exit(exitCode);
    }

    // Use oclif's error() for proper exit code and display
    return this.error(err.message, {exit: exitCode});
  }

  /**
   * Called after run() completes (whether successfully or via catch()).
   * Tracks COMMAND_SUCCESS and stops telemetry.
   */
  protected async finally(err: Error | undefined): Promise<void> {
    // Only track success if no error occurred
    if (!err && this.telemetry) {
      const duration = this.commandStartTime ? Date.now() - this.commandStartTime : undefined;
      this.telemetry.sendEvent('COMMAND_SUCCESS', {command: this.id, duration});
      await this.telemetry.stop();
    }
    await super.finally(err);
  }

  public baseCommandTest(): void {
    this.logger.info('BaseCommand initialized');
  }

  /**
   * Check if destructive operations are allowed based on safety level.
   * Provides early, user-friendly error messages before HTTP requests are attempted.
   *
   * This is a command-level check that complements the HTTP middleware safety guard.
   * While the middleware provides unbypassable protection, this method offers better
   * error messages and early detection.
   *
   * Destructive operations include:
   * - Deleting resources (sandboxes, users, API clients, etc.)
   * - Resetting or wiping data
   * - Force operations that overwrite data
   * - Revoking access or permissions
   *
   * NOTE: This is optional - the HTTP middleware will catch any operations that bypass
   * this check. Use this method for better UX when you know an operation is destructive.
   *
   * @param operationDescription - Description of the operation (e.g., "delete sandbox", "reset user password")
   * @throws Error if safety level blocks the operation
   *
   * @example
   * ```typescript
   * async run() {
   *   this.assertDestructiveOperationAllowed('delete sandbox');
   *   // ... proceed with deletion
   * }
   * ```
   */
  protected assertDestructiveOperationAllowed(operationDescription?: string): void {
    const evaluation = this.safetyGuard.evaluate({
      type: 'command',
      commandId: this.id,
    });

    if (evaluation.action === 'allow') {
      return;
    }

    const operation = operationDescription || t('base.destructiveOperation', 'this destructive operation');

    // For both 'block' and 'confirm' at the assertion level, we block.
    // Commands that want to support confirmation should call confirmOrBlock() separately.
    const safetyLevel = this.safetyGuard.config.level;
    return this.error(
      t(
        'base.safetyModeBlocked',
        'Cannot {{operation}}: blocked by your safety configuration (level: {{safetyLevel}}).\n\n{{description}}\n\nTo change this, update the "safety" section in your dw.json or the SFCC_SAFETY_LEVEL environment variable.\nSee: https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/safety',
        {
          operation,
          safetyLevel,
          description: describeSafetyLevel(safetyLevel),
        },
      ),
      {exit: 1},
    );
  }

  /**
   * Parse extra params from --extra-query, --extra-body, and --extra-headers flags.
   * Returns undefined if no extra params are specified.
   *
   * @returns ExtraParamsConfig or undefined
   */
  protected getExtraParams(): ExtraParamsConfig | undefined {
    const extraQuery = this.flags['extra-query'];
    const extraBody = this.flags['extra-body'];
    const extraHeaders = this.flags['extra-headers'];

    if (!extraQuery && !extraBody && !extraHeaders) {
      return undefined;
    }

    const config: ExtraParamsConfig = {};

    if (extraQuery) {
      try {
        config.query = JSON.parse(extraQuery) as Record<string, string | number | boolean | undefined>;
      } catch {
        this.error(`Invalid JSON for --extra-query: ${extraQuery}`);
      }
    }

    if (extraBody) {
      try {
        config.body = JSON.parse(extraBody) as Record<string, unknown>;
      } catch {
        this.error(`Invalid JSON for --extra-body: ${extraBody}`);
      }
    }

    if (extraHeaders) {
      try {
        config.headers = JSON.parse(extraHeaders) as Record<string, string>;
      } catch {
        this.error(`Invalid JSON for --extra-headers: ${extraHeaders}`);
      }
    }

    return config;
  }

  /**
   * Register safety middleware that evaluates all HTTP requests against the SafetyGuard.
   *
   * The middleware reads `this.safetyGuard` lazily (via arrow function closure), so it
   * picks up the full config after `initializeSafetyGuard()` runs. This allows the
   * middleware to be registered early in init() before config resolution completes.
   */
  private registerSafetyMiddleware(): void {
    globalMiddlewareRegistry.register({
      name: 'cli-safety-guard',
      getMiddleware: () => {
        // Skip if no safety restrictions are configured
        if (this.safetyGuard.config.level === 'NONE' && !this.safetyGuard.config.rules?.length) {
          return undefined;
        }
        return createSafetyMiddleware(this.safetyGuard);
      },
    });
  }

  /**
   * Update the safety guard with config-provided safety settings.
   * Called after loadConfiguration() to merge env vars, global safety config,
   * and per-instance dw.json config.
   */
  private initializeSafetyGuard(): void {
    const globalSafety = loadGlobalSafetyConfig(this.config.configDir);
    const config = resolveEffectiveSafetyConfig(this.resolvedConfig.values.safety, globalSafety);
    this.safetyGuard = new SafetyGuard(config);

    if (config.level !== 'NONE' || config.rules?.length || config.confirm) {
      this.logger.debug(
        {level: config.level, confirm: config.confirm, ruleCount: config.rules?.length ?? 0},
        'Safety mode active',
      );
    }
  }

  /**
   * Evaluate command-level safety rules for the current command.
   *
   * This runs at the end of init() so every command is evaluated against
   * command rules (e.g., `{ command: "code:deploy", action: "block" }`).
   * If no command rule matches, this is a no-op — level-based blocking
   * is handled by the HTTP middleware and assertDestructiveOperationAllowed().
   */
  private async evaluateCommandSafety(): Promise<void> {
    const evaluation = this.safetyGuard.evaluate({
      type: 'command',
      commandId: this.id,
    });

    if (evaluation.action === 'block' && evaluation.rule) {
      this.error(evaluation.reason, {exit: 1});
    }
    if (evaluation.action === 'confirm' && evaluation.rule) {
      await this.confirmOrBlock(evaluation);
    }
  }

  /**
   * Require interactive confirmation for a safety-guarded operation.
   *
   * If stdin is a TTY, prompts the user. Otherwise, blocks with an error message.
   * The error message clearly indicates the block is from the user's own safety configuration.
   *
   * @param evaluation - The safety evaluation that triggered confirmation
   * @throws Error if confirmation is denied or not possible
   */
  protected async confirmOrBlock(evaluation: SafetyEvaluation): Promise<void> {
    if (!process.stdin.isTTY) {
      this.error(
        `Your safety configuration requires confirmation for this operation, ` +
          `but no interactive session is available.\n\n  ${evaluation.reason}\n\n` +
          `To change this, update the "safety" section in your dw.json or the SFCC_SAFETY_CONFIRM environment variable.`,
        {exit: 1},
      );
    }

    const confirmed = await safetyConfirm(
      `Your safety configuration requires confirmation for this operation:\n  ${evaluation.reason}\n  Proceed?`,
    );
    if (!confirmed) {
      this.error('Operation cancelled.', {exit: 1});
    }
  }

  /**
   * Register extra params (query, body, headers) as global middleware.
   * This applies to ALL HTTP clients created during command execution.
   */
  private registerExtraParamsMiddleware(): void {
    const extraParams = this.getExtraParams();
    if (!extraParams) return;

    globalMiddlewareRegistry.register({
      name: 'cli-extra-params',
      getMiddleware() {
        return createExtraParamsMiddleware(extraParams);
      },
    });
  }
}
