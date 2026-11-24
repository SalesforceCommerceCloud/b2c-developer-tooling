/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Args, Flags, ux} from '@oclif/core';
import {BaseCommand, ERROR_CODE, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  diffSearchCaptures,
  type PriceOrder,
  type RefinementAttributeSummary,
  type SearchCapture,
  type SearchCaptureRequest,
  type SearchDiff,
  type SearchDiffEntry,
  type SearchDiffSideSummary,
} from '@salesforce/b2c-tooling-sdk/operations/search';
import {readTextInput} from '../../utils/slas/client.js';
import {t, withDocs} from '../../i18n/index.js';

interface SideRow {
  baseline: string;
  candidate: string;
  label: string;
}

const SIDE_COLUMNS: Record<string, ColumnDef<SideRow>> = {
  label: {header: '', get: (r) => r.label},
  baseline: {header: 'Baseline', get: (r) => r.baseline},
  candidate: {header: 'Candidate', get: (r) => r.candidate},
};

const REFINEMENT_COLUMNS: Record<string, ColumnDef<RefinementAttributeSummary>> = {
  attributeId: {header: 'Refinement', get: (r) => r.attributeId},
  both: {header: 'Both', get: (r) => String(r.both)},
  baselineOnly: {header: 'Only B', get: (r) => String(r.baselineOnly)},
  candidateOnly: {header: 'Only C', get: (r) => String(r.candidateOnly)},
  valuesDiffer: {header: 'Values differ', get: (r) => String(r.valuesDiffer)},
  countsDiffer: {header: 'Counts differ', get: (r) => String(r.countsDiffer)},
};

const PRICE_ORDER_SHORT: Record<PriceOrder, string> = {
  ascending: 'asc',
  descending: 'desc',
  equal: 'equal',
  unordered: 'unordered',
};

function formatModes(modes: Record<string, number>): string {
  const entries = Object.entries(modes);
  return entries.length === 0 ? '-' : entries.map(([mode, count]) => `${mode}: ${count}`).join(', ');
}

function formatRatio(value: number | undefined): string {
  return value === undefined ? '-' : value.toFixed(2);
}

function servedBy(entry: SearchDiffEntry): string {
  const mode = entry.candidate.effectiveSearchMode ?? '-';
  return entry.candidate.modeFallback ? `${mode} (fallback)` : mode;
}

/** The sort a capture asked for: `sort` for Shopper Search, the `srule` parameter for a storefront page. */
function requestedSort(request: SearchCaptureRequest): string | undefined {
  return request.source === 'storefront' ? request.params?.srule : request.sort;
}

function shortPriceOrder(order: PriceOrder | undefined): string {
  return order ? PRICE_ORDER_SHORT[order] : '-';
}

function priceOrders(entry: SearchDiffEntry): string {
  return `${shortPriceOrder(entry.baseline.priceOrder)}/${shortPriceOrder(entry.candidate.priceOrder)}`;
}

function queryColumns(kValues: number[], sorted: boolean): Record<string, ColumnDef<SearchDiffEntry>> {
  const columns: Record<string, ColumnDef<SearchDiffEntry>> = {
    query: {header: 'Query', get: (e) => e.query},
    hits: {header: 'Hits B/C', get: (e) => `${e.baseline.hitCount}/${e.candidate.hitCount}`},
  };
  for (const k of kValues) {
    columns[`k${k}`] = {header: `@${k}`, get: (e) => formatRatio(e.results?.overlap.atK[String(k)])};
  }
  return {
    ...columns,
    top1: {header: 'Top-1', get: (e) => (e.results ? (e.results.order.top1Agree ? 'same' : 'diff') : '-')},
    baselineOnly: {header: 'Only B', get: (e) => String(e.results?.membership.baselineOnlyCount ?? '-')},
    candidateOnly: {header: 'Only C', get: (e) => String(e.results?.membership.candidateOnlyCount ?? '-')},
    ...(sorted && {prices: {header: 'Price B/C', get: priceOrders}}),
    mode: {header: 'Served by (C)', get: servedBy},
    note: {header: 'Note', get: (e) => e.note ?? ''},
  };
}

export default class SearchDiffCommand extends BaseCommand<typeof SearchDiffCommand> {
  static args = {
    baseline: Args.string({description: 'Baseline capture file from search capture', required: true}),
    candidate: Args.string({description: 'Candidate capture file from search capture', required: true}),
  };

  static description = withDocs(
    t(
      'commands.search.diff.description',
      'Compare two product search captures query by query\n\nReports overlap at each depth, products returned by only one side, rank changes, refinement and refinement hit count changes, sorting options, the order of hit prices and the search mode that served each side. The diff has no pass or fail verdict.',
    ),
    '/cli/search.html#b2c-search-diff',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> lexical.json semantic.json',
    '<%= config.bin %> <%= command.id %> before.json after.json --k 1,5,10,25',
    '<%= config.bin %> <%= command.id %> before.json after.json --max-ids 10 --output diff.json',
    '<%= config.bin %> <%= command.id %> before.json after.json --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    k: Flags.integer({
      description: 'Depths at which to report overlap (comma-separated or repeatable; default 1,3,5,10)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
      min: 1,
    }),
    'max-ids': Flags.integer({
      description: 'Longest list of baseline-only or candidate-only product IDs to keep per query',
      min: 0,
    }),
    output: Flags.string({char: 'o', description: 'Write the diff JSON to this file'}),
  };

  async run(): Promise<SearchDiff> {
    const baseline = await this.readCapture(this.args.baseline);
    const candidate = await this.readCapture(this.args.candidate);

    let diff: SearchDiff;
    try {
      diff = diffSearchCaptures(baseline, candidate, {
        kValues: this.flags.k as number[] | undefined,
        maxIds: this.flags['max-ids'],
      });
    } catch (error) {
      this.error((error as Error).message, {code: ERROR_CODE.VALIDATION});
    }

    if (this.flags.output) {
      fs.writeFileSync(this.flags.output, JSON.stringify(diff, null, 2) + '\n');
    }
    if (this.jsonEnabled()) return diff;

    const sorted =
      requestedSort(diff.baseline.request) !== undefined || requestedSort(diff.candidate.request) !== undefined;
    this.printSummary(diff, sorted);
    if (diff.queries.length > 0) {
      ux.stdout('');
      const columns = queryColumns(diff.kValues, sorted);
      new TableRenderer(columns).render(diff.queries, Object.keys(columns));
    }
    if (this.flags.output) {
      ux.stdout(t('commands.search.diff.wrote', 'Wrote {{file}}', {file: this.flags.output}));
    }
    return diff;
  }

  private printSummary(diff: SearchDiff, sorted: boolean): void {
    const {summary} = diff;
    const describe = (side: SearchDiff['baseline']) => {
      const {request} = side;
      const settings =
        request.source === 'storefront'
          ? [`storefront ${request.host}`]
          : [
              `mode ${request.searchMode ?? 'site default'}`,
              ...(request.sort ? [`sort ${request.sort}`] : []),
              ...(request.refine?.length ? [`refine ${request.refine.join(' ')}`] : []),
            ];
      return `${side.label} (${side.capturedAt}, site ${request.siteId}, ${settings.join(', ')})`;
    };

    ux.stdout(t('commands.search.diff.baseline', 'Baseline:  {{side}}', {side: describe(diff.baseline)}));
    ux.stdout(t('commands.search.diff.candidate', 'Candidate: {{side}}', {side: describe(diff.candidate)}));
    for (const warning of diff.warnings) this.warn(warning);
    for (const [side, queries] of [
      ['baseline', diff.unmatchedQueries.baselineOnly],
      ['candidate', diff.unmatchedQueries.candidateOnly],
    ] as const) {
      if (queries.length > 0) {
        this.warn(
          t('commands.search.diff.unmatched', 'Only in the {{side}} ({{count}}): {{queries}}', {
            count: queries.length,
            side,
            queries: queries.join(', '),
          }),
        );
      }
    }

    ux.stdout('');
    ux.stdout(
      t('commands.search.diff.compared', 'Queries compared: {{compared}} of {{queries}}', {
        compared: summary.compared,
        queries: summary.queries,
      }),
    );
    const overlap = diff.kValues.map((k) => `@${k} ${formatRatio(summary.meanOverlapAtK[String(k)])}`).join('  ');
    ux.stdout(t('commands.search.diff.overlap', 'Mean overlap:     {{overlap}}', {overlap}));
    ux.stdout(
      t('commands.search.diff.top1', 'Top-1 agreement:  {{agree}} of {{compared}}', {
        agree: summary.top1Agreements,
        compared: summary.compared,
      }),
    );
    ux.stdout(
      t('commands.search.diff.refinements', 'Refinement differences: {{count}} of {{compared}}', {
        count: summary.refinementDifferences,
        compared: summary.compared,
      }),
    );
    ux.stdout(
      t('commands.search.diff.refinementCounts', 'Refinement count differences: {{count}} of {{compared}}', {
        count: summary.refinementCountDifferences,
        compared: summary.compared,
      }),
    );
    ux.stdout(
      t('commands.search.diff.sorting', 'Sorting differences: {{count}} of {{compared}}', {
        count: summary.sortingDifferences,
        compared: summary.compared,
      }),
    );

    ux.stdout('');
    const row = (label: string, get: (side: SearchDiffSideSummary) => string): SideRow => ({
      label,
      baseline: get(summary.baseline),
      candidate: get(summary.candidate),
    });
    new TableRenderer(SIDE_COLUMNS).render(
      [
        row('Label', (s) => s.label),
        row('Failed', (s) => String(s.failed)),
        row('Zero results', (s) => String(s.zeroResults)),
        row('With hits', (s) => String(s.queriesWithHits)),
        row('Distinct result lists', (s) => String(s.distinctResultSets)),
        row('Largest shared list', (s) => String(s.largestSharedResultSet)),
        row('Served by', (s) => formatModes(s.effectiveSearchModes)),
        row('Mode fallbacks', (s) => String(s.modeFallbacks)),
        row('Sort options', (s) => (s.sortingOptions.length > 0 ? s.sortingOptions.join(', ') : '-')),
        row('Selected sort', (s) => formatModes(s.selectedSortingOptions)),
        ...(sorted ? [row('Price order', (s) => formatModes(s.priceOrders))] : []),
      ],
      ['label', 'baseline', 'candidate'],
    );

    for (const [side, sideSummary] of [
      ['baseline', summary.baseline],
      ['candidate', summary.candidate],
    ] as const) {
      if (sideSummary.largestSharedResultSet > 1) {
        ux.stdout(
          t(
            'commands.search.diff.sharedList',
            'Note: {{count}} queries returned the same result list in the {{side}}.',
            {count: sideSummary.largestSharedResultSet, side},
          ),
        );
      }
    }

    if (summary.refinementAttributes.length > 0) {
      ux.stdout('');
      new TableRenderer(REFINEMENT_COLUMNS).render(summary.refinementAttributes, Object.keys(REFINEMENT_COLUMNS));
    }
  }

  private async readCapture(file: string): Promise<SearchCapture> {
    try {
      return JSON.parse(await readTextInput(file)) as SearchCapture;
    } catch (error) {
      this.error(
        t('commands.search.diff.readError', 'Could not read capture file {{file}}: {{message}}', {
          file,
          message: (error as Error).message,
        }),
        {code: ERROR_CODE.VALIDATION},
      );
    }
  }
}
