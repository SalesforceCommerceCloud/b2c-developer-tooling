/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Tables Browser app. Mirrors the layout and behavior of the legacy
// tables-browser.html: search + reload toolbar, two-pane split, schema
// detail with sticky header columns / types / nullable.
import * as React from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ConnectionBar} from '../shared/components/ConnectionBar.js';
import {Icon} from '../shared/components/Icon.js';
import {PageHeader} from '../shared/components/PageHeader.js';
import {Spinner} from '../shared/components/Spinner.js';
import {getInitialConnection, postMessage} from '../shared/bridge/vscode.js';
import {useInboundMessages} from '../shared/bridge/useMessage.js';
import type {ConnectionState, ColumnInfo} from '../shared/types.js';

type StatusKind = 'loading' | 'success' | 'error' | null;
interface StatusState {
  kind: StatusKind;
  text?: string;
  html?: string;
}

interface SchemaState {
  tableName: string | null;
  columns: ColumnInfo[];
  loading: boolean;
  error: string | null;
}

export function TablesBrowser() {
  const [connection, setConnection] = useState<ConnectionState>(getInitialConnection());
  const [allTables, setAllTables] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [status, setStatus] = useState<StatusState>({kind: null});
  const [schema, setSchema] = useState<SchemaState>({
    tableName: null,
    columns: [],
    loading: false,
    error: null,
  });
  const hasAutoLoadRequested = useRef(false);
  const hideTimer = useRef<number | null>(null);
  // Schema state is read inside the inbound-message callback. Mirror it into a
  // ref so the callback can stay stable across renders — without this, the ref
  // change list `[schema.tableName]` rebuilds the listener after every schema
  // update, briefly leaving an unsubscribed window where late-arriving messages
  // (`tableDescribed`, `tableDescribeError`) could be missed.
  const schemaTableNameRef = useRef<string | null>(null);
  schemaTableNameRef.current = schema.tableName;

  const setStatusFor = (kind: StatusKind, text?: string, html?: string) => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setStatus({kind, text, html});
    if (kind === 'success') {
      hideTimer.current = window.setTimeout(() => setStatus({kind: null}), 2200);
    }
  };

  const requestTablesLoad = useCallback(() => {
    if (!connection.tenantId) {
      setStatusFor('error', 'Configure CIP connection first');
      postMessage({command: 'configureConnection'});
      return;
    }
    postMessage({command: 'loadTables'});
  }, [connection.tenantId]);

  // Auto-load on first connection.
  useEffect(() => {
    if (hasAutoLoadRequested.current || hasLoadedOnce) return;
    if (connection.status !== 'connected' || !connection.tenantId) return;
    hasAutoLoadRequested.current = true;
    requestTablesLoad();
  }, [connection.status, connection.tenantId, hasLoadedOnce, requestTablesLoad]);

  const onMessage = useCallback((msg: import('../shared/bridge/vscode.js').InboundMessage) => {
    switch (msg.command) {
      case 'connectionState':
        setConnection(msg.connection);
        break;
      case 'tablesLoading':
        setStatusFor('loading', undefined, '<span class="spinner"></span> Loading entities…');
        break;
      case 'tablesLoaded':
        setAllTables(msg.tables || []);
        setHasLoadedOnce(true);
        setStatusFor('success', `Loaded ${msg.tableCount} entities.`);
        break;
      case 'tablesLoadError':
        setStatusFor('error', msg.error);
        break;
      case 'tableDescribing':
        setSchema({tableName: msg.tableName, columns: [], loading: true, error: null});
        break;
      case 'tableDescribed': {
        const cols = (msg.schema?.columns || []) as ColumnInfo[];
        setSchema({
          tableName: msg.tableName ?? schemaTableNameRef.current,
          columns: cols,
          loading: false,
          error: null,
        });
        break;
      }
      case 'tableDescribeError':
        setSchema({
          tableName: msg.tableName ?? schemaTableNameRef.current,
          columns: [],
          loading: false,
          error: msg.error,
        });
        break;
      default:
        break;
    }
  }, []);
  useInboundMessages(onMessage);

  const filteredTables = useMemo(() => {
    const q = search.toLowerCase();
    return q ? allTables.filter((t) => t.toLowerCase().includes(q)) : allTables;
  }, [allTables, search]);

  const tableCountText =
    allTables.length === 0
      ? '0'
      : filteredTables.length === allTables.length
        ? String(allTables.length)
        : `${filteredTables.length}/${allTables.length}`;

  const isConnected = connection.status === 'connected';

  function handleSelect(tableName: string) {
    setSelected(tableName);
    setSchema({tableName, columns: [], loading: true, error: null});
    postMessage({command: 'describeTable', params: {tableName}});
  }

  return (
    <>
      <PageHeader
        flat
        eyebrow="B2C-DX Analytics"
        title="Entity Browser"
        subtitle="Browse CIP data warehouse entities and inspect their schemas."
        meta={
          <>
            <ConnectionBar connection={connection} />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => postMessage({command: 'configureConnection'})}
            >
              Configure
            </button>
          </>
        }
      />

      <main className="eb-page">
        <div className="eb-toolbar">
          <div className="eb-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Search entities…"
              value={search}
              disabled={!hasLoadedOnce}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary eb-load-btn"
            disabled={!isConnected || status.kind === 'loading'}
            onClick={requestTablesLoad}
          >
            <Icon name="refresh" />
            <span>Reload Entities</span>
          </button>
        </div>

        <div className={`eb-status status-message ${status.kind || ''}`}>
          {status.html ? <span dangerouslySetInnerHTML={{__html: status.html}} /> : status.text}
        </div>

        <div className="eb-split">
          <section className="eb-pane eb-pane--list" aria-label="Entity list">
            <header className="eb-pane__head">
              <div className="eb-pane__title">
                <Icon name="table" />
                <span className="eb-pane__title-text">Entities</span>
              </div>
              <span className="eb-pane__meta" aria-live="polite">
                {tableCountText}
              </span>
            </header>
            <div className="eb-pane__body">
              {!hasLoadedOnce ? (
                <div className="eb-pane__empty">
                  <span
                    className="ic ic-table"
                    style={{['--cip-icon-size' as 'width']: '24px' as unknown as string}}
                    aria-hidden="true"
                  />
                  <div>
                    <strong>No entities loaded yet</strong>
                  </div>
                  <div>
                    Click <strong>Reload Entities</strong> to fetch the entity list from your connected CIP tenant.
                  </div>
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="eb-pane__placeholder">
                  {allTables.length === 0 ? 'No entities loaded' : 'No entities match your filter'}
                </div>
              ) : (
                filteredTables.map((t) => (
                  <div
                    key={t}
                    className={`table-item${selected === t ? ' selected' : ''}`}
                    title={t}
                    onClick={() => handleSelect(t)}
                  >
                    {t}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="eb-pane eb-pane--detail" aria-label="Entity schema">
            <header className="eb-pane__head">
              <div className="eb-pane__title">
                <Icon name="columns" />
                <span className="eb-pane__title-text">{schema.tableName ?? 'Schema'}</span>
              </div>
              {schema.tableName && !schema.loading && !schema.error ? (
                <span className="eb-pane__meta">{schema.columns.length}</span>
              ) : null}
            </header>
            <div className={`eb-pane__body${!schema.tableName ? ' is-empty' : ''}`}>
              {!schema.tableName ? (
                <span>Select an entity from the list to view its schema.</span>
              ) : schema.loading ? (
                <div className="eb-pane__placeholder">
                  <Spinner /> Loading schema…
                </div>
              ) : schema.error ? (
                <div className="eb-error">Failed to load schema: {schema.error}</div>
              ) : (
                <SchemaTable tableName={schema.tableName} columns={schema.columns} />
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function SchemaTable({tableName, columns}: {tableName: string; columns: ColumnInfo[]}) {
  return (
    <>
      <div className="eb-schema__meta">
        <strong>{tableName}</strong> · {columns.length} column{columns.length === 1 ? '' : 's'}
      </div>
      {columns.length === 0 ? (
        <div className="eb-pane__placeholder">No columns returned for this entity.</div>
      ) : (
        <table className="eb-schema">
          <colgroup>
            <col className="col-name" />
            <col className="col-type" />
            <col className="col-nullable" />
          </colgroup>
          <thead>
            <tr>
              <th>Column</th>
              <th>Type</th>
              <th>Nullable</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((c) => (
              <tr key={c.name}>
                <td className="col-name" title={c.name}>
                  {c.name}
                </td>
                <td className="col-type">
                  <span className="type-badge" title={c.type}>
                    {c.type}
                  </span>
                </td>
                <td className="col-nullable">{c.nullable ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
