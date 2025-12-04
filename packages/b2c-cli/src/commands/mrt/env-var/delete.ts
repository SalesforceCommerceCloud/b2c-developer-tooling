import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling/cli';
import {deleteEnvVar} from '@salesforce/b2c-tooling/operations/mrt';
import {t} from '../../../i18n/index.js';

/**
 * Delete an environment variable from an MRT project environment.
 */
export default class MrtEnvVarDelete extends MrtCommand<typeof MrtEnvVarDelete> {
  static args = {
    key: Args.string({
      description: 'Environment variable name',
      required: true,
    }),
  };

  static description = t(
    'commands.mrt.envVar.delete.description',
    'Delete an environment variable from a Managed Runtime environment',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> MY_VAR --project acme-storefront --environment production',
    '<%= config.bin %> <%= command.id %> OLD_API_KEY -p my-project -e staging',
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

    const {key} = this.args;
    const {project, environment} = this.flags;

    await deleteEnvVar(
      {
        projectSlug: project,
        environment,
        key,
      },
      this.getMrtAuth(),
    );

    this.log(
      t('commands.mrt.envVar.delete.success', 'Deleted {{key}} from {{project}}/{{environment}}', {
        key,
        project,
        environment,
      }),
    );

    return {key, project, environment};
  }
}
