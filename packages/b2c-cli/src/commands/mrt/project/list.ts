/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {listProjects, type ListProjectsResult, type MrtProject} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<MrtProject>> = {
  name: {
    header: 'Name',
    get: (proj) => proj.name,
  },
  slug: {
    header: 'Slug',
    get: (proj) => proj.slug ?? '',
  },
  organization: {
    header: 'Organization',
    get: (proj) => proj.organization,
  },
  region: {
    header: 'Region',
    get: (proj) => proj.ssr_region ?? '-',
  },
  created: {
    header: 'Created',
    get: (proj) => (proj.created_at ? new Date(proj.created_at).toLocaleDateString() : '-'),
  },
};

const DEFAULT_COLUMNS = ['name', 'slug', 'organization', 'region'];

/**
 * List MRT projects accessible to the authenticated user.
 */
export default class MrtProjectList extends MrtCommand<typeof MrtProjectList> {
  static description = withDocs(
    t('commands.mrt.project.list.description', 'List Managed Runtime projects'),
    '/cli/mrt.html#b2c-mrt-project-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --organization my-org',
    '<%= config.bin %> <%= command.id %> --limit 10',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    organization: Flags.string({
      char: 'o',
      description: 'Filter by organization slug',
    }),
    limit: Flags.integer({
      description: 'Maximum number of results to return',
    }),
    offset: Flags.integer({
      description: 'Offset for pagination',
    }),
  };

  async run(): Promise<ListProjectsResult> {
    this.requireMrtCredentials();

    const {organization, limit, offset} = this.flags;

    this.log(t('commands.mrt.project.list.fetching', 'Fetching projects...'));

    const result = await listProjects(
      {
        organization,
        limit,
        offset,
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      if (result.projects.length === 0) {
        this.log(t('commands.mrt.project.list.empty', 'No projects found.'));
      } else {
        this.log(t('commands.mrt.project.list.count', 'Found {{count}} project(s):', {count: result.count}));
        createTable(COLUMNS).render(result.projects, DEFAULT_COLUMNS);
      }
    }

    return result;
  }
}
