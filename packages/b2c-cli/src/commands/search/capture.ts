/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Flags, ux} from '@oclif/core';
import {ERROR_CODE, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {getGuestToken} from '@salesforce/b2c-tooling-sdk/slas';
import {
  captureProductSearch,
  checkRefinements,
  DEFAULT_CAPTURE_LIMIT,
  MAX_CAPTURE_LIMIT,
  MAX_REFINEMENTS,
  normalizeQueries,
  parseQueryFile,
  priceOrderOf,
  type SearchCapture,
  type SearchCaptureEntry,
} from '@salesforce/b2c-tooling-sdk/operations/search';
import {ShopperSearchCommand} from '../../utils/search/shopper.js';
import {readTextInput} from '../../utils/slas/client.js';
import {t, withDocs} from '../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<SearchCaptureEntry>> = {
  query: {header: 'Query', get: (e) => e.query},
  status: {header: 'Status', get: (e) => String(e.status)},
  total: {header: 'Total', get: (e) => (e.total === undefined ? '-' : String(e.total))},
  hits: {header: 'Hits', get: (e) => String(e.hits.length)},
  mode: {header: 'Served by', get: (e) => e.effectiveSearchMode ?? '-'},
  prices: {header: 'Price order', get: (e) => priceOrderOf(e.hits) ?? '-'},
  top: {header: 'Top hit', get: (e) => e.hits[0]?.productId ?? '-'},
  latency: {header: 'ms', get: (e) => String(e.latencyMs)},
  error: {header: 'Error', get: (e) => e.error ?? ''},
};

const tableRenderer = new TableRenderer(COLUMNS);

export default class SearchCaptureCommand extends ShopperSearchCommand<typeof SearchCaptureCommand> {
  static description = withDocs(
    t(
      'commands.search.capture.description',
      'Capture Shopper Search product search results for a list of queries\n\nRuns each query through the Shopper Search productSearch API with a SLAS guest token and records the ranked hits with their prices, totals, refinements with their hit counts, sorting options and the search mode that served each request. A sort and refinements, when given, apply to every query. Compare two captures with `search diff`.',
    ),
    '/cli/search.html#b2c-search-capture',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --short-code kv7kzm78 --site-id RefArch --slas-client-id my-client --query shirt --query "red dress"',
    '<%= config.bin %> <%= command.id %> --site-id RefArch --slas-client-id my-client --queries-file queries.txt --search-mode lexical --output lexical.json',
    '<%= config.bin %> <%= command.id %> --site-id RefArch --slas-client-id my-client --queries-file queries.txt --search-mode semantic --output semantic.json',
    '<%= config.bin %> <%= command.id %> --site-id RefArch --slas-client-id my-client --slas-client-secret sk_xxx --queries-file queries.txt --label before --json',
    '<%= config.bin %> <%= command.id %> --site-id RefArch --slas-client-id my-client --queries-file queries.txt --sort price-low-to-high --output price-asc.json',
    '<%= config.bin %> <%= command.id %> --site-id RefArch --slas-client-id my-client --queries-file queries.txt --refine c_refinementColor=blue --refine "price=(0..50)" --output blue.json',
  ];

  static flags = {
    ...ShopperSearchCommand.baseFlags,
    query: Flags.string({
      char: 'q',
      description: 'Search query to capture (repeatable)',
      multiple: true,
      multipleNonGreedy: true,
      helpGroup: 'SEARCH',
    }),
    'queries-file': Flags.string({
      description: 'File with one query per line; blank lines and # comments are skipped (use - for stdin)',
      helpGroup: 'SEARCH',
    }),
    limit: Flags.integer({
      description: `Hits to capture per query (1-${MAX_CAPTURE_LIMIT})`,
      default: DEFAULT_CAPTURE_LIMIT,
      min: 1,
      max: MAX_CAPTURE_LIMIT,
      helpGroup: 'SEARCH',
    }),
    'search-mode': Flags.string({
      description:
        'Search engine to request: semantic (Agentic Commerce Search) or lexical (native search). Omit to use the site default',
      options: ['semantic', 'lexical'],
      helpGroup: 'SEARCH',
    }),
    sort: Flags.string({
      description: 'ID of the sorting option to sort by, for example price-low-to-high. Omit to use the default sort',
      helpGroup: 'SEARCH',
    }),
    refine: Flags.string({
      description: `Refinement to apply to every query, as attribute=value, for example brand=Acme or "price=(0..50)" (repeatable, at most ${MAX_REFINEMENTS})`,
      multiple: true,
      multipleNonGreedy: true,
      helpGroup: 'SEARCH',
    }),
    locale: Flags.string({description: 'Locale to search in, for example en-US', helpGroup: 'SEARCH'}),
    currency: Flags.string({description: 'Currency for prices, for example USD', helpGroup: 'SEARCH'}),
    label: Flags.string({
      description: 'Label stored in the capture and shown by search diff (default: the search mode, or "capture")',
      helpGroup: 'SEARCH',
    }),
    output: Flags.string({char: 'o', description: 'Write the capture JSON to this file'}),
  };

  protected operations = {captureProductSearch, getGuestToken};

  async run(): Promise<SearchCapture> {
    const queries = await this.collectQueries();
    if (queries.length === 0) {
      this.error(t('commands.search.capture.noQueries', 'Provide at least one query with --query or --queries-file.'), {
        code: ERROR_CODE.VALIDATION,
      });
    }

    const sort = this.flags.sort as string | undefined;
    const refine = (this.flags.refine as string[] | undefined) ?? [];
    try {
      checkRefinements(refine);
    } catch (error) {
      this.error((error as Error).message, {code: ERROR_CODE.VALIDATION});
    }

    const {client, organizationId, shortCode, siteId} = await this.connectShopperSearch();
    const searchMode = this.flags['search-mode'] as 'lexical' | 'semantic' | undefined;
    const {limit} = this.flags;

    if (!this.jsonEnabled()) {
      const settings = [
        t('commands.search.capture.settingMode', 'search mode: {{mode}}', {mode: searchMode ?? 'site default'}),
        ...(sort ? [t('commands.search.capture.settingSort', 'sort: {{sort}}', {sort})] : []),
        ...(refine.length > 0
          ? [t('commands.search.capture.settingRefine', 'refinements: {{refine}}', {refine: refine.join(', ')})]
          : []),
      ];
      this.log(
        t(
          'commands.search.capture.capturing',
          'Running {{count}} search request(s) on site {{siteId}} ({{settings}})...',
          {
            count: queries.length,
            siteId,
            settings: settings.join('; '),
          },
        ),
      );
    }

    const capture = await this.operations.captureProductSearch(client, {
      organizationId,
      siteId,
      shortCode,
      queries,
      limit,
      searchMode,
      locale: this.flags.locale,
      currency: this.flags.currency,
      sort,
      refine,
      label: this.flags.label,
    });

    if (this.flags.output) {
      fs.writeFileSync(this.flags.output, JSON.stringify(capture, null, 2) + '\n');
    }

    const failed = capture.results.filter((entry) => entry.error !== undefined);
    if (failed.length === capture.results.length) {
      const [first] = failed;
      this.error(
        t(
          'commands.search.capture.allFailed',
          'All {{count}} search request(s) failed. First error (HTTP {{status}}): {{message}}',
          {
            count: failed.length,
            status: first.status,
            message: first.error,
          },
        ),
      );
    }

    if (this.jsonEnabled()) return capture;

    const columns = ['query', 'status', 'total', 'hits', 'mode', ...(sort ? ['prices'] : []), 'top', 'latency'];
    if (failed.length > 0) columns.push('error');
    tableRenderer.render(capture.results, columns);

    if (failed.length > 0) {
      this.warn(
        t('commands.search.capture.someFailed', '{{failed}} of {{count}} search request(s) failed.', {
          failed: failed.length,
          count: capture.results.length,
        }),
      );
    }
    if (this.flags.output) {
      ux.stdout(t('commands.search.capture.wrote', 'Wrote {{file}}', {file: this.flags.output}));
    }
    return capture;
  }

  private async collectQueries(): Promise<string[]> {
    const queries = [...((this.flags.query as string[] | undefined) ?? [])];
    const file = this.flags['queries-file'] as string | undefined;
    if (file) {
      let content: string;
      try {
        content = await readTextInput(file);
      } catch (error) {
        this.error(
          t('commands.search.capture.readError', 'Could not read queries file {{file}}: {{message}}', {
            file,
            message: (error as Error).message,
          }),
          {code: ERROR_CODE.VALIDATION},
        );
      }
      queries.push(...parseQueryFile(content));
    }
    return normalizeQueries(queries);
  }
}
