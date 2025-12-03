import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling/cli';
import {setEnvVar} from '@salesforce/b2c-tooling/operations/mrt';
import {t} from '../../../i18n/index.js';

/**
 * Set an environment variable on an MRT project environment.
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
    'Set an environment variable on a Managed Runtime environment',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> MY_VAR "my value" --project acme-storefront --environment production',
    '<%= config.bin %> <%= command.id %> API_KEY "secret123" -p my-project -e staging',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    project: Flags.string({
      char: 'p',
      description: 'MRT project slug',
      required: true,
    }),
    environment: Flags.string({
      char: 'e',
      description: 'Target environment (e.g., staging, production)',
      required: true,
    }),
  };

  async run(): Promise<{key: string; project: string; environment: string}> {
    this.requireMrtCredentials();

    const {key, value} = this.args;
    const {project, environment} = this.flags;

    await setEnvVar(
      {
        projectSlug: project,
        environment,
        key,
        value,
      },
      this.getMrtAuth(),
    );

    this.log(t('commands.mrt.envVar.set.success', 'Set {{key}} on {{project}}/{{environment}}', {
      key,
      project,
      environment,
    }));

    return {key, project, environment};
  }
}
