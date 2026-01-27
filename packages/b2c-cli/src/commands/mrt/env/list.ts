/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {listEnvs, type ListEnvsResult, type MrtEnvironment} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtEnvironment>> = {
  name: {
    header: 'Name',
    get: (env) => env.name,
  },
  slug: {
    header: 'Slug',
    get: (env) => env.slug ?? '',
  },
  state: {
    header: 'State',
    get: (env) => env.state ?? '-',
  },
  region: {
    header: 'Region',
    get: (env) => env.ssr_region ?? '-',
  },
  production: {
    header: 'Prod',
    get: (env) => (env.is_production ? 'Yes' : 'No'),
  },
};

const DEFAULT_COLUMNS = ['name', 'slug', 'state', 'region', 'production'];

/**
 * List environments (targets) for an MRT project.
 */
export default class MrtEnvList extends MrtCommand<typeof MrtEnvList> {
  static description = withDocs(
    t('commands.mrt.env.list.description', 'List Managed Runtime environments'),
    '/cli/mrt.html#b2c-mrt-env-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-storefront',
    '<%= config.bin %> <%= command.id %> -p my-storefront --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  async run(): Promise<ListEnvsResult> {
    this.requireMrtCredentials();

    const {mrtProject: project} = this.resolvedConfig.values;

    if (!project) {
      this.error(
        'MRT project is required. Provide --project flag, set SFCC_MRT_PROJECT, or set mrtProject in dw.json.',
      );
    }

    this.log(t('commands.mrt.env.list.fetching', 'Fetching environments for {{project}}...', {project}));

    const result = await listEnvs(
      {
        projectSlug: project,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      if (result.environments.length === 0) {
        this.log(t('commands.mrt.env.list.empty', 'No environments found.'));
      } else {
        this.log(
          t('commands.mrt.env.list.count', 'Found {{count}} environment(s):', {count: result.environments.length}),
        );
        createTable(COLUMNS).render(result.environments, DEFAULT_COLUMNS);
      }
    }

    return result;
  }
}
