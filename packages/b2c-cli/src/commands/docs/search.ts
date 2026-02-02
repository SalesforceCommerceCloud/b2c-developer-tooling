/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {BaseCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {searchDocs, listDocs, type SearchResult, type DocEntry} from '@salesforce/b2c-tooling-sdk/docs';
import {t} from '../../i18n/index.js';

interface SearchDocsResponse {
  query?: string;
  results: SearchResult[];
}

interface ListDocsResponse {
  entries: DocEntry[];
}

const COLUMNS: Record<string, ColumnDef<SearchResult>> = {
  id: {
    header: 'ID',
    get: (r) => r.entry.id,
  },
  title: {
    header: 'Title',
    get: (r) => r.entry.title,
  },
  score: {
    header: 'Match',
    get(r) {
      // Convert score to percentage (lower is better in Fuse.js)
      const percent = Math.round((1 - r.score) * 100);
      return `${percent}%`;
    },
  },
};

const DEFAULT_COLUMNS = ['id', 'title', 'score'];

export default class DocsSearch extends BaseCommand<typeof DocsSearch> {
  static args = {
    query: Args.string({
      description: 'Search query (fuzzy match against class/module names)',
      required: false,
    }),
  };

  static description = t('commands.docs.search.description', 'Search Script API documentation');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> ProductMgr',
    '<%= config.bin %> <%= command.id %> "catalog product"',
    '<%= config.bin %> <%= command.id %> status --limit 5',
    '<%= config.bin %> <%= command.id %> --list',
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
  };

  protected operations = {
    listDocs,
    searchDocs,
  };

  async run(): Promise<ListDocsResponse | SearchDocsResponse> {
    const {query} = this.args;
    const {limit, list} = this.flags;

    // List mode
    if (list) {
      const entries = this.operations.listDocs();

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
        title: COLUMNS.title,
      };

      createTable(listColumns).render(results, ['id', 'title']);

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

    const results = this.operations.searchDocs(query, limit);

    const response: SearchDocsResponse = {
      query,
      results,
    };

    if (this.jsonEnabled()) {
      return response;
    }

    if (results.length === 0) {
      ux.stdout(t('commands.docs.search.noResults', 'No documentation found matching: {{query}}', {query}));
      return response;
    }

    createTable(COLUMNS).render(results, DEFAULT_COLUMNS);

    this.log(
      t('commands.docs.search.resultCount', 'Found {{count}} matches for "{{query}}"', {
        count: results.length,
        query,
      }),
    );

    return response;
  }
}
