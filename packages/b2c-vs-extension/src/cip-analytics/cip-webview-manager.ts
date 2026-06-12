/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  buildCipReportSql,
  executeCipReport,
  listCipTables,
  describeCipTable,
  type CipReportDefinition,
} from '@salesforce/b2c-tooling-sdk/operations/cip';
import {createCipClient, type CipClient} from '@salesforce/b2c-tooling-sdk/clients';
import {randomBytes} from 'node:crypto';
import * as os from 'node:os';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import type {CipConnectionService} from './cip-connection-service.js';
import {CipDuplicateNameError, type CipQueryLibraryService} from './cip-query-library-service.js';

type QueryResultData = {columns: string[]; rows: Array<Record<string, unknown>>};

interface WebviewMessage {
  command: string;
  reportName?: string;
  params?: {
    [key: string]: unknown;
    data?: QueryResultData;
    message?: string;
  };
}

/**
 * Serializable subset of {@link CipReportDefinition} that the host injects as
 * `window.__REPORT__` for the Report Dashboard webview. Mirrors the
 * `ReportContext` interface declared on the webview side.
 */
interface ReportContextSeed {
  name: string;
  description: string;
  category: string;
  displayName: string;
  parameters: Array<{
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    required?: boolean;
    min?: number;
    max?: number;
    options?: string[];
    multiple?: boolean;
    default?: string;
  }>;
}

function getOptionalArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter((item): item is string => typeof item === 'string');
  return strings.length > 0 ? strings : undefined;
}

const REMOTE_INCLUDE_REPORT_NAME = 'remote-include-performance';
const REMOTE_INCLUDE_TABLE_NAME = 'ccdw_aggr_include_controller_request';
const REMOTE_INCLUDE_PARENT_SELECT = 'SELECT ic.main_controller_name, ic.controller_name';
const REMOTE_INCLUDE_PARENT_GROUP = 'GROUP BY ic.main_controller_name, ic.controller_name';

/**
 * One-shot intent fired at a Query Builder panel — load a saved query into
 * the editor, or open the rename modal for one. Constructed by the host
 * (`openQueryBuilder`), consumed by the webview's inbound dispatcher.
 */
type QueryBuilderAction =
  | {kind: 'loadSavedQuery'; query: SerializableSavedQuery}
  | {kind: 'renameSavedQuery'; query: SerializableSavedQuery};

/** Plain-data view of a saved query the webview safely receives over postMessage. */
interface SerializableSavedQuery {
  id: string;
  name: string;
  sql: string;
  description?: string;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Strip the boilerplate that wraps every Avatica error so the actual
 * server-reported cause leads the message. The CIP gateway prepends
 * something like:
 *
 *   `CIP Avatica request failed (400 Bad Request): Error while executing SQL
 *    "<the entire SQL>": <real cause>`
 */
function stripPlumbingPrefix(raw: string): string {
  let s = raw.trim();
  // Remove the outer "CIP Avatica request failed (...): " wrapper.
  s = s.replace(/^CIP Avatica request failed \([^)]*\):\s*/i, '');
  s = s.replace(/^Error while executing SQL\s+"[\s\S]*?":\s*/i, '');
  return s.trim() || raw.trim();
}

/**
 * Map the inner Calcite/Phoenix error message to a short, scannable headline.
 * Falls back to a generic "Query rejected by CIP" if no pattern matches —
 * the details line still carries the full cause, so we never lose info.
 */
function headlineForQueryError(detail: string): string {
  if (/not being grouped/i.test(detail)) return 'Column needs a GROUP BY or aggregate';
  if (/column .* does not exist/i.test(detail) || /unknown column/i.test(detail)) return 'Unknown column';
  if (/table .* does not exist/i.test(detail) || /unknown table/i.test(detail)) return 'Unknown table';
  if (/invalid input syntax for type/i.test(detail)) return "Value type doesn't match column";
  if (/parse error/i.test(detail) || /syntax error/i.test(detail)) return 'SQL syntax error';
  if (/duplicate column/i.test(detail)) return 'Duplicate column in result';
  if (/division by zero/i.test(detail)) return 'Division by zero';
  return 'Query rejected by CIP';
}

function rewriteRemoteIncludeParentColumn(sql: string, parentColumn: string): string {
  if (parentColumn === 'main_controller_name') {
    return sql;
  }

  const selectReplacement = `SELECT ic.${parentColumn} AS main_controller_name, ic.controller_name`;
  const groupReplacement = `GROUP BY ic.${parentColumn}, ic.controller_name`;

  return sql
    .replace(REMOTE_INCLUDE_PARENT_SELECT, selectReplacement)
    .replace(REMOTE_INCLUDE_PARENT_GROUP, groupReplacement);
}

/**
 * Manages CIP Analytics webview panels.
 * Inspired by SOQL Builder - provides visual query interface with parameter forms.
 */
export class CipWebviewManager {
  private panels = new Map<string, vscode.WebviewPanel>();
  /** De-duplicates concurrent Load Tables clicks per panel so Avatica doesn't get hammered. */
  private tablesInFlight = new WeakMap<vscode.WebviewPanel, Promise<void>>();
  /** De-duplicates concurrent Describe Table calls per panel+table. */
  private describeInFlight = new WeakMap<vscode.WebviewPanel, Map<string, Promise<void>>>();
  /** Cache of site-id dropdown options per active tenant+host with TTL. */
  private siteOptionsCache = new Map<string, {expiresAt: number; sites: string[]}>();
  /** De-dupes concurrent site-list loads per active tenant+host. */
  private sitesInFlight = new Map<string, Promise<string[]>>();
  /** Last-seen active connection identity used to invalidate site cache on realm switch/update. */
  private activeSiteCacheKey: string | null = null;

  private readonly disposables: vscode.Disposable[] = [];

  /** Tracks which open panels are Query Builder panels — only those care about library updates. */
  private readonly queryBuilderPanels = new Set<vscode.WebviewPanel>();

  /**
   * One-shot action to dispatch to a Query Builder panel as soon as the
   * webview is ready. Set by `openQueryBuilder` when the caller asks for a
   * load/rename, drained on the next `listSavedQueries` message (the
   * webview's first-mount signal). Avoids the post-mount postMessage race:
   * if we fired the message during `createWebviewPanel`, React might not
   * have mounted yet and the message would be silently dropped.
   */
  private readonly pendingActions = new WeakMap<vscode.WebviewPanel, QueryBuilderAction>();

  /** Metadata/system table names returned by Avatica that are not tenant data entities. */
  private static readonly NON_DATA_TABLES = new Set(['quota', 'tables', 'columns']);
  /** Site list can be cached briefly; realm/host changes still invalidate immediately. */
  private static readonly SITE_OPTIONS_TTL_MS = 10 * 60 * 1000;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly configProvider: B2CExtensionConfig,
    private readonly connection: CipConnectionService,
    private readonly queryLibrary: CipQueryLibraryService,
    private readonly log: vscode.OutputChannel,
  ) {
    // Forward connection status to every open panel so each can refresh its banner.
    this.disposables.push(
      this.connection.onDidChange((c) => {
        const nextCacheKey = c.tenantId ? `${c.tenantId}@@${this.connection.resolvedHost()}` : null;
        if (nextCacheKey !== this.activeSiteCacheKey) {
          this.siteOptionsCache.clear();
          this.sitesInFlight.clear();
          this.activeSiteCacheKey = nextCacheKey;
        }

        for (const panel of this.panels.values()) {
          panel.webview.postMessage({command: 'connectionState', connection: c});
        }
      }),
    );
    // Push library updates to every open Query Builder panel so save/delete from one
    // window updates the dropdown in another.
    this.disposables.push(
      this.queryLibrary.onDidChange(() => {
        for (const panel of this.queryBuilderPanels) {
          this.sendSavedQueries(panel);
        }
      }),
    );
    context.subscriptions.push(...this.disposables);
  }

  /** Send the current saved-query list (scoped to active tenant first) to a Query Builder panel. */
  private sendSavedQueries(panel: vscode.WebviewPanel): void {
    const conn = this.connection.get();
    panel.webview.postMessage({
      command: 'savedQueries',
      queries: this.queryLibrary.list(),
      activeTenantId: conn.tenantId || '',
    });
  }

  private requireConnectedClient(): {client: CipClient; tenantId: string; host: string} | null {
    const conn = this.connection.get();
    if (!conn.tenantId) {
      void vscode.window
        .showWarningMessage('CIP Analytics is not configured. Set the tenant and environment first.', 'Configure')
        .then((choice) => {
          if (choice === 'Configure') {
            void vscode.commands.executeCommand('b2c-dx.cipAnalytics.configureConnection');
          }
        });
      return null;
    }
    const config = this.configProvider.getConfig();
    if (!config) {
      void vscode.window.showErrorMessage('No B2C configuration found (dw.json / .env).');
      return null;
    }
    const host = this.connection.resolvedHost();
    const client = createCipClient({instance: conn.tenantId, host}, config.createOAuth());
    return {client, tenantId: conn.tenantId, host};
  }

  /**
   * Route a clipboard write through the extension host. The webview's
   * `navigator.clipboard.writeText()` only works while the panel holds a
   * transient user-activation; after the first paste-and-blur subsequent
   * calls reject silently. Using `vscode.env.clipboard` keeps repeat copies
   * reliable regardless of the webview's focus state.
   */
  private async copyToClipboard(message: WebviewMessage): Promise<void> {
    const text = String(message.params?.text ?? '');
    if (text.length > 0) {
      await vscode.env.clipboard.writeText(text);
    }
  }

  /**
   * Switch realms synchronously (cheap — just updates state) and kick off the
   * Avatica handshake in the background. We deliberately do NOT await
   * `testConnection()` because it can take 2–5 seconds; webview panels open
   * instantly and pick up the connect via the `connectionState` push instead
   * of blocking the entire panel creation behind the network round-trip.
   */
  private async ensureRealmActive(realmId?: string): Promise<void> {
    if (!realmId) return;
    const current = this.connection.get();
    if (current.id !== realmId) {
      await this.connection.switchRealm(realmId);
    }
    if (this.connection.get().status !== 'connected') {
      // Fire-and-forget: webview already renders a "Connecting…" pill and a
      // "Loading entities…" placeholder while this resolves, so the user gets
      // a responsive panel immediately.
      void this.connection.testConnection().catch(() => {
        /* errors surface via connectionState `disconnected` + message */
      });
    }
  }

  /**
   * Open or reveal a webview panel for the given report.
   */
  async openReport(report: CipReportDefinition, realmId?: string): Promise<void> {
    await this.ensureRealmActive(realmId);
    const columnKey = `cipAnalytics-${realmId ?? 'default'}-${report.name}`;

    // If panel already exists, reveal it
    const existingPanel = this.panels.get(columnKey);
    if (existingPanel) {
      existingPanel.reveal(vscode.ViewColumn.One);
      return;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel('cipAnalyticsDashboard', report.name, vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: this.localResourceRoots,
    });

    this.panels.set(columnKey, panel);

    // Set initial HTML content
    panel.webview.html = this.getReportDashboardContent(panel.webview, report);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(
      async (message: WebviewMessage) => {
        await this.handleWebviewMessage(message, panel, report);
      },
      undefined,
      this.context.subscriptions,
    );

    // Clean up when panel is closed
    panel.onDidDispose(
      () => {
        this.panels.delete(columnKey);
      },
      null,
      this.context.subscriptions,
    );

    this.log.appendLine(`[CIP Analytics] Opened webview for report: ${report.name}`);
  }

  /**
   * Open or reveal the tables browser webview.
   */
  async openTablesBrowser(realmId?: string): Promise<void> {
    await this.ensureRealmActive(realmId);
    const columnKey = `cipAnalytics-tablesBrowser-${realmId ?? 'default'}`;

    // If panel already exists, reveal it
    const existingPanel = this.panels.get(columnKey);
    if (existingPanel) {
      existingPanel.reveal(vscode.ViewColumn.One);
      return;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel('cipTablesBrowser', 'CIP Entity Browser', vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: this.localResourceRoots,
    });

    this.panels.set(columnKey, panel);

    // Set initial HTML content
    panel.webview.html = this.getTablesBrowserContent(panel.webview);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(
      async (message: WebviewMessage) => {
        await this.handleTablesBrowserMessage(message, panel);
      },
      undefined,
      this.context.subscriptions,
    );

    // Clean up when panel is closed
    panel.onDidDispose(
      () => {
        this.panels.delete(columnKey);
      },
      null,
      this.context.subscriptions,
    );

    this.log.appendLine('[CIP Analytics] Opened tables browser');
  }

  /**
   * Open or reveal the Query Builder webview (inspired by SOQL Builder).
   *
   * `options.action` is a one-shot intent the panel runs as soon as it's
   * mounted — load a saved query into the editor, or open the rename modal.
   * For an existing (already-mounted) panel we postMessage immediately. For
   * a brand-new panel we stash the action in `pendingActions` and the
   * webview drains it via its first `listSavedQueries` request, which only
   * fires after React has mounted and the inbound listener is up.
   */
  async openQueryBuilder(realmId?: string, options?: {action?: QueryBuilderAction}): Promise<void> {
    await this.ensureRealmActive(realmId);
    const columnKey = `cipAnalytics-queryBuilder-${realmId ?? 'default'}`;
    const action = options?.action;

    const existingPanel = this.panels.get(columnKey);
    if (existingPanel) {
      existingPanel.reveal(vscode.ViewColumn.One);
      if (action) this.dispatchAction(existingPanel, action);
      return;
    }

    const panel = vscode.window.createWebviewPanel('cipQueryBuilder', 'CIP Query Builder', vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: this.localResourceRoots,
    });

    this.panels.set(columnKey, panel);
    this.queryBuilderPanels.add(panel);
    if (action) this.pendingActions.set(panel, action);
    panel.webview.html = this.getQueryBuilderContent(panel.webview);

    panel.webview.onDidReceiveMessage(
      async (message: WebviewMessage) => {
        await this.handleQueryBuilderMessage(message, panel);
      },
      undefined,
      this.context.subscriptions,
    );

    panel.onDidDispose(
      () => {
        this.panels.delete(columnKey);
        this.queryBuilderPanels.delete(panel);
        this.pendingActions.delete(panel);
      },
      null,
      this.context.subscriptions,
    );

    // Seed the panel with the current library so the dropdown is populated immediately.
    this.sendSavedQueries(panel);

    this.log.appendLine('[CIP Analytics] Opened Query Builder');
  }

  /**
   * Resolve a saved-query id to a plain-data record safe for postMessage.
   * Strips the in-memory references that the webview has no use for.
   */
  resolveSavedQuery(queryId: string): SerializableSavedQuery | null {
    const entry = this.queryLibrary.get(queryId);
    if (!entry) return null;
    return {
      id: entry.id,
      name: entry.name,
      sql: entry.sql,
      description: entry.description,
      tenantId: entry.tenantId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  /** Forward a one-shot action to a panel that's already past first-mount. */
  private dispatchAction(panel: vscode.WebviewPanel, action: QueryBuilderAction): void {
    if (action.kind === 'loadSavedQuery') {
      panel.webview.postMessage({command: 'loadSavedQuery', query: action.query});
    } else if (action.kind === 'renameSavedQuery') {
      panel.webview.postMessage({command: 'renameSavedQuery', query: action.query});
    }
  }

  /**
   * Handle messages from the webview.
   */
  private async handleWebviewMessage(
    message: WebviewMessage,
    panel: vscode.WebviewPanel,
    report: CipReportDefinition,
  ): Promise<void> {
    switch (message.command) {
      case 'loadSites': {
        await this.loadSites(panel);
        break;
      }
      case 'executeQuery': {
        await this.executeQuery((message.params ?? {}) as Record<string, string>, panel, report);
        break;
      }
      case 'exportCsv': {
        await this.exportToCsv(message.params?.data);
        break;
      }
      case 'exportJson': {
        await this.exportToJson(message.params?.data);
        break;
      }
      case 'configureConnection': {
        await vscode.commands.executeCommand('b2c-dx.cipAnalytics.configureConnection');
        break;
      }
      case 'copyToClipboard': {
        await this.copyToClipboard(message);
        break;
      }
      case 'log': {
        this.log.appendLine(`[CIP Analytics Webview] ${message.params?.message ?? ''}`);
        break;
      }
    }
  }

  /**
   * Handle messages from the tables browser webview.
   */
  private async handleTablesBrowserMessage(message: WebviewMessage, panel: vscode.WebviewPanel): Promise<void> {
    switch (message.command) {
      case 'loadTables': {
        await this.loadTablesOnce(panel);
        break;
      }
      case 'describeTable': {
        await this.describeTableOnce((message.params ?? {}) as Record<string, string>, panel);
        break;
      }
      case 'configureConnection': {
        await vscode.commands.executeCommand('b2c-dx.cipAnalytics.configureConnection');
        break;
      }
      case 'log': {
        this.log.appendLine(`[CIP Tables Browser] ${message.params?.message ?? ''}`);
        break;
      }
    }
  }

  /**
   * Handle messages from the Query Builder webview.
   */
  private async handleQueryBuilderMessage(message: WebviewMessage, panel: vscode.WebviewPanel): Promise<void> {
    switch (message.command) {
      case 'loadTables': {
        await this.loadTablesOnce(panel);
        break;
      }
      case 'describeTable': {
        await this.describeTableOnce((message.params ?? {}) as Record<string, string>, panel);
        break;
      }
      case 'executeRawQuery': {
        await this.executeRawQuery((message.params ?? {}) as Record<string, string>, panel);
        break;
      }
      case 'configureConnection': {
        await vscode.commands.executeCommand('b2c-dx.cipAnalytics.configureConnection');
        break;
      }
      case 'exportCsv': {
        await this.exportToCsv(message.params?.data);
        break;
      }
      case 'exportJson': {
        await this.exportToJson(message.params?.data);
        break;
      }
      case 'listSavedQueries': {
        this.sendSavedQueries(panel);
        // The webview's first-mount signal — dispatch any queued action
        // now that React is up and listening. The deletion makes this
        // genuinely one-shot: a future `listSavedQueries` (e.g. a re-mount
        // after Reload Webview) won't replay a stale action.
        const pending = this.pendingActions.get(panel);
        if (pending) {
          this.pendingActions.delete(panel);
          this.dispatchAction(panel, pending);
        }
        break;
      }
      case 'saveQuery': {
        await this.saveQuery((message.params ?? {}) as Record<string, string>, panel);
        break;
      }
      case 'updateQuery': {
        await this.updateQuery((message.params ?? {}) as Record<string, string>, panel);
        break;
      }
      case 'deleteQuery': {
        await this.deleteQuery((message.params ?? {}) as Record<string, string>, panel);
        break;
      }
      case 'showWarning': {
        const warning = String(message.params?.message ?? '').trim();
        if (warning.length > 0) {
          void vscode.window.showWarningMessage(warning);
        }
        break;
      }
      case 'copyToClipboard': {
        await this.copyToClipboard(message);
        break;
      }
      case 'log': {
        this.log.appendLine(`[CIP Query Builder] ${message.params?.message ?? ''}`);
        break;
      }
    }
  }

  /**
   * Persist a new saved query, tagged with the current tenant.
   * If the panel posts an `id`, treat as an "save as" duplicate.
   */
  private async saveQuery(params: Record<string, string>, panel: vscode.WebviewPanel): Promise<void> {
    const name = (params.name ?? '').trim();
    const sql = (params.sql ?? '').trim();
    if (!name || !sql) {
      panel.webview.postMessage({command: 'savedQueryError', error: 'Name and SQL are required.'});
      return;
    }
    const conn = this.connection.get();
    if (!conn.tenantId) {
      panel.webview.postMessage({command: 'savedQueryError', error: 'Connect to a CIP realm before saving.'});
      return;
    }
    try {
      const entry = await this.queryLibrary.save({
        name,
        sql,
        description: params.description,
        tenantId: conn.tenantId,
      });
      this.log.appendLine(`[CIP Query Builder] Saved query "${entry.name}" (${entry.id})`);
      panel.webview.postMessage({command: 'savedQuerySaved', query: entry});
    } catch (err) {
      if (err instanceof CipDuplicateNameError) {
        panel.webview.postMessage({command: 'savedQueryError', error: err.message});
        return;
      }
      throw err;
    }
  }

  /** Patch an existing saved query (rename / edit description / overwrite SQL). */
  private async updateQuery(params: Record<string, string>, panel: vscode.WebviewPanel): Promise<void> {
    const id = params.id;
    if (!id) {
      panel.webview.postMessage({command: 'savedQueryError', error: 'Missing query id.'});
      return;
    }
    const patch: Record<string, string> = {};
    if (typeof params.name === 'string') patch.name = params.name;
    if (typeof params.sql === 'string') patch.sql = params.sql;
    if (typeof params.description === 'string') patch.description = params.description;
    try {
      const next = await this.queryLibrary.update(id, patch);
      if (!next) {
        panel.webview.postMessage({command: 'savedQueryError', error: 'Query not found.'});
        return;
      }
      this.log.appendLine(`[CIP Query Builder] Updated query "${next.name}" (${next.id})`);
      panel.webview.postMessage({command: 'savedQueryUpdated', query: next});
    } catch (err) {
      if (err instanceof CipDuplicateNameError) {
        panel.webview.postMessage({command: 'savedQueryError', error: err.message});
        return;
      }
      throw err;
    }
  }

  /** Delete a saved query after a native VS Code confirmation prompt. */
  private async deleteQuery(params: Record<string, string>, panel: vscode.WebviewPanel): Promise<void> {
    const id = params.id;
    if (!id) return;
    const entry = this.queryLibrary.get(id);
    if (!entry) return;
    const choice = await vscode.window.showWarningMessage(
      `Delete saved query "${entry.name}"?`,
      {modal: true, detail: 'This cannot be undone.'},
      'Delete',
    );
    if (choice !== 'Delete') return;
    await this.queryLibrary.delete(id);
    this.log.appendLine(`[CIP Query Builder] Deleted query "${entry.name}" (${id})`);
    panel.webview.postMessage({command: 'savedQueryDeleted', id});
  }

  /**
   * Execute a raw SQL query and return results.
   */
  private async executeRawQuery(params: Record<string, string>, panel: vscode.WebviewPanel): Promise<void> {
    const sql = params.sql;
    const fetchSize = parseInt(params.fetchSize || '1000', 10);
    if (!sql) {
      panel.webview.postMessage({command: 'queryError', error: 'SQL query is required'});
      return;
    }
    const ctx = this.requireConnectedClient();
    if (!ctx) {
      panel.webview.postMessage({command: 'queryError', error: 'CIP connection is not configured.'});
      return;
    }
    try {
      this.log.appendLine(
        `[CIP Query Builder] Executing SQL: ${sql.substring(0, 200)}${sql.length > 200 ? '...' : ''}`,
      );
      panel.webview.postMessage({command: 'queryExecuting'});

      const startTime = Date.now();
      const result = await ctx.client.query(sql, {fetchSize});
      const executionTime = Date.now() - startTime;
      this.connection.markConnected(`Query OK · ${result.rows.length} rows in ${executionTime}ms`);

      this.log.appendLine(`[CIP Query Builder] Query returned ${result.rows.length} rows in ${executionTime}ms`);
      panel.webview.postMessage({
        command: 'queryResult',
        data: {
          columns: result.columns ?? [],
          rows: result.rows ?? [],
          rowCount: result.rows?.length ?? 0,
          executionTime,
        },
      });
    } catch (error) {
      const {message, headline, details, isConnectionIssue} = CipWebviewManager.classifyQueryError(error);
      this.log.appendLine(`[CIP Query Builder] Query failed: ${message}`);
      // Only flip the connection to disconnected for genuine connection
      // problems (auth, network, rate-limit, timeout).
      if (isConnectionIssue) {
        this.connection.markDisconnected(message);
      }
      panel.webview.postMessage({command: 'queryError', error: message, headline, details});
    }
  }

  /**
   * Map a low-level connection error onto a user-actionable message.
   * Pure (no `this`) so it can be unit-tested in isolation.
   */
  static formatConnectionError(error: unknown): string {
    return CipWebviewManager.classifyQueryError(error).message;
  }

  /**
   * Classify a query/connection error into a user-friendly message and a
   * flag indicating whether it represents a real connection problem.
   */
  static classifyQueryError(error: unknown): {
    message: string;
    headline?: string;
    details?: string;
    isConnectionIssue: boolean;
  } {
    const msg = error instanceof Error ? error.message : String(error);

    // 429 from CIP usually means we fired too many handshakes in a short window.
    // Tell the user to back off rather than retry immediately. This IS a
    // connection-layer signal — the gateway is rejecting traffic.
    if (/\b429\b/.test(msg) || /Too Many Requests/i.test(msg)) {
      return {
        message: 'Rate-limited by CIP (HTTP 429). Wait ~30 seconds before retrying.',
        headline: 'Rate-limited by CIP',
        details: 'Wait ~30 seconds before retrying.',
        isConnectionIssue: true,
      };
    }
    if (msg.includes('invalid_scope')) {
      return {
        message:
          'Invalid tenant ID or no CIP access. Verify tenant ID with your admin, or check if CIP is provisioned.',
        headline: 'Invalid tenant ID or CIP not provisioned',
        details: 'Verify the tenant ID with your admin, or check whether CIP is provisioned for this realm.',
        isConnectionIssue: true,
      };
    }
    if (msg.includes('Authentication') || msg.includes('401')) {
      return {
        message: 'Authentication failed. Check OAuth credentials (clientId/clientSecret).',
        headline: 'Authentication failed',
        details: 'Check the OAuth credentials (clientId / clientSecret) in dw.json.',
        isConnectionIssue: true,
      };
    }
    if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
      return {
        message: 'Connection timeout. CIP may not be provisioned yet (wait 2 hours after enabling).',
        headline: 'Connection timed out',
        details: 'CIP may not be fully provisioned yet — wait ~2 hours after enabling.',
        isConnectionIssue: true,
      };
    }
    if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
      return {
        message: 'Cannot reach CIP host. Check network connection or CIP host configuration.',
        headline: 'Cannot reach CIP host',
        details: 'Check the network connection or the CIP host configuration.',
        isConnectionIssue: true,
      };
    }

    // From here down: the server received the request and rejected the SQL
    // itself. Strip the boring plumbing ("CIP Avatica request failed
    // (400 Bad Request): Error while executing SQL "...": ") so the
    // detail line leads with the actual cause. Then map the most common
    // Calcite/Phoenix phrasings to a friendly headline.
    const stripped = stripPlumbingPrefix(msg);
    const isQueryError =
      /\b400\b/.test(msg) ||
      /Bad Request/i.test(msg) ||
      /\b404\b/.test(msg) ||
      /Not Found/i.test(msg) ||
      /parse error/i.test(msg) ||
      /syntax error/i.test(msg) ||
      /invalid input syntax/i.test(msg) ||
      /column .* does not exist/i.test(msg) ||
      /table .* does not exist/i.test(msg) ||
      /not being grouped/i.test(msg);

    if (isQueryError) {
      const headline = headlineForQueryError(stripped);
      return {
        message: `Query failed: ${msg}`,
        headline,
        details: stripped,
        isConnectionIssue: false,
      };
    }

    return {
      message: `Connection failed: ${msg}`,
      headline: 'Connection failed',
      details: msg,
      isConnectionIssue: true,
    };
  }

  private static isMissingRemoteIncludeParentColumnError(reportName: string, error: unknown): boolean {
    if (reportName !== REMOTE_INCLUDE_REPORT_NAME) {
      return false;
    }

    const message = error instanceof Error ? error.message : String(error);
    return /column\s+"?main_controll+er_name"?\s+does\s+not\s+exist/i.test(message);
  }

  private static isMissingColumnError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /column\s+"?[A-Za-z0-9_]+"?\s+does\s+not\s+exist/i.test(message);
  }

  private async resolveRemoteIncludeParentCandidates(client: CipClient, fetchSize: number): Promise<string[]> {
    const candidates: string[] = [];
    try {
      const metadata = await describeCipTable(client, REMOTE_INCLUDE_TABLE_NAME, {
        fetchSize,
        schema: 'warehouse',
      });
      const metadataCandidates = metadata.columns
        .map((column) => column.columnName.toLowerCase())
        .filter((name) => name !== 'main_controller_name' && name.endsWith('controller_name'));
      candidates.push(...metadataCandidates);
    } catch {
      // Metadata lookup can fail or be misleading on some tenants. We still try known fallback columns below.
    }

    candidates.push('parent_controller_name', 'referrer_controller_name', 'controller_name');
    return [...new Set(candidates)];
  }

  private async executeRemoteIncludeFallback(
    client: CipClient,
    reportParams: Record<string, string>,
    fetchSize: number,
  ): Promise<{rows: Array<Record<string, unknown>>}> {
    const {sql} = buildCipReportSql(REMOTE_INCLUDE_REPORT_NAME, reportParams);
    const candidates = await this.resolveRemoteIncludeParentCandidates(client, fetchSize);
    let lastError: unknown;

    for (const parentColumn of candidates) {
      const rewrittenSql = rewriteRemoteIncludeParentColumn(sql, parentColumn);
      this.log.appendLine(`[CIP Analytics] Retrying ${REMOTE_INCLUDE_REPORT_NAME} with parent column: ${parentColumn}`);
      try {
        return client.query(rewrittenSql, {fetchSize});
      } catch (error) {
        lastError = error;
        if (!CipWebviewManager.isMissingColumnError(error)) {
          throw error;
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`${REMOTE_INCLUDE_REPORT_NAME} fallback exhausted all parent-column candidates`);
  }

  /**
   * De-duped wrapper around {@link loadTables}. If another Load Tables call is already in
   * flight for the same panel, reuse that promise instead of firing a second Avatica
   * handshake — keeps rapid clicks from tripping the CIP 429 rate limit.
   */
  private async loadTablesOnce(panel: vscode.WebviewPanel): Promise<void> {
    const existing = this.tablesInFlight.get(panel);
    if (existing) {
      this.log.appendLine('[CIP Tables] Load already in flight — reusing');
      return existing;
    }
    const promise = this.loadTables(panel).finally(() => {
      this.tablesInFlight.delete(panel);
    });
    this.tablesInFlight.set(panel, promise);
    return promise;
  }

  /**
   * De-duped wrapper around {@link describeTable}. Coalesces per panel + table name so a
   * user clicking the same table repeatedly doesn't fan out metadata requests.
   */
  private async describeTableOnce(params: Record<string, string>, panel: vscode.WebviewPanel): Promise<void> {
    const tableName = params.tableName ?? '';
    let panelMap = this.describeInFlight.get(panel);
    if (!panelMap) {
      panelMap = new Map();
      this.describeInFlight.set(panel, panelMap);
    }
    const existing = panelMap.get(tableName);
    if (existing) {
      this.log.appendLine(`[CIP Tables] Describe already in flight for ${tableName} — reusing`);
      return existing;
    }
    const promise = this.describeTable(params, panel).finally(() => {
      panelMap?.delete(tableName);
    });
    panelMap.set(tableName, promise);
    return promise;
  }

  /**
   * Load all CIP tables for the current connection.
   */
  private async loadTables(panel: vscode.WebviewPanel): Promise<void> {
    const ctx = this.requireConnectedClient();
    if (!ctx) {
      panel.webview.postMessage({command: 'tablesLoadError', error: 'CIP connection is not configured.'});
      return;
    }
    try {
      this.log.appendLine(`[CIP Tables Browser] Loading tables for tenant ${ctx.tenantId} @ ${ctx.host}`);
      panel.webview.postMessage({command: 'tablesLoading'});

      const result = await listCipTables(ctx.client);

      // The SDK hard-codes `row.tableName` (camelCase) when mapping metadata rows. When the
      // JDBC driver returns the raw uppercase label (TABLE_NAME), the SDK produces N rows of
      // {tableName: ''} and the raw labels are gone by the time we see the result — no amount
      // of key-pattern matching on `result.tables` can recover them. In that case fall back to
      // a direct `client.query()` which gives us rows keyed by whatever label the driver emitted.
      let tableNames = result.tables.map((t) => t.tableName).filter((n) => n.length > 0);

      if (tableNames.length === 0 && result.tableCount > 0) {
        this.log.appendLine(
          `[CIP Tables Browser] SDK returned ${result.tableCount} tables but names were blank — re-querying metadata directly.`,
        );
        const raw = await ctx.client.query(`SELECT tableName FROM metadata.TABLES ORDER BY tableSchem, tableName`);
        const extractName = (row: Record<string, unknown>): string => {
          for (const key of Object.keys(row)) {
            if (/^table[_ ]?name$/i.test(key)) {
              const v = row[key];
              if (typeof v === 'string' && v.length > 0) return v;
            }
          }
          return '';
        };
        tableNames = raw.rows.map(extractName).filter((n) => n.length > 0);
      }

      tableNames = tableNames.filter((name) => !CipWebviewManager.NON_DATA_TABLES.has(name.toLowerCase()));

      this.connection.markConnected(`${tableNames.length} tables available`);
      this.log.appendLine(
        `[CIP Tables Browser] Loaded ${tableNames.length}/${result.tableCount} tables; sample: ${JSON.stringify(tableNames.slice(0, 3))}`,
      );

      panel.webview.postMessage({
        command: 'tablesLoaded',
        tables: tableNames,
        tableCount: tableNames.length,
      });
    } catch (error) {
      const {message, headline, details, isConnectionIssue} = CipWebviewManager.classifyQueryError(error);
      this.log.appendLine(`[CIP Tables Browser] Failed to load tables: ${message}`);
      if (isConnectionIssue) {
        this.connection.markDisconnected(message);
      }
      panel.webview.postMessage({command: 'tablesLoadError', error: message, headline, details});
    }
  }

  /**
   * Describe a specific CIP table to get its schema.
   */
  private async describeTable(params: Record<string, string>, panel: vscode.WebviewPanel): Promise<void> {
    const tableName = params.tableName;
    if (!tableName) {
      panel.webview.postMessage({command: 'tableDescribeError', error: 'Table name is required'});
      return;
    }
    const ctx = this.requireConnectedClient();
    if (!ctx) {
      panel.webview.postMessage({
        command: 'tableDescribeError',
        tableName,
        error: 'CIP connection is not configured.',
      });
      return;
    }
    try {
      this.log.appendLine(`[CIP Tables Browser] Describing table: ${tableName}`);
      panel.webview.postMessage({command: 'tableDescribing', tableName});

      const schema = await describeCipTable(ctx.client, tableName);

      // Webview expects {name, type, nullable}; SDK emits {columnName, dataType, isNullable}.
      // Same mapping gap as listCipTables: if the driver returned uppercase labels the SDK
      // silently produced empty columnName fields, so fall back to a direct metadata query.
      let columns = schema.columns
        .map((c) => ({name: c.columnName, type: c.dataType, nullable: c.isNullable}))
        .filter((c) => c.name.length > 0);

      if (columns.length === 0 && schema.columns.length > 0) {
        // Defense-in-depth: only run the metadata-fallback SQL for
        // identifier-shaped table names. The webview always sends a name from
        // the previously-loaded list, but this handler is reachable from any
        // caller that posts a `describeTable` message, so lock the input down
        // to a SQL identifier before string-interpolating it.
        if (!CipWebviewManager.isSafeTableIdentifier(tableName)) {
          panel.webview.postMessage({
            command: 'tableDescribeError',
            tableName,
            error: 'Invalid table name.',
          });
          return;
        }
        this.log.appendLine(
          `[CIP Tables Browser] SDK returned ${schema.columns.length} columns but names were blank — re-querying metadata directly.`,
        );
        const raw = await ctx.client.query(
          `SELECT columnName, typeName, isNullable FROM metadata.COLUMNS WHERE tableName = '${tableName.replace(/'/g, "''")}' ORDER BY ordinalPosition`,
        );
        const pick = (row: Record<string, unknown>, pattern: RegExp): string => {
          for (const key of Object.keys(row)) {
            if (pattern.test(key)) {
              const v = row[key];
              if (typeof v === 'string' && v.length > 0) return v;
              if (v !== null && v !== undefined) return String(v);
            }
          }
          return '';
        };
        columns = raw.rows
          .map((row) => ({
            name: pick(row, /^column[_ ]?name$/i),
            type: pick(row, /^(type[_ ]?name|data[_ ]?type)$/i),
            nullable: /^(1|true|yes)$/i.test(pick(row, /^(is[_ ]?nullable|nullable)$/i)),
          }))
          .filter((c) => c.name.length > 0);
      }

      this.connection.markConnected();
      this.log.appendLine(
        `[CIP Tables Browser] Table ${tableName} has ${columns.length} columns; sample: ${JSON.stringify(columns.slice(0, 2).map((c) => c.name))}`,
      );

      panel.webview.postMessage({command: 'tableDescribed', tableName, schema: {columns}});
    } catch (error) {
      const {message, headline, details, isConnectionIssue} = CipWebviewManager.classifyQueryError(error);
      this.log.appendLine(`[CIP Tables Browser] Failed to describe table: ${message}`);
      if (isConnectionIssue) {
        this.connection.markDisconnected(message);
      }
      panel.webview.postMessage({command: 'tableDescribeError', tableName, error: message, headline, details});
    }
  }

  /**
   * Export results to CSV file.
   */
  /**
   * Resolves a writable directory for the Save dialog's default location.
   * Falls back in this order: first workspace folder → user's home → OS temp.
   * Without this, `Uri.file('filename.csv')` resolves to `/filename.csv` which is read-only.
   */
  private defaultExportDir(): vscode.Uri {
    const ws = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (ws && ws.scheme === 'file') return ws;
    const home = os.homedir();
    if (home) return vscode.Uri.file(home);
    return vscode.Uri.file(os.tmpdir());
  }

  private async exportToCsv(data?: {columns: string[]; rows: Array<Record<string, unknown>>}): Promise<void> {
    if (!data || !data.rows || data.rows.length === 0) {
      vscode.window.showWarningMessage('No data to export');
      return;
    }

    try {
      const csv = this.generateCsv(data.columns, data.rows);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const defaultFileName = `cip-results-${timestamp}.csv`;
      const defaultUri = vscode.Uri.joinPath(this.defaultExportDir(), defaultFileName);

      const uri = await vscode.window.showSaveDialog({
        defaultUri,
        filters: {
          'CSV Files': ['csv'],
          'All Files': ['*'],
        },
      });

      if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(csv, 'utf8'));
        vscode.window.showInformationMessage(`Exported ${data.rows.length} rows to ${uri.fsPath}`);
        this.log.appendLine(`[CIP Analytics] Exported to CSV: ${uri.fsPath}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Export failed: ${errorMessage}`);
      this.log.appendLine(`[CIP Analytics] CSV export failed: ${errorMessage}`);
    }
  }

  /**
   * Export results to JSON file.
   */
  private async exportToJson(data?: {columns: string[]; rows: Array<Record<string, unknown>>}): Promise<void> {
    if (!data || !data.rows || data.rows.length === 0) {
      vscode.window.showWarningMessage('No data to export');
      return;
    }

    try {
      const json = JSON.stringify(data.rows, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const defaultFileName = `cip-results-${timestamp}.json`;
      const defaultUri = vscode.Uri.joinPath(this.defaultExportDir(), defaultFileName);

      const uri = await vscode.window.showSaveDialog({
        defaultUri,
        filters: {
          'JSON Files': ['json'],
          'All Files': ['*'],
        },
      });

      if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(json, 'utf8'));
        vscode.window.showInformationMessage(`Exported ${data.rows.length} rows to ${uri.fsPath}`);
        this.log.appendLine(`[CIP Analytics] Exported to JSON: ${uri.fsPath}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Export failed: ${errorMessage}`);
      this.log.appendLine(`[CIP Analytics] JSON export failed: ${errorMessage}`);
    }
  }

  /**
   * Generate CSV string from columns and rows.
   */
  private generateCsv(columns: string[], rows: Array<Record<string, unknown>>): string {
    const escapeCsvValue = (value: unknown): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const str = String(value);
      // Escape double quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = columns.map(escapeCsvValue).join(',');
    const dataRows = rows.map((row) => columns.map((col) => escapeCsvValue(row[col])).join(',')).join('\n');

    return `${header}\n${dataRows}`;
  }

  /**
   * Fetch the list of site IDs from ccdw_dim_site and send to the webview.
   */
  private async loadSites(panel: vscode.WebviewPanel): Promise<void> {
    const ctx = this.requireConnectedClient();
    if (!ctx) {
      panel.webview.postMessage({command: 'sitesLoaded', sites: []});
      return;
    }

    const cacheKey = `${ctx.tenantId}@@${ctx.host}`;
    const cached = this.siteOptionsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      panel.webview.postMessage({command: 'sitesLoaded', sites: cached.sites});
      return;
    }

    let inFlight = this.sitesInFlight.get(cacheKey);
    if (!inFlight) {
      inFlight = (async () => {
        const result = await ctx.client.query(
          `SELECT DISTINCT nsite_id FROM ccdw_dim_site WHERE nsite_id IS NOT NULL ORDER BY nsite_id`,
          {fetchSize: 500},
        );
        return result.rows.map((r) => String(r.nsite_id ?? '')).filter(Boolean);
      })().finally(() => {
        this.sitesInFlight.delete(cacheKey);
      });
      this.sitesInFlight.set(cacheKey, inFlight);
    }

    try {
      const sites = await inFlight;
      this.siteOptionsCache.set(cacheKey, {
        expiresAt: Date.now() + CipWebviewManager.SITE_OPTIONS_TTL_MS,
        sites,
      });
      panel.webview.postMessage({command: 'sitesLoaded', sites});
    } catch {
      panel.webview.postMessage({command: 'sitesLoaded', sites: []});
    }
  }

  /**
   * Execute the CIP report query and send results back to webview.
   */
  private async executeQuery(
    params: Record<string, string>,
    panel: vscode.WebviewPanel,
    report: CipReportDefinition,
  ): Promise<void> {
    const ctx = this.requireConnectedClient();
    if (!ctx) {
      panel.webview.postMessage({command: 'queryError', error: 'CIP connection is not configured.'});
      return;
    }
    try {
      const fetchSize = parseInt(params.fetchSize || '1000', 10);
      // Only forward report parameters; tenant/host come from the shared connection.
      const reportParams = {...params};
      delete reportParams.fetchSize;

      this.log.appendLine(
        `[CIP Analytics] Executing report ${report.name} @ ${ctx.host} (tenant=${ctx.tenantId}, fetchSize=${fetchSize})`,
      );

      const result = await executeCipReport(ctx.client, report.name, {
        params: reportParams,
        fetchSize,
      });

      this.connection.markConnected(`Report OK · ${result.rows.length} rows`);
      this.log.appendLine(`[CIP Analytics] Query successful: ${result.rows.length} rows returned`);

      panel.webview.postMessage({
        command: 'queryResults',
        data: {
          rows: result.rows,
          rowCount: result.rows.length,
          columns: result.rows.length > 0 ? Object.keys(result.rows[0]) : [],
        },
      });
    } catch (error) {
      if (CipWebviewManager.isMissingRemoteIncludeParentColumnError(report.name, error)) {
        try {
          const fetchSize = parseInt(params.fetchSize || '1000', 10);
          const reportParams = {...params};
          delete reportParams.fetchSize;
          const result = await this.executeRemoteIncludeFallback(ctx.client, reportParams, fetchSize);
          this.connection.markConnected(`Report OK · ${result.rows.length} rows`);
          this.log.appendLine(
            `[CIP Analytics] Query recovered with remote-include fallback: ${result.rows.length} rows returned`,
          );
          panel.webview.postMessage({
            command: 'queryResults',
            data: {
              rows: result.rows,
              rowCount: result.rows.length,
              columns: result.rows.length > 0 ? Object.keys(result.rows[0]) : [],
            },
          });
          return;
        } catch (retryError) {
          error = retryError;
        }
      }

      const {message, headline, details, isConnectionIssue} = CipWebviewManager.classifyQueryError(error);
      this.log.appendLine(`[CIP Analytics] Query failed: ${message}`);
      if (isConnectionIssue) {
        this.connection.markDisconnected(message);
      }
      panel.webview.postMessage({command: 'queryError', error: message, headline, details});
    }
  }

  /**
   * Uri to the CIP Analytics shared CSS in the packaged dist tree.
   * Esbuild's build step (`copyCipStyles` in scripts/esbuild-bundle.mjs) copies
   * `src/cip-analytics/cip-styles.css` to `dist/cip-analytics/` so the runtime
   * extension never reaches back into `src/`.
   */
  private get cipAnalyticsUri(): vscode.Uri {
    return vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'cip-analytics');
  }

  /** Uri to the bundled React webview UI assets (esbuild output). */
  private get webviewUiUri(): vscode.Uri {
    return vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview-ui');
  }

  /** Resource roots a CIP Analytics webview is allowed to load assets from. */
  private get localResourceRoots(): vscode.Uri[] {
    return [this.cipAnalyticsUri, this.webviewUiUri];
  }

  /** Escapes a string for safe embedding in HTML text content. */
  private static escapeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Escapes a string for safe embedding inside a double-quoted HTML attribute. */
  private static escapeAttr(input: string): string {
    return input.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /**
   * Whitelist for SQL table identifiers. Allows `name` or `schema.name`, each
   * segment a standard `[A-Za-z_][A-Za-z0-9_]*` token. Used before
   * interpolating a user-provided table name into the metadata-fallback SQL
   * inside `describeTable`.
   */
  private static isSafeTableIdentifier(name: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?$/.test(name);
  }

  /**
   * Build the HTML shell that mounts a React webview UI bundle.
   *
   * Each panel is now a small React app under src/webview-ui/, bundled by
   * esbuild into dist/webview-ui/<entry>.js. The HTML returned here is a tiny
   * shell that wires up the CSP nonce, the shared stylesheet, the initial
   * connection state, and any panel-specific bootstrap data.
   */
  private renderReactShell(
    webview: vscode.Webview,
    options: {
      title: string;
      bodyClass?: string;
      htmlClass?: string;
      entry: 'query-builder' | 'tables-browser' | 'report-dashboard';
      reportContext?: ReportContextSeed;
    },
  ): string {
    const nonce = randomBytes(16).toString('hex');
    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this.cipAnalyticsUri, 'cip-styles.css')).toString();
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.webviewUiUri, `${options.entry}.js`)).toString();
    const conn = this.connection.get();
    const cspSource = webview.cspSource;
    const htmlClass = options.htmlClass ? ` class="${CipWebviewManager.escapeAttr(options.htmlClass)}"` : '';
    const bodyClass = options.bodyClass ? ` class="${CipWebviewManager.escapeAttr(options.bodyClass)}"` : '';
    const reportSeed = options.reportContext ? `window.__REPORT__ = ${JSON.stringify(options.reportContext)};` : '';
    return [
      '<!doctype html>',
      `<html lang="en"${htmlClass}>`,
      '  <head>',
      '    <meta charset="UTF-8" />',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      `    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${cspSource}; img-src ${cspSource} data:; font-src ${cspSource};" />`,
      `    <title>${CipWebviewManager.escapeHtml(options.title)}</title>`,
      `    <link rel="stylesheet" href="${stylesUri}" />`,
      '  </head>',
      `  <body${bodyClass}>`,
      '    <div id="root"></div>',
      `    <script nonce="${nonce}">window.__INITIAL_CONNECTION__ = ${JSON.stringify(conn)};${reportSeed}</script>`,
      `    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>`,
      '  </body>',
      '</html>',
    ].join('\n');
  }

  private getReportDashboardContent(webview: vscode.Webview, report: CipReportDefinition): string {
    // The React app renders the parameter form from the injected report context.
    // Pass only serializable fields; CipReportDefinition includes `buildSql`, a function.
    const displayName = report.name
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return this.renderReactShell(webview, {
      title: displayName,
      entry: 'report-dashboard',
      reportContext: {
        name: report.name,
        description: report.description,
        category: report.category,
        displayName,
        parameters: report.parameters.map((p) => {
          const raw = p as unknown as Record<string, unknown>;
          return {
            name: p.name,
            description: p.description,
            type: p.type,
            required: p.required,
            min: p.min,
            max: p.max,
            options: getOptionalArray(raw.options),
            multiple: typeof raw.multiple === 'boolean' ? raw.multiple : undefined,
            default: typeof raw.default === 'string' ? raw.default : undefined,
          };
        }),
      },
    });
  }

  private getTablesBrowserContent(webview: vscode.Webview): string {
    return this.renderReactShell(webview, {
      title: 'CIP Entity Browser',
      bodyClass: 'cip-entity-browser',
      entry: 'tables-browser',
    });
  }

  private getQueryBuilderContent(webview: vscode.Webview): string {
    return this.renderReactShell(webview, {
      title: 'CIP Query Builder',
      htmlClass: 'cip-query-builder',
      bodyClass: 'cip-query-builder',
      entry: 'query-builder',
    });
  }
}
