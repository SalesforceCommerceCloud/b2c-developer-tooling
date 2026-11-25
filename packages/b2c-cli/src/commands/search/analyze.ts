/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Flags, ux} from '@oclif/core';
import {BaseCommand, ERROR_CODE, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  analyzeSearchSources,
  SEARCH_SOURCE_ROLES,
  type SearchCapture,
  type SearchEngineAttribution,
  type SearchFinding,
  type SearchFindingSeverity,
  type SearchSourceAnalysis,
  type SearchSourcePair,
  type SearchSourceRole,
  type SearchSources,
  type SearchSourceSummary,
} from '@salesforce/b2c-tooling-sdk/operations/search';
import {readTextInput} from '../../utils/slas/client.js';
import {t, withDocs} from '../../i18n/index.js';

/** The flag that carries the capture of each role. */
const ROLE_FLAGS = {
  storefrontLexical: 'storefront-lexical',
  storefrontSemantic: 'storefront-semantic',
  scapiLexical: 'scapi-lexical',
  scapiSemantic: 'scapi-semantic',
} as const satisfies Record<SearchSourceRole, string>;

const ROLE_LABELS: Record<SearchSourceRole, string> = {
  storefrontLexical: 'Storefront (lexical)',
  storefrontSemantic: 'Storefront (semantic)',
  scapiLexical: 'API (lexical)',
  scapiSemantic: 'API (semantic)',
};

const SEVERITIES: Array<{severity: SearchFindingSeverity; title: string}> = [
  {severity: 'warning', title: 'Warnings'},
  {severity: 'notice', title: 'Notices'},
  {severity: 'info', title: 'Info'},
];

/** Findings print at most this many example queries. */
const MAX_PRINTED_EXAMPLES = 3;

/**
 * The comparison of a storefront with the API always starts with this warning. The analysis compares
 * across sources by design, so the command leaves it out; the JSON keeps it.
 */
const CROSS_SOURCE_WARNING = 'The captures come from different sources';

interface SourceRow extends SearchSourceSummary {
  role: SearchSourceRole;
}

const SOURCE_COLUMNS: Record<string, ColumnDef<SourceRow>> = {
  role: {header: 'Role', get: (r) => ROLE_LABELS[r.role]},
  label: {header: 'Label', get: (r) => r.label},
  source: {header: 'Source', get: (r) => r.source},
  capturedAt: {header: 'Captured', get: (r) => r.capturedAt},
  queries: {header: 'Queries', get: (r) => String(r.queries)},
  servedBy: {header: 'Served by', get: (r) => formatServedBy(r.effectiveSearchModes)},
};

function formatRatio(value: number | undefined): string {
  return value === undefined ? '-' : value.toFixed(2);
}

/** The modes that served the queries; `-` when the source did not report any. */
function formatServedBy(modes: Record<string, number>): string {
  const reported = Object.entries(modes).filter(([mode]) => mode !== 'unreported');
  return reported.length === 0 ? '-' : reported.map(([mode, count]) => `${mode}: ${count}`).join(', ');
}

/** Names the flags in a message that names roles, for example `scapiLexical` becomes `--scapi-lexical`. */
function withFlagNames(message: string): string {
  return message.replaceAll(
    /\b(?:storefrontLexical|storefrontSemantic|scapiLexical|scapiSemantic)\b/g,
    (role) => `--${ROLE_FLAGS[role as SearchSourceRole]}`,
  );
}

function isCaptureShaped(value: unknown): value is SearchCapture {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Array.isArray((value as {results?: unknown}).results)
  );
}

function pairColumns(kValues: number[]): Record<string, ColumnDef<SearchSourcePair>> {
  const columns: Record<string, ColumnDef<SearchSourcePair>> = {
    pair: {header: 'Pair', get: (p) => p.id},
    compared: {header: 'Compared', get: (p) => `${p.summary.compared} of ${p.summary.queries}`},
  };
  for (const k of kValues) {
    columns[`k${k}`] = {header: `@${k}`, get: (p) => formatRatio(p.summary.meanOverlapAtK[String(k)])};
  }
  return {
    ...columns,
    top1: {header: 'Top-1 same', get: (p) => `${p.summary.top1Agreements} of ${p.summary.compared}`},
    facets: {header: 'Facet diffs', get: (p) => String(p.summary.refinementDifferences)},
    sorting: {header: 'Sort diffs', get: (p) => String(p.summary.sortingDifferences)},
    // Only a storefront compared with the API maps variant IDs to the products the API returns.
    variants: {
      header: 'IDs via variant',
      get: (p) => (p.id.startsWith('storefront-vs-scapi') ? String(p.idsMatchedThroughRepresentedProduct) : '-'),
    },
  };
}

function describeAttribution(attribution: SearchEngineAttribution): string {
  return `${attribution.closerTo === 'unclear' ? 'unclear' : `closer to ${attribution.closerTo}`} (mean overlap at ${attribution.k}: ${formatRatio(attribution.meanOverlapWithLexical)} with the lexical API results, ${formatRatio(attribution.meanOverlapWithSemantic)} with the semantic API results)`;
}

/** What a finding is about: its comparison, or its source. */
function findingScope(finding: SearchFinding): string | undefined {
  if (finding.pair) return finding.pair;
  return finding.source ? ROLE_LABELS[finding.source] : undefined;
}

export default class SearchAnalyzeCommand extends BaseCommand<typeof SearchAnalyzeCommand> {
  static description = withDocs(
    t(
      'commands.search.analyze.description',
      'Analyze search captures from the storefront and the Shopper Search API under lexical and semantic search\n\nCompares up to four captures of the same queries in pairs: the storefront against the API with the same search engine, and lexical against semantic search on each. Judges which engine each storefront capture looks like, and lists findings with the queries they affect and what is likely behind them. Findings are leads to check; the analysis has no pass or fail verdict.',
    ),
    '/cli/search.html#b2c-search-analyze',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --scapi-lexical api-lexical.json --scapi-semantic api-semantic.json',
    '<%= config.bin %> <%= command.id %> --storefront-lexical storefront-lexical.json --scapi-lexical api-lexical.json',
    '<%= config.bin %> <%= command.id %> --storefront-semantic storefront-semantic.json --scapi-lexical api-lexical.json --scapi-semantic api-semantic.json',
    '<%= config.bin %> <%= command.id %> --storefront-lexical storefront-lexical.json --storefront-semantic storefront-semantic.json --scapi-lexical api-lexical.json --scapi-semantic api-semantic.json --output analysis.json',
    '<%= config.bin %> <%= command.id %> --storefront-lexical storefront-lexical.json --scapi-lexical api-lexical.json --k 1,5,10,25 --max-examples 10 --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    'storefront-lexical': Flags.string({
      description:
        'Capture of the storefront search page under lexical (native) search, from search capture-storefront (- reads stdin)',
      helpGroup: 'SOURCES',
    }),
    'storefront-semantic': Flags.string({
      description:
        'Capture of the storefront search page with Agentic Commerce Search turned on, from search capture-storefront (- reads stdin)',
      helpGroup: 'SOURCES',
    }),
    'scapi-lexical': Flags.string({
      description: 'Capture of the Shopper Search API with --search-mode lexical, from search capture (- reads stdin)',
      helpGroup: 'SOURCES',
    }),
    'scapi-semantic': Flags.string({
      description: 'Capture of the Shopper Search API with --search-mode semantic, from search capture (- reads stdin)',
      helpGroup: 'SOURCES',
    }),
    k: Flags.integer({
      description: 'Depths at which to report overlap (comma-separated or repeatable; default 1,3,5,10)',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
      min: 1,
    }),
    'max-examples': Flags.integer({
      description: 'Most example queries with product IDs to keep per finding (default 5; 0 keeps none)',
      min: 0,
    }),
    output: Flags.string({char: 'o', description: 'Write the analysis JSON to this file'}),
  };

  async run(): Promise<SearchSourceAnalysis> {
    const files = this.sourceFiles();
    const sources = await this.readSources(files);

    let analysis: SearchSourceAnalysis;
    try {
      analysis = analyzeSearchSources(sources, {
        kValues: this.flags.k as number[] | undefined,
        maxExamples: this.flags['max-examples'],
      });
    } catch (error) {
      this.error(withFlagNames((error as Error).message), {code: ERROR_CODE.VALIDATION});
    }

    if (this.flags.output) {
      fs.writeFileSync(this.flags.output, JSON.stringify(analysis, null, 2) + '\n');
    }
    if (this.jsonEnabled()) return analysis;

    this.printAnalysis(analysis);
    if (this.flags.output) {
      ux.stdout(t('commands.search.analyze.wrote', 'Wrote {{file}}', {file: this.flags.output}));
    }
    return analysis;
  }

  private printAnalysis(analysis: SearchSourceAnalysis): void {
    for (const warning of analysis.warnings) this.warn(withFlagNames(warning));
    for (const pair of analysis.pairs) {
      for (const warning of pair.warnings) {
        if (!warning.startsWith(CROSS_SOURCE_WARNING)) this.warn(`${pair.id}: ${warning}`);
      }
    }

    ux.stdout(t('commands.search.analyze.sourcesTitle', 'Sources'));
    const sourceRows: SourceRow[] = SEARCH_SOURCE_ROLES.flatMap((role) => {
      const summary = analysis.sources[role];
      return summary ? [{role, ...summary}] : [];
    });
    new TableRenderer(SOURCE_COLUMNS).render(sourceRows, Object.keys(SOURCE_COLUMNS));

    if (analysis.pairs.length > 0) {
      ux.stdout('');
      ux.stdout(
        t(
          'commands.search.analyze.pairsTitle',
          'Comparisons (mean overlap at each depth; the baseline is the first source of the pair)',
        ),
      );
      const columns = pairColumns(analysis.kValues);
      new TableRenderer(columns).render(analysis.pairs, Object.keys(columns));
    }

    const attributions = (['storefrontLexical', 'storefrontSemantic'] as const).flatMap((role) => {
      const attribution = analysis.engineAttribution?.[role];
      return attribution ? [{role, attribution}] : [];
    });
    if (attributions.length > 0) {
      ux.stdout('');
      ux.stdout(t('commands.search.analyze.attributionTitle', 'Engine attribution'));
      for (const {role, attribution} of attributions) {
        ux.stdout(`  ${ROLE_LABELS[role]}: ${describeAttribution(attribution)}`);
      }
    }

    ux.stdout('');
    this.printFindings(analysis.findings);
  }

  private printFinding(finding: SearchFinding): void {
    const scope = findingScope(finding);
    ux.stdout(`  ${finding.code}${scope ? ` (${scope})` : ''}`);
    ux.stdout(`    ${finding.message}`);
    if (finding.likelyCauses.length > 0) {
      ux.stdout(`    ${t('commands.search.analyze.likelyCauses', 'Likely causes:')}`);
      for (const cause of finding.likelyCauses) ux.stdout(`      - ${cause}`);
    }
    if (finding.queries.length > 0) {
      ux.stdout(
        `    ${t('commands.search.analyze.queries', 'Queries: {{queries}}', {queries: finding.queries.join(', ')})}`,
      );
    }
    const examples = (finding.examples ?? []).slice(0, MAX_PRINTED_EXAMPLES);
    if (examples.length > 0) {
      ux.stdout(`    ${t('commands.search.analyze.examples', 'Examples:')}`);
      for (const example of examples) ux.stdout(`      ${example.query}: ${example.productIds.join(', ')}`);
    }
  }

  private printFindings(findings: SearchFinding[]): void {
    if (findings.length === 0) {
      ux.stdout(t('commands.search.analyze.noFindings', 'No findings.'));
      return;
    }

    let first = true;
    for (const {severity, title} of SEVERITIES) {
      const group = findings.filter((finding) => finding.severity === severity);
      if (group.length === 0) continue;

      if (!first) ux.stdout('');
      first = false;
      ux.stdout(`${title} (${group.length})`);
      for (const finding of group) this.printFinding(finding);
    }
  }

  private async readCapture(role: SearchSourceRole, file: string): Promise<SearchCapture> {
    const flag = `--${ROLE_FLAGS[role]}`;
    const name = file === '-' ? 'stdin' : file;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readTextInput(file));
    } catch (error) {
      this.error(
        t('commands.search.analyze.readError', 'Could not read the capture for {{flag}} ({{file}}): {{message}}', {
          flag,
          file: name,
          message: (error as Error).message,
        }),
        {code: ERROR_CODE.VALIDATION},
      );
    }
    if (!isCaptureShaped(parsed)) {
      this.error(
        t(
          'commands.search.analyze.notCapture',
          'The file for {{flag}} ({{file}}) is not a search capture. Use the JSON that search capture or search capture-storefront writes.',
          {flag, file: name},
        ),
        {code: ERROR_CODE.VALIDATION},
      );
    }
    return parsed;
  }

  private async readSources(files: Array<[SearchSourceRole, string]>): Promise<SearchSources> {
    const captures = await Promise.all(files.map(([role, file]) => this.readCapture(role, file)));
    return Object.fromEntries(files.map(([role], index) => [role, captures[index]])) as SearchSources;
  }

  /** The capture file given for each role, in role order. */
  private sourceFiles(): Array<[SearchSourceRole, string]> {
    const files = SEARCH_SOURCE_ROLES.flatMap((role): Array<[SearchSourceRole, string]> => {
      const file = this.flags[ROLE_FLAGS[role]] as string | undefined;
      return file === undefined ? [] : [[role, file]];
    });

    if (files.length < 2) {
      this.error(
        t(
          'commands.search.analyze.tooFewSources',
          'Provide at least two captures to analyze (got {{count}}), with --storefront-lexical, --storefront-semantic, --scapi-lexical and --scapi-semantic.',
          {count: files.length},
        ),
        {code: ERROR_CODE.VALIDATION},
      );
    }
    const fromStdin = files.filter(([, file]) => file === '-');
    if (fromStdin.length > 1) {
      this.error(
        t(
          'commands.search.analyze.stdinOnce',
          'Only one capture can be read from stdin (-), but {{flags}} all use it.',
          {
            flags: fromStdin.map(([role]) => `--${ROLE_FLAGS[role]}`).join(', '),
          },
        ),
        {code: ERROR_CODE.VALIDATION},
      );
    }
    return files;
  }
}
