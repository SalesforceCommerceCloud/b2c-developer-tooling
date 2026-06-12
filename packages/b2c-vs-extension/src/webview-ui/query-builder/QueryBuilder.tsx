/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Top-level Query Builder app. Holds the view layout (header, toolbar, sidebar,
// builder/editor split, run bar, results panel) and wires reducer state to the
// extension-host message bridge.
import * as React from 'react';
import {useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react';
import {ConnectionBar} from '../shared/components/ConnectionBar.js';
import {EmptyState} from '../shared/components/EmptyState.js';
import {Icon} from '../shared/components/Icon.js';
import {PageHeader} from '../shared/components/PageHeader.js';
import {ResultsTable} from '../shared/components/ResultsTable.js';
import {SegmentedControl} from '../shared/components/SegmentedControl.js';
import {SidebarSection} from '../shared/components/SidebarSection.js';
import {SqlPreview} from '../shared/components/SqlPreview.js';
import {Spinner} from '../shared/components/Spinner.js';
import {StatusBar, type StatusKind} from '../shared/components/StatusBar.js';
import {getInitialConnection, postMessage} from '../shared/bridge/vscode.js';
import {useInboundMessages} from '../shared/bridge/useMessage.js';
import type {ConnectionState, SavedQuery} from '../shared/types.js';
import {buildSql} from './buildSql.js';
import {initialState, reducer, type ViewMode} from './reducer.js';
import {FromClause} from './clauses/FromClause.js';
import {GroupByClause} from './clauses/GroupByClause.js';
import {LimitClause} from './clauses/LimitClause.js';
import {OrderByClauseView} from './clauses/OrderByClause.js';
import {SelectClause} from './clauses/SelectClause.js';
import {WhereClause} from './clauses/WhereClause.js';
import {SavedQueriesMenu} from './SavedQueriesMenu.js';
import {SaveQueryModal, type SaveModalState} from './SaveQueryModal.js';

function getTypeClass(type: string): string {
  const t = (type || '').toLowerCase();
  if (t.includes('char') || t.includes('text') || t.includes('str')) return 'str';
  if (
    t.includes('int') ||
    t.includes('long') ||
    t.includes('num') ||
    t.includes('decimal') ||
    t.includes('double') ||
    t.includes('float') ||
    t.includes('big')
  )
    return 'int';
  if (t.includes('date') || t.includes('time')) return 'date';
  if (t.includes('bool')) return 'bool';
  return '';
}

interface StatusState {
  kind: StatusKind;
  text?: string;
}

export function QueryBuilder() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [connection, setConnection] = useState<ConnectionState>(getInitialConnection());
  const [tableSearch, setTableSearch] = useState('');
  const [fieldSearch, setFieldSearch] = useState('');
  const [tablesLoading, setTablesLoading] = useState(false);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [columnsError, setColumnsError] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [queryRunning, setQueryRunning] = useState(false);
  const [status, setStatus] = useState<StatusState>({kind: null});
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [activeTenantId, setActiveTenantId] = useState('');
  const [saveModal, setSaveModal] = useState<SaveModalState>({mode: null});
  const [saveModalError, setSaveModalError] = useState<string | null>(null);
  const tablesEverLoaded = useRef(false);
  const pendingLoadAfterConfigure = useRef(false);
  const sqlEditorRef = useRef<HTMLTextAreaElement>(null);

  const sql = useMemo(
    () =>
      buildSql({
        currentTable: state.currentTable,
        selectedFields: state.selectedFields,
        aggregates: state.aggregates,
        filters: state.filters,
        filterLogic: state.filterLogic,
        orderBy: state.orderBy,
        groupBy: state.groupBy,
        limit: state.limit,
      }),
    [
      state.currentTable,
      state.selectedFields,
      state.aggregates,
      state.filters,
      state.filterLogic,
      state.orderBy,
      state.groupBy,
      state.limit,
    ],
  );

  // The Generated SQL preview should always show the SQL that would run if the
  // user clicked Run Query *right now*. In Builder view that's the reducer
  // output; in SQL view it's whatever the user has typed. This keeps the
  // editor and the preview in lock-step in both directions.
  const displaySql = state.currentView === 'editor' && state.customSql ? state.customSql : sql;

  // Auto-reveal SQL panel as soon as we have something meaningful to preview.
  useEffect(() => {
    // Intentionally only depends on `displaySql` so a user-closed panel
    // doesn't bounce back open every time the SQL string updates.
    if (displaySql && !displaySql.startsWith('--') && !showSql) {
      setShowSql(true);
    }
  }, [displaySql]);

  // Keep the SQL editor live: every change to the builder (table, columns,
  // filters, sort, limit) flows straight into the SQL textarea — the same
  // contract the Generated SQL preview holds. The view the user is currently
  // on doesn't matter; picking a table from the sidebar or toggling a column
  // updates the editor in place. The placeholder ("-- Select an entity ...")
  // is suppressed so we don't blow away typed SQL when the user clears the
  // table selection mid-edit.
  useEffect(() => {
    if (!sql || sql.startsWith('--')) return;
    if (state.customSql === sql) return;
    dispatch({type: 'setCustomSql', sql});
  }, [sql]);

  // Auto-load tables once we're connected. Mirrors autoLoadTablesIfNeeded() in the legacy code.
  useEffect(() => {
    if (tablesEverLoaded.current) return;
    if (connection.status !== 'connected' || !connection.tenantId) return;
    tablesEverLoaded.current = true;
    setTablesLoading(true);
    setStatus({kind: 'loading', text: 'Loading entities...'});
    postMessage({command: 'loadTables'});
  }, [connection.status, connection.tenantId]);

  // Show "Connecting…" + tables-loading placeholder if a tenant is configured but not yet connected.
  useEffect(() => {
    if (connection.tenantId && connection.status !== 'connected' && !tablesEverLoaded.current) {
      setTablesLoading(true);
      setStatus({kind: 'loading', text: 'Connecting...'});
    }
  }, [connection.tenantId, connection.status]);

  // Ask the extension for the saved-query library on first mount.
  useEffect(() => {
    postMessage({command: 'listSavedQueries'});
  }, []);

  // Inbound message dispatch.
  const onMessage = useCallback((msg: import('../shared/bridge/vscode.js').InboundMessage) => {
    switch (msg.command) {
      case 'connectionState':
        setConnection(msg.connection);
        if (pendingLoadAfterConfigure.current && msg.connection.tenantId) {
          pendingLoadAfterConfigure.current = false;
        }
        break;
      case 'tablesLoading':
        setTablesLoading(true);
        break;
      case 'tablesLoaded':
        setTablesLoading(false);
        dispatch({type: 'setTables', tables: msg.tables || []});
        setStatus({
          kind: 'success',
          text: `Loaded ${msg.tableCount} entities — search and click to explore.`,
        });
        break;
      case 'tablesLoadError':
        setTablesLoading(false);
        dispatch({type: 'setTables', tables: []});
        setStatus({kind: 'error', text: msg.error});
        break;
      case 'tableDescribed': {
        setColumnsLoading(false);
        setColumnsError(null);
        const cols = (msg.schema?.columns || []).map((c) => ({name: c.name, type: c.type}));
        dispatch({type: 'setColumns', columns: cols});
        break;
      }
      case 'tableDescribeError':
        setColumnsLoading(false);
        setColumnsError(String(msg.error));
        break;
      case 'queryExecuting':
        setQueryRunning(true);
        setStatus({kind: 'loading', text: 'Executing query...'});
        break;
      case 'queryResult':
        setQueryRunning(false);
        dispatch({type: 'setResults', data: msg.data});
        setShowResults(true);
        setStatus({
          kind: 'success',
          text: `Query returned ${msg.data.rowCount ?? 0} rows in ${msg.data.executionTime ?? 0}ms.`,
        });
        break;
      case 'queryError':
        setQueryRunning(false);
        setStatus({kind: 'error', text: msg.error});
        break;
      case 'savedQueries':
        setSavedQueries(Array.isArray(msg.queries) ? msg.queries : []);
        setActiveTenantId(String(msg.activeTenantId || ''));
        break;
      case 'savedQuerySaved':
      case 'savedQueryUpdated':
        setSaveModal({mode: null});
        setSaveModalError(null);
        setStatus({kind: 'success', text: 'Saved.'});
        break;
      case 'savedQueryDeleted':
        setStatus({kind: 'success', text: 'Deleted.'});
        break;
      case 'savedQueryError':
        setSaveModalError(String(msg.error || 'Could not save query.'));
        break;
      default:
        break;
    }
  }, []);
  useInboundMessages(onMessage);

  // Cmd/Ctrl + Enter runs the active query.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runQuery();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state.currentView, state.customSql, sql, connection.status, connection.tenantId]);

  const filteredTables = useMemo(() => {
    const q = tableSearch.toLowerCase();
    return state.tables.filter((t) => t.toLowerCase().includes(q));
  }, [state.tables, tableSearch]);

  const filteredColumns = useMemo(() => {
    const q = fieldSearch.toLowerCase();
    return state.columns.filter((c) => c.name.toLowerCase().includes(q));
  }, [state.columns, fieldSearch]);

  const isConnected = connection.status === 'connected';
  const runDisabled = !isConnected || (state.currentView === 'editor' ? !state.customSql.trim() : !state.currentTable);
  const tableCount =
    state.tables.length === 0
      ? '0'
      : tableSearch
        ? `${filteredTables.length}/${state.tables.length}`
        : String(state.tables.length);
  const fieldCount =
    state.columns.length === 0
      ? '0'
      : fieldSearch
        ? `${filteredColumns.length}/${state.columns.length}`
        : String(state.columns.length);

  const handleConfigure = () => postMessage({command: 'configureConnection'});

  const handleLoadTables = () => {
    if (!connection.tenantId) {
      setStatus({kind: 'error', text: 'Configure CIP connection first'});
      pendingLoadAfterConfigure.current = true;
      postMessage({command: 'configureConnection'});
      return;
    }
    setTablesLoading(true);
    dispatch({type: 'setTables', tables: state.tables}); // no-op to keep current list during reload
    setStatus({kind: 'loading', text: 'Loading entities...'});
    postMessage({command: 'loadTables'});
  };

  const selectTable = (tableName: string) => {
    dispatch({type: 'selectTable', tableName});
    setColumnsLoading(true);
    setColumnsError(null);
    postMessage({command: 'describeTable', params: {tableName}});
  };

  const switchView = (view: ViewMode) => {
    dispatch({type: 'setView', view});
    if (view === 'editor') {
      const existing = sql;
      if (existing && !existing.startsWith('--')) {
        dispatch({type: 'setCustomSql', sql: existing});
      }
    }
  };

  function runQuery() {
    if (!connection.tenantId) {
      setStatus({kind: 'error', text: 'Configure the CIP connection first.'});
      postMessage({command: 'configureConnection'});
      return;
    }
    const text = state.currentView === 'editor' ? state.customSql : sql;
    if (!text || text.startsWith('--')) {
      setStatus({kind: 'error', text: 'No valid query — select an entity first.'});
      return;
    }
    // Flip into the running state immediately so the user sees feedback even
    // before the extension host posts back `queryExecuting`. Clearing the
    // previous result + opening the results panel lets the in-panel spinner
    // act as the primary "results loading" affordance.
    setQueryRunning(true);
    dispatch({type: 'setResults', data: null});
    setShowResults(true);
    setStatus({kind: 'loading', text: 'Executing query...'});
    postMessage({command: 'executeRawQuery', params: {sql: text, fetchSize: 1000}});
  }

  function suggestQueryName(): string {
    if (state.currentTable) return state.currentTable;
    const trimmed = state.customSql.trim();
    const m = trimmed.match(/from\s+([\w."`]+)/i);
    if (m) return m[1].replace(/[`"]/g, '');
    return '';
  }

  function openSaveModal() {
    const text = state.currentView === 'editor' ? state.customSql : sql;
    if (!text || text.startsWith('--')) {
      const message = 'Build or type a query before saving.';
      setStatus({kind: 'error', text: message});
      postMessage({command: 'showWarning', params: {message}});
      return;
    }
    setSaveModalError(null);
    setSaveModal({mode: 'save', sql: text});
  }

  function loadSavedQuery(q: SavedQuery) {
    if (state.currentView !== 'editor') {
      dispatch({type: 'setView', view: 'editor'});
    }
    dispatch({type: 'setCustomSql', sql: q.sql});
    if (sqlEditorRef.current) sqlEditorRef.current.value = q.sql;
    setStatus({kind: 'success', text: `Loaded "${q.name}" — review and run.`});
  }

  return (
    <div className="app">
      <PageHeader
        eyebrow="B2C-DX Analytics"
        title="Query Builder"
        subtitle="Explore and query the CIP data warehouse with a visual builder or raw SQL."
        meta={
          <>
            <ConnectionBar connection={connection} />
            <button type="button" className="btn btn-secondary" onClick={handleConfigure}>
              Configure
            </button>
          </>
        }
      />

      <div className="toolbar-bar qb-toolbar">
        <div className="toolbar-title qb-toolbar__title">
          <span className="qb-toolbar__label">Query Composer</span>
          <span className="subtitle">Switch between visual builder and raw SQL</span>
        </div>
        <div className="spacer" />
        <button
          type="button"
          className="btn btn-primary"
          disabled={!isConnected || tablesLoading}
          aria-busy={tablesLoading}
          onClick={handleLoadTables}
        >
          {tablesLoading ? <Spinner /> : <Icon name="refresh" />}
          <span>{tablesLoading ? 'Loading…' : 'Reload Entities'}</span>
        </button>

        <SavedQueriesMenu
          queries={savedQueries}
          activeTenantId={activeTenantId}
          onLoad={loadSavedQuery}
          onRename={(q) => {
            setSaveModalError(null);
            setSaveModal({mode: 'rename', query: q});
          }}
          onDelete={(q) => postMessage({command: 'deleteQuery', params: {id: q.id}})}
        />

        <button type="button" className="btn btn-secondary" title="Save the current query" onClick={openSaveModal}>
          <Icon name="bookmark" />
          <span>Save</span>
        </button>

        <SegmentedControl
          className="view-toggle qb-view-toggle"
          value={state.currentView}
          onChange={switchView}
          options={[
            {value: 'builder', label: 'Builder'},
            {value: 'editor', label: 'SQL'},
          ]}
        />
      </div>

      <div className="sidebar">
        <SidebarSection
          className="tables"
          iconName="table"
          title="Entities"
          count={tableCount}
          searchValue={tableSearch}
          onSearchChange={setTableSearch}
          searchPlaceholder="Search entities..."
        >
          {state.tables.length === 0 && !tablesLoading ? (
            <EmptyState icon="inbox" title="No entities loaded" hint="Click Reload Entities to refresh." />
          ) : tablesLoading ? (
            <EmptyState loading title="Loading entities…" hint="Fetching metadata from the CIP data warehouse." />
          ) : filteredTables.length === 0 ? (
            <EmptyState icon="search" title="No matches" />
          ) : (
            filteredTables.map((t) => (
              <div
                key={t}
                className={`list-item${state.currentTable === t ? ' selected' : ''}`}
                data-table={t}
                onClick={() => selectTable(t)}
              >
                <span className="icon">
                  <Icon name="table" />
                </span>
                <span className="label">{t}</span>
              </div>
            ))
          )}
        </SidebarSection>

        <SidebarSection
          className="columns"
          iconName="columns"
          title="Columns"
          count={fieldCount}
          searchValue={fieldSearch}
          onSearchChange={setFieldSearch}
          searchPlaceholder="Search columns..."
        >
          {columnsError ? (
            <EmptyState icon="alert" title="Failed to load" hint={columnsError} />
          ) : columnsLoading ? (
            <EmptyState loading hint="Loading columns..." />
          ) : state.columns.length === 0 ? (
            <EmptyState icon="columns" title="Pick an entity" hint="Select an entity above to see its columns." />
          ) : filteredColumns.length === 0 ? (
            <EmptyState icon="search" title="No matches" />
          ) : (
            filteredColumns.map((c) => {
              const isSelected = state.selectedFields.includes(c.name);
              return (
                <label key={c.name} className="list-item" style={{cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    className="field-checkbox"
                    data-field={c.name}
                    checked={isSelected}
                    onChange={() => dispatch({type: 'toggleField', field: c.name})}
                  />
                  <span className="label">{c.name}</span>
                  <span className={`type-tag ${getTypeClass(c.type)}`} title={c.type}>
                    {c.type}
                  </span>
                </label>
              );
            })
          )}
        </SidebarSection>
      </div>

      <div className="main">
        <div className="main-top">
          <div className="content-scroll">
            <div className={`builder${state.currentView === 'builder' ? '' : ' hidden'}`} id="builderView">
              <SelectClause
                columns={state.columns}
                selectedFields={state.selectedFields}
                aggregates={state.aggregates}
                onToggle={(f) => dispatch({type: 'toggleField', field: f})}
                onSelectAll={() => dispatch({type: 'selectAllFields'})}
                onClear={() => dispatch({type: 'clearFields'})}
                onSetAggregate={(field, agg) => dispatch({type: 'setAggregate', field, agg})}
              />
              <FromClause currentTable={state.currentTable} />
              <WhereClause
                columns={state.columns}
                filters={state.filters}
                filterLogic={state.filterLogic}
                onAdd={() => dispatch({type: 'addFilter'})}
                onUpdate={(index, patch) => dispatch({type: 'updateFilter', index, patch})}
                onRemove={(index) => dispatch({type: 'removeFilter', index})}
                onLogicChange={(logic) => dispatch({type: 'setFilterLogic', logic})}
              />
              <GroupByClause
                columns={state.columns}
                groupBy={state.groupBy}
                onAdd={() => dispatch({type: 'addGroupBy'})}
                onUpdate={(index, column) => dispatch({type: 'updateGroupBy', index, column})}
                onRemove={(index) => dispatch({type: 'removeGroupBy', index})}
              />
              <OrderByClauseView
                columns={state.columns}
                orderBy={state.orderBy}
                onAdd={() => dispatch({type: 'addOrder'})}
                onUpdate={(index, patch) => dispatch({type: 'updateOrder', index, patch})}
                onRemove={(index) => dispatch({type: 'removeOrder', index})}
              />
              <LimitClause limit={state.limit} onChange={(limit) => dispatch({type: 'setLimit', limit})} />
            </div>
            <div className={`editor${state.currentView === 'editor' ? '' : ' hidden'}`} id="editorView">
              <textarea
                ref={sqlEditorRef}
                className="sql-editor"
                spellCheck={false}
                placeholder="SELECT * FROM ccdw_aggr_sales_summary LIMIT 10"
                value={state.customSql}
                onChange={(e) => dispatch({type: 'setCustomSql', sql: e.currentTarget.value})}
              />
            </div>
          </div>

          <SqlPreview sql={displaySql} open={showSql} />

          <div className="run-bar">
            <button
              type="button"
              className="btn-ghost"
              aria-expanded={showSql}
              aria-controls="previewPanel"
              onClick={() => setShowSql((v) => !v)}
            >
              <Icon name="code" />
              <span>{showSql ? 'Hide SQL' : 'Show SQL'}</span>
            </button>
            <button
              type="button"
              className="btn-ghost"
              aria-expanded={showResults}
              aria-controls="resultsPanel"
              disabled={!state.results && !queryRunning}
              onClick={() => setShowResults((v) => !v)}
            >
              <Icon name="table" />
              <span>{showResults ? 'Hide Results' : 'Show Results'}</span>
            </button>
            <span className="run-hint">
              Press <kbd>⌘</kbd> <kbd>↵</kbd> to run
            </span>
            <button className="btn btn-run" disabled={runDisabled || queryRunning} onClick={runQuery}>
              {queryRunning ? <Spinner /> : <Icon name="play" />}
              <span>{queryRunning ? 'Running…' : 'Run Query'}</span>
            </button>
          </div>
        </div>

        <div
          className={`results-panel${showResults && (state.results || queryRunning) ? ' visible' : ''}`}
          id="resultsPanel"
        >
          <div className="results-head">
            <div className="results-title">Results</div>
            <div className="badges">
              {state.results ? (
                <span className="badge">{(state.results.rowCount || 0).toLocaleString()} rows</span>
              ) : null}
            </div>
            <div className="results-actions">
              <button
                className="btn btn-secondary"
                disabled={!state.results || (state.results.rows?.length ?? 0) === 0}
                onClick={() => state.results && postMessage({command: 'exportCsv', params: {data: state.results}})}
              >
                <Icon name="download" />
                <span>CSV</span>
              </button>
              <button
                className="btn btn-secondary"
                disabled={!state.results || (state.results.rows?.length ?? 0) === 0}
                onClick={() => state.results && postMessage({command: 'exportJson', params: {data: state.results}})}
              >
                <Icon name="code" />
                <span>JSON</span>
              </button>
            </div>
          </div>
          <div className="results-body">
            {queryRunning ? (
              <div className="loading-panel">
                <Spinner size="lg" />
                <div className="loading-panel__title">Running query…</div>
                <div className="loading-panel__hint">Fetching rows from the CIP data warehouse.</div>
              </div>
            ) : state.results ? (
              <ResultsTable columns={state.results.columns} rows={state.results.rows} maxRows={1000} />
            ) : null}
          </div>
        </div>
      </div>

      <StatusBar kind={status.kind} text={status.text} />

      <SaveQueryModal
        state={saveModal}
        defaultName={suggestQueryName()}
        error={saveModalError}
        onClose={() => {
          setSaveModal({mode: null});
          setSaveModalError(null);
        }}
        onSubmit={(payload) => {
          if (payload.mode === 'rename' && payload.id) {
            postMessage({
              command: 'updateQuery',
              params: {id: payload.id, name: payload.name, description: payload.description, sql: payload.sql},
            });
          } else {
            postMessage({
              command: 'saveQuery',
              params: {name: payload.name, description: payload.description, sql: payload.sql},
            });
          }
        }}
      />
    </div>
  );
}
