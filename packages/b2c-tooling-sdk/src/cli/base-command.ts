/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags, type Interfaces} from '@oclif/core';
import {loadConfig} from './config.js';
import type {LoadConfigOptions, PluginSources} from './config.js';
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
import {setLanguage} from '../i18n/index.js';
import {configureLogger, getLogger, type LogLevel, type Logger} from '../logging/index.js';
import {createExtraParamsMiddleware, type ExtraParamsConfig} from '../clients/middleware.js';
import type {ConfigSource} from '../config/types.js';
import {globalMiddlewareRegistry} from '../clients/middleware-registry.js';
import {globalAuthMiddlewareRegistry} from '../auth/middleware.js';
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
      char: 'd',
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

  /** Telemetry instance for tracking command events */
  protected telemetry?: Telemetry;

  /** High-priority config sources from plugins (inserted before defaults) */
  protected pluginSourcesBefore: ConfigSource[] = [];
  /** Low-priority config sources from plugins (inserted after defaults) */
  protected pluginSourcesAfter: ConfigSource[] = [];

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

    // Set CLI User-Agent (CLI name/version only, without @salesforce/ prefix)
    // This must happen before any API clients are created
    setUserAgent(`${this.config.name.replace(/^@salesforce\//, '')}/${this.config.version}`);

    // Register extra params middleware (from --extra-query, --extra-body, --extra-headers flags)
    // This must happen before any API clients are created
    this.registerExtraParamsMiddleware();

    // Collect middleware from plugins before any API clients are created
    await this.collectPluginHttpMiddleware();

    // Collect auth middleware from plugins before any authentication is performed
    await this.collectPluginAuthMiddleware();

    // Collect config sources from plugins before loading configuration
    await this.collectPluginConfigSources();

    // Auto-initialize telemetry from oclif pjson config
    await this.initTelemetryFromConfig();

    this.resolvedConfig = this.loadConfiguration();

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
   * to ensure common options like workingDirectory are always included.
   *
   * @example
   * ```typescript
   * protected override loadConfiguration(): ResolvedB2CConfig {
   *   const options: LoadConfigOptions = {
   *     ...this.getBaseConfigOptions(),
   *     // Add subclass-specific options here
   *   };
   *   return loadConfig(extractMyFlags(this.flags), options, this.getPluginSources());
   * }
   * ```
   */
  protected getBaseConfigOptions(): LoadConfigOptions {
    return {
      instance: this.flags.instance,
      configPath: this.flags.config,
      workingDirectory: this.flags['project-directory'],
    };
  }

  /**
   * Gets plugin sources for configuration resolution.
   */
  protected getPluginSources(): PluginSources {
    return {
      before: this.pluginSourcesBefore,
      after: this.pluginSourcesAfter,
    };
  }

  protected loadConfiguration(): ResolvedB2CConfig {
    return loadConfig({}, this.getBaseConfigOptions(), this.getPluginSources());
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
   * Plugin sources are collected into two arrays based on their priority:
   * - `pluginSourcesBefore`: High priority sources (override defaults)
   * - `pluginSourcesAfter`: Low priority sources (fill gaps)
   *
   * Priority mapping:
   * - 'before' → -1 (higher priority than defaults)
   * - 'after' → 10 (lower priority than defaults)
   * - number → used directly
   */
  protected async collectPluginConfigSources(): Promise<void> {
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

    // Collect sources from all plugins that responded, respecting priority
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

      // Apply priority to sources that don't already have one set
      for (const source of result.sources) {
        if (source.priority === undefined) {
          (source as {priority?: number}).priority = numericPriority;
        }
      }

      // Still use before/after arrays for backwards compatibility
      // The resolver will sort all sources by priority anyway
      if (numericPriority < 0) {
        this.pluginSourcesBefore.push(...result.sources);
      } else {
        this.pluginSourcesAfter.push(...result.sources);
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
    this.error(err.message, {exit: exitCode});
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
