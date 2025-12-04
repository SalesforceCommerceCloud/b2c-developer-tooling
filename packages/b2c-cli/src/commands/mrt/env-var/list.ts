import {Flags} from '@oclif/core';
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling/cli';
import {listEnvVars, type ListEnvVarsResult, type EnvironmentVariable} from '@salesforce/b2c-tooling/operations/mrt';
import {t} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<EnvironmentVariable>> = {
  name: {
    header: 'Name',
    get: (v) => v.name,
  },
  value: {
    header: 'Value',
    get: (v) => v.value,
  },
  status: {
    header: 'Status',
    get: (v) => v.publishingStatusDescription,
  },
  updated: {
    header: 'Updated',
    get: (v) => (v.updatedAt ? new Date(v.updatedAt).toLocaleString() : '-'),
  },
};

const DEFAULT_COLUMNS = ['name', 'value', 'status', 'updated'];

/**
 * List environment variables on an MRT project environment.
 */
export default class MrtEnvVarList extends MrtCommand<typeof MrtEnvVarList> {
  static description = t(
    'commands.mrt.envVar.list.description',
    'List environment variables on a Managed Runtime environment',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project acme-storefront --environment production',
    '<%= config.bin %> <%= command.id %> -p my-project -e staging',
    '<%= config.bin %> <%= command.id %> -p my-project -e production --json',
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

  async run(): Promise<ListEnvVarsResult> {
    this.requireMrtCredentials();

    const {project, environment} = this.flags;

    this.log(
      t('commands.mrt.envVar.list.fetching', 'Listing env vars for {{project}}/{{environment}}...', {
        project,
        environment,
      }),
    );

    const result = await listEnvVars(
      {
        projectSlug: project,
        environment,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      if (result.variables.length === 0) {
        this.log(t('commands.mrt.envVar.list.empty', 'No environment variables found.'));
      } else {
        createTable(COLUMNS).render(result.variables, DEFAULT_COLUMNS);
      }
    }

    return result;
  }
}
