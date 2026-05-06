/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  executeCipReport,
  listCipTables,
  describeCipTable,
  type CipReportDefinition,
} from '@salesforce/b2c-tooling-sdk/operations/cip';
import {createCipClient, type CipClient} from '@salesforce/b2c-tooling-sdk/clients';
import {randomBytes} from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import type {CipConnectionService} from './cip-connection-service.js';

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
 * Manages CIP Analytics webview panels.
 * Inspired by SOQL Builder - provides visual query interface with parameter forms.
 */
export class CipWebviewManager {
  private panels = new Map<string, vscode.WebviewPanel>();
  /** De-duplicates concurrent Load Tables clicks per panel so Avatica doesn't get hammered. */
  private tablesInFlight = new WeakMap<vscode.WebviewPanel, Promise<void>>();
  /** De-duplicates concurrent Describe Table calls per panel+table. */
  private describeInFlight = new WeakMap<vscode.WebviewPanel, Map<string, Promise<void>>>();

  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly configProvider: B2CExtensionConfig,
    private readonly connection: CipConnectionService,
    private readonly log: vscode.OutputChannel,
  ) {
    // Forward connection status to every open panel so each can refresh its banner.
    this.disposables.push(
      this.connection.onDidChange((c) => {
        for (const panel of this.panels.values()) {
          panel.webview.postMessage({command: 'connectionState', connection: c});
        }
      }),
    );
    context.subscriptions.push(...this.disposables);
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
   * Open or reveal a webview panel for the given report.
   */
  async openReport(report: CipReportDefinition): Promise<void> {
    const columnKey = `cipAnalytics-${report.name}`;

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
      localResourceRoots: [this.cipAnalyticsUri],
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
  async openTablesBrowser(): Promise<void> {
    const columnKey = 'cipAnalytics-tablesBrowser';

    // If panel already exists, reveal it
    const existingPanel = this.panels.get(columnKey);
    if (existingPanel) {
      existingPanel.reveal(vscode.ViewColumn.One);
      return;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel('cipTablesBrowser', 'CIP Tables Browser', vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [this.cipAnalyticsUri],
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
   */
  async openQueryBuilder(): Promise<void> {
    const columnKey = 'cipAnalytics-queryBuilder';

    const existingPanel = this.panels.get(columnKey);
    if (existingPanel) {
      existingPanel.reveal(vscode.ViewColumn.One);
      return;
    }

    const panel = vscode.window.createWebviewPanel('cipQueryBuilder', 'CIP Query Builder', vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [this.cipAnalyticsUri],
    });

    this.panels.set(columnKey, panel);
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
      },
      null,
      this.context.subscriptions,
    );

    this.log.appendLine('[CIP Analytics] Opened Query Builder');
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
      case 'log': {
        this.log.appendLine(`[CIP Query Builder] ${message.params?.message ?? ''}`);
        break;
      }
    }
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
      const errorMessage = this.formatConnectionError(error);
      this.log.appendLine(`[CIP Query Builder] Query failed: ${errorMessage}`);
      this.connection.markDisconnected(errorMessage);
      panel.webview.postMessage({command: 'queryError', error: errorMessage});
    }
  }

  /**
   * Format connection error with helpful messages.
   */
  private formatConnectionError(error: unknown): string {
    const msg = error instanceof Error ? error.message : String(error);

    // 429 from CIP usually means we fired too many handshakes in a short window.
    // Tell the user to back off rather than retry immediately.
    if (/\b429\b/.test(msg) || /Too Many Requests/i.test(msg)) {
      return 'Rate-limited by CIP (HTTP 429). Wait ~30 seconds before retrying.';
    }
    if (msg.includes('invalid_scope')) {
      return 'Invalid tenant ID or no CIP access. Verify tenant ID with your admin, or check if CIP is provisioned.';
    }
    if (msg.includes('Authentication') || msg.includes('401')) {
      return 'Authentication failed. Check OAuth credentials (clientId/clientSecret).';
    }
    if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
      return 'Connection timeout. CIP may not be provisioned yet (wait 2 hours after enabling).';
    }
    if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
      return 'Cannot reach CIP host. Check network connection or CIP host configuration.';
    }
    return `Connection failed: ${msg}`;
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
      const errorMessage = this.formatConnectionError(error);
      this.log.appendLine(`[CIP Tables Browser] Failed to load tables: ${errorMessage}`);
      this.connection.markDisconnected(errorMessage);
      panel.webview.postMessage({command: 'tablesLoadError', error: errorMessage});
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
      const errorMessage = this.formatConnectionError(error);
      this.log.appendLine(`[CIP Tables Browser] Failed to describe table: ${errorMessage}`);
      this.connection.markDisconnected(errorMessage);
      panel.webview.postMessage({command: 'tableDescribeError', tableName, error: errorMessage});
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
      const errorMessage = this.formatConnectionError(error);
      this.log.appendLine(`[CIP Analytics] Query failed: ${errorMessage}`);
      this.connection.markDisconnected(errorMessage);
      panel.webview.postMessage({command: 'queryError', error: errorMessage});
    }
  }

  /** Uri to the cip-analytics source folder, used as the sole localResourceRoots entry. */
  private get cipAnalyticsUri(): vscode.Uri {
    return vscode.Uri.joinPath(this.context.extensionUri, 'src', 'cip-analytics');
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
   * Load an HTML template, substitute tokens, and inject the Content-Security-Policy nonce
   * plus the webview-resolved URI for the shared stylesheet.
   */
  private renderTemplate(webview: vscode.Webview, templateName: string, replacements: Record<string, string>): string {
    const templatePath = path.join(this.context.extensionPath, 'src', 'cip-analytics', templateName);
    let html = fs.readFileSync(templatePath, 'utf-8');

    const nonce = randomBytes(16).toString('hex');
    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this.cipAnalyticsUri, 'cip-styles.css')).toString();
    const conn = this.connection.get();

    const all: Record<string, string> = {
      __NONCE__: nonce,
      __CSP_SOURCE__: webview.cspSource,
      __STYLES_URI__: stylesUri,
      // Snapshot of the shared connection for the initial banner render.
      __CONNECTION_JSON__: JSON.stringify(conn),
      ...replacements,
    };

    for (const [token, value] of Object.entries(all)) {
      html = html.replaceAll(token, value);
    }
    return html;
  }

  private getReportDashboardContent(webview: vscode.Webview, report: CipReportDefinition): string {
    const parameterFields = report.parameters
      .map((param) => {
        const nameAttr = CipWebviewManager.escapeAttr(param.name);
        const descAttr = CipWebviewManager.escapeAttr(param.description);
        const descText = CipWebviewManager.escapeHtml(param.description);
        const nameText = CipWebviewManager.escapeHtml(param.name);
        const required = param.required ? 'required' : '';

        let inputHtml = '';
        // Dates get a `.field--date` modifier so CSS can break them onto their own
        // grid row — keeps from/to ranges visually paired instead of wrapping the
        // second date to a lonely third row.
        let fieldModifier = '';
        if (param.type === 'date') {
          fieldModifier = ' field--date';
          inputHtml = `<input type="date" id="${nameAttr}" name="${nameAttr}" ${required} class="input" />`;
        } else if (param.type === 'boolean') {
          inputHtml = `
            <select id="${nameAttr}" name="${nameAttr}" ${required} class="select">
              <option value="">— Select —</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          `;
        } else if (param.type === 'number') {
          const min = param.min !== undefined ? String(param.min) : '';
          const max = param.max !== undefined ? String(param.max) : '';
          inputHtml = `<input type="number" id="${nameAttr}" name="${nameAttr}" min="${min}" max="${max}" ${required} class="input" placeholder="${descAttr}" />`;
        } else {
          inputHtml = `<input type="text" id="${nameAttr}" name="${nameAttr}" ${required} class="input" placeholder="${descAttr}" />`;
        }

        return `
          <div class="field${fieldModifier}">
            <label class="label" for="${nameAttr}">
              ${nameText}${param.required ? ' <span class="required">*</span>' : ''}
            </label>
            <span class="hint">${descText}</span>
            ${inputHtml}
          </div>
        `;
      })
      .join('');

    return this.renderTemplate(webview, 'report-dashboard.html', {
      __REPORT_NAME__: CipWebviewManager.escapeHtml(report.name),
      __REPORT_NAME_ESC__: CipWebviewManager.escapeHtml(report.name),
      __REPORT_NAME_JSON__: JSON.stringify(report.name),
      __REPORT_CATEGORY__: CipWebviewManager.escapeHtml(report.category),
      __REPORT_DESCRIPTION__: CipWebviewManager.escapeHtml(report.description),
      __PARAMETER_FIELDS__: parameterFields,
    });
  }

  private getTablesBrowserContent(webview: vscode.Webview): string {
    return this.renderTemplate(webview, 'tables-browser.html', {});
  }

  private getQueryBuilderContent(webview: vscode.Webview): string {
    return this.renderTemplate(webview, 'query-builder.html', {});
  }
}
