/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Pure SQL composition extracted from query-builder.html so it can be unit
// tested without booting the webview.
import type {AggregateFn, FilterCondition, OrderClause} from '../shared/types.js';

interface BuildSqlInput {
  currentTable: string | null;
  selectedFields: string[];
  /**
   * Per-field aggregate function (e.g. `{revenue: 'SUM'}`). Missing entries
   * mean "no aggregate". Optional so legacy callers that don't aggregate keep
   * producing identical SQL.
   */
  aggregates?: Record<string, AggregateFn | undefined>;
  filters: FilterCondition[];
  filterLogic: 'AND' | 'OR';
  orderBy: OrderClause[];
  /** Columns to GROUP BY. Order is preserved in the emitted SQL. */
  groupBy?: string[];
  limit: number | null;
}

/**
 * SQL reserved keywords that must be wrapped in double quotes to use as
 * identifiers. Sourced from Apache Calcite's reserved-words table — Calcite
 * is the SQL parser Avatica/Phoenix (and therefore CIP) inherits from, so
 * this list mirrors what the actual engine rejects.
 *
 * Comparison is case-insensitive (entries are lowercased; lookup lowercases
 * the input). To extend: add the new lowercased keyword. Source of truth:
 * https://calcite.apache.org/docs/reference.html#keywords
 */
const RESERVED_KEYWORDS = new Set<string>([
  // Query / clause keywords
  'abs',
  'all',
  'allocate',
  'allow',
  'alter',
  'and',
  'any',
  'are',
  'array',
  'as',
  'asensitive',
  'asymmetric',
  'at',
  'atomic',
  'authorization',
  'avg',
  'begin',
  'begin_frame',
  'begin_partition',
  'between',
  'bigint',
  'binary',
  'bit',
  'blob',
  'body',
  'boolean',
  'both',
  'by',
  'call',
  'called',
  'cardinality',
  'cascaded',
  'case',
  'cast',
  'ceil',
  'ceiling',
  'char',
  'character',
  'character_length',
  'char_length',
  'check',
  'class',
  'classifier',
  'clob',
  'close',
  'coalesce',
  'collate',
  'collect',
  'column',
  'commit',
  'condition',
  'connect',
  'constraint',
  'contains',
  'convert',
  'corr',
  'corresponding',
  'count',
  'covar_pop',
  'covar_samp',
  'create',
  'cross',
  'cube',
  'cume_dist',
  'current',
  'current_catalog',
  'current_date',
  'current_default_transform_group',
  'current_path',
  'current_role',
  'current_row',
  'current_schema',
  'current_time',
  'current_timestamp',
  'current_transform_group_for_type',
  'current_user',
  'cursor',
  'cycle',
  'data',
  'date',
  'day',
  'deallocate',
  'dec',
  'decimal',
  'declare',
  'default',
  'define',
  'delete',
  'dense_rank',
  'deref',
  'desc',
  'describe',
  'deterministic',
  'disallow',
  'disconnect',
  'distinct',
  'double',
  'drop',
  'dynamic',
  'each',
  'element',
  'else',
  'empty',
  'end',
  'end-exec',
  'end_frame',
  'end_partition',
  'equals',
  'escape',
  'every',
  'except',
  'exec',
  'execute',
  'exists',
  'exp',
  'explain',
  'external',
  'extract',
  'false',
  'fetch',
  'field',
  'filter',
  'first_value',
  'float',
  'floor',
  'for',
  'foreign',
  'frame_row',
  'free',
  'from',
  'full',
  'function',
  'fusion',
  'get',
  'global',
  'grant',
  'group',
  'grouping',
  'groups',
  'having',
  'hold',
  'hour',
  'identity',
  'import',
  'in',
  'index',
  'indicator',
  'initial',
  'inner',
  'inout',
  'insensitive',
  'insert',
  'int',
  'integer',
  'intersect',
  'intersection',
  'interval',
  'into',
  'is',
  'join',
  'json_array',
  'json_arrayagg',
  'json_exists',
  'json_object',
  'json_objectagg',
  'json_query',
  'json_value',
  'key',
  'lag',
  'language',
  'large',
  'last_value',
  'lateral',
  'lead',
  'leading',
  'leading_precision',
  'left',
  'level',
  'like',
  'like_regex',
  'limit',
  'ln',
  'local',
  'localtime',
  'localtimestamp',
  'lower',
  'match',
  'matches',
  'match_number',
  'match_recognize',
  'max',
  'measures',
  'member',
  'merge',
  'method',
  'min',
  'minute',
  'mod',
  'modifies',
  'module',
  'month',
  'multiset',
  'name',
  'national',
  'natural',
  'nchar',
  'nclob',
  'new',
  'next',
  'no',
  'none',
  'normalize',
  'not',
  'nth_value',
  'ntile',
  'null',
  'nullable',
  'nullif',
  'numeric',
  'occurrences_regex',
  'octet_length',
  'of',
  'offset',
  'old',
  'omit',
  'on',
  'one',
  'only',
  'open',
  'option',
  'or',
  'order',
  'out',
  'outer',
  'over',
  'overlaps',
  'overlay',
  'parameter',
  'partition',
  'path',
  'pattern',
  'per',
  'percent',
  'percentile_cont',
  'percentile_disc',
  'percent_rank',
  'period',
  'permute',
  'portion',
  'position',
  'position_regex',
  'power',
  'precedes',
  'precision',
  'prepare',
  'prev',
  'primary',
  'procedure',
  'range',
  'rank',
  'reads',
  'real',
  'recursive',
  'ref',
  'references',
  'referencing',
  'regr_avgx',
  'regr_avgy',
  'regr_count',
  'regr_intercept',
  'regr_r2',
  'regr_slope',
  'regr_sxx',
  'regr_sxy',
  'regr_syy',
  'release',
  'reset',
  'restrict',
  'result',
  'return',
  'returns',
  'revoke',
  'right',
  'role',
  'rollback',
  'rollup',
  'row',
  'row_number',
  'rows',
  'running',
  'savepoint',
  'schema',
  'scope',
  'scroll',
  'search',
  'second',
  'seek',
  'select',
  'sensitive',
  'session',
  'session_user',
  'set',
  'show',
  'similar',
  'sin',
  'size',
  'skip',
  'smallint',
  'some',
  'specific',
  'specifictype',
  'sql',
  'sqlexception',
  'sqlstate',
  'sqlwarning',
  'sqrt',
  'start',
  'state',
  'static',
  'status',
  'stddev_pop',
  'stddev_samp',
  'submultiset',
  'subset',
  'substring',
  'substring_regex',
  'succeeds',
  'sum',
  'symmetric',
  'system',
  'system_time',
  'system_user',
  'table',
  'tablesample',
  'temporary',
  'text',
  'then',
  'time',
  'timestamp',
  'timezone_hour',
  'timezone_minute',
  'tiny',
  'tinyint',
  'to',
  'trailing',
  'trailing_precision',
  'translate',
  'translate_regex',
  'translation',
  'treat',
  'trigger',
  'trim',
  'trim_array',
  'true',
  'truncate',
  'type',
  'uescape',
  'union',
  'unique',
  'unknown',
  'unnest',
  'update',
  'upper',
  'upsert',
  'user',
  'using',
  'value',
  'values',
  'value_of',
  'varbinary',
  'varchar',
  'varying',
  'var_pop',
  'var_samp',
  'versioning',
  'when',
  'whenever',
  'where',
  'width_bucket',
  'window',
  'with',
  'within',
  'without',
  'year',
  'zone',
]);

/** Plain snake_case identifier — no quoting needed. */
const SAFE_IDENTIFIER_RE = /^[a-z_][a-z0-9_]*$/;

/**
 * Decide whether an identifier segment needs to be wrapped in double quotes.
 * Quotes are required when the segment isn't plain snake_case (contains
 * uppercase, spaces, dashes, etc.) or when it matches a reserved keyword.
 */
function needsQuoting(segment: string): boolean {
  if (!segment) return false;
  if (!SAFE_IDENTIFIER_RE.test(segment)) return true;
  return RESERVED_KEYWORDS.has(segment.toLowerCase());
}

/**
 * Quote a SQL identifier when necessary. Each dot-separated segment is
 * checked independently, so `myschema.method` becomes `myschema."method"`
 * (only the reserved word is quoted). Embedded double quotes are escaped
 * per ANSI rules by doubling them.
 */
export function quoteIdent(name: string): string {
  return name
    .split('.')
    .map((segment) => (needsQuoting(segment) ? `"${segment.replace(/"/g, '""')}"` : segment))
    .join('.');
}

/**
 * Render a single SELECT column with optional aggregate. Without an aggregate
 * the column is emitted as-is (`"name"` or `name`). With one we wrap it in
 * the function call and alias it back to a stable, identifier-safe label so
 * results tables show e.g. `revenue_sum` instead of `SUM("revenue")`.
 */
function renderSelectColumn(field: string, agg: AggregateFn | undefined): string {
  const ident = quoteIdent(field);
  if (!agg) return ident;
  const alias = quoteIdent(`${field}_${agg.toLowerCase()}`);
  return `${agg}(${ident}) AS ${alias}`;
}

/**
 * Quote a scalar filter value: strings get single-quoted (with embedded
 * single quotes doubled), numbers stay raw. Empty input is treated as a
 * quoted empty string so we never emit a dangling `col = ` with nothing on
 * the right-hand side.
 */
function formatScalarValue(value: string | undefined): string {
  const v = value ?? '';
  if (v === '') return "''";
  return isNaN(Number(v)) ? "'" + v.replace(/'/g, "''") + "'" : v;
}

export function buildSql(input: BuildSqlInput): string {
  if (!input.currentTable) return '-- Select an entity to generate query';

  const aggregates = input.aggregates ?? {};
  const groupBy = (input.groupBy ?? []).filter((c) => c);

  const fields =
    input.selectedFields.length > 0
      ? input.selectedFields.map((f) => renderSelectColumn(f, aggregates[f])).join(', ')
      : '*';
  let sql = 'SELECT ' + fields + '\nFROM ' + quoteIdent(input.currentTable);

  const validFilters = input.filters.filter((f) => f.column);
  if (validFilters.length > 0) {
    const conditions = validFilters.map((f) => {
      const col = quoteIdent(f.column);
      if (f.operator === 'IS NULL' || f.operator === 'IS NOT NULL') {
        return col + ' ' + f.operator;
      }
      if (f.operator === 'BETWEEN') {
        const lo = formatScalarValue(f.value);
        const hi = formatScalarValue(f.valueTo);
        return `${col} BETWEEN ${lo} AND ${hi}`;
      }
      if (f.operator === 'IN' || f.operator === 'NOT IN') {
        return col + ' ' + f.operator + ' (' + (f.value || '') + ')';
      }
      return col + ' ' + f.operator + ' ' + formatScalarValue(f.value);
    });
    sql += '\nWHERE ' + conditions.join(' ' + input.filterLogic + ' ');
  }

  if (groupBy.length > 0) {
    sql += '\nGROUP BY ' + groupBy.map(quoteIdent).join(', ');
  }

  const validOrder = input.orderBy.filter((o) => o.column);
  if (validOrder.length > 0) {
    sql += '\nORDER BY ' + validOrder.map((o) => quoteIdent(o.column) + ' ' + o.direction).join(', ');
  }

  if (input.limit && input.limit > 0) {
    sql += '\nLIMIT ' + input.limit;
  }

  return sql;
}
