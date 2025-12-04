import {Args, Flags} from '@oclif/core';
import {MrtCommand} from '@salesforce/b2c-tooling/cli';
import {setEnvVars} from '@salesforce/b2c-tooling/operations/mrt';
import {t} from '../../../i18n/index.js';

/**
 * Set environment variables on an MRT project environment.
 */
export default class MrtEnvVarSet extends MrtCommand<typeof MrtEnvVarSet> {
  static args = {
    variables: Args.string({
      description: 'Environment variables in KEY=value format',
      required: true,
    }),
  };

  static description = t(
    'commands.mrt.envVar.set.description',
    'Set environment variables on a Managed Runtime environment',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> MY_VAR=value --project acme-storefront --environment production',
    '<%= config.bin %> <%= command.id %> API_KEY=secret DEBUG=true -p my-project -e staging',
    '<%= config.bin %> <%= command.id %> "MESSAGE=hello world" -p my-project -e production',
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

  // Allow multiple arguments
  static strict = false;

  async run(): Promise<{variables: Record<string, string>; project: string; environment: string}> {
    this.requireMrtCredentials();

    const {argv} = await this.parse(MrtEnvVarSet);
    const {project, environment} = this.flags;

    // Parse KEY=value arguments
    const variables: Record<string, string> = {};
    const keys: string[] = [];

    for (const arg of argv as string[]) {
      const eqIndex = arg.indexOf('=');
      if (eqIndex === -1) {
        this.error(t('commands.mrt.envVar.set.invalidFormat', 'Invalid format: {{arg}}. Use KEY=value format.', {arg}));
      }

      const key = arg.slice(0, eqIndex);
      const value = arg.slice(eqIndex + 1);

      if (!key) {
        this.error(t('commands.mrt.envVar.set.emptyKey', 'Empty key in: {{arg}}', {arg}));
      }

      variables[key] = value;
      keys.push(key);
    }

    if (keys.length === 0) {
      this.error(t('commands.mrt.envVar.set.noVariables', 'No environment variables provided. Use KEY=value format.'));
    }

    await setEnvVars(
      {
        projectSlug: project,
        environment,
        variables,
      },
      this.getMrtAuth(),
    );

    if (keys.length === 1) {
      this.log(
        t('commands.mrt.envVar.set.successSingle', 'Set {{key}} on {{project}}/{{environment}}', {
          key: keys[0],
          project,
          environment,
        }),
      );
    } else {
      this.log(
        t('commands.mrt.envVar.set.successMultiple', 'Set {{count}} variables on {{project}}/{{environment}}', {
          count: keys.length,
          project,
          environment,
        }),
      );
    }

    return {variables, project, environment};
  }
}
