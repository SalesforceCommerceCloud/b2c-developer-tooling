import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling/cli';
import {t} from '../../../i18n/index.js';

/**
 * Stub command demonstrating MrtCommand usage.
 * MRT operations use API key authentication.
 */
export default class MrtEnvVarSet extends MrtCommand<typeof MrtEnvVarSet> {
  static args = {
    key: Args.string({
      description: 'Environment variable name',
      required: true,
    }),
    value: Args.string({
      description: 'Environment variable value',
      required: true,
    }),
  };

  static description = t(
    'commands.mrt.envVar.set.description',
    'Set an environment variable on a Managed Runtime project',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %> MY_VAR "my value" --project acme-storefront --environment production',
  ];

  static flags = {
    project: Flags.string({
      description: 'MRT project ID',
      required: true,
    }),
    environment: Flags.string({
      char: 'e',
      description: 'Target environment',
      required: true,
    }),
  };

  async run(): Promise<void> {
    this.requireMrtCredentials();

    const key = this.args.key;
    const value = this.args.value;
    const project = this.flags.project;
    const environment = this.flags.environment;

    this.log(
      t('commands.mrt.envVar.set.setting', 'Setting {{key}} on {{project}}/{{environment}}...', {
        key,
        project,
        environment,
      }),
    );

    // TODO: Implement actual MRT API call using this.createMrtClient()

    this.log('');
    this.log(t('commands.mrt.envVar.set.stub', '(stub) Environment variable setting not yet implemented'));
    this.log(t('commands.mrt.envVar.set.wouldSet', 'Would set {{key}}={{value}}', {key, value}));
    this.log(t('commands.mrt.envVar.set.project', 'Project: {{project}}', {project}));
    this.log(t('commands.mrt.envVar.set.environment', 'Environment: {{environment}}', {environment}));
  }
}
