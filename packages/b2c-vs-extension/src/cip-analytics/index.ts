/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {listCipReports} from '@salesforce/b2c-tooling-sdk/operations/cip';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {CipAnalyticsTreeDataProvider} from './cip-tree-provider.js';
import {CipWebviewManager} from './cip-webview-manager.js';
import type {CipReportEntry} from './types.js';

/**
 * Register CIP Analytics feature.
 * Follows the pattern from api-browser/index.ts and sandbox-tree/index.ts.
 */
export function registerCipAnalytics(
  context: vscode.ExtensionContext,
  configProvider: B2CExtensionConfig,
  log: vscode.OutputChannel,
): void {
  // Create tree provider
  const treeProvider = new CipAnalyticsTreeDataProvider(configProvider, log);

  // Create webview manager
  const webviewManager = new CipWebviewManager(context, configProvider, log);

  // Create tree view
  const treeView = vscode.window.createTreeView('b2cCipAnalytics', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  // Register refresh command
  const refreshDisposable = vscode.commands.registerCommand('b2c-dx.cipAnalytics.refresh', () => {
    treeProvider.refresh();
  });

  // Register open report command - now opens webview dashboard
  const openReportDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.openReport',
    async (report?: CipReportEntry) => {
      // If no report provided (called from command palette), show quick pick
      if (!report) {
        const allReports = listCipReports();
        const items = allReports.map((r) => ({
          label: r.name,
          description: r.category,
          detail: r.description,
          report: r,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select a CIP Analytics report to open',
          matchOnDescription: true,
          matchOnDetail: true,
        });

        if (!selected) {
          return; // User cancelled
        }

        report = selected.report;
      }

      log.appendLine(`[CIP Analytics] Opening dashboard for report: ${report.name}`);
      await webviewManager.openReport(report);
    },
  );

  // Register browse tables command
  const browseTablesDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.browseTables',
    async () => {
      log.appendLine('[CIP Analytics] Opening tables browser');
      await webviewManager.openTablesBrowser();
    },
  );

  // Register query builder command
  const queryBuilderDisposable = vscode.commands.registerCommand(
    'b2c-dx.cipAnalytics.queryBuilder',
    async () => {
      log.appendLine('[CIP Analytics] Opening Query Builder');
      await webviewManager.openQueryBuilder();
    },
  );

  // Refresh tree when config changes
  configProvider.onDidReset(() => {
    treeProvider.refresh();
  });

  // Register all disposables
  context.subscriptions.push(
    treeView,
    refreshDisposable,
    openReportDisposable,
    browseTablesDisposable,
    queryBuilderDisposable,
  );

  log.appendLine('[CIP Analytics] Feature registered successfully');
}
