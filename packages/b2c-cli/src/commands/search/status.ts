/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {ERROR_CODE, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {getGuestToken} from '@salesforce/b2c-tooling-sdk/slas';
import {
  checkSearchModes,
  MAX_STATUS_QUERIES,
  normalizeQueries,
  type AgenticCommerceSearchState,
  type SearchModeProbe,
  type SearchModeStatus,
} from '@salesforce/b2c-tooling-sdk/operations/search';
import {ShopperSearchCommand} from '../../utils/search/shopper.js';
import {t, withDocs} from '../../i18n/index.js';

const COLUMNS: Record<string, ColumnDef<SearchModeProbe>> = {
  query: {header: 'Query', get: (p) => p.query},
  requested: {header: 'Requested', get: (p) => p.requested},
  status: {header: 'Status', get: (p) => String(p.status)},
  mode: {header: 'Served by', get: (p) => p.effectiveSearchMode ?? '-'},
  total: {header: 'Total', get: (p) => (p.total === undefined ? '-' : String(p.total))},
  latency: {header: 'ms', get: (p) => String(p.latencyMs)},
  error: {header: 'Error', get: (p) => p.error ?? ''},
};

const tableRenderer = new TableRenderer(COLUMNS);

const STATE_LABELS: Record<AgenticCommerceSearchState, string> = {
  'not-serving': 'not serving',
  serving: 'serving',
  unknown: 'unknown',
};

export default class SearchStatusCommand extends ShopperSearchCommand<typeof SearchStatusCommand> {
  static description = withDocs(
    t(
      'commands.search.status.description',
      'Check whether Agentic Commerce Search is serving a site\n\nSends each query to the Shopper Search productSearch API three times, without a search mode, as lexical and as semantic, and reports the search engine that served each request. Reports whether Agentic Commerce Search is serving the site and which engine serves requests without a search mode, which is what shoppers on the storefront get. Use multi-word queries that shoppers type: single-word lookups can fall back to lexical search even when Agentic Commerce Search is on.',
    ),
    '/cli/search.html#b2c-search-status',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id abcd_123 --short-code kv7kzm78 --site-id RefArch --slas-client-id my-client --query "red dress" --query "leather ankle boots"',
    '<%= config.bin %> <%= command.id %> --site-id RefArch --slas-client-id my-client -q "wool winter coat" -q "running shoes for women"',
    '<%= config.bin %> <%= command.id %> --site-id RefArch --slas-client-id my-client --slas-client-secret sk_xxx --query "red dress" --locale en-US --currency USD --json',
  ];

  static flags = {
    ...ShopperSearchCommand.baseFlags,
    query: Flags.string({
      char: 'q',
      description: `Search query to check (repeatable, 1-${MAX_STATUS_QUERIES}). Use multi-word queries that shoppers type`,
      multiple: true,
      multipleNonGreedy: true,
      helpGroup: 'SEARCH',
    }),
    locale: Flags.string({description: 'Locale to search in, for example en-US', helpGroup: 'SEARCH'}),
    currency: Flags.string({description: 'Currency for prices, for example USD', helpGroup: 'SEARCH'}),
  };

  protected operations = {checkSearchModes, getGuestToken};

  async run(): Promise<SearchModeStatus> {
    const queries = normalizeQueries((this.flags.query as string[] | undefined) ?? []);
    if (queries.length === 0) {
      this.error(
        t(
          'commands.search.status.noQueries',
          'Provide one to {{max}} queries with --query. Use queries of several words that shoppers type, such as "red dress": single-word lookups can fall back to lexical search even when Agentic Commerce Search is on.',
          {max: MAX_STATUS_QUERIES},
        ),
        {code: ERROR_CODE.VALIDATION},
      );
    }
    if (queries.length > MAX_STATUS_QUERIES) {
      this.error(
        t('commands.search.status.tooManyQueries', 'At most {{max}} queries are allowed (got {{count}}).', {
          max: MAX_STATUS_QUERIES,
          count: queries.length,
        }),
        {code: ERROR_CODE.VALIDATION},
      );
    }

    const {client, organizationId, shortCode, siteId} = await this.connectShopperSearch();

    if (!this.jsonEnabled()) {
      this.log(
        t(
          'commands.search.status.checking',
          'Checking search modes on site {{siteId}} ({{count}} search request(s))...',
          {
            siteId,
            count: queries.length * 3,
          },
        ),
      );
    }

    const status = await this.operations.checkSearchModes(client, {
      organizationId,
      siteId,
      shortCode,
      queries,
      locale: this.flags.locale,
      currency: this.flags.currency,
    });

    const failed = status.probes.filter((probe) => probe.error !== undefined);
    if (failed.length === status.probes.length) {
      const [first] = failed;
      this.error(
        t(
          'commands.search.status.allFailed',
          'All {{count}} search request(s) failed. First error ({{status}}): {{message}}',
          {
            count: failed.length,
            status: first.status === 0 ? 'no response' : `HTTP ${first.status}`,
            message: first.error,
          },
        ),
      );
    }

    if (this.jsonEnabled()) return status;

    tableRenderer.render(status.probes, [
      'query',
      'requested',
      'status',
      'mode',
      'total',
      'latency',
      ...(failed.length > 0 ? ['error'] : []),
    ]);

    ux.stdout('');
    ux.stdout(
      t('commands.search.status.verdict', 'Agentic Commerce Search: {{state}}', {
        state: STATE_LABELS[status.agenticCommerceSearch],
      }),
    );
    ux.stdout(t('commands.search.status.siteDefault', 'Site default engine: {{mode}}', {mode: status.siteDefault}));

    if (failed.length > 0) {
      this.warn(
        t('commands.search.status.someFailed', '{{failed}} of {{count}} search request(s) failed.', {
          failed: failed.length,
          count: status.probes.length,
        }),
      );
    }
    for (const warning of status.warnings) this.warn(warning);

    return status;
  }
}
