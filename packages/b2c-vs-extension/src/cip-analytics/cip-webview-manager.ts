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
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';

interface WebviewMessage {
  command: string;
  reportName?: string;
  params?: Record<string, string | {columns: string[]; rows: Array<Record<string, unknown>>}>;
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
      `📊 ${report.name}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.context.extensionUri],
      },
    );

    this.panels.set(columnKey, panel);

    // Set initial HTML content
    panel.webview.html = this.getWebviewContent(report);

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
      '📋 CIP Tables Browser',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.context.extensionUri],
      },
    );

    this.panels.set(columnKey, panel);

    // Set initial HTML content
    panel.webview.html = this.getTablesBrowserContent();

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
      '⚡ CIP Query Builder',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.context.extensionUri],
      },
    );

    this.panels.set(columnKey, panel);
    panel.webview.html = this.getQueryBuilderContent();

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
        await this.executeQuery(message.params ?? {}, panel, report);
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

      const columns = (result.columns ?? []).map((c) => c.label);
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

    const tenantId = config.values.tenantId ?? 'Not configured';
    const useStaging = config.values.cipStaging ?? false;
    const host = config.values.cipHost ?? (useStaging ? DEFAULT_CIP_STAGING_HOST : DEFAULT_CIP_HOST);

    return {tenantId, host, staging: useStaging};
  }

  /**
   * Generate HTML content for the webview.
   * Inspired by SOQL Builder's clean, form-based interface.
   */
  private getWebviewContent(report: CipReportDefinition): string {
    const connectionInfo = this.getConnectionInfo();
    const parameterFields = report.parameters
      .map((param) => {
        const required = param.required ? 'required' : '';
        const placeholder = param.description || '';

        let inputHtml = '';

        if (param.type === 'date') {
          inputHtml = `<input type="date" id="${param.name}" name="${param.name}" ${required} class="input" />`;
        } else if (param.type === 'boolean') {
          inputHtml = `
            <select id="${param.name}" name="${param.name}" ${required} class="select">
              <option value="">— Select —</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          `;
        } else if (param.type === 'number') {
          const min = 'min' in param ? param.min : '';
          const max = 'max' in param ? param.max : '';
          inputHtml = `<input type="number" id="${param.name}" name="${param.name}" min="${min}" max="${max}" ${required} class="input" placeholder="${placeholder}" />`;
        } else {
          inputHtml = `<input type="text" id="${param.name}" name="${param.name}" ${required} class="input" placeholder="${placeholder}" />`;
        }

        return `
          <div class="field">
            <label class="label" for="${param.name}">
              ${param.name}${param.required ? ' <span class="required">*</span>' : ''}
            </label>
            <span class="hint">${param.description}</span>
            ${inputHtml}
          </div>
        `;
      })
      .join('');


    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.name}</title>
  <style>
    :root {
      --accent: #0176D3;
      --accent-hover: #014486;
      --accent-light: #1B96FF;
      --accent-soft: rgba(1, 118, 211, 0.1);
      --accent-softer: rgba(1, 118, 211, 0.05);
      --success: #2E844A;
      --success-soft: rgba(46, 132, 74, 0.1);
      --error: #BA0517;
      --error-soft: rgba(186, 5, 23, 0.1);
      --warning: #DD7A01;
      --warning-soft: rgba(221, 122, 1, 0.1);
      --keyword: #0176D3;
      --card-radius: 8px;
      --chip-radius: 14px;
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.08);
      --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
      --transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--vscode-font-family);
      font-size: 13px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      padding: 0;
      margin: 0;
    }

    .page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 24px 40px;
    }

    /* === HERO HEADER === */
    .hero {
      position: relative;
      padding: 24px 28px;
      background: linear-gradient(135deg, var(--accent-soft) 0%, transparent 100%);
      border: 1px solid var(--accent-soft);
      border-radius: var(--card-radius);
      margin-bottom: 24px;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: -60px;
      right: -60px;
      width: 180px;
      height: 180px;
      background: radial-gradient(circle, var(--accent-soft) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-row {
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
    }

    .hero-icon {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(1, 118, 211, 0.3);
      flex-shrink: 0;
    }

    .hero-body {
      flex: 1;
      min-width: 0;
    }

    .hero-category {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--accent);
      margin-bottom: 4px;
    }

    .hero-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 6px;
      color: var(--vscode-foreground);
      line-height: 1.2;
    }

    .hero-description {
      font-size: 13px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.5;
    }

    /* === CARD LAYOUT === */
    .card {
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: var(--card-radius);
      margin-bottom: 20px;
      overflow: hidden;
      transition: var(--transition);
    }

    .card:hover {
      border-color: rgba(128, 128, 128, 0.5);
      box-shadow: var(--shadow-sm);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      background: linear-gradient(180deg, var(--vscode-editorWidget-background) 0%, transparent 100%);
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .card-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: var(--accent-soft);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    .card-title-group {
      flex: 1;
    }

    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--vscode-foreground);
      line-height: 1.3;
    }

    .card-subtitle {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 2px;
    }

    .card-body {
      padding: 18px 20px;
    }

    /* === TWO COLUMN LAYOUT === */
    .config-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 700px) {
      .config-grid { grid-template-columns: 1fr; }
    }

    /* === FORM FIELDS === */
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field.inline {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: end;
    }

    .field.full { grid-column: 1 / -1; }

    .label {
      font-size: 12px;
      font-weight: 600;
      color: var(--vscode-foreground);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .label .required {
      color: var(--error);
      font-weight: 700;
    }

    .hint {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.4;
    }

    .input, .select {
      width: 100%;
      padding: 8px 10px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.4));
      border-radius: 4px;
      font-size: 13px;
      font-family: var(--vscode-font-family);
      transition: var(--transition);
      outline: none;
    }

    .input:hover:not(:focus), .select:hover:not(:focus) {
      border-color: rgba(128, 128, 128, 0.7);
    }

    .input:focus, .select:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-soft);
    }

    .input[type="date"] {
      cursor: pointer;
    }

    /* Checkbox styled as card */
    .checkbox-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.4));
      border-radius: 4px;
      cursor: pointer;
      transition: var(--transition);
      user-select: none;
    }

    .checkbox-card:hover {
      border-color: var(--accent);
      background-color: var(--accent-soft);
    }

    .checkbox-card input[type="checkbox"] {
      accent-color: var(--accent);
      cursor: pointer;
      width: 14px;
      height: 14px;
    }

    .checkbox-card-content {
      flex: 1;
    }

    .checkbox-card-title {
      font-size: 12px;
      font-weight: 600;
    }

    .checkbox-card-hint {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 2px;
    }

    /* === BUTTONS === */
    .btn {
      padding: 8px 14px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: var(--transition);
      font-family: var(--vscode-font-family);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .btn-primary {
      background-color: var(--accent);
      color: white;
      border-color: var(--accent);
      box-shadow: 0 1px 2px rgba(1, 118, 211, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      background-color: var(--accent-hover);
      border-color: var(--accent-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(1, 118, 211, 0.4);
    }

    .btn-primary:active:not(:disabled) { transform: translateY(0); }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .btn-run {
      background: linear-gradient(135deg, #2E844A 0%, #1F6036 100%);
      color: white;
      border-color: #1F6036;
      padding: 10px 20px;
      font-size: 13px;
      box-shadow: 0 2px 4px rgba(46, 132, 74, 0.3);
    }

    .btn-run:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(46, 132, 74, 0.4);
    }

    .btn-run:disabled {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border-color: transparent;
      box-shadow: none;
      opacity: 0.5;
    }

    .btn-secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: 1px solid var(--vscode-button-border, rgba(128, 128, 128, 0.3));
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: var(--vscode-button-secondaryHoverBackground);
      border-color: var(--accent);
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* === ACTION BAR === */
    .action-bar {
      position: sticky;
      bottom: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      background: linear-gradient(180deg, transparent 0%, var(--vscode-editor-background) 30%, var(--vscode-editor-background) 100%);
      border-top: 1px solid var(--vscode-panel-border);
      margin-top: 8px;
      backdrop-filter: blur(10px);
      z-index: 10;
    }

    .action-bar .info {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      flex: 1;
    }

    .action-bar .info kbd {
      padding: 2px 6px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.3));
      border-radius: 3px;
      font-size: 11px;
      font-family: var(--vscode-editor-font-family);
    }

    /* === CONNECTION STATUS === */
    .conn-status {
      display: none;
      padding: 10px 12px;
      border-radius: 4px;
      font-size: 12px;
      margin-top: 10px;
      line-height: 1.4;
      gap: 8px;
      align-items: center;
    }

    .conn-status.visible { display: flex; }

    .conn-status.testing {
      background: var(--accent-soft);
      color: var(--accent);
      border-left: 3px solid var(--accent);
    }

    .conn-status.success {
      background: var(--success-soft);
      color: var(--success);
      border-left: 3px solid var(--success);
    }

    .conn-status.error {
      background: var(--error-soft);
      color: var(--error);
      border-left: 3px solid var(--error);
    }

    /* === STATUS MESSAGE === */
    .status-msg {
      display: none;
      padding: 10px 14px;
      border-radius: 4px;
      font-size: 12px;
      margin-top: 12px;
      align-items: center;
      gap: 8px;
    }

    .status-msg.visible { display: flex; }

    .status-msg.loading {
      background: var(--accent-soft);
      color: var(--accent);
    }

    .status-msg.success {
      background: var(--success-soft);
      color: var(--success);
    }

    .status-msg.error {
      background: var(--error-soft);
      color: var(--error);
    }

    /* === SPINNER === */
    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* === RESULTS === */
    .results {
      display: none;
    }

    .results.visible { display: block; }

    .results-toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      background: var(--vscode-editorWidget-background);
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .results-meta {
      display: flex;
      gap: 6px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      background: var(--success-soft);
      color: var(--success);
      border-radius: 11px;
      font-size: 11px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .badge.neutral {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }

    .results-actions {
      margin-left: auto;
      display: flex;
      gap: 6px;
    }

    .results-scroll {
      max-height: 600px;
      overflow: auto;
    }

    .results-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
    .results-scroll::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-background);
      border-radius: 5px;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .table thead {
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .table th {
      text-align: left;
      padding: 10px 14px;
      background: var(--vscode-editorWidget-background);
      border-bottom: 2px solid var(--accent);
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      transition: var(--transition);
    }

    .table th:hover {
      background: var(--accent-soft);
      color: var(--accent);
    }

    .table th .sort {
      margin-left: 6px;
      opacity: 0.5;
      font-size: 10px;
    }

    .table th.sorted .sort { opacity: 1; color: var(--accent); }

    .table td {
      padding: 8px 14px;
      border-bottom: 1px solid var(--vscode-panel-border);
      font-family: var(--vscode-editor-font-family);
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .table tr { transition: var(--transition); }

    .table tr:hover { background-color: var(--accent-soft); }

    .table tr:nth-child(even) { background-color: rgba(128, 128, 128, 0.03); }

    .null-cell {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
    }

    .no-results {
      padding: 60px 20px;
      text-align: center;
      color: var(--vscode-descriptionForeground);
    }

    .no-results .icon {
      font-size: 48px;
      opacity: 0.3;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- === HERO === -->
    <div class="hero">
      <div class="hero-row">
        <div class="hero-icon">📊</div>
        <div class="hero-body">
          <div class="hero-category">${report.category}</div>
          <div class="hero-title">${report.name}</div>
          <div class="hero-description">${report.description}</div>
        </div>
      </div>
    </div>

    <form id="queryForm">
      <!-- === CIP CONFIGURATION === -->
      <div class="card">
        <div class="card-header">
          <div class="card-icon">🔗</div>
          <div class="card-title-group">
            <div class="card-title">Connection</div>
            <div class="card-subtitle">CIP instance and query settings</div>
          </div>
        </div>
        <div class="card-body">
          <div class="config-grid">
            <div class="field full">
              <label class="label" for="tenantId">
                Tenant ID <span class="required">*</span>
              </label>
              <span class="hint">Organization identifier (e.g., zzat_sbx, zzat_prd, zzat_stg)</span>
              <div class="field inline">
                <input
                  type="text"
                  id="tenantId"
                  name="tenantId"
                  required
                  class="input"
                  value="${connectionInfo?.tenantId ?? ''}"
                  placeholder="Enter tenant ID" />
                <button type="button" class="btn btn-secondary" id="testConnectionBtn">
                  <span>⚡</span>
                  <span>Test</span>
                </button>
              </div>
              <div id="connectionStatus" class="conn-status"></div>
            </div>

            <div class="field">
              <label class="label">Environment</label>
              <label class="checkbox-card">
                <input type="checkbox" id="useStaging" name="useStaging" ${connectionInfo?.staging ? 'checked' : ''}>
                <div class="checkbox-card-content">
                  <div class="checkbox-card-title">Use staging host</div>
                  <div class="checkbox-card-hint">jdbc.stg.analytics.commercecloud.salesforce.com</div>
                </div>
              </label>
            </div>

            <div class="field">
              <label class="label" for="fetchSize">Fetch Size</label>
              <span class="hint">Rows per batch (higher = faster for large results)</span>
              <select id="fetchSize" name="fetchSize" class="select">
                <option value="100">100 rows · Fast, small datasets</option>
                <option value="500">500 rows · Balanced</option>
                <option value="1000" selected>1,000 rows · Default</option>
                <option value="5000">5,000 rows · Large datasets</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- === QUERY PARAMETERS === -->
      <div class="card">
        <div class="card-header">
          <div class="card-icon">🎯</div>
          <div class="card-title-group">
            <div class="card-title">Report Parameters</div>
            <div class="card-subtitle">Customize the report inputs</div>
          </div>
        </div>
        <div class="card-body">
          <div class="config-grid">
            ${parameterFields}
          </div>
        </div>
      </div>

      <!-- === ACTION BAR === -->
      <div class="action-bar">
        <div class="info">
          <kbd>⌘</kbd> + <kbd>Enter</kbd> to run query
        </div>
        <button type="submit" class="btn btn-run" id="runButton">
          <span>▶</span>
          <span>Run Query</span>
        </button>
      </div>

      <div class="status-msg" id="statusMessage"></div>
    </form>

    <!-- === RESULTS === -->
    <div class="card results" id="resultsSection" style="margin-top: 20px;">
      <div class="card-header">
        <div class="card-icon">📈</div>
        <div class="card-title-group">
          <div class="card-title">Query Results</div>
          <div class="card-subtitle" id="resultsInfo">—</div>
        </div>
      </div>
      <div class="results-toolbar">
        <div class="results-meta" id="resultsMeta"></div>
        <div class="results-actions">
          <button class="btn btn-secondary" id="exportCsvBtn" disabled>
            <span>📄</span>
            <span>CSV</span>
          </button>
          <button class="btn btn-secondary" id="exportJsonBtn" disabled>
            <span>{ }</span>
            <span>JSON</span>
          </button>
          <button class="btn btn-secondary" id="copyBtn" disabled>
            <span>📋</span>
            <span>Copy</span>
          </button>
        </div>
      </div>
      <div class="results-scroll">
        <table class="table" id="resultsTable">
          <thead id="resultsTableHead"></thead>
          <tbody id="resultsTableBody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    const form = document.getElementById('queryForm');
    const runButton = document.getElementById('runButton');
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    const connectionStatus = document.getElementById('connectionStatus');
    const statusMessage = document.getElementById('statusMessage');
    const resultsSection = document.getElementById('resultsSection');
    const resultsInfo = document.getElementById('resultsInfo');
    const resultsMeta = document.getElementById('resultsMeta');
    const resultsTableHead = document.getElementById('resultsTableHead');
    const resultsTableBody = document.getElementById('resultsTableBody');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const copyBtn = document.getElementById('copyBtn');

    let currentData = { columns: [], rows: [] };
    let sortState = { column: null, ascending: true };
    let queryStart = 0;

    // Keyboard shortcut: Cmd/Ctrl+Enter
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!runButton.disabled) form.requestSubmit();
      }
    });

    // Test connection
    testConnectionBtn.addEventListener('click', () => {
      const tenantId = document.getElementById('tenantId').value;
      const useStaging = document.getElementById('useStaging').checked;

      if (!tenantId) {
        connectionStatus.className = 'conn-status error visible';
        connectionStatus.innerHTML = '❌ Please enter a tenant ID first';
        return;
      }

      connectionStatus.className = 'conn-status testing visible';
      connectionStatus.innerHTML = '<span class="spinner"></span><span>Testing connection...</span>';
      testConnectionBtn.disabled = true;

      vscode.postMessage({
        command: 'testConnection',
        params: {
          tenantId: tenantId,
          useStaging: String(useStaging)
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const params = {};
      for (const [key, value] of formData.entries()) {
        if (value) params[key] = value;
      }

      statusMessage.className = 'status-msg loading visible';
      statusMessage.innerHTML = '<span class="spinner"></span><span>Executing query...</span>';
      runButton.disabled = true;
      resultsSection.classList.remove('visible');
      queryStart = Date.now();

      vscode.postMessage({
        command: 'executeQuery',
        reportName: '${report.name}',
        params: params
      });
    });

    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.command) {
        case 'queryResults': handleQueryResults(message.data); break;
        case 'queryError': handleQueryError(message.error); break;
        case 'connectionTestResult': handleConnectionTestResult(message.result); break;
      }
    });

    function handleConnectionTestResult(result) {
      testConnectionBtn.disabled = false;
      connectionStatus.className = \`conn-status \${result.success ? 'success' : 'error'} visible\`;
      connectionStatus.innerHTML = result.message;

      if (result.success) {
        setTimeout(() => {
          connectionStatus.classList.remove('visible');
        }, 5000);
      }
    }

    function handleQueryResults(data) {
      runButton.disabled = false;
      const elapsed = Date.now() - queryStart;

      statusMessage.className = 'status-msg success visible';
      statusMessage.innerHTML = '<span>✅</span><span>Query completed successfully</span>';

      setTimeout(() => {
        statusMessage.classList.remove('visible');
      }, 3000);

      currentData = data;
      currentData.executionTime = elapsed;
      sortState = { column: null, ascending: true };

      renderResults();
      exportCsvBtn.disabled = false;
      exportJsonBtn.disabled = false;
      copyBtn.disabled = false;

      resultsSection.classList.add('visible');
      resultsSection.scrollIntoView({behavior: 'smooth', block: 'start'});
    }

    function renderResults() {
      const { columns, rows, rowCount, executionTime } = currentData;

      resultsInfo.textContent = \`\${rowCount} row\${rowCount !== 1 ? 's' : ''} returned\`;

      resultsMeta.innerHTML =
        \`<span class="badge">\${(rowCount || 0).toLocaleString()} rows</span>\` +
        (executionTime ? \`<span class="badge neutral">⏱ \${executionTime}ms</span>\` : '');

      if (!rows || rows.length === 0) {
        resultsTableHead.innerHTML = '';
        resultsTableBody.innerHTML = '<tr><td colspan="99"><div class="no-results"><div class="icon">📭</div><div>No rows returned for this query</div></div></td></tr>';
        return;
      }

      if (columns.length > 0) {
        resultsTableHead.innerHTML = '<tr>' +
          columns.map((col, idx) => {
            const isSorted = sortState.column === idx;
            const indicator = isSorted
              ? (sortState.ascending ? '↑' : '↓')
              : '⇅';
            const sortedClass = isSorted ? 'sorted' : '';
            return \`<th class="\${sortedClass}" data-column="\${idx}">
              \${escapeHtml(col)}
              <span class="sort">\${indicator}</span>
            </th>\`;
          }).join('') +
          '</tr>';

        resultsTableHead.querySelectorAll('th').forEach((th, idx) => {
          th.addEventListener('click', () => sortByColumn(idx));
        });
      }

      resultsTableBody.innerHTML = rows.map(row => {
        return '<tr>' +
          columns.map(col => \`<td title="\${escapeAttr(String(row[col] ?? ''))}">\${formatValue(row[col])}</td>\`).join('') +
          '</tr>';
      }).join('');
    }

    function sortByColumn(columnIndex) {
      const column = currentData.columns[columnIndex];

      if (sortState.column === columnIndex) {
        sortState.ascending = !sortState.ascending;
      } else {
        sortState.column = columnIndex;
        sortState.ascending = true;
      }

      currentData.rows.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortState.ascending ? comparison : -comparison;
      });

      renderResults();
    }

    exportCsvBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'exportCsv', params: { data: currentData } });
    });

    exportJsonBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'exportJson', params: { data: currentData } });
    });

    copyBtn.addEventListener('click', () => {
      const text = generateTableText(currentData.columns, currentData.rows);
      navigator.clipboard.writeText(text).then(() => {
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span>✓</span><span>Copied!</span>';
        setTimeout(() => { copyBtn.innerHTML = originalHtml; }, 2000);
      }).catch(err => alert('Failed to copy: ' + err));
    });

    function generateTableText(columns, rows) {
      const header = columns.join('\\t');
      const dataRows = rows.map(row => columns.map(col => row[col] ?? '').join('\\t')).join('\\n');
      return header + '\\n' + dataRows;
    }

    function handleQueryError(error) {
      runButton.disabled = false;
      statusMessage.className = 'status-msg error visible';
      statusMessage.innerHTML = \`<span>❌</span><span>\${escapeHtml(error)}</span>\`;
    }

    function formatValue(value) {
      if (value === null || value === undefined) {
        return '<span class="null-cell">—</span>';
      }
      if (typeof value === 'number') {
        if (Number.isInteger(value)) return value.toLocaleString();
        return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      }
      if (typeof value === 'boolean') {
        return value ? '<span style="color: var(--success);">true</span>' : '<span style="color: var(--error);">false</span>';
      }

      const str = String(value);

      if (/^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2})?/.test(str)) {
        try {
          const date = new Date(str);
          if (!isNaN(date.getTime())) {
            if (/^\\d{4}-\\d{2}-\\d{2}$/.test(str)) return date.toLocaleDateString();
            return date.toLocaleString();
          }
        } catch { /* not a date */ }
      }

      if (str.length > 100) {
        return \`<span title="\${escapeAttr(str)}">\${escapeHtml(str.substring(0, 97))}...</span>\`;
      }

      return escapeHtml(str);
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = String(text == null ? '' : text);
      return div.innerHTML;
    }

    function escapeAttr(text) {
      return String(text == null ? '' : text).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
  </script>
</body>
</html>`;
  }

  /**
   * Generate HTML content for the tables browser.
   */
  private getTablesBrowserContent(): string {
    const config = this.configProvider.getConfig();
    const connectionInfo = this.getConnectionInfo();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CIP Tables Browser</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--vscode-font-family);
      font-size: 12px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 16px;
      line-height: 1.5;
    }

    .header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .header h1 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header p {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      line-height: 1.4;
    }

    .config-form {
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 3px;
      padding: 12px;
      margin-bottom: 16px;
    }

    .form-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      margin-bottom: 12px;
    }

    .form-group {
      flex: 1;
    }

    label {
      display: block;
      font-weight: 500;
      margin-bottom: 4px;
      font-size: 12px;
    }

    input[type="text"] {
      width: 100%;
      padding: 6px 8px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.4));
      border-radius: 2px;
      font-family: var(--vscode-font-family);
      font-size: 12px;
    }

    input[type="text"]:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      font-size: 12px;
    }

    .checkbox-label input[type="checkbox"] {
      width: 14px;
      height: 14px;
      cursor: pointer;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 2px;
      font-family: var(--vscode-font-family);
      font-size: 12px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.1s ease;
    }

    .btn-primary {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .btn-primary:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .search-box {
      margin-bottom: 12px;
    }

    .search-box input {
      width: 100%;
    }

    .status-message {
      padding: 8px 10px;
      border-radius: 2px;
      margin-bottom: 12px;
      font-size: 12px;
      display: none;
    }

    .status-message.loading {
      display: block;
      background-color: rgba(75, 166, 223, 0.15);
      border-left: 2px solid var(--vscode-inputValidation-infoBorder);
    }

    .status-message.error {
      display: block;
      background-color: rgba(244, 71, 71, 0.15);
      border-left: 2px solid var(--vscode-inputValidation-errorBorder);
    }

    .status-message.success {
      display: block;
      background-color: rgba(137, 189, 102, 0.15);
      border-left: 2px solid #89BD66;
    }

    .tables-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 16px;
      height: calc(100vh - 280px);
    }

    .tables-list {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 3px;
      overflow-y: auto;
      background-color: var(--vscode-editor-background);
    }

    .table-item {
      padding: 8px 10px;
      cursor: pointer;
      border-bottom: 1px solid var(--vscode-panel-border);
      font-size: 11px;
      font-family: var(--vscode-editor-font-family);
    }

    .table-item:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .table-item.selected {
      background-color: var(--vscode-list-activeSelectionBackground);
      color: var(--vscode-list-activeSelectionForeground);
    }

    .table-detail {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 3px;
      padding: 12px;
      overflow-y: auto;
      background-color: var(--vscode-editor-background);
    }

    .table-detail.empty {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }

    .table-detail h2 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .columns-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .columns-table th {
      text-align: left;
      padding: 6px 8px;
      background-color: var(--vscode-editor-background);
      border-bottom: 1px solid var(--vscode-panel-border);
      font-weight: 600;
    }

    .columns-table td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .columns-table tr:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .type-badge {
      background-color: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 2px 4px;
      border-radius: 2px;
      font-size: 10px;
      font-weight: 600;
    }

    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid var(--vscode-button-background);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 6px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 CIP Tables Browser</h1>
    <p>Browse and explore all CIP data warehouse tables and their schemas</p>
  </div>

  <div class="config-form">
    <div class="form-row">
      <div class="form-group">
        <label for="tenantId">Tenant ID *</label>
        <input type="text" id="tenantId" placeholder="e.g., zzat_prd" value="${connectionInfo?.tenantId ?? ''}" />
      </div>
      <label class="checkbox-label">
        <input type="checkbox" id="useStaging" ${connectionInfo?.staging ? 'checked' : ''}>
        Use staging
      </label>
      <button type="button" class="btn btn-primary" id="loadTablesBtn">
        Load Tables
      </button>
    </div>
  </div>

  <div class="status-message" id="statusMessage"></div>

  <div class="search-box" id="searchBox" style="display: none;">
    <input type="text" id="searchInput" placeholder="Search tables..." />
  </div>

  <div class="tables-grid" id="tablesGrid" style="display: none;">
    <div class="tables-list" id="tablesList"></div>
    <div class="table-detail empty" id="tableDetail">
      Select a table to view its schema
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    const tenantIdInput = document.getElementById('tenantId');
    const useStagingCheckbox = document.getElementById('useStaging');
    const loadTablesBtn = document.getElementById('loadTablesBtn');
    const statusMessage = document.getElementById('statusMessage');
    const searchBox = document.getElementById('searchBox');
    const searchInput = document.getElementById('searchInput');
    const tablesGrid = document.getElementById('tablesGrid');
    const tablesList = document.getElementById('tablesList');
    const tableDetail = document.getElementById('tableDetail');

    let allTables = [];
    let selectedTable = null;

    loadTablesBtn.addEventListener('click', () => {
      const tenantId = tenantIdInput.value.trim();
      if (!tenantId) {
        showStatus('error', 'Please enter a tenant ID');
        return;
      }

      vscode.postMessage({
        command: 'loadTables',
        params: {
          tenantId: tenantId,
          useStaging: String(useStagingCheckbox.checked)
        }
      });
    });

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      filterTables(query);
    });

    function filterTables(query) {
      const filtered = query ? allTables.filter(t => t.toLowerCase().includes(query)) : allTables;
      renderTablesList(filtered);
    }

    function showStatus(type, message) {
      statusMessage.className = \`status-message \${type}\`;
      statusMessage.innerHTML = message;
    }

    function renderTablesList(tables) {
      tablesList.innerHTML = '';

      if (tables.length === 0) {
        tablesList.innerHTML = '<div style="padding: 12px; color: var(--vscode-descriptionForeground);">No tables found</div>';
        return;
      }

      tables.forEach(tableName => {
        const item = document.createElement('div');
        item.className = 'table-item';
        if (selectedTable === tableName) {
          item.classList.add('selected');
        }
        item.textContent = tableName;
        item.addEventListener('click', () => {
          selectTable(tableName);
        });
        tablesList.appendChild(item);
      });
    }

    function selectTable(tableName) {
      selectedTable = tableName;

      // Update selection UI
      document.querySelectorAll('.table-item').forEach(item => {
        if (item.textContent === tableName) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });

      // Load table schema
      vscode.postMessage({
        command: 'describeTable',
        params: {
          tenantId: tenantIdInput.value.trim(),
          useStaging: String(useStagingCheckbox.checked),
          tableName: tableName
        }
      });
    }

    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.command) {
        case 'tablesLoading':
          showStatus('loading', '<span class="spinner"></span> Loading tables...');
          loadTablesBtn.disabled = true;
          break;

        case 'tablesLoaded':
          allTables = message.tables || [];
          showStatus('success', \`✅ Loaded \${message.tableCount} tables\`);
          loadTablesBtn.disabled = false;
          searchBox.style.display = 'block';
          tablesGrid.style.display = 'grid';
          renderTablesList(allTables);
          break;

        case 'tablesLoadError':
          showStatus('error', message.error);
          loadTablesBtn.disabled = false;
          break;

        case 'tableDescribing':
          tableDetail.innerHTML = '<div style="padding: 12px;"><span class="spinner"></span> Loading schema...</div>';
          tableDetail.classList.remove('empty');
          break;

        case 'tableDescribed':
          renderTableSchema(message.tableName, message.schema);
          break;

        case 'tableDescribeError':
          tableDetail.innerHTML = \`<div style="padding: 12px; color: var(--vscode-errorForeground);">❌ Failed to load schema: \${message.error}</div>\`;
          tableDetail.classList.remove('empty');
          break;
      }
    });

    function renderTableSchema(tableName, schema) {
      tableDetail.classList.remove('empty');
      tableDetail.innerHTML = \`
        <h2>\${tableName}</h2>
        <p style="margin-bottom: 12px; color: var(--vscode-descriptionForeground); font-size: 11px;">
          \${schema.columns.length} columns
        </p>
        <table class="columns-table">
          <thead>
            <tr>
              <th>Column Name</th>
              <th>Type</th>
              <th>Nullable</th>
            </tr>
          </thead>
          <tbody>
            \${schema.columns.map(col => \`
              <tr>
                <td style="font-family: var(--vscode-editor-font-family);">\${col.name}</td>
                <td><span class="type-badge">\${col.type}</span></td>
                <td>\${col.nullable ? 'Yes' : 'No'}</td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      \`;
    }
  </script>
</body>
</html>`;
  }

  /**
   * Generate HTML content for the CIP Query Builder.
   * Modern, engaging UX with dynamic interactions.
   */
  private getQueryBuilderContent(): string {
    const connectionInfo = this.getConnectionInfo();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CIP Query Builder</title>
  <style>
    :root {
      --accent: #0176D3;
      --accent-hover: #014486;
      --accent-light: #1B96FF;
      --accent-soft: rgba(1, 118, 211, 0.1);
      --accent-softer: rgba(1, 118, 211, 0.05);
      --success: #2E844A;
      --success-soft: rgba(46, 132, 74, 0.1);
      --error: #BA0517;
      --error-soft: rgba(186, 5, 23, 0.1);
      --warning: #DD7A01;
      --warning-soft: rgba(221, 122, 1, 0.1);
      --keyword: #0176D3;
      --radius-sm: 4px;
      --radius-md: 6px;
      --radius-lg: 8px;
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
      --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
      --transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      --sidebar-width: 320px;
      --footer-height: 44px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      height: 100vh;
      overflow: hidden;
    }

    body {
      font-family: var(--vscode-font-family);
      font-size: 13px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      -webkit-font-smoothing: antialiased;
    }

    /* === LAYOUT GRID === */
    .app {
      display: grid;
      grid-template-rows: auto auto auto 1fr;
      grid-template-columns: var(--sidebar-width) 1fr;
      grid-template-areas:
        "hero hero"
        "config config"
        "toolbar toolbar"
        "sidebar main";
      height: 100vh;
      overflow: hidden;
      background-color: var(--vscode-sideBar-background);
      gap: 0;
    }

    /* Floating card wrapper — adds "paper" feel */
    .floating {
      margin: 16px 24px 0;
      border-radius: 10px;
      border: 1px solid var(--vscode-panel-border);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    /* === HERO HEADER (1st container) - FLOATING CARD === */
    .hero-header {
      grid-area: hero;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding: 14px 24px;
      margin: 12px 20px 0;
      background: linear-gradient(135deg, var(--accent-soft) 0%, var(--vscode-editor-background) 100%);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      position: relative;
      overflow: hidden;
    }

    .hero-header::before {
      content: '';
      position: absolute;
      top: -40px;
      left: -40px;
      width: 140px;
      height: 140px;
      background: radial-gradient(circle, var(--accent-soft) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-header::after {
      content: '';
      position: absolute;
      top: -40px;
      right: -40px;
      width: 140px;
      height: 140px;
      background: radial-gradient(circle, var(--accent-soft) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(1, 118, 211, 0.3);
      flex-shrink: 0;
      position: relative;
    }

    .hero-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      position: relative;
      text-align: center;
    }

    .hero-title {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.3px;
      line-height: 1.2;
    }

    .hero-subtitle {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.3;
    }

    /* === CONFIG CONTAINER (2nd container) - FLOATING CARD === */
    .config-bar {
      grid-area: config;
      padding: 12px 20px;
      margin: 8px 20px 0;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .config-bar-inner {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
      max-width: 1000px;
      margin: 0 auto;
    }

    .config-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: var(--vscode-foreground);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 7px;
    }

    .config-field {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .config-field .input,
    .config-field .select,
    .config-field .checkbox-pill,
    .config-field .btn {
      height: 36px !important;
      font-size: 13px;
    }

    /* === TOOLBAR CONTAINER (3rd container) - FLOATING CARD === */
    .toolbar-bar {
      grid-area: toolbar;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 20px;
      margin: 8px 20px 10px;
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .toolbar-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 700;
      color: var(--vscode-foreground);
      letter-spacing: -0.2px;
    }

    .toolbar-title .dot {
      width: 8px;
      height: 8px;
      background: var(--accent);
      border-radius: 50%;
      box-shadow: 0 0 0 3px var(--accent-soft);
    }

    .toolbar-title .subtitle {
      font-size: 11px;
      font-weight: 500;
      color: var(--vscode-descriptionForeground);
      margin-left: 4px;
    }

    .spacer { flex: 1; }

    .input, .select {
      padding: 6px 10px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.4));
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-family: var(--vscode-font-family);
      transition: var(--transition);
      outline: none;
      height: 30px;
    }

    .input:hover:not(:focus), .select:hover:not(:focus) {
      border-color: rgba(128, 128, 128, 0.7);
    }

    .input:focus, .select:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-soft);
    }

    .checkbox-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 10px;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.4));
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
      font-size: 12px;
      user-select: none;
      height: 30px;
    }

    .checkbox-pill:hover {
      border-color: var(--accent);
      background-color: var(--accent-soft);
    }

    .checkbox-pill input[type="checkbox"] {
      accent-color: var(--accent);
      cursor: pointer;
    }

    .btn {
      height: 30px;
      padding: 0 12px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: var(--transition);
      font-family: var(--vscode-font-family);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .btn-primary {
      background-color: var(--accent);
      color: white;
      border-color: var(--accent);
      box-shadow: 0 1px 2px rgba(1, 118, 211, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      background-color: var(--accent-hover);
      border-color: var(--accent-hover);
      box-shadow: 0 2px 6px rgba(1, 118, 211, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .btn-run {
      background: linear-gradient(135deg, #2E844A 0%, #1F6036 100%);
      color: white;
      border-color: #1F6036;
      padding: 0 20px;
      height: 36px !important;
      font-size: 13px;
      box-shadow: 0 2px 4px rgba(46, 132, 74, 0.3);
      font-weight: 700;
    }

    .btn-run:hover:not(:disabled) {
      box-shadow: 0 4px 10px rgba(46, 132, 74, 0.4);
    }

    .btn-run:disabled {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border-color: transparent;
      box-shadow: none;
      opacity: 0.5;
    }

    .btn-secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: 1px solid var(--vscode-button-border, rgba(128, 128, 128, 0.3));
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: var(--vscode-button-secondaryHoverBackground);
      border-color: var(--accent);
    }

    .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

    /* removed old .header-right */

    /* View Toggle - LARGER for professional feel */
    .view-toggle {
      display: inline-flex;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.4));
      border-radius: 6px;
      padding: 3px;
      gap: 3px;
      height: 36px;
    }

    .view-toggle button {
      padding: 0 16px;
      border: none;
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      border-radius: 4px;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--vscode-font-family);
    }

    .view-toggle button:hover:not(.active) { background: var(--accent-soft); }

    .view-toggle button.active {
      background: var(--accent);
      color: white;
      box-shadow: 0 1px 3px rgba(1, 118, 211, 0.3);
    }

    /* === SIDEBAR === FLOATING CARD === */
    .sidebar {
      grid-area: sidebar;
      display: grid;
      grid-template-rows: auto 1fr;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 10px;
      margin: 0 0 12px 20px;
      overflow: hidden;
      min-height: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .sidebar-section {
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid var(--vscode-panel-border);
      overflow: hidden;
      min-height: 0;
    }

    .sidebar-section.tables { max-height: 45%; min-height: 200px; }
    .sidebar-section.columns { flex: 1; }
    .sidebar-section:last-child { border-bottom: none; }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 14px 10px;
      flex-shrink: 0;
      background: linear-gradient(180deg, var(--vscode-editorWidget-background) 0%, transparent 100%);
      border-bottom: 1px solid rgba(128, 128, 128, 0.15);
    }

    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--vscode-foreground);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-title-icon { color: var(--accent); font-size: 14px; }

    .count-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: 10px;
      font-variant-numeric: tabular-nums;
    }

    .search-bar {
      padding: 0 14px 10px;
      position: relative;
      flex-shrink: 0;
    }

    .search-bar::before {
      content: '🔍';
      position: absolute;
      left: 22px;
      top: 50%;
      transform: translateY(-60%);
      font-size: 11px;
      opacity: 0.5;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 6px 10px 6px 30px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.4));
      border-radius: var(--radius-sm);
      font-size: 12px;
      transition: var(--transition);
      outline: none;
    }

    .search-input:hover:not(:focus) {
      border-color: rgba(128, 128, 128, 0.7);
    }

    .search-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-soft);
    }

    .list {
      flex: 1;
      overflow-y: auto;
      padding: 2px 8px 8px;
      min-height: 0;
    }

    .list::-webkit-scrollbar { width: 6px; }
    .list::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-background);
      border-radius: 3px;
    }

    .list-item {
      padding: 6px 10px;
      cursor: pointer;
      font-size: 12px;
      font-family: var(--vscode-editor-font-family);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 1px;
      transition: var(--transition);
      user-select: none;
    }

    .list-item:hover { background-color: var(--vscode-list-hoverBackground); }

    .list-item.selected {
      background-color: var(--accent-soft);
      color: var(--accent);
      font-weight: 600;
      box-shadow: inset 2px 0 0 var(--accent);
    }

    .list-item .icon { flex-shrink: 0; font-size: 11px; }

    .list-item .label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .field-checkbox {
      width: 13px;
      height: 13px;
      accent-color: var(--accent);
      cursor: pointer;
      flex-shrink: 0;
      margin: 0;
    }

    .type-tag {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-family: var(--vscode-font-family);
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      opacity: 0.8;
      flex-shrink: 0;
    }

    .type-tag.str, .type-tag.varchar, .type-tag.text { background: rgba(46, 132, 74, 0.2); color: #2E844A; }
    .type-tag.int, .type-tag.bigint, .type-tag.long, .type-tag.num,
    .type-tag.decimal, .type-tag.double, .type-tag.float { background: rgba(1, 118, 211, 0.2); color: var(--accent); }
    .type-tag.date, .type-tag.timestamp, .type-tag.time { background: rgba(221, 122, 1, 0.2); color: var(--warning); }
    .type-tag.bool, .type-tag.boolean { background: rgba(186, 5, 23, 0.2); color: var(--error); }

    /* Empty States */
    .empty {
      padding: 16px 14px;
      text-align: center;
      color: var(--vscode-descriptionForeground);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      background: var(--accent-softer);
      border: 1px dashed rgba(1, 118, 211, 0.2);
      border-radius: var(--radius-sm);
      margin: 4px;
    }

    .empty-icon { font-size: 22px; opacity: 0.5; }
    .empty-title { font-weight: 700; color: var(--vscode-foreground); font-size: 11px; }
    .empty-hint { font-size: 11px; line-height: 1.4; opacity: 0.85; }

    /* === MAIN CONTENT === FLOATING CARD === */
    .main {
      grid-area: main;
      display: grid;
      grid-template-rows: 1fr auto;
      overflow: hidden;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 10px;
      margin: 0 20px 12px 12px;
      min-height: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .main-top {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .content-scroll {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }

    .content-scroll::-webkit-scrollbar { width: 10px; }
    .content-scroll::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-background);
      border-radius: 5px;
    }

    /* === BUILDER === */
    .builder {
      padding: 12px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 1100px;
    }

    /* Run bar — shown below LIMIT clause / SQL editor, button aligned RIGHT */
    .run-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 12px 16px 16px;
      background: var(--vscode-editor-background);
    }

    .run-hint {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .run-hint kbd {
      padding: 1px 5px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.3));
      border-radius: 3px;
      font-size: 10px;
      font-family: var(--vscode-editor-font-family);
    }

    .builder.hidden { display: none; }

    /* === CARD (matches curated reports pattern) === */
    .clause {
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: var(--transition);
    }

    .clause:hover {
      border-color: rgba(128, 128, 128, 0.5);
      box-shadow: var(--shadow-sm);
    }

    /* Card header — compact */
    .clause-head {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      background: linear-gradient(180deg, var(--vscode-editorWidget-background) 0%, transparent 100%);
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    /* Icon circle with keyword (replaces flat badge) */
    .clause-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 9px;
      letter-spacing: 0.5px;
      font-family: var(--vscode-editor-font-family);
      box-shadow: 0 1px 4px rgba(1, 118, 211, 0.25);
      flex-shrink: 0;
      text-align: center;
      line-height: 1;
      padding: 0 2px;
    }

    /* Title group (title + subtitle — matches curated reports) */
    .clause-title-group {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .clause-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--vscode-foreground);
      line-height: 1.2;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .clause-title .kw {
      font-family: var(--vscode-editor-font-family);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.7px;
      color: var(--accent);
      background: var(--accent-soft);
      padding: 1px 6px;
      border-radius: 3px;
      text-transform: uppercase;
    }

    .clause-desc {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.2;
    }

    .clause-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    .btn-ghost {
      height: 26px;
      padding: 0 10px;
      font-size: 11px;
      font-weight: 600;
      background: var(--accent-soft);
      color: var(--accent);
      border: 1px solid rgba(1, 118, 211, 0.3);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
      font-family: var(--vscode-font-family);
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .btn-ghost:hover:not(:disabled) {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(1, 118, 211, 0.3);
    }

    .btn-ghost:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: transparent;
      border-color: rgba(128, 128, 128, 0.3);
      color: var(--vscode-descriptionForeground);
    }

    .clause-body {
      padding: 10px 14px;
      min-height: 40px;
    }

    .placeholder {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      font-style: italic;
      line-height: 1.5;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .placeholder::before {
      content: '';
      width: 6px;
      height: 6px;
      background: var(--vscode-descriptionForeground);
      border-radius: 50%;
      opacity: 0.4;
    }

    /* === CHIPS === */
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 4px 4px 10px;
      background: var(--accent-soft);
      color: var(--accent);
      border: 1px solid rgba(1, 118, 211, 0.3);
      border-radius: 14px;
      font-size: 11px;
      font-family: var(--vscode-editor-font-family);
      font-weight: 500;
      animation: chipIn 0.2s ease-out;
    }

    @keyframes chipIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }

    .chip.primary {
      background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%);
      color: white;
      border: none;
      padding: 5px 12px;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(1, 118, 211, 0.3);
    }

    .chip .remove {
      cursor: pointer;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      transition: var(--transition);
    }

    .chip .remove:hover {
      background: rgba(186, 5, 23, 0.2);
      color: var(--error);
    }

    /* === FILTERS & ORDER ROWS === */
    .filter-row, .order-row {
      display: grid;
      gap: 8px;
      margin-bottom: 6px;
      align-items: center;
      padding: 6px;
      background-color: var(--vscode-sideBar-background);
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      transition: var(--transition);
    }

    .filter-row { grid-template-columns: minmax(0, 2fr) 140px minmax(0, 2fr) 32px; }
    .order-row { grid-template-columns: minmax(0, 2fr) 120px 32px; }

    .filter-row:hover, .order-row:hover { border-color: rgba(128, 128, 128, 0.3); }
    .filter-row:last-child, .order-row:last-child { margin-bottom: 0; }

    .field-select, .field-input {
      width: 100%;
      height: 28px;
      padding: 0 8px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.4));
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-family: var(--vscode-font-family);
      transition: var(--transition);
      outline: none;
    }

    .field-select:hover:not(:focus), .field-input:hover:not(:focus) {
      border-color: rgba(128, 128, 128, 0.7);
    }

    .field-select:focus, .field-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-soft);
    }

    .remove-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      color: var(--error);
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 13px;
      transition: var(--transition);
    }

    .remove-btn:hover {
      background: var(--error-soft);
      border-color: var(--error);
    }

    /* Logic toggle */
    .logic-segment {
      display: inline-flex;
      gap: 2px;
      padding: 2px;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.4));
      border-radius: var(--radius-sm);
      margin-bottom: 10px;
    }

    .logic-segment button {
      height: 24px;
      padding: 0 14px;
      border: none;
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
      font-size: 11px;
      font-weight: 700;
      border-radius: 3px;
      transition: var(--transition);
      font-family: var(--vscode-editor-font-family);
    }

    .logic-segment button:hover:not(.active) { background: var(--accent-soft); }

    .logic-segment button.active {
      background: var(--accent);
      color: white;
      box-shadow: 0 1px 2px rgba(1, 118, 211, 0.3);
    }

    /* === SQL EDITOR === */
    .editor {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 400px;
    }

    .editor.hidden { display: none; }

    .editor-head {
      padding: 10px 16px;
      background: var(--warning-soft);
      border-bottom: 1px solid var(--vscode-panel-border);
      font-size: 11px;
      color: var(--warning);
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .sql-editor {
      flex: 1;
      width: 100%;
      padding: 16px 20px;
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      border: none;
      outline: none;
      font-family: var(--vscode-editor-font-family);
      font-size: 13px;
      line-height: 1.6;
      resize: none;
      tab-size: 2;
    }

    /* === QUERY PREVIEW (bottom of main-top) === */
    .preview-panel {
      border-top: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editorWidget-background);
      padding: 10px 16px 12px;
      max-height: 140px;
      overflow-y: auto;
      flex-shrink: 0;
    }

    .preview-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .preview-label::before {
      content: '';
      width: 6px;
      height: 6px;
      background: var(--success);
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.2); }
    }

    #queryPreviewText {
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
      color: var(--vscode-foreground);
    }

    .sql-keyword { color: var(--accent); font-weight: 600; }
    .sql-string { color: #2E844A; }
    .sql-number { color: #DD7A01; }
    .sql-comment { color: var(--vscode-descriptionForeground); font-style: italic; }

    /* === RESULTS === */
    .results-panel {
      display: none;
      flex-direction: column;
      border-top: 2px solid var(--accent);
      max-height: 50vh;
      min-height: 200px;
      background-color: var(--vscode-editor-background);
      overflow: hidden;
    }

    .results-panel.visible { display: flex; }

    .results-head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 20px;
      background: var(--vscode-editorWidget-background);
      border-bottom: 1px solid var(--vscode-panel-border);
      flex-shrink: 0;
    }

    .results-title {
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .results-title::before { content: '📊'; font-size: 14px; }

    .badges { display: flex; gap: 6px; }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px;
      background: var(--success-soft);
      color: var(--success);
      border-radius: 11px;
      font-size: 11px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .badge.neutral {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }

    .results-actions {
      margin-left: auto;
      display: flex;
      gap: 6px;
    }

    .results-body {
      flex: 1;
      overflow: auto;
    }

    .results-body::-webkit-scrollbar { width: 10px; height: 10px; }
    .results-body::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-background);
      border-radius: 5px;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .table thead {
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .table th {
      text-align: left;
      padding: 8px 14px;
      background: var(--vscode-editorWidget-background);
      border-bottom: 2px solid var(--accent);
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      transition: var(--transition);
    }

    .table th:hover {
      background: var(--accent-soft);
      color: var(--accent);
    }

    .table td {
      padding: 7px 14px;
      border-bottom: 1px solid var(--vscode-panel-border);
      font-family: var(--vscode-editor-font-family);
      white-space: nowrap;
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .table tr { transition: var(--transition); }
    .table tr:hover { background-color: var(--accent-soft); }
    .table tr:nth-child(even) { background-color: rgba(128, 128, 128, 0.03); }

    .no-results {
      padding: 40px 20px;
      text-align: center;
      color: var(--vscode-descriptionForeground);
    }

    .no-results .icon { font-size: 36px; opacity: 0.4; margin-bottom: 8px; }

    /* === FOOTER STATUS BAR === */
    .footer {
      grid-area: footer;
      padding: 0 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 11px;
      background: var(--vscode-statusBar-background);
      color: var(--vscode-statusBar-foreground);
      border-top: 1px solid var(--vscode-panel-border);
    }

    .footer.error { background: var(--error-soft); color: var(--error); }
    .footer.success { background: var(--success-soft); color: var(--success); }
    .footer.loading { background: var(--accent-soft); color: var(--accent); }

    .footer .hint {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 6px;
      opacity: 0.8;
    }

    kbd {
      padding: 1px 5px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.3));
      border-radius: 3px;
      font-size: 10px;
      font-family: var(--vscode-editor-font-family);
    }

    .spinner {
      display: inline-block;
      width: 11px;
      height: 11px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Responsive */
    @media (max-width: 900px) {
      .app { grid-template-columns: 260px 1fr; }
    }
  </style>
</head>
<body>
  <div class="app">
    <!-- === 1. HERO HEADER CONTAINER === -->
    <div class="hero-header">
      <div class="hero-icon">⚡</div>
      <div class="hero-text">
        <div class="hero-title">Query Builder</div>
        <div class="hero-subtitle">Build custom SQL queries against CIP data warehouse · Visual or raw SQL</div>
      </div>
    </div>

    <!-- === 2. CONFIG CONTAINER (Connection settings) === -->
    <div class="config-bar">
      <div class="config-bar-inner">
        <div class="config-field">
          <label class="config-label" for="tenantId">🔗 Tenant ID</label>
          <input type="text" id="tenantId" class="input" placeholder="e.g., zzat_sbx" value="${connectionInfo?.tenantId ?? ''}" style="width: 180px;" />
        </div>

        <div class="config-field">
          <label class="config-label">🌍 Environment</label>
          <label class="checkbox-pill" style="height: 30px;">
            <input type="checkbox" id="useStaging" ${connectionInfo?.staging ? 'checked' : ''}>
            <span>Use Staging Host</span>
          </label>
        </div>

        <div class="config-field">
          <label class="config-label" for="fetchSize">📊 Fetch Size</label>
          <select id="fetchSize" class="select" style="width: 140px;">
            <option value="100">100 rows</option>
            <option value="500">500 rows</option>
            <option value="1000" selected>1,000 rows</option>
            <option value="5000">5,000 rows</option>
          </select>
        </div>

        <div class="config-field">
          <label class="config-label">&nbsp;</label>
          <button id="loadTablesBtn" class="btn btn-primary">
            <span>📥</span>
            <span>Load Tables</span>
          </button>
        </div>
      </div>
    </div>

    <!-- === 3. TOOLBAR CONTAINER (View toggle only) === -->
    <div class="toolbar-bar">
      <div class="toolbar-title">
        <span class="dot"></span>
        <span>Query Composer</span>
        <span class="subtitle">· Switch between visual builder and raw SQL</span>
      </div>

      <div class="spacer"></div>

      <div class="view-toggle">
        <button id="builderViewBtn" class="active">
          <span>⚙</span>
          <span>Builder</span>
        </button>
        <button id="editorViewBtn">
          <span>{ }</span>
          <span>SQL</span>
        </button>
      </div>
    </div>

    <!-- === SIDEBAR === -->
    <div class="sidebar">
      <div class="sidebar-section">
        <div class="section-head">
          <div class="section-title">
            <span class="section-title-icon">📂</span>
            <span>Tables</span>
          </div>
          <span class="count-badge" id="tableCount">0</span>
        </div>
        <div class="search-bar">
          <input type="text" class="search-input" id="tableSearch" placeholder="Search tables..." />
        </div>
        <div class="list" id="tableList">
          <div class="empty">
            <div class="empty-icon">📭</div>
            <div class="empty-title">No tables loaded</div>
            <div class="empty-hint">Click "Load Tables"<br/>to discover tables</div>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="section-head">
          <div class="section-title">
            <span class="section-title-icon">🔖</span>
            <span>Columns</span>
          </div>
          <span class="count-badge" id="fieldCount">0</span>
        </div>
        <div class="search-bar">
          <input type="text" class="search-input" id="fieldSearch" placeholder="Search columns..." />
        </div>
        <div class="list" id="fieldList">
          <div class="empty">
            <div class="empty-icon">👈</div>
            <div class="empty-title">Pick a table</div>
            <div class="empty-hint">Choose a table from above<br/>to see its columns</div>
          </div>
        </div>
      </div>
    </div>

    <!-- === MAIN === -->
    <div class="main">
      <div class="main-top">
        <div class="content-scroll">
          <!-- Builder View -->
          <div class="builder" id="builderView">
            <div class="clause">
              <div class="clause-head">
                <div class="clause-icon">🎯</div>
                <div class="clause-title-group">
                  <div class="clause-title">Choose Columns <span class="kw">SELECT</span></div>
                  <div class="clause-desc">Pick which fields to retrieve — defaults to all columns (*)</div>
                </div>
                <div class="clause-actions">
                  <button class="btn-ghost" id="selectAllFieldsBtn" disabled>
                    <span>✓</span>
                    <span>Select All</span>
                  </button>
                  <button class="btn-ghost" id="clearFieldsBtn" disabled>
                    <span>✕</span>
                    <span>Clear</span>
                  </button>
                </div>
              </div>
              <div class="clause-body">
                <div id="selectedFieldsContainer">
                  <span class="placeholder">No columns selected — will use SELECT * (all columns)</span>
                </div>
              </div>
            </div>

            <div class="clause">
              <div class="clause-head">
                <div class="clause-icon">📄</div>
                <div class="clause-title-group">
                  <div class="clause-title">Source Table <span class="kw">FROM</span></div>
                  <div class="clause-desc">The CIP data warehouse table to query</div>
                </div>
                <div class="clause-actions">
                  <button class="btn-ghost" id="changeFromBtn" disabled>
                    <span>🔄</span>
                    <span>Change Table</span>
                  </button>
                </div>
              </div>
              <div class="clause-body">
                <div id="fromContainer">
                  <span class="placeholder">Pick a table from the sidebar to begin</span>
                </div>
              </div>
            </div>

            <div class="clause">
              <div class="clause-head">
                <div class="clause-icon">🔍</div>
                <div class="clause-title-group">
                  <div class="clause-title">Filter Results <span class="kw">WHERE</span></div>
                  <div class="clause-desc">Add conditions to narrow down your results</div>
                </div>
                <div class="clause-actions">
                  <button class="btn-ghost" id="addFilterBtn">
                    <span>+</span>
                    <span>Add Filter</span>
                  </button>
                </div>
              </div>
              <div class="clause-body">
                <div class="logic-segment" id="logicToggle" style="display: none;">
                  <button data-logic="AND" class="active">AND</button>
                  <button data-logic="OR">OR</button>
                </div>
                <div id="filtersContainer">
                  <span class="placeholder">No filters applied — all rows will be returned</span>
                </div>
              </div>
            </div>

            <div class="clause">
              <div class="clause-head">
                <div class="clause-icon">↕</div>
                <div class="clause-title-group">
                  <div class="clause-title">Sort Results <span class="kw">ORDER BY</span></div>
                  <div class="clause-desc">Order rows by one or more columns</div>
                </div>
                <div class="clause-actions">
                  <button class="btn-ghost" id="addOrderBtn">
                    <span>+</span>
                    <span>Add Sort</span>
                  </button>
                </div>
              </div>
              <div class="clause-body">
                <div id="orderByContainer">
                  <span class="placeholder">No sorting applied — results in default order</span>
                </div>
              </div>
            </div>

            <div class="clause">
              <div class="clause-head">
                <div class="clause-icon">#</div>
                <div class="clause-title-group">
                  <div class="clause-title">Result Cap <span class="kw">LIMIT</span></div>
                  <div class="clause-desc">Maximum number of rows to return</div>
                </div>
              </div>
              <div class="clause-body">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <input type="number" id="limitInput" class="field-input" placeholder="100" min="1" max="10000" value="100" style="width: 80px; height: 28px; font-size: 12px; font-weight: 600; text-align: center;" />
                  <span style="font-size: 11px; color: var(--vscode-descriptionForeground);">rows max · up to 10,000</span>
                </div>
              </div>
            </div>
          </div>

          <!-- SQL Editor View -->
          <div class="editor hidden" id="editorView">
            <textarea class="sql-editor" id="sqlEditor" spellcheck="false" placeholder="SELECT * FROM ccdw_aggr_sales_summary LIMIT 10"></textarea>
          </div>

          <!-- Run Query action bar (shared across Builder and SQL views) -->
          <div class="run-bar">
            <span class="run-hint">Press <kbd>⌘</kbd> <kbd>↵</kbd> to run</span>
            <button id="runQueryBtnBottom" class="btn btn-run" disabled>
              <span>▶</span>
              <span>Run Query</span>
            </button>
          </div>
        </div>

        <!-- Query Preview -->
        <div class="preview-panel">
          <div class="preview-label">Generated SQL</div>
          <pre id="queryPreviewText">-- Select a table and fields to generate query</pre>
        </div>
      </div>

      <!-- Results Panel (below main-top, inside main but scroll independent) -->
      <div class="results-panel" id="resultsPanel">
        <div class="results-head">
          <div class="results-title">Results</div>
          <div class="badges" id="resultsBadges"></div>
          <div class="results-actions">
            <button class="btn btn-secondary" id="exportCsvBtn" disabled>
              <span>📄</span>
              <span>CSV</span>
            </button>
            <button class="btn btn-secondary" id="exportJsonBtn" disabled>
              <span>{ }</span>
              <span>JSON</span>
            </button>
          </div>
        </div>
        <div class="results-body" id="resultsBody"></div>
      </div>
    </div>

  </div>

  <!-- Hidden status bar — used only for inline error/success messaging via JS -->
  <div id="statusBar" style="display: none;"></div>

  <script>
    const vscode = acquireVsCodeApi();

    const state = {
      tables: [],
      currentTable: null,
      columns: [],
      selectedFields: [],
      filters: [],
      filterLogic: 'AND',
      orderBy: [],
      limit: 100,
      currentView: 'builder',
      customSql: '',
      results: null,
    };

    const el = {
      tenantId: document.getElementById('tenantId'),
      useStaging: document.getElementById('useStaging'),
      fetchSize: document.getElementById('fetchSize'),
      loadTablesBtn: document.getElementById('loadTablesBtn'),
      runQueryBtn: document.getElementById('runQueryBtnBottom'),
      builderViewBtn: document.getElementById('builderViewBtn'),
      editorViewBtn: document.getElementById('editorViewBtn'),
      builderView: document.getElementById('builderView'),
      editorView: document.getElementById('editorView'),
      sqlEditor: document.getElementById('sqlEditor'),
      tableCount: document.getElementById('tableCount'),
      fieldCount: document.getElementById('fieldCount'),
      tableSearch: document.getElementById('tableSearch'),
      fieldSearch: document.getElementById('fieldSearch'),
      tableList: document.getElementById('tableList'),
      fieldList: document.getElementById('fieldList'),
      selectedFieldsContainer: document.getElementById('selectedFieldsContainer'),
      fromContainer: document.getElementById('fromContainer'),
      selectAllFieldsBtn: document.getElementById('selectAllFieldsBtn'),
      clearFieldsBtn: document.getElementById('clearFieldsBtn'),
      changeFromBtn: document.getElementById('changeFromBtn'),
      addFilterBtn: document.getElementById('addFilterBtn'),
      filtersContainer: document.getElementById('filtersContainer'),
      logicToggle: document.getElementById('logicToggle'),
      addOrderBtn: document.getElementById('addOrderBtn'),
      orderByContainer: document.getElementById('orderByContainer'),
      limitInput: document.getElementById('limitInput'),
      queryPreviewText: document.getElementById('queryPreviewText'),
      resultsPanel: document.getElementById('resultsPanel'),
      resultsBadges: document.getElementById('resultsBadges'),
      resultsBody: document.getElementById('resultsBody'),
      exportCsvBtn: document.getElementById('exportCsvBtn'),
      exportJsonBtn: document.getElementById('exportJsonBtn'),
      statusBar: document.getElementById('statusBar'),
    };

    el.loadTablesBtn.addEventListener('click', () => {
      const tenantId = el.tenantId.value.trim();
      if (!tenantId) {
        setStatus('error', '❌ Tenant ID is required');
        el.tenantId.focus();
        return;
      }
      setStatus('loading', '<span class="spinner"></span> Loading tables...');
      vscode.postMessage({
        command: 'loadTables',
        params: {tenantId, useStaging: String(el.useStaging.checked)}
      });
    });

    el.tableSearch.addEventListener('input', () => renderTableList());
    el.fieldSearch.addEventListener('input', () => renderFieldList());
    el.builderViewBtn.addEventListener('click', () => switchView('builder'));
    el.editorViewBtn.addEventListener('click', () => switchView('editor'));
    el.runQueryBtn.addEventListener('click', () => runQuery());

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!el.runQueryBtn.disabled) runQuery();
      }
    });

    el.limitInput.addEventListener('input', () => {
      state.limit = parseInt(el.limitInput.value) || null;
      updateQueryPreview();
    });

    el.selectAllFieldsBtn.addEventListener('click', () => {
      if (state.columns.length === 0) return;
      state.selectedFields = state.columns.map(c => c.name);
      renderSelectedFields();
      renderFieldList();
      updateQueryPreview();
    });

    el.clearFieldsBtn.addEventListener('click', () => {
      state.selectedFields = [];
      renderSelectedFields();
      renderFieldList();
      updateQueryPreview();
    });

    el.changeFromBtn.addEventListener('click', () => {
      el.tableSearch.focus();
      el.tableSearch.select();
    });

    el.addFilterBtn.addEventListener('click', () => {
      state.filters.push({column: '', operator: '=', value: ''});
      renderFilters();
      updateQueryPreview();
    });

    el.addOrderBtn.addEventListener('click', () => {
      state.orderBy.push({column: '', direction: 'ASC'});
      renderOrderBy();
      updateQueryPreview();
    });

    el.logicToggle.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        state.filterLogic = btn.dataset.logic;
        el.logicToggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateQueryPreview();
      });
    });

    el.sqlEditor.addEventListener('input', () => {
      state.customSql = el.sqlEditor.value;
      // Enable Run Query if SQL editor has content
      if (state.currentView === 'editor') {
        el.runQueryBtn.disabled = !state.customSql.trim();
      }
    });

    el.exportCsvBtn.addEventListener('click', () => {
      if (state.results) {
        vscode.postMessage({command: 'exportCsv', params: {data: state.results}});
      }
    });

    el.exportJsonBtn.addEventListener('click', () => {
      if (state.results) {
        vscode.postMessage({command: 'exportJson', params: {data: state.results}});
      }
    });

    function setStatus(type, message) {
      el.statusBar.className = 'footer ' + (type || '');
      el.statusBar.innerHTML = '<span>' + message + '</span><div class="hint"><kbd>⌘</kbd> <kbd>↵</kbd> <span>to run query</span></div>';
    }

    function switchView(view) {
      state.currentView = view;
      el.builderViewBtn.classList.toggle('active', view === 'builder');
      el.editorViewBtn.classList.toggle('active', view === 'editor');
      el.builderView.classList.toggle('hidden', view !== 'builder');
      el.editorView.classList.toggle('hidden', view !== 'editor');
      if (view === 'editor') {
        const existingSql = buildSql();
        if (existingSql && !existingSql.startsWith('--')) {
          el.sqlEditor.value = existingSql;
        }
        state.customSql = el.sqlEditor.value;
        // Enable Run Query if SQL editor has content
        el.runQueryBtn.disabled = !state.customSql.trim();
      } else {
        // In builder view, enable only if table is selected
        el.runQueryBtn.disabled = !state.currentTable;
      }
    }

    function getTypeClass(type) {
      const t = (type || '').toLowerCase();
      if (t.includes('char') || t.includes('text') || t.includes('str')) return 'str';
      if (t.includes('int') || t.includes('long') || t.includes('num') || t.includes('decimal') || t.includes('double') || t.includes('float') || t.includes('big')) return 'int';
      if (t.includes('date') || t.includes('time')) return 'date';
      if (t.includes('bool')) return 'bool';
      return '';
    }

    function renderTableList() {
      const query = el.tableSearch.value.toLowerCase();
      const filtered = state.tables.filter(t => t.toLowerCase().includes(query));
      el.tableCount.textContent = state.tables.length === 0 ? '0' :
        (query ? filtered.length + '/' + state.tables.length : state.tables.length);

      if (state.tables.length === 0) return;

      if (filtered.length === 0) {
        el.tableList.innerHTML = '<div class="empty"><div class="empty-icon">🔍</div><div class="empty-title">No matches</div></div>';
        return;
      }

      el.tableList.innerHTML = filtered.map(t =>
        '<div class="list-item ' + (state.currentTable === t ? 'selected' : '') + '" data-table="' + escapeAttr(t) + '">' +
          '<span class="icon">📄</span>' +
          '<span class="label">' + escapeHtml(t) + '</span>' +
        '</div>'
      ).join('');

      el.tableList.querySelectorAll('.list-item').forEach(item => {
        item.addEventListener('click', () => selectTable(item.dataset.table));
      });
    }

    function selectTable(tableName) {
      state.currentTable = tableName;
      state.selectedFields = [];
      state.filters = [];
      state.orderBy = [];
      state.columns = [];

      renderTableList();
      renderSelectedFields();
      renderFromClause();
      renderFilters();
      renderOrderBy();

      el.fieldList.innerHTML = '<div class="empty"><div class="empty-icon"><span class="spinner" style="color: var(--accent); width: 20px; height: 20px;"></span></div><div class="empty-hint">Loading columns...</div></div>';

      vscode.postMessage({
        command: 'describeTable',
        params: {
          tenantId: el.tenantId.value.trim(),
          useStaging: String(el.useStaging.checked),
          tableName: tableName,
        }
      });

      updateQueryPreview();
      el.runQueryBtn.disabled = false;
    }

    function renderFieldList() {
      const query = el.fieldSearch.value.toLowerCase();
      const filtered = state.columns.filter(c => c.name.toLowerCase().includes(query));
      el.fieldCount.textContent = state.columns.length === 0 ? '0' :
        (query ? filtered.length + '/' + state.columns.length : state.columns.length);

      if (state.columns.length === 0) return;

      if (filtered.length === 0) {
        el.fieldList.innerHTML = '<div class="empty"><div class="empty-icon">🔍</div><div class="empty-title">No matches</div></div>';
        return;
      }

      el.fieldList.innerHTML = filtered.map(c => {
        const isSelected = state.selectedFields.includes(c.name);
        const typeClass = getTypeClass(c.type);
        return '<label class="list-item" style="cursor: pointer;">' +
          '<input type="checkbox" class="field-checkbox" data-field="' + escapeAttr(c.name) + '" ' + (isSelected ? 'checked' : '') + '>' +
          '<span class="label">' + escapeHtml(c.name) + '</span>' +
          '<span class="type-tag ' + typeClass + '">' + escapeHtml(c.type) + '</span>' +
        '</label>';
      }).join('');

      el.fieldList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => toggleField(cb.dataset.field));
      });
    }

    function toggleField(fieldName) {
      const idx = state.selectedFields.indexOf(fieldName);
      if (idx >= 0) {
        state.selectedFields.splice(idx, 1);
      } else {
        state.selectedFields.push(fieldName);
      }
      renderSelectedFields();
      updateQueryPreview();
    }

    function renderSelectedFields() {
      el.selectAllFieldsBtn.disabled = state.columns.length === 0 || state.selectedFields.length === state.columns.length;
      el.clearFieldsBtn.disabled = state.selectedFields.length === 0;

      if (state.selectedFields.length === 0) {
        el.selectedFieldsContainer.innerHTML = '<span class="placeholder">No columns selected — will use SELECT * (all columns)</span>';
        return;
      }

      el.selectedFieldsContainer.innerHTML = '<div class="chips">' +
        state.selectedFields.map(f =>
          '<div class="chip">' + escapeHtml(f) + '<span class="remove" data-field="' + escapeAttr(f) + '">✕</span></div>'
        ).join('') +
      '</div>';

      el.selectedFieldsContainer.querySelectorAll('.remove').forEach(r => {
        r.addEventListener('click', () => {
          toggleField(r.dataset.field);
          renderFieldList();
        });
      });
    }

    function renderFromClause() {
      el.changeFromBtn.disabled = state.tables.length === 0;
      if (!state.currentTable) {
        el.fromContainer.innerHTML = '<span class="placeholder">👈 Pick a table from the sidebar to begin</span>';
      } else {
        el.fromContainer.innerHTML = '<div class="chip primary">📄 ' + escapeHtml(state.currentTable) + '</div>';
      }
    }

    function renderFilters() {
      if (state.filters.length === 0) {
        el.filtersContainer.innerHTML = '<span class="placeholder">No filters applied</span>';
        el.logicToggle.style.display = 'none';
        return;
      }

      el.logicToggle.style.display = state.filters.length > 1 ? 'inline-flex' : 'none';

      const operators = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'NOT LIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL'];

      el.filtersContainer.innerHTML = state.filters.map((f, idx) => {
        const columnOptions = state.columns.map(c =>
          '<option value="' + escapeAttr(c.name) + '" ' + (f.column === c.name ? 'selected' : '') + '>' + escapeHtml(c.name) + '</option>'
        ).join('');

        const opOptions = operators.map(op =>
          '<option value="' + op + '" ' + (f.operator === op ? 'selected' : '') + '>' + op + '</option>'
        ).join('');

        const needsValue = !['IS NULL', 'IS NOT NULL'].includes(f.operator);

        return '<div class="filter-row">' +
          '<select class="field-select" data-filter-idx="' + idx + '" data-filter-prop="column">' +
            '<option value="">Select column...</option>' + columnOptions +
          '</select>' +
          '<select class="field-select" data-filter-idx="' + idx + '" data-filter-prop="operator">' + opOptions + '</select>' +
          (needsValue
            ? '<input type="text" class="field-input" data-filter-idx="' + idx + '" data-filter-prop="value" placeholder="Value" value="' + escapeAttr(f.value || '') + '">'
            : '<span></span>'
          ) +
          '<button class="remove-btn" data-remove-filter="' + idx + '" title="Remove filter">✕</button>' +
        '</div>';
      }).join('');

      el.filtersContainer.querySelectorAll('[data-filter-prop]').forEach(input => {
        input.addEventListener('change', (e) => {
          const idx = parseInt(e.target.dataset.filterIdx);
          const prop = e.target.dataset.filterProp;
          state.filters[idx][prop] = e.target.value;
          if (prop === 'operator') renderFilters();
          updateQueryPreview();
        });
        input.addEventListener('input', (e) => {
          const idx = parseInt(e.target.dataset.filterIdx);
          const prop = e.target.dataset.filterProp;
          state.filters[idx][prop] = e.target.value;
          updateQueryPreview();
        });
      });

      el.filtersContainer.querySelectorAll('[data-remove-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.removeFilter);
          state.filters.splice(idx, 1);
          renderFilters();
          updateQueryPreview();
        });
      });
    }

    function renderOrderBy() {
      if (state.orderBy.length === 0) {
        el.orderByContainer.innerHTML = '<span class="placeholder">No sorting applied</span>';
        return;
      }

      el.orderByContainer.innerHTML = state.orderBy.map((o, idx) => {
        const columnOptions = state.columns.map(c =>
          '<option value="' + escapeAttr(c.name) + '" ' + (o.column === c.name ? 'selected' : '') + '>' + escapeHtml(c.name) + '</option>'
        ).join('');

        const dirOptions = ['ASC', 'DESC'].map(d =>
          '<option value="' + d + '" ' + (o.direction === d ? 'selected' : '') + '>' + (d === 'ASC' ? '↑ ASC' : '↓ DESC') + '</option>'
        ).join('');

        return '<div class="order-row">' +
          '<select class="field-select" data-order-idx="' + idx + '" data-order-prop="column">' +
            '<option value="">Select column...</option>' + columnOptions +
          '</select>' +
          '<select class="field-select" data-order-idx="' + idx + '" data-order-prop="direction">' + dirOptions + '</select>' +
          '<button class="remove-btn" data-remove-order="' + idx + '" title="Remove sort">✕</button>' +
        '</div>';
      }).join('');

      el.orderByContainer.querySelectorAll('[data-order-prop]').forEach(input => {
        input.addEventListener('change', (e) => {
          const idx = parseInt(e.target.dataset.orderIdx);
          const prop = e.target.dataset.orderProp;
          state.orderBy[idx][prop] = e.target.value;
          updateQueryPreview();
        });
      });

      el.orderByContainer.querySelectorAll('[data-remove-order]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.removeOrder);
          state.orderBy.splice(idx, 1);
          renderOrderBy();
          updateQueryPreview();
        });
      });
    }

    function buildSql() {
      if (!state.currentTable) return '-- Select a table to generate query';

      const fields = state.selectedFields.length > 0 ? state.selectedFields.join(', ') : '*';
      let sql = 'SELECT ' + fields + '\\nFROM ' + state.currentTable;

      const validFilters = state.filters.filter(f => f.column);
      if (validFilters.length > 0) {
        const conditions = validFilters.map(f => {
          if (f.operator === 'IS NULL' || f.operator === 'IS NOT NULL') {
            return f.column + ' ' + f.operator;
          }
          const needsQuotes = f.operator === 'LIKE' || f.operator === 'NOT LIKE' || isNaN(Number(f.value));
          if (f.operator === 'IN' || f.operator === 'NOT IN') {
            return f.column + ' ' + f.operator + ' (' + f.value + ')';
          }
          const value = needsQuotes ? "'" + (f.value || '').replace(/'/g, "''") + "'" : f.value;
          return f.column + ' ' + f.operator + ' ' + value;
        });
        sql += '\\nWHERE ' + conditions.join(' ' + state.filterLogic + ' ');
      }

      const validOrder = state.orderBy.filter(o => o.column);
      if (validOrder.length > 0) {
        sql += '\\nORDER BY ' + validOrder.map(o => o.column + ' ' + o.direction).join(', ');
      }

      if (state.limit && state.limit > 0) {
        sql += '\\nLIMIT ' + state.limit;
      }

      return sql;
    }

    function highlightSql(sql) {
      const keywords = ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'LIMIT', 'AND', 'OR', 'NOT', 'IS NULL', 'IS NOT NULL', 'LIKE', 'IN', 'ASC', 'DESC'];
      let highlighted = escapeHtml(sql);
      keywords.forEach(kw => {
        const regex = new RegExp('\\\\b(' + kw + ')\\\\b', 'g');
        highlighted = highlighted.replace(regex, '<span class="sql-keyword">$1</span>');
      });
      highlighted = highlighted.replace(/'([^']*)'/g, '<span class="sql-string">\\'$1\\'</span>');
      highlighted = highlighted.replace(/\\b(\\d+)\\b/g, '<span class="sql-number">$1</span>');
      highlighted = highlighted.replace(/(--[^\\n]*)/g, '<span class="sql-comment">$1</span>');
      return highlighted;
    }

    function updateQueryPreview() {
      const sql = buildSql();
      el.queryPreviewText.innerHTML = highlightSql(sql);
    }

    function runQuery() {
      const tenantId = el.tenantId.value.trim();
      if (!tenantId) {
        setStatus('error', '❌ Tenant ID required');
        el.tenantId.focus();
        return;
      }

      const sql = state.currentView === 'editor' ? state.customSql : buildSql();
      if (!sql || sql.startsWith('--')) {
        setStatus('error', '❌ No valid query — select a table first');
        return;
      }

      el.runQueryBtn.disabled = true;
      setStatus('loading', '<span class="spinner"></span> Executing query...');

      vscode.postMessage({
        command: 'executeRawQuery',
        params: {
          tenantId,
          sql,
          useStaging: String(el.useStaging.checked),
          fetchSize: el.fetchSize.value,
        }
      });
    }

    function renderResults(data) {
      state.results = data;
      el.resultsPanel.classList.add('visible');
      el.exportCsvBtn.disabled = !data.rows || data.rows.length === 0;
      el.exportJsonBtn.disabled = !data.rows || data.rows.length === 0;

      el.resultsBadges.innerHTML =
        '<span class="badge">' + (data.rowCount || 0).toLocaleString() + ' rows</span>' +
        (data.executionTime ? '<span class="badge neutral">⏱ ' + data.executionTime + 'ms</span>' : '');

      if (!data.rows || data.rows.length === 0) {
        el.resultsBody.innerHTML = '<div class="no-results"><div class="icon">📭</div><div>Query successful. No rows returned.</div></div>';
        return;
      }

      const cols = data.columns;
      const html = [
        '<table class="table"><thead><tr>',
        cols.map(c => '<th>' + escapeHtml(c) + '</th>').join(''),
        '</tr></thead><tbody>',
        data.rows.slice(0, 1000).map(row =>
          '<tr>' + cols.map(c => {
            const value = row[c];
            const display = value === null || value === undefined ? '—' :
                            typeof value === 'object' ? JSON.stringify(value) :
                            String(value);
            return '<td title="' + escapeAttr(display) + '">' + escapeHtml(display) + '</td>';
          }).join('') + '</tr>'
        ).join(''),
        '</tbody></table>'
      ].join('');

      el.resultsBody.innerHTML = html;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = String(text == null ? '' : text);
      return div.innerHTML;
    }

    function escapeAttr(text) {
      return String(text == null ? '' : text).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    window.addEventListener('message', event => {
      const message = event.data;
      switch (message.command) {
        case 'tablesLoaded':
          state.tables = message.tables || [];
          renderTableList();
          renderFromClause();
          setStatus('success', '✅ Loaded ' + message.tableCount + ' tables — search and click to explore');
          break;

        case 'tablesLoadError':
          setStatus('error', message.error);
          break;

        case 'tableDescribed':
          state.columns = (message.schema.columns || []).map(c => ({name: c.name, type: c.type}));
          renderFieldList();
          renderSelectedFields();
          renderFilters();
          renderOrderBy();
          break;

        case 'tableDescribeError':
          el.fieldList.innerHTML = '<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-title">Failed to load</div><div class="empty-hint">' + escapeHtml(message.error) + '</div></div>';
          break;

        case 'queryExecuting':
          setStatus('loading', '<span class="spinner"></span> Executing query...');
          break;

        case 'queryResult':
          el.runQueryBtn.disabled = false;
          renderResults(message.data);
          setStatus('success', '✅ Query returned ' + message.data.rowCount + ' rows in ' + message.data.executionTime + 'ms');
          break;

        case 'queryError':
          el.runQueryBtn.disabled = false;
          setStatus('error', message.error);
          break;
      }
    });

    updateQueryPreview();
  </script>
</body>
</html>`;
  }
}
