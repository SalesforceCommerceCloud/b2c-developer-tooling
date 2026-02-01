/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BaseCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {createScaffoldRegistry, type Scaffold, type ScaffoldCategory} from '@salesforce/b2c-tooling-sdk/scaffold';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Response type for the search command.
 */
interface ScaffoldSearchResponse {
  query: string;
  count: number;
  data: Array<{
    id: string;
    displayName: string;
    description: string;
    category: ScaffoldCategory;
    source: string;
    tags?: string[];
  }>;
}

const COLUMNS: Record<string, ColumnDef<Scaffold>> = {
  id: {
    header: 'ID',
    get: (s) => s.id,
  },
  displayName: {
    header: 'Name',
    get: (s) => s.manifest.displayName,
  },
  category: {
    header: 'Category',
    get: (s) => s.manifest.category,
  },
  source: {
    header: 'Source',
    get: (s) => s.source,
  },
  description: {
    header: 'Description',
    get: (s) => s.manifest.description,
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['id', 'displayName', 'category', 'description'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to search available scaffolds.
 */
export default class ScaffoldSearch extends BaseCommand<typeof ScaffoldSearch> {
  static args = {
    query: Args.string({
      description: 'Search query (matches name, description, and tags)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.scaffold.search.description', 'Search for scaffolds by name, description, or tags'),
    '/cli/scaffold.html#b2c-scaffold-search',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> controller',
    '<%= config.bin %> <%= command.id %> api',
    '<%= config.bin %> <%= command.id %> hook --category cartridge',
    '<%= config.bin %> <%= command.id %> job --json',
  ];

  static flags = {
    category: Flags.string({
      char: 'c',
      description: 'Filter results by category',
      options: ['cartridge', 'custom-api', 'page-designer', 'job', 'metadata'],
    }),
  };

  async run(): Promise<ScaffoldSearchResponse> {
    const {query} = this.args;
    const registry = createScaffoldRegistry();
    const category = this.flags.category as ScaffoldCategory | undefined;

    const scaffolds = await registry.searchScaffolds(query, {
      category,
      projectRoot: process.cwd(),
    });

    const response: ScaffoldSearchResponse = {
      query,
      count: scaffolds.length,
      data: scaffolds.map((s) => ({
        id: s.id,
        displayName: s.manifest.displayName,
        description: s.manifest.description,
        category: s.manifest.category,
        source: s.source,
        tags: s.manifest.tags,
      })),
    };

    if (this.jsonEnabled()) {
      return response;
    }

    if (scaffolds.length === 0) {
      this.log(t('commands.scaffold.search.noResults', 'No scaffolds found matching "{{query}}"', {query}));
      return response;
    }

    this.log(
      t('commands.scaffold.search.foundScaffolds', 'Found {{count}} scaffold(s) matching "{{query}}":', {
        count: scaffolds.length,
        query,
      }),
    );
    this.log('');

    tableRenderer.render(scaffolds, DEFAULT_COLUMNS);

    this.log('');
    this.log(t('commands.scaffold.search.hint', 'Use "b2c scaffold info <id>" for more details'));

    return response;
  }
}
