import {Command, Flags, type Interfaces} from '@oclif/core';
import {loadConfig} from './config.js';
import type {ResolvedConfig, LoadConfigOptions} from './config.js';
import {setLanguage} from '../i18n/index.js';
import {configureLogger, getLogger, type LogLevel, type Logger} from '../logging/index.js';
import type {ExtraParamsConfig} from '../clients/middleware.js';

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
    'extra-query': Flags.string({
      description: 'Extra query parameters as JSON (e.g., \'{"debug":"true"}\')',
      helpGroup: 'GLOBAL',
      hidden: true,
    }),
    'extra-body': Flags.string({
      description: 'Extra body fields to merge as JSON (e.g., \'{"_internal":true}\')',
      helpGroup: 'GLOBAL',
      hidden: true,
    }),
  };

  protected flags!: Flags<T>;
  protected args!: Args<T>;
  protected resolvedConfig!: ResolvedConfig;
  protected logger!: Logger;

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

  protected loadConfiguration(): ResolvedConfig {
    const options: LoadConfigOptions = {
      instance: this.flags.instance,
      configPath: this.flags.config,
    };

    return loadConfig({}, options);
  }

  /**
   * Handle errors thrown during command execution.
   *
   * Logs the error using the structured logger (including cause if available),
   * then uses oclif's error() to exit with proper code.
   */
  protected async catch(err: Error & {exitCode?: number}): Promise<never> {
    // Log if logger is available (may not be if error during init)
    if (this.logger) {
      this.logger.error({cause: err?.cause}, err.message);
    }

    // Use oclif's error() for proper exit code and display
    this.error(err.message, {exit: err.exitCode ?? 1});
  }

  /**
   * Parse extra params from --extra-query and --extra-body flags.
   * Returns undefined if no extra params are specified.
   *
   * @returns ExtraParamsConfig or undefined
   */
  protected getExtraParams(): ExtraParamsConfig | undefined {
    const extraQuery = this.flags['extra-query'];
    const extraBody = this.flags['extra-body'];

    if (!extraQuery && !extraBody) {
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

    return config;
  }
}
