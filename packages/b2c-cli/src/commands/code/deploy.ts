import {Flags} from '@oclif/core';
import {
  findAndDeployCartridges,
  getActiveCodeVersion,
  type DeployResult,
} from '@salesforce/b2c-tooling-sdk/operations/code';
import {CartridgeCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t} from '../../i18n/index.js';

export default class CodeDeploy extends CartridgeCommand<typeof CodeDeploy> {
  static args = {
    ...CartridgeCommand.baseArgs,
  };

  static description = t('commands.code.deploy.description', 'Deploy cartridges to a B2C Commerce instance');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ./my-cartridges',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net --code-version v1',
    '<%= config.bin %> <%= command.id %> --reload',
    '<%= config.bin %> <%= command.id %> --delete --reload',
    '<%= config.bin %> <%= command.id %> -c app_storefront_base -c plugin_applepay',
    '<%= config.bin %> <%= command.id %> -x test_cartridge',
  ];

  static flags = {
    ...CartridgeCommand.baseFlags,
    ...CartridgeCommand.cartridgeFlags,
    reload: Flags.boolean({
      char: 'r',
      description: 'Reload (re-activate) code version after deploy',
      default: false,
    }),
    delete: Flags.boolean({
      description: 'Delete existing cartridges before upload',
      default: false,
    }),
  };

  async run(): Promise<DeployResult> {
    this.requireWebDavCredentials();
    this.requireOAuthCredentials();

    const hostname = this.resolvedConfig.hostname!;
    let version = this.resolvedConfig.codeVersion;

    // If no code version specified, discover the active one
    if (!version) {
      this.warn(
        t('commands.code.deploy.noCodeVersion', 'No code version specified, discovering active code version...'),
      );
      const activeVersion = await getActiveCodeVersion(this.instance);
      if (!activeVersion?.id) {
        this.error(
          t('commands.code.deploy.noActiveVersion', 'No active code version found. Specify one with --code-version.'),
        );
      }
      version = activeVersion.id;
      // Update the instance config so findAndDeployCartridges uses it
      this.instance.config.codeVersion = version;
    }

    this.log(
      t('commands.code.deploy.deploying', 'Deploying {{path}} to {{hostname}} ({{version}})', {
        path: this.cartridgePath,
        hostname,
        version,
      }),
    );

    try {
      const result = await findAndDeployCartridges(this.instance, this.cartridgePath, {
        reload: this.flags.reload,
        delete: this.flags.delete,
        ...this.cartridgeOptions,
      });

      this.log(
        t('commands.code.deploy.summary', 'Deployed {{count}} cartridge(s) to {{codeVersion}}', {
          count: result.cartridges.length,
          codeVersion: result.codeVersion,
        }),
      );

      if (result.reloaded) {
        this.log(t('commands.code.deploy.reloaded', 'Code version reloaded'));
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        this.error(t('commands.code.deploy.failed', 'Deployment failed: {{message}}', {message: error.message}));
      }
      throw error;
    }
  }
}
