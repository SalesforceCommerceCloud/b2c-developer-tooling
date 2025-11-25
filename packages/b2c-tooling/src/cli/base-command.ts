import {Command, Flags, Interfaces} from '@oclif/core';
import {loadConfig, ResolvedConfig, LoadConfigOptions} from './config.js';
import {setLanguage} from '../i18n/index.js';
import {configureLogger, getLogger, type LogLevel, type Logger} from '../logging/index.js';

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<(typeof BaseCommand)['baseFlags'] & T['flags']>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent'] as const;

/**
 * Base command class for B2C CLI tools.
 */
export abstract class BaseCommand<T extends typeof Command> extends Command {
  static baseFlags = {
    'log-level': Flags.option({
      description: 'Set logging verbosity level',
      env: 'SFCC_LOG_LEVEL',
      options: LOG_LEVELS,
      helpGroup: 'LOGGING',
    })(),
    debug: Flags.boolean({
      char: 'D',
      description: 'Enable debug logging (shorthand for --log-level debug)',
      env: 'SFCC_DEBUG',
      default: false,
      helpGroup: 'LOGGING',
    }),
    lang: Flags.string({
      char: 'L',
      description: 'Language for messages (e.g., en, de). Also respects LANGUAGE env var.',
      helpGroup: 'GLOBAL',
    }),
    config: Flags.string({
      description: 'Path to config file (defaults to dw.json)',
      env: 'SFCC_CONFIG',
      helpGroup: 'CONFIG',
    }),
    instance: Flags.string({
      char: 'i',
      description: 'Instance/config name from dw.json',
      env: 'SFCC_INSTANCE',
      helpGroup: 'CONFIG',
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

  protected configureLogging(): void {
    let level: LogLevel = 'info';

    if (this.flags['log-level']) {
      level = this.flags['log-level'] as LogLevel;
    } else if (this.flags.debug) {
      level = 'debug';
    }

    configureLogger({
      level,
      destination: process.stderr,
      baseContext: {command: this.id},
    });

    this.logger = getLogger();
  }

  protected loadConfiguration(): ResolvedConfig {
    const options: LoadConfigOptions = {
      instance: this.flags.instance,
      configPath: this.flags.config,
    };

    return loadConfig({}, options);
  }
}
