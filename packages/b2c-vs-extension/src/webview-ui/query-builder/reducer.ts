/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Query Builder state machine. Mirrors the in-memory `state` object from the
// legacy inline script so the migration is a literal port — and unit-testable
// for the first time.
import type {AggregateFn, ColumnInfo, FilterCondition, OrderClause, QueryResultData} from '../shared/types.js';

export type ViewMode = 'builder' | 'editor';

export interface QueryBuilderState {
  tables: string[];
  currentTable: string | null;
  columns: ColumnInfo[];
  selectedFields: string[];
  /** Per-field aggregate function. Missing entry → no aggregate. */
  aggregates: Record<string, AggregateFn | undefined>;
  filters: FilterCondition[];
  filterLogic: 'AND' | 'OR';
  orderBy: OrderClause[];
  /** Columns to GROUP BY. Order mirrors the emitted SQL. */
  groupBy: string[];
  limit: number | null;
  currentView: ViewMode;
  customSql: string;
  results: QueryResultData | null;
}

export const initialState: QueryBuilderState = {
  tables: [],
  currentTable: null,
  columns: [],
  selectedFields: [],
  aggregates: {},
  filters: [],
  filterLogic: 'AND',
  orderBy: [],
  groupBy: [],
  limit: 100,
  currentView: 'builder',
  customSql: '',
  results: null,
};

export type QueryBuilderAction =
  | {type: 'setTables'; tables: string[]}
  | {type: 'setColumns'; columns: ColumnInfo[]}
  | {type: 'selectTable'; tableName: string}
  | {type: 'clearTable'}
  | {type: 'toggleField'; field: string}
  | {type: 'selectAllFields'}
  | {type: 'clearFields'}
  | {type: 'setAggregate'; field: string; agg: AggregateFn | undefined}
  | {type: 'addFilter'}
  | {type: 'updateFilter'; index: number; patch: Partial<FilterCondition>}
  | {type: 'removeFilter'; index: number}
  | {type: 'setFilterLogic'; logic: 'AND' | 'OR'}
  | {type: 'addOrder'}
  | {type: 'updateOrder'; index: number; patch: Partial<OrderClause>}
  | {type: 'removeOrder'; index: number}
  | {type: 'addGroupBy'}
  | {type: 'updateGroupBy'; index: number; column: string}
  | {type: 'removeGroupBy'; index: number}
  | {type: 'setLimit'; limit: number | null}
  | {type: 'setView'; view: ViewMode}
  | {type: 'setCustomSql'; sql: string}
  | {type: 'setResults'; data: QueryResultData | null};

export function reducer(state: QueryBuilderState, action: QueryBuilderAction): QueryBuilderState {
  switch (action.type) {
    case 'setTables':
      return {...state, tables: action.tables};
    case 'setColumns':
      return {...state, columns: action.columns};
    case 'selectTable':
      // Reset every column-bound piece of state when switching tables.
      // Aggregates and groupBy are tied to the previous table's columns and
      // would emit invalid SQL otherwise.
      return {
        ...state,
        currentTable: action.tableName,
        selectedFields: [],
        aggregates: {},
        filters: [],
        orderBy: [],
        groupBy: [],
        columns: [],
      };
    case 'clearTable':
      return {
        ...state,
        currentTable: null,
        columns: [],
        selectedFields: [],
        aggregates: {},
        filters: [],
        orderBy: [],
        groupBy: [],
      };
    case 'toggleField': {
      const idx = state.selectedFields.indexOf(action.field);
      if (idx >= 0) {
        // Drop the field's aggregate when the field itself is removed so we
        // don't leak orphan entries into `state.aggregates`.
        const {[action.field]: _removed, ...rest} = state.aggregates;
        return {
          ...state,
          selectedFields: state.selectedFields.filter((f) => f !== action.field),
          aggregates: rest,
        };
      }
      return {...state, selectedFields: [...state.selectedFields, action.field]};
    }
    case 'selectAllFields':
      return {...state, selectedFields: state.columns.map((c) => c.name)};
    case 'clearFields':
      return {...state, selectedFields: [], aggregates: {}};
    case 'setAggregate': {
      const next = {...state.aggregates};
      if (action.agg === undefined) {
        delete next[action.field];
      } else {
        next[action.field] = action.agg;
      }
      return {...state, aggregates: next};
    }
    case 'addFilter':
      return {...state, filters: [...state.filters, {column: '', operator: '=', value: ''}]};
    case 'updateFilter':
      return {
        ...state,
        filters: state.filters.map((f, i) => (i === action.index ? {...f, ...action.patch} : f)),
      };
    case 'removeFilter':
      return {...state, filters: state.filters.filter((_, i) => i !== action.index)};
    case 'setFilterLogic':
      return {...state, filterLogic: action.logic};
    case 'addOrder':
      return {...state, orderBy: [...state.orderBy, {column: '', direction: 'ASC'}]};
    case 'updateOrder':
      return {
        ...state,
        orderBy: state.orderBy.map((o, i) => (i === action.index ? {...o, ...action.patch} : o)),
      };
    case 'removeOrder':
      return {...state, orderBy: state.orderBy.filter((_, i) => i !== action.index)};
    case 'addGroupBy':
      return {...state, groupBy: [...state.groupBy, '']};
    case 'updateGroupBy':
      return {
        ...state,
        groupBy: state.groupBy.map((c, i) => (i === action.index ? action.column : c)),
      };
    case 'removeGroupBy':
      return {...state, groupBy: state.groupBy.filter((_, i) => i !== action.index)};
    case 'setLimit':
      return {...state, limit: action.limit};
    case 'setView':
      return {...state, currentView: action.view};
    case 'setCustomSql':
      return {...state, customSql: action.sql};
    case 'setResults':
      return {...state, results: action.data};
    default:
      return state;
  }
}
