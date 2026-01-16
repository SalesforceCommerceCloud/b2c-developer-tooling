/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags, type Interfaces} from '@oclif/core';
import {loadConfig} from './config.js';
import type {LoadConfigOptions, PluginSources} from './config.js';
import type {ResolvedB2CConfig} from '../config/index.js';
import type {
  ConfigSourcesHookOptions,
  ConfigSourcesHookResult,
  HttpMiddlewareHookOptions,
  HttpMiddlewareHookResult,
} from './hooks.js';
import {setLanguage} from '../i18n/index.js';
import {configureLogger, getLogger, type LogLevel, type Logger} from '../logging/index.js';
import {createExtraParamsMiddleware, type ExtraParamsConfig} from '../clients/middleware.js';
import type {ConfigSource} from '../config/types.js';
import {globalMiddlewareRegistry} from '../clients/middleware-registry.js';

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<(typeof BaseCommand)['baseFlags'] & T['flags']>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent'] as const;

/**
 * Base command class for B2C CLI tools.
 *
 * Environment variables for logging:
 * - SFCC_LOG_TO_STDOUT: Send logs to stdout instead of stderr
 * - SFCC_LOG_COLORIZE: Force colors on/off (default: auto-detect TTY)
 * - SFCC_REDACT_SECRETS: Set to 'false' to disable secret redaction
 * - NO_COLOR: Industry standard to disable colors
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
      description: 'Output logs as JSON lines',
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
    'working-directory': Flags.string({
      description: 'Project working directory',
      env: 'SFCC_WORKING_DIRECTORY',
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

  /** High-priority config sources from plugins (inserted before defaults) */
  protected pluginSourcesBefore: ConfigSource[] = [];
  /** Low-priority config sources from plugins (inserted after defaults) */
  protected pluginSourcesAfter: ConfigSource[] = [];

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

    // Register extra params middleware (from --extra-query, --extra-body, --extra-headers flags)
    // This must happen before any API clients are created
    this.registerExtraParamsMiddleware();

    // Collect middleware from plugins before any API clients are created
    await this.collectPluginHttpMiddleware();

    // Collect config sources from plugins before loading configuration
    await this.collectPluginConfigSources();

    this.resolvedConfig = this.loadConfiguration();
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
      json: this.flags.json,
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

  protected loadConfiguration(): ResolvedB2CConfig {
    const options: LoadConfigOptions = {
      instance: this.flags.instance,
      configPath: this.flags.config,
    };

    const pluginSources: PluginSources = {
      before: this.pluginSourcesBefore,
      after: this.pluginSourcesAfter,
    };

    return loadConfig({}, options, pluginSources);
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

      if (result.priority === 'before') {
        this.pluginSourcesBefore.push(...result.sources);
      } else {
        // Default priority is 'after'
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
   * Handle errors thrown during command execution.
   *
   * Logs the error using the structured logger (including cause if available).
   * In JSON mode, outputs a JSON error object to stdout instead of oclif's default format.
   */
  protected async catch(err: Error & {exitCode?: number}): Promise<never> {
    const exitCode = err.exitCode ?? 1;

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
