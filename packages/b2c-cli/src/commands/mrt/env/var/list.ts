/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  listEnvVars,
  type ListEnvVarsResult,
  type EnvironmentVariable,
} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t} from '../../../../i18n/index.js';

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
    'commands.mrt.env.var.list.description',
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
  };

  async run(): Promise<ListEnvVarsResult> {
    this.requireMrtCredentials();

    const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }
    if (!environment) {
      this.error(
        'MRT environment is required. Provide --environment flag, set SFCC_MRT_ENVIRONMENT, or set mrtEnvironment in dw.json.',
      );
    }

    this.log(
      t('commands.mrt.env.var.list.fetching', 'Listing env vars for {{project}}/{{environment}}...', {
        project,
        environment,
      }),
    );

    const result = await listEnvVars(
      {
        projectSlug: project,
        environment,
        origin: this.resolvedConfig.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      if (result.variables.length === 0) {
        this.log(t('commands.mrt.env.var.list.empty', 'No environment variables found.'));
      } else {
        createTable(COLUMNS).render(result.variables, DEFAULT_COLUMNS);
      }
    }

    return result;
  }
}
