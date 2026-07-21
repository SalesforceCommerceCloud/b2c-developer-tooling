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
  categoriesForWorkspace,
  resolveEnabledCategories,
  DOC_CATEGORIES,
  type DocCategory,
  type SearchResult,
  type DocEntry,
} from '@salesforce/b2c-tooling-sdk/docs';
import {detectWorkspaceType, PROJECT_TYPES, type ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';
import {t} from '../../i18n/index.js';
import {resolveDocsWorkspace} from '../../utils/docs/workspace.js';

interface SearchDocsResponse {
  query?: string;
  category?: string;
  workspace?: ProjectType[];
  total: number;
  offset: number;
  results: SearchResult[];
  truncated?: boolean;
  nextOffset?: number;
}

interface ListDocsResponse {
  entries: DocEntry[];
}

/**
 * The `--workspace` sentinels plus every concrete workspace marker (from the
 * SDK's canonical {@link PROJECT_TYPES}). `auto` forces detection, `all` opts
 * out, or name one or more concrete types (comma-separated). Used for help text
 * and validation. Not passed as oclif `options`, since that would reject a
 * comma-separated value before we can split it.
 */
const WORKSPACE_FLAG_VALUES = ['auto', 'all', ...PROJECT_TYPES] as const;

/**
 * All valid documentation categories, for --category validation and help text.
 * Sourced from the SDK's canonical list so the CLI never drifts from it.
 */
const VALID_CATEGORIES: readonly DocCategory[] = DOC_CATEGORIES;

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
  sourceUrl: {
    header: 'Source URL',
    get: (r) => r.entry.sourceUrl ?? '',
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
    '<%= config.bin %> <%= command.id %> "passwordless login" --limit 5 --offset 5',
    '<%= config.bin %> <%= command.id %> --list --category tooling',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of results to display',
      default: 20,
    }),
    offset: Flags.integer({
      char: 'o',
      description: 'Number of ranked results to skip (for pagination)',
      default: 0,
      min: 0,
    }),
    list: Flags.boolean({
      description: 'List all available documentation entries',
      default: false,
    }),
    category: Flags.string({
      char: 'c',
      description: 'Restrict results to a documentation category',
      options: [...VALID_CATEGORIES],
    }),
    topics: Flags.string({
      description:
        'Limit the available documentation to these categories (comma-separated allowlist that bounds the ' +
        'whole corpus). --category and --workspace narrow within it. Unknown names are ignored with a warning.',
      env: 'SFCC_DOCS_TOPICS',
    }),
    workspace: Flags.string({
      // No oclif `options` here: it validates the whole value, so it would reject
      // a comma-separated list like "cartridges,sfra". Validation happens in
      // resolveWorkspace instead (unknown names warn, like --topics).
      description:
        `Favor docs for a workspace type (${WORKSPACE_FLAG_VALUES.join('|')}). Defaults to auto-detecting; ` +
        '"all" applies no preference; "auto" forces detection; or name one or more types (comma-separated).',
    }),
    // `-c` is used by --category above, so omit the default short flag on --columns.
    ...columnFlagsFor(COLUMNS, {columnsChar: false}),
  };

  protected operations = {
    detectWorkspaceType,
    listDocs,
    searchDocs,
  };

  async run(): Promise<ListDocsResponse | SearchDocsResponse> {
    const {query} = this.args;
    const {limit, list, category, offset} = this.flags;
    const resultLimit = limit ?? 20;
    const resultOffset = offset ?? 0;
    // Allowlist that bounds the whole corpus. Precedence: --topics /
    // SFCC_DOCS_TOPICS flag first, else the resolved config's `docsCategories`
    // (dw.json `docs-categories`, SFCC_DOCS_CATEGORIES, package.json).
    const topicsInput = this.flags.topics ?? this.resolvedConfig?.values.docsCategories;
    const enabledCategories = resolveEnabledCategories(topicsInput, (invalid) =>
      this.warn(
        t('commands.docs.search.invalidTopics', 'Ignoring unknown documentation topic(s): {{topics}}', {
          topics: invalid.join(', '),
        }),
      ),
    );

    // List mode
    if (list) {
      // Listing does not auto-detect: a workspace narrows the listing only when
      // the flag is explicitly given (matches the MCP docs_list behavior, where
      // an unset workspace lists everything). Explicit category still wins.
      const listWorkspace =
        this.flags.workspace && this.flags.workspace !== 'all'
          ? await this.resolveWorkspace(this.flags.workspace)
          : undefined;
      const listFilter: DocCategory | DocCategory[] | undefined =
        (category as DocCategory | undefined) ?? (listWorkspace ? categoriesForWorkspace(listWorkspace) : undefined);
      const entries = this.operations.listDocs(listFilter, enabledCategories);

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

    // Workspace awareness is on by default for search (unset -> auto-detect).
    const workspace = await this.resolveWorkspace(this.flags.workspace);

    // searchDocs returns top-N hits. Retrieve the complete ranked set so the
    // CLI can expose total count and offset-based pagination.
    const ranked = this.operations.searchDocs(query, {
      limit: Number.MAX_SAFE_INTEGER,
      category: category as DocCategory | undefined,
      workspace,
      enabledCategories,
    });
    const results = ranked.slice(resultOffset, resultOffset + resultLimit);
    const end = resultOffset + results.length;
    const truncated = end < ranked.length;

    const response: SearchDocsResponse = {
      query,
      ...(category && {category}),
      ...(workspace && {workspace}),
      total: ranked.length,
      offset: resultOffset,
      results,
      ...(truncated && {truncated: true, nextOffset: end}),
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
      t('commands.docs.search.resultCount', 'Showing {{count}} of {{total}} matches for "{{query}}"', {
        count: results.length,
        total: ranked.length,
        query,
      }),
    );

    return response;
  }

  /**
   * Resolves the --workspace flag to concrete project type(s). Shared with
   * `docs read` via {@link resolveDocsWorkspace} so both apply the same
   * workspace-aware ranking.
   */
  private resolveWorkspace(value: string | undefined): Promise<ProjectType[] | undefined> {
    return resolveDocsWorkspace(value, this.operations.detectWorkspaceType, this.logger, this.warn.bind(this));
  }
}
