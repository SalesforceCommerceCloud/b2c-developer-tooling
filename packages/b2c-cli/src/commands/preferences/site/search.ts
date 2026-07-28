/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Args, Flags, ux} from '@oclif/core';
import {PreferencesCommand, instanceTypeFlag, maskPasswordsFlag} from '../../../utils/preferences.js';
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getApiErrorMessage,
  type PreferenceInstanceType,
  type PreferenceValue,
  type PreferenceValueSearchResult,
  type PreferencesSearchRequest,
} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

const SEARCHABLE_FIELDS = ['id', 'displayName', 'description'];
const VALUE_TYPE_FIELD = 'valueType';
const SORTABLE_FIELDS = [...SEARCHABLE_FIELDS, VALUE_TYPE_FIELD];

const COLUMNS: Record<string, ColumnDef<PreferenceValue>> = {
  id: {header: 'ID', get: (p) => p.id || '-'},
  valueType: {header: 'Type', get: (p) => p.valueType || '-'},
  displayName: {
    header: 'Display Name',
    get: (p) => p.displayName?.default || Object.values(p.displayName ?? {})[0] || '-',
  },
  siteValues: {
    header: 'Site Values',
    get: (p) => (p.siteValues ? JSON.stringify(p.siteValues) : '-'),
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['id', 'valueType', 'displayName'];
const tableRenderer = new TableRenderer(COLUMNS);

export default class PreferencesSiteSearch extends PreferencesCommand<typeof PreferencesSiteSearch> {
  static args = {
    'group-id': Args.string({
      description: 'Preference group ID',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.preferences.site.search.description',
      'Search preferences across sites in a site preference group for a given instance type',
    ),
    '/cli/preferences.html#search-site',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> CustomGroupId --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> CustomGroupId --instance-type staging --search-phrase Wapi --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> CustomGroupId --value-type string --sort-by id --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> CustomGroupId --query-file query.json --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> CustomGroupId --query \'{"matchAllQuery":{}}\' --expand value --tenant-id zzxy_prd',
  ];

  static flags = {
    'instance-type': instanceTypeFlag,
    'search-phrase': Flags.string({
      description: 'Free-text phrase searched across id, displayName, description',
      exclusive: ['query', 'query-file'],
    }),
    'value-type': Flags.string({
      description: 'Filter by valueType (combined with --search-phrase via AND)',
      exclusive: ['query', 'query-file'],
    }),
    query: Flags.string({
      description: 'Inline JSON Query body (overrides convenience flags)',
      exclusive: ['query-file', 'search-phrase', 'value-type'],
    }),
    'query-file': Flags.string({
      description: 'JSON file containing a Query body (overrides convenience flags)',
      exclusive: ['query', 'search-phrase', 'value-type'],
    }),
    'sort-by': Flags.string({
      description: 'Sort field',
      options: SORTABLE_FIELDS,
    }),
    'sort-order': Flags.string({
      description: 'Sort order',
      options: ['asc', 'desc'],
      default: 'asc',
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of results (1-200)',
      default: 25,
      min: 1,
      max: 200,
    }),
    offset: Flags.integer({
      char: 'o',
      description: 'Result offset for pagination',
      default: 0,
      min: 0,
    }),
    expand: Flags.string({
      description: 'Expand option ("value" returns attribute value definitions)',
      options: ['value'],
    }),
    'mask-passwords': maskPasswordsFlag,
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<PreferenceValueSearchResult> {
    this.requireOAuthCredentials();

    const {'group-id': groupId} = this.args;
    const {
      'instance-type': instanceType,
      'search-phrase': searchPhrase,
      'value-type': valueType,
      query: queryFlag,
      'query-file': queryFile,
      'sort-by': sortBy,
      'sort-order': sortOrder,
      limit,
      offset,
      expand,
      'mask-passwords': maskPasswords,
    } = this.flags;
    const organizationId = this.getOrganizationId();

    const requestBody = this.buildSearchRequest({
      searchPhrase,
      valueType,
      queryFlag,
      queryFile,
      sortBy,
      sortOrder,
      limit,
      offset,
    });

    const result = await this.preferencesClient.POST(
      '/organizations/{organizationId}/site-preference-groups/{groupId}/{instanceType}/preference-search',
      {
        params: {
          path: {organizationId, groupId, instanceType: instanceType as PreferenceInstanceType},
          query: {maskPasswords, expand: expand ? [expand as 'value'] : undefined},
        },
        body: requestBody,
      },
    );

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.preferences.site.search.error', 'Failed to search site preferences: {{message}}', {message}),
      );
    }

    if (this.jsonEnabled()) return result.data;

    const hits = result.data.hits || [];
    ux.stdout('\n');
    tableRenderer.render(hits, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));
    ux.stdout(
      t('commands.preferences.site.search.total', '\nTotal: {{total}} preferences\n', {
        total: result.data.total ?? hits.length,
      }),
    );

    return result.data;
  }

  private buildSearchRequest(opts: {
    searchPhrase?: string;
    valueType?: string;
    queryFlag?: string;
    queryFile?: string;
    sortBy?: string;
    sortOrder: string;
    limit: number;
    offset: number;
  }): PreferencesSearchRequest {
    const {searchPhrase, valueType, queryFlag, queryFile, sortBy, sortOrder, limit, offset} = opts;

    let query: PreferencesSearchRequest['query'];

    if (queryFile || queryFlag) {
      const raw = queryFile ? this.readFile(queryFile) : queryFlag!;
      try {
        query = JSON.parse(raw) as PreferencesSearchRequest['query'];
      } catch {
        this.error(t('commands.preferences.parseError', 'Failed to parse JSON body'));
      }
    } else if (searchPhrase && valueType) {
      query = {
        boolQuery: {
          must: [
            {textQuery: {fields: SEARCHABLE_FIELDS, searchPhrase}},
            {termQuery: {fields: [VALUE_TYPE_FIELD], operator: 'is', values: [valueType]}},
          ],
        },
      } as PreferencesSearchRequest['query'];
    } else if (searchPhrase) {
      query = {
        textQuery: {fields: SEARCHABLE_FIELDS, searchPhrase},
      } as PreferencesSearchRequest['query'];
    } else if (valueType) {
      query = {
        termQuery: {fields: [VALUE_TYPE_FIELD], operator: 'is', values: [valueType]},
      } as PreferencesSearchRequest['query'];
    } else {
      query = {matchAllQuery: {}};
    }

    const request: PreferencesSearchRequest = {query, limit, offset};
    if (sortBy) {
      request.sorts = [{field: sortBy, sortOrder: sortOrder as 'asc' | 'desc'}];
    }
    return request;
  }

  private readFile(path: string): string {
    if (!fs.existsSync(path)) {
      this.error(t('commands.preferences.fileNotFound', 'File not found: {{file}}', {file: path}));
    }
    return fs.readFileSync(path, 'utf8');
  }
}
