/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {
  BaseCommand,
  TableRenderer,
  columnFlagsFor,
  selectColumns,
  type ColumnDef,
} from '@salesforce/b2c-tooling-sdk/cli';
import {
  searchDocs,
  listDocs,
  type DocCategory,
  type SearchResult,
  type DocEntry,
} from '@salesforce/b2c-tooling-sdk/docs';
import {t} from '../../i18n/index.js';

interface SearchDocsResponse {
  query?: string;
  category?: string;
  results: SearchResult[];
}

interface ListDocsResponse {
  entries: DocEntry[];
}

/** All valid documentation categories, for --category validation and help text. */
const VALID_CATEGORIES: DocCategory[] = [
  'script-api',
  'job-step',
  'commerce-api',
  'pwa-kit-managed-runtime',
  'sfnext',
  'sfra',
  'b2c-commerce',
  'tooling',
];

const COLUMNS: Record<string, ColumnDef<SearchResult>> = {
  id: {
    header: 'ID',
    get: (r) => r.entry.id,
  },
  title: {
    header: 'Title',
    get: (r) => r.entry.title,
  },
  category: {
    header: 'Category',
    get: (r) => r.entry.category ?? '',
  },
  summary: {
    header: 'Summary',
    get: (r) => r.entry.summary ?? r.entry.preview ?? '',
  },
  keywords: {
    header: 'Keywords',
    get: (r) => (r.entry.keywords ?? []).join(', '),
  },
  url: {
    header: 'URL',
    get: (r) => r.entry.url ?? '',
  },
  score: {
    header: 'Match',
    // Higher is better (MiniSearch). Show the raw relevance score rounded.
    get: (r) => r.score.toFixed(1),
  },
};

const DEFAULT_COLUMNS = ['id', 'category', 'title', 'score'];

const tableRenderer = new TableRenderer(COLUMNS);

export default class DocsSearch extends BaseCommand<typeof DocsSearch> {
  static args = {
    query: Args.string({
      description: 'Search query (matches title, headings, keywords across all documentation corpora)',
      required: false,
    }),
  };

  static description = t('commands.docs.search.description', 'Search B2C Commerce documentation');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> ProductMgr',
    '<%= config.bin %> <%= command.id %> "passwordless login" --category commerce-api',
    '<%= config.bin %> <%= command.id %> "storefront next getting started" --category sfnext',
    '<%= config.bin %> <%= command.id %> status --limit 5',
    '<%= config.bin %> <%= command.id %> --list --category tooling',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of results to display',
      default: 20,
    }),
    list: Flags.boolean({
      description: 'List all available documentation entries',
      default: false,
    }),
    category: Flags.string({
      char: 'c',
      description: 'Restrict results to a documentation category',
      options: VALID_CATEGORIES,
    }),
    // `-c` is used by --category above, so omit the default short flag on --columns.
    ...columnFlagsFor(COLUMNS, {columnsChar: false}),
  };

  protected operations = {
    listDocs,
    searchDocs,
  };

  async run(): Promise<ListDocsResponse | SearchDocsResponse> {
    const {query} = this.args;
    const {limit, list, category} = this.flags;

    // List mode
    if (list) {
      const entries = this.operations.listDocs(category as DocCategory | undefined);

      if (this.jsonEnabled()) {
        return {entries};
      }

      // Convert to search results for table rendering
      const results: SearchResult[] = entries.map((entry) => ({
        entry,
        score: 0,
      }));

      const listColumns: Record<string, ColumnDef<SearchResult>> = {
        id: COLUMNS.id,
        category: COLUMNS.category,
        title: COLUMNS.title,
      };

      new TableRenderer(listColumns).render(results, ['id', 'category', 'title']);

      this.log(
        t('commands.docs.search.totalCount', '{{count}} documentation entries available', {count: entries.length}),
      );

      return {entries};
    }

    // Search mode requires query
    if (!query) {
      this.error(
        t('commands.docs.search.queryRequired', 'Query is required for search. Use --list to see all entries.'),
      );
    }

    const results = this.operations.searchDocs(query, {
      limit,
      category: category as DocCategory | undefined,
    });

    const response: SearchDocsResponse = {
      query,
      ...(category && {category}),
      results,
    };

    if (this.jsonEnabled()) {
      return response;
    }

    if (results.length === 0) {
      ux.stdout(t('commands.docs.search.noResults', 'No documentation found matching: {{query}}', {query}));
      return response;
    }

    tableRenderer.render(results, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    this.log(
      t('commands.docs.search.resultCount', 'Found {{count}} matches for "{{query}}"', {
        count: results.length,
        query,
      }),
    );

    return response;
  }
}
