/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import {Flags, ux} from '@oclif/core';
import {BaseCommand, ERROR_CODE, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  buildStorefrontSearchUrl,
  captureStorefrontSearch,
  DEFAULT_CAPTURE_LIMIT,
  DEFAULT_STOREFRONT_USER,
  MAX_CAPTURE_LIMIT,
  normalizeQueries,
  parseQueryFile,
  resolvePageProfile,
  type SearchCapture,
  type SearchCaptureEntry,
  type StorefrontPageProfile,
  type StorefrontPageResponse,
} from '@salesforce/b2c-tooling-sdk/operations/search';
import {readTextInput} from '../../utils/slas/client.js';
import {t, withDocs} from '../../i18n/index.js';

const DEFAULT_DELAY_MS = 250;

function describeNotes(entry: SearchCaptureEntry): string {
  const notes: string[] = [];
  if (entry.redirectedTo) {
    const target = new URL(entry.redirectedTo);
    notes.push(`redirected to ${target.pathname}${target.search}`);
  }
  if (entry.parseWarnings?.length) notes.push(`${entry.parseWarnings.length} page warning(s)`);
  return notes.join('; ');
}

const COLUMNS: Record<string, ColumnDef<SearchCaptureEntry>> = {
  query: {header: 'Query', get: (e) => e.query},
  status: {header: 'Status', get: (e) => String(e.status)},
  total: {header: 'Total', get: (e) => (e.total === undefined ? '-' : String(e.total))},
  hits: {header: 'Hits', get: (e) => String(e.hits.length)},
  top: {header: 'Top hit', get: (e) => e.hits[0]?.productId ?? '-'},
  latency: {header: 'ms', get: (e) => String(e.latencyMs)},
  notes: {header: 'Notes', get: describeNotes},
  error: {header: 'Error', get: (e) => e.error ?? ''},
};

const tableRenderer = new TableRenderer(COLUMNS);

/** File name for a saved page: its position and a readable form of the query. */
function pageFileName(page: StorefrontPageResponse, width: number): string {
  const slug = page.query
    .toLowerCase()
    .normalize('NFKD')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return `${String(page.index + 1).padStart(width, '0')}-${slug || 'query'}.html`;
}

export default class SearchCaptureStorefrontCommand extends BaseCommand<typeof SearchCaptureStorefrontCommand> {
  static description = withDocs(
    t(
      'commands.search.capture-storefront.description',
      "Capture the storefront search page for a list of queries\n\nRequests the storefront's search results page for each query and reads the product tiles in order, the result count, the filters and the sorting options from the page HTML. The page selectors default to the Storefront Reference Architecture (SFRA); use --profile for customized templates. The capture has the same format as `search capture`, so `search diff` compares storefront pages with each other or with Shopper Search results.",
    ),
    '/cli/search.html#b2c-search-capture-storefront',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --server www.example.com --site-id RefArch --query shirt --query "red dress"',
    'SFCC_STOREFRONT_PASSWORD=... <%= config.bin %> <%= command.id %> --server dev.example.com --site-id RefArch --queries-file queries.txt --output storefront.json',
    '<%= config.bin %> <%= command.id %> --site-id RefArch --queries-file queries.txt --locale en_US --bypass-page-cache --save-html pages',
    '<%= config.bin %> <%= command.id %> --server www.example.com --site-id RefArch --path /search --profile profile.json --queries-file queries.txt',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    server: Flags.string({
      char: 's',
      description: 'Storefront host name or origin (default: the instance hostname from the configuration)',
      env: 'SFCC_SERVER',
      helpGroup: 'STOREFRONT',
    }),
    'site-id': Flags.string({
      description: 'Site ID to search',
      env: 'SFCC_SITE_ID',
      helpGroup: 'STOREFRONT',
    }),
    'storefront-user': Flags.string({
      description: `User name for storefront password protection (default: ${DEFAULT_STOREFRONT_USER})`,
      env: 'SFCC_STOREFRONT_USER',
      helpGroup: 'STOREFRONT',
    }),
    'storefront-password': Flags.string({
      description:
        'Storefront password, when the storefront is password protected. Prefer the environment variable: a flag value shows in the process list and shell history',
      env: 'SFCC_STOREFRONT_PASSWORD',
      helpGroup: 'STOREFRONT',
    }),
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
      description: `Products to request per page with the sz parameter (1-${MAX_CAPTURE_LIMIT})`,
      default: DEFAULT_CAPTURE_LIMIT,
      min: 1,
      max: MAX_CAPTURE_LIMIT,
      helpGroup: 'SEARCH',
    }),
    locale: Flags.string({
      description: 'Locale segment of the default search page path, for example en_US (default: default)',
      helpGroup: 'SEARCH',
    }),
    path: Flags.string({
      description:
        'Path of the search page, for example /search (default: /on/demandware.store/Sites-{site}-Site/{locale}/Search-Show)',
      helpGroup: 'SEARCH',
    }),
    param: Flags.string({
      description: 'Extra query parameter for every request, as name=value (repeatable)',
      multiple: true,
      multipleNonGreedy: true,
      helpGroup: 'SEARCH',
    }),
    'bypass-page-cache': Flags.boolean({
      description: 'Add a parameter unique to this capture so the page cache cannot serve pages rendered before it',
      default: false,
      helpGroup: 'SEARCH',
    }),
    delay: Flags.integer({
      description: 'Pause between requests in milliseconds',
      default: DEFAULT_DELAY_MS,
      min: 0,
      helpGroup: 'SEARCH',
    }),
    profile: Flags.string({
      description:
        'JSON file of page selectors that replace the SFRA defaults, for customized templates (see the documentation for the keys)',
      helpGroup: 'SEARCH',
    }),
    'save-html': Flags.string({
      description: 'Directory to save the HTML of each page in, for checking what the capture read',
      helpGroup: 'SEARCH',
    }),
    label: Flags.string({
      description: 'Label stored in the capture and shown by search diff (default: "storefront")',
      helpGroup: 'SEARCH',
    }),
    output: Flags.string({char: 'o', description: 'Write the capture JSON to this file'}),
  };

  protected operations = {captureStorefrontSearch};

  async run(): Promise<SearchCapture> {
    const queries = await this.collectQueries();
    if (queries.length === 0) {
      this.error(
        t('commands.search.capture-storefront.noQueries', 'Provide at least one query with --query or --queries-file.'),
        {code: ERROR_CODE.VALIDATION},
      );
    }

    const host = this.flagOrConfig(this.flags.server, 'hostname');
    if (!host) {
      this.error(
        t(
          'commands.search.capture-storefront.serverRequired',
          'A storefront host is required. Provide --server, set SFCC_SERVER, or configure hostname in dw.json.',
        ) + this.configDocsHint(),
        {code: ERROR_CODE.VALIDATION},
      );
    }
    const siteId = this.flagOrConfig(this.flags['site-id'], 'siteId');
    if (!siteId) {
      this.error(
        t(
          'commands.search.capture-storefront.siteIdRequired',
          'site-id is required. Provide via --site-id flag, SFCC_SITE_ID env var, or site-id in dw.json.',
        ) + this.configDocsHint(),
        {code: ERROR_CODE.VALIDATION},
      );
    }

    const params = this.parseParams();
    const profile = this.flags.profile ? this.readProfile(this.flags.profile) : undefined;
    try {
      // Checks the host, path and parameters before any request is sent.
      buildStorefrontSearchUrl({
        host,
        siteId,
        query: queries[0],
        locale: this.flags.locale,
        path: this.flags.path,
        params,
      });
    } catch (error) {
      this.error((error as Error).message, {code: ERROR_CODE.VALIDATION});
    }
    const htmlDir = this.flags['save-html'];
    if (htmlDir) fs.mkdirSync(htmlDir, {recursive: true});
    const width = Math.max(2, String(queries.length).length);

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.search.capture-storefront.capturing', 'Requesting {{count}} search page(s) from {{host}}...', {
          count: queries.length,
          host,
        }),
      );
    }

    const capture = await this.operations.captureStorefrontSearch({
      host,
      siteId,
      queries,
      limit: this.flags.limit,
      locale: this.flags.locale,
      path: this.flags.path,
      params,
      bypassPageCache: this.flags['bypass-page-cache'],
      username: this.flags['storefront-user'],
      password: this.flags['storefront-password'],
      delayMs: this.flags.delay,
      profile,
      label: this.flags.label,
      onPage: htmlDir
        ? (page) => fs.promises.writeFile(path.join(htmlDir, pageFileName(page, width)), page.html)
        : undefined,
    });

    if (this.flags.output) {
      fs.writeFileSync(this.flags.output, JSON.stringify(capture, null, 2) + '\n');
    }

    const failed = capture.results.filter((entry) => entry.error !== undefined);
    if (failed.length === capture.results.length) {
      const [first] = failed;
      this.error(
        t(
          'commands.search.capture-storefront.allFailed',
          'All {{count}} page request(s) failed. First error: {{message}}',
          {count: failed.length, message: first.error},
        ),
      );
    }

    if (this.jsonEnabled()) return capture;

    const columns = ['query', 'status', 'total', 'hits', 'top', 'latency'];
    if (capture.results.some((entry) => describeNotes(entry))) columns.push('notes');
    if (failed.length > 0) columns.push('error');
    tableRenderer.render(capture.results, columns);

    for (const [warning, count] of this.countPageWarnings(capture)) {
      this.warn(
        t('commands.search.capture-storefront.pageWarning', '{{count}} page(s): {{warning}}', {count, warning}),
      );
    }
    if (failed.length > 0) {
      this.warn(
        t('commands.search.capture-storefront.someFailed', '{{failed}} of {{count}} page request(s) failed.', {
          failed: failed.length,
          count: capture.results.length,
        }),
      );
    }
    if (htmlDir) {
      ux.stdout(t('commands.search.capture-storefront.savedHtml', 'Saved the pages in {{dir}}', {dir: htmlDir}));
    }
    if (this.flags.output) {
      ux.stdout(t('commands.search.capture-storefront.wrote', 'Wrote {{file}}', {file: this.flags.output}));
    }
    return capture;
  }

  private async collectQueries(): Promise<string[]> {
    const queries = [...(this.flags.query ?? [])];
    const file = this.flags['queries-file'];
    if (file) {
      let content: string;
      try {
        content = await readTextInput(file);
      } catch (error) {
        this.error(
          t('commands.search.capture-storefront.readError', 'Could not read queries file {{file}}: {{message}}', {
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

  /** Distinct page warnings with the number of pages that had each, most frequent first. */
  private countPageWarnings(capture: SearchCapture): Array<[string, number]> {
    const counts = new Map<string, number>();
    for (const entry of capture.results) {
      for (const warning of new Set(entry.parseWarnings ?? [])) {
        counts.set(warning, (counts.get(warning) ?? 0) + 1);
      }
    }
    return [...counts].sort((a, b) => b[1] - a[1]);
  }

  private parseParams(): Record<string, string> | undefined {
    const values = this.flags.param ?? [];
    if (values.length === 0) return undefined;
    const params: Record<string, string> = {};
    for (const value of values) {
      const separator = value.indexOf('=');
      if (separator <= 0) {
        this.error(
          t('commands.search.capture-storefront.invalidParam', 'Invalid --param "{{value}}": use name=value.', {value}),
          {code: ERROR_CODE.VALIDATION},
        );
      }
      params[value.slice(0, separator)] = value.slice(separator + 1);
    }
    return params;
  }

  private readProfile(file: string): StorefrontPageProfile {
    let overrides: unknown;
    try {
      overrides = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      this.error(
        t('commands.search.capture-storefront.profileReadError', 'Could not read page profile {{file}}: {{message}}', {
          file,
          message: (error as Error).message,
        }),
        {code: ERROR_CODE.VALIDATION},
      );
    }
    try {
      return resolvePageProfile(overrides as Partial<StorefrontPageProfile>);
    } catch (error) {
      this.error(
        t('commands.search.capture-storefront.profileInvalid', 'Invalid page profile {{file}}: {{message}}', {
          file,
          message: (error as Error).message,
        }),
        {code: ERROR_CODE.VALIDATION},
      );
    }
  }
}
