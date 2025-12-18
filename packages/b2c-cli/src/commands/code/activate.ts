import {Args, Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {activateCodeVersion, reloadCodeVersion} from '@salesforce/b2c-tooling-sdk/operations/code';
import {t} from '../../i18n/index.js';

export default class CodeActivate extends InstanceCommand<typeof CodeActivate> {
  static args = {
    codeVersion: Args.string({
      description: 'Code version ID to activate',
      required: false,
    }),
  };

  static description = t('commands.code.activate.description', 'Activate or reload a code version');

  static examples = [
    '<%= config.bin %> <%= command.id %> v1',
    '<%= config.bin %> <%= command.id %> v1 --server my-sandbox.demandware.net',
    '<%= config.bin %> <%= command.id %> --reload',
    '<%= config.bin %> <%= command.id %> v1 --reload',
  ];

  static flags = {
    ...InstanceCommand.baseFlags,
    reload: Flags.boolean({
      char: 'r',
      description: 'Reload the code version (toggle activation to force reload)',
      default: false,
    }),
  };

  async run(): Promise<void> {
    this.requireOAuthCredentials();

    const codeVersionArg = this.args.codeVersion;
    const hostname = this.resolvedConfig.hostname!;

    // Get code version from arg, flag, or config
    const codeVersion = codeVersionArg ?? this.resolvedConfig.codeVersion;

    if (this.flags.reload) {
      // Reload mode - re-activate the code version
      this.log(
        t('commands.code.activate.reloading', 'Reloading code version{{version}} on {{hostname}}...', {
          hostname,
          version: codeVersion ? ` ${codeVersion}` : '',
        }),
      );

      try {
        await reloadCodeVersion(this.instance, codeVersion);
        this.log(
          t('commands.code.activate.reloaded', 'Code version{{version}} reloaded successfully', {
            version: codeVersion ? ` ${codeVersion}` : '',
          }),
        );
      } catch (error) {
        if (error instanceof Error) {
          this.error(
            t('commands.code.activate.reloadFailed', 'Failed to reload code version: {{message}}', {
              message: error.message,
            }),
          );
        }
        throw error;
      }
    } else {
      // Activate mode - just activate the code version
      if (!codeVersion) {
        this.error(
          t(
            'commands.code.activate.versionRequired',
            'Code version is required. Provide as argument or use --code-version flag.',
          ),
        );
      }

      this.log(
        t('commands.code.activate.activating', 'Activating code version {{codeVersion}} on {{hostname}}...', {
          hostname,
          codeVersion,
        }),
      );

      try {
        await activateCodeVersion(this.instance, codeVersion);
        this.log(
          t('commands.code.activate.activated', 'Code version {{codeVersion}} activated successfully', {codeVersion}),
        );
      } catch (error) {
        if (error instanceof Error) {
          this.error(
            t('commands.code.activate.failed', 'Failed to activate code version: {{message}}', {
              message: error.message,
            }),
          );
        }
        throw error;
      }
    }
  }
}
