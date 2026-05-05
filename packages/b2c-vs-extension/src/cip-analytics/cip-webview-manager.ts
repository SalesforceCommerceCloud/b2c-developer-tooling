/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  executeCipReport,
  listCipTables,
  describeCipTable,
  type CipReportDefinition,
} from '@salesforce/b2c-tooling-sdk/operations/cip';
import {
  createCipClient,
  DEFAULT_CIP_HOST,
  DEFAULT_CIP_STAGING_HOST,
  type CipClient,
} from '@salesforce/b2c-tooling-sdk/clients';
import {randomBytes} from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';

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

interface ConnectionTestResult {
  success: boolean;
  message: string;
  tableCount?: number;
}

/**
 * Manages CIP Analytics webview panels.
 * Inspired by SOQL Builder - provides visual query interface with parameter forms.
 */
export class CipWebviewManager {
  private panels = new Map<string, vscode.WebviewPanel>();

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly configProvider: B2CExtensionConfig,
    private readonly log: vscode.OutputChannel,
  ) {}

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
    const panel = vscode.window.createWebviewPanel(
      'cipAnalyticsDashboard',
      report.name,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.cipAnalyticsUri],
      },
    );

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
    const panel = vscode.window.createWebviewPanel(
      'cipTablesBrowser',
      'CIP Tables Browser',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.cipAnalyticsUri],
      },
    );

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

    const panel = vscode.window.createWebviewPanel(
      'cipQueryBuilder',
      'CIP Query Builder',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.cipAnalyticsUri],
      },
    );

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
      case 'testConnection': {
        await this.testConnection(message.params as Record<string, string>, panel);
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
        await this.loadTables(message.params as Record<string, string>, panel);
        break;
      }
      case 'describeTable': {
        await this.describeTable(message.params as Record<string, string>, panel);
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
        await this.loadTables(message.params as Record<string, string>, panel);
        break;
      }
      case 'describeTable': {
        await this.describeTable(message.params as Record<string, string>, panel);
        break;
      }
      case 'executeRawQuery': {
        await this.executeRawQuery(message.params as Record<string, string>, panel);
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
    try {
      const tenantId = params.tenantId;
      const sql = params.sql;
      const useStaging = params.useStaging === 'true';
      const fetchSize = parseInt(params.fetchSize || '1000', 10);

      if (!tenantId || !sql) {
        throw new Error('Tenant ID and SQL query are required');
      }

      this.log.appendLine(`[CIP Query Builder] Executing SQL: ${sql.substring(0, 200)}${sql.length > 200 ? '...' : ''}`);

      panel.webview.postMessage({command: 'queryExecuting'});

      const config = this.configProvider.getConfig();
      if (!config) {
        throw new Error('No configuration found');
      }

      const cipHost = config.values.cipHost ?? (useStaging ? DEFAULT_CIP_STAGING_HOST : DEFAULT_CIP_HOST);
      const oauthStrategy = config.createOAuth();
      const cipClient = createCipClient({instance: tenantId, host: cipHost}, oauthStrategy);

      const startTime = Date.now();
      const result = await cipClient.query(sql, {fetchSize});
      const executionTime = Date.now() - startTime;

      const columns = result.columns ?? [];
      const rows = result.rows ?? [];

      this.log.appendLine(`[CIP Query Builder] Query returned ${rows.length} rows in ${executionTime}ms`);

      panel.webview.postMessage({
        command: 'queryResult',
        data: {
          columns,
          rows,
          rowCount: rows.length,
          executionTime,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.appendLine(`[CIP Query Builder] Query failed: ${errorMessage}`);

      panel.webview.postMessage({
        command: 'queryError',
        error: this.formatConnectionError(error),
      });
    }
  }

  /**
   * Test CIP connection with provided tenant ID.
   */
  private async testConnection(params: Record<string, string>, panel: vscode.WebviewPanel): Promise<void> {
    try {
      const tenantId = params.tenantId;
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const useStaging = params.useStaging === 'true';
      this.log.appendLine(`[CIP Analytics] Testing connection to tenant: ${tenantId} (staging: ${useStaging})`);

      const config = this.configProvider.getConfig();
      if (!config) {
        throw new Error('No configuration found');
      }

      const cipHost = config.values.cipHost ?? (useStaging ? DEFAULT_CIP_STAGING_HOST : DEFAULT_CIP_HOST);
      const oauthStrategy = config.createOAuth();

      const cipClient = createCipClient({instance: tenantId, host: cipHost}, oauthStrategy);

      // Test with simple metadata query
      const result = await listCipTables(cipClient, {fetchSize: 1});

      const testResult: ConnectionTestResult = {
        success: true,
        message: `✅ Connected successfully! ${result.tableCount} tables available.`,
        tableCount: result.tableCount,
      };

      this.log.appendLine(`[CIP Analytics] Connection test succeeded: ${result.tableCount} tables`);

      panel.webview.postMessage({
        command: 'connectionTestResult',
        result: testResult,
      });
    } catch (error) {
      const errorMessage = this.formatConnectionError(error);
      this.log.appendLine(`[CIP Analytics] Connection test failed: ${errorMessage}`);

      const testResult: ConnectionTestResult = {
        success: false,
        message: errorMessage,
      };

      panel.webview.postMessage({
        command: 'connectionTestResult',
        result: testResult,
      });
    }
  }

  /**
   * Format connection error with helpful messages.
   */
  private formatConnectionError(error: unknown): string {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes('invalid_scope')) {
      return '❌ Invalid tenant ID or no CIP access. Verify tenant ID with your admin, or check if CIP is provisioned.';
    }
    if (msg.includes('Authentication') || msg.includes('401')) {
      return '❌ Authentication failed. Check OAuth credentials (clientId/clientSecret).';
    }
    if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
      return '❌ Connection timeout. CIP may not be provisioned yet (wait 2 hours after enabling).';
    }
    if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
      return '❌ Cannot reach CIP host. Check network connection or CIP host configuration.';
    }
    return `❌ Connection failed: ${msg}`;
  }

  /**
   * Load all CIP tables for the given tenant.
   */
  private async loadTables(params: Record<string, string>, panel: vscode.WebviewPanel): Promise<void> {
    try {
      const tenantId = params.tenantId;
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const useStaging = params.useStaging === 'true';
      this.log.appendLine(`[CIP Tables Browser] Loading tables for tenant: ${tenantId} (staging: ${useStaging})`);

      panel.webview.postMessage({
        command: 'tablesLoading',
      });

      const config = this.configProvider.getConfig();
      if (!config) {
        throw new Error('No configuration found');
      }

      const cipHost = config.values.cipHost ?? (useStaging ? DEFAULT_CIP_STAGING_HOST : DEFAULT_CIP_HOST);
      const oauthStrategy = config.createOAuth();
      const cipClient = createCipClient({instance: tenantId, host: cipHost}, oauthStrategy);

      const result = await listCipTables(cipClient);

      this.log.appendLine(`[CIP Tables Browser] Loaded ${result.tables.length} tables`);

      panel.webview.postMessage({
        command: 'tablesLoaded',
        tables: result.tables,
        tableCount: result.tableCount,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.appendLine(`[CIP Tables Browser] Failed to load tables: ${errorMessage}`);

      panel.webview.postMessage({
        command: 'tablesLoadError',
        error: this.formatConnectionError(error),
      });
    }
  }

  /**
   * Describe a specific CIP table to get its schema.
   */
  private async describeTable(params: Record<string, string>, panel: vscode.WebviewPanel): Promise<void> {
    try {
      const tenantId = params.tenantId;
      const tableName = params.tableName;
      const useStaging = params.useStaging === 'true';

      if (!tenantId || !tableName) {
        throw new Error('Tenant ID and table name are required');
      }

      this.log.appendLine(`[CIP Tables Browser] Describing table: ${tableName}`);

      panel.webview.postMessage({
        command: 'tableDescribing',
        tableName,
      });

      const config = this.configProvider.getConfig();
      if (!config) {
        throw new Error('No configuration found');
      }

      const cipHost = config.values.cipHost ?? (useStaging ? DEFAULT_CIP_STAGING_HOST : DEFAULT_CIP_HOST);
      const oauthStrategy = config.createOAuth();
      const cipClient = createCipClient({instance: tenantId, host: cipHost}, oauthStrategy);

      const schema = await describeCipTable(cipClient, tableName);

      this.log.appendLine(`[CIP Tables Browser] Table ${tableName} has ${schema.columns.length} columns`);

      panel.webview.postMessage({
        command: 'tableDescribed',
        tableName,
        schema,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.appendLine(`[CIP Tables Browser] Failed to describe table: ${errorMessage}`);

      panel.webview.postMessage({
        command: 'tableDescribeError',
        tableName: params.tableName,
        error: errorMessage,
      });
    }
  }

  /**
   * Export results to CSV file.
   */
  private async exportToCsv(data?: {columns: string[]; rows: Array<Record<string, unknown>>}): Promise<void> {
    if (!data || !data.rows || data.rows.length === 0) {
      vscode.window.showWarningMessage('No data to export');
      return;
    }

    try {
      const csv = this.generateCsv(data.columns, data.rows);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const defaultFileName = `cip-results-${timestamp}.csv`;

      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(defaultFileName),
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

      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(defaultFileName),
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
   * Execute the CIP query and send results back to webview.
   */
  private async executeQuery(
    params: Record<string, string>,
    panel: vscode.WebviewPanel,
    report: CipReportDefinition,
  ): Promise<void> {
    try {
      this.log.appendLine(`[CIP Analytics] Executing report: ${report.name} with params: ${JSON.stringify(params)}`);

      // Get config
      const config = this.configProvider.getConfig();
      if (!config) {
        throw new Error('No B2C Commerce configuration found. Ensure dw.json exists in workspace.');
      }

      // Extract tenant ID from form params (user input)
      const tenantId = params.tenantId;
      if (!tenantId) {
        throw new Error('Tenant ID is required. Enter a tenant ID in the form (e.g., "zzat_prd").');
      }

      // Extract staging flag from form params
      const useStaging = params.useStaging === 'true';

      // Extract fetch size from form params
      const fetchSize = parseInt(params.fetchSize || '1000', 10);

      this.log.appendLine(`[CIP Analytics] Using tenant ID: ${tenantId} (staging: ${useStaging}, fetchSize: ${fetchSize})`);

      // Determine CIP host
      const cipHost = config.values.cipHost ?? (useStaging ? DEFAULT_CIP_STAGING_HOST : DEFAULT_CIP_HOST);

      this.log.appendLine(`[CIP Analytics] Using CIP host: ${cipHost}`);

      // Create OAuth strategy for CIP
      const oauthStrategy = config.createOAuth();

      // Create CIP client with form-provided tenant ID
      const cipClient: CipClient = createCipClient(
        {
          instance: tenantId,
          host: cipHost,
        },
        oauthStrategy,
      );

      // Extract report parameters (not tenant/staging/fetchSize)
      const reportParams = {...params};
      delete reportParams.tenantId;
      delete reportParams.useStaging;
      delete reportParams.fetchSize;

      // Execute report with fetch size
      const result = await executeCipReport(cipClient, report.name, {
        params: reportParams,
        fetchSize,
      });

      this.log.appendLine(`[CIP Analytics] Query successful: ${result.rows.length} rows returned`);

      // Send results to webview
      panel.webview.postMessage({
        command: 'queryResults',
        data: {
          rows: result.rows,
          rowCount: result.rows.length,
          columns: result.rows.length > 0 ? Object.keys(result.rows[0]) : [],
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.appendLine(`[CIP Analytics] Query failed: ${errorMessage}`);

      // Send error to webview
      panel.webview.postMessage({
        command: 'queryError',
        error: errorMessage,
      });
    }
  }

  /**
   * Get connection info for display in webview.
   */
  private getConnectionInfo(): {tenantId: string; host: string; staging: boolean} | null {
    const config = this.configProvider.getConfig();
    if (!config) {
      return null;
    }

    const tenantId = config.values.tenantId ?? '';
    // Default to production; user can toggle via the checkbox in each panel.
    const host = config.values.cipHost ?? DEFAULT_CIP_HOST;

    return {tenantId, host, staging: false};
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

    const all: Record<string, string> = {
      __NONCE__: nonce,
      __CSP_SOURCE__: webview.cspSource,
      __STYLES_URI__: stylesUri,
      ...replacements,
    };

    for (const [token, value] of Object.entries(all)) {
      html = html.replaceAll(token, value);
    }
    return html;
  }

  private getReportDashboardContent(webview: vscode.Webview, report: CipReportDefinition): string {
    const connectionInfo = this.getConnectionInfo();
    const parameterFields = report.parameters
      .map((param) => {
        const nameAttr = CipWebviewManager.escapeAttr(param.name);
        const descAttr = CipWebviewManager.escapeAttr(param.description);
        const descText = CipWebviewManager.escapeHtml(param.description);
        const nameText = CipWebviewManager.escapeHtml(param.name);
        const required = param.required ? 'required' : '';

        let inputHtml = '';
        if (param.type === 'date') {
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
          <div class="field">
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
      __TENANT_ID__: CipWebviewManager.escapeAttr(connectionInfo?.tenantId ?? ''),
      __USE_STAGING_CHECKED__: connectionInfo?.staging ? 'checked' : '',
      __PARAMETER_FIELDS__: parameterFields,
    });
  }

  private getTablesBrowserContent(webview: vscode.Webview): string {
    const connectionInfo = this.getConnectionInfo();
    return this.renderTemplate(webview, 'tables-browser.html', {
      __TENANT_ID__: CipWebviewManager.escapeAttr(connectionInfo?.tenantId ?? ''),
      __USE_STAGING_CHECKED__: connectionInfo?.staging ? 'checked' : '',
    });
  }

  private getQueryBuilderContent(webview: vscode.Webview): string {
    const connectionInfo = this.getConnectionInfo();
    return this.renderTemplate(webview, 'query-builder.html', {
      __TENANT_ID__: CipWebviewManager.escapeAttr(connectionInfo?.tenantId ?? ''),
      __USE_STAGING_CHECKED__: connectionInfo?.staging ? 'checked' : '',
    });
  }
}
