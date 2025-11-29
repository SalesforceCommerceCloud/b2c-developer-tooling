import {Args} from '@oclif/core';
import {uploadCartridges} from '@salesforce/b2c-tooling';
import {InstanceCommand} from '@salesforce/b2c-tooling/cli';
import {t} from '../../i18n/index.js';

export default class Deploy extends InstanceCommand<typeof Deploy> {
  static args = {
    cartridgePath: Args.string({
      description: 'Path to cartridges directory',
      default: './cartridges',
    }),
  };

  static description = t('commands.code.deploy.description', 'Deploy cartridges to a B2C Commerce instance');

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ./my-cartridges',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net --code-version v1',
  ];

  async run(): Promise<void> {
    this.requireCodeVersion();
    this.requireWebDavCredentials();

    const path = this.args.cartridgePath;
    const hostname = this.resolvedConfig.hostname!;
    const version = this.resolvedConfig.codeVersion!;

    this.log(t('commands.code.deploy.deploying', 'Deploying cartridges from {{path}}...', {path}));
    this.log(t('commands.code.deploy.target', 'Target: {{hostname}}', {hostname}));
    this.log(t('commands.code.deploy.codeVersion', 'Code Version: {{version}}', {version}));

    try {
      await uploadCartridges(this.instance, path);
      this.log(t('commands.code.deploy.complete', 'Deployment complete'));
    } catch (error) {
      if (error instanceof Error) {
        this.error(t('commands.code.deploy.failed', 'Deployment failed: {{message}}', {message: error.message}));
      }
      throw error;
    }
  }
}
