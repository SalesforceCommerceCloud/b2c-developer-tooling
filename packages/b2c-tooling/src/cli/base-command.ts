import {Command, Flags, Interfaces} from '@oclif/core';
import {loadConfig, ResolvedConfig, LoadConfigOptions} from './config.js';
import {setLogger, consoleLogger} from '../logger.js';
import {setLanguage} from '../i18n/index.js';

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<(typeof BaseCommand)['baseFlags'] & T['flags']>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

/**
 * Base command class for B2C CLI tools.
 * Provides minimal common flags: debug, config file path, instance selection.
 *
 * All flags support environment variables with SFCC_ prefix.
 *
 * For commands that need authentication, extend one of:
 * - OAuthCommand: For platform operations requiring OAuth (ODS, etc.)
 * - InstanceCommand: For B2C instance operations (sites, code, etc.)
 * - MrtCommand: For Managed Runtime operations
 */
export abstract class BaseCommand<T extends typeof Command> extends Command {
  static baseFlags = {
    debug: Flags.boolean({
      char: 'D',
      description: 'Enable debug logging',
      env: 'SFCC_DEBUG',
      default: false,
      helpGroup: 'GLOBAL',
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

    // Set language first so all messages are localized
    // Flag takes precedence (env var is handled by i18n module at import time)
    if (this.flags.lang) {
      setLanguage(this.flags.lang);
    }

    if (this.flags.debug) {
      setLogger(consoleLogger);
    }

    // Load config - subclasses will augment with their specific flags
    this.resolvedConfig = this.loadConfiguration();
  }

  /**
   * Load configuration from flags and dw.json.
   * Environment variables are handled by OCLIF's flag parsing.
   * Subclasses should override to add their specific flag mappings.
   */
  protected loadConfiguration(): ResolvedConfig {
    const options: LoadConfigOptions = {
      instance: this.flags.instance,
      configPath: this.flags.config,
    };

    return loadConfig({}, options);
  }
}
