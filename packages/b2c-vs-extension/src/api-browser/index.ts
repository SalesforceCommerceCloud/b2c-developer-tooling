/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {registerSafeCommand} from '../safety.js';
import {
  ApiBrowserTreeDataProvider,
  ApiSchemaTreeItem,
  isShopperSchema,
  type SchemaEntry,
} from './api-browser-tree-provider.js';
import {SwaggerWebviewManager} from './swagger-webview.js';

const SFNEXT_TERMINAL_NAME = 'sfnext scapi add';

function runSfnextScapiAdd(schema: SchemaEntry, cwd: string, log: vscode.OutputChannel): void {
  const existing = vscode.window.terminals.find((t) => t.name === SFNEXT_TERMINAL_NAME);
  const terminal = existing ?? vscode.window.createTerminal({name: SFNEXT_TERMINAL_NAME, cwd});
  const command = `pnpm sfnext scapi add ${schema.apiFamily} ${schema.apiName} ${schema.apiVersion}`;
  log.appendLine(`[API Browser] Spawning terminal "${SFNEXT_TERMINAL_NAME}" (cwd=${cwd})`);
  log.appendLine(`[API Browser] $ ${command}`);
  terminal.show();
  terminal.sendText(command);
}

export function registerApiBrowser(
  context: vscode.ExtensionContext,
  configProvider: B2CExtensionConfig,
  log: vscode.OutputChannel,
): void {
  const treeProvider = new ApiBrowserTreeDataProvider(configProvider, log);
  const swaggerManager = new SwaggerWebviewManager(context, configProvider, log);

  const treeView = vscode.window.createTreeView('b2cApiBrowser', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  const refreshDisposable = registerSafeCommand('b2c-dx.apiBrowser.refresh', () => {
    treeProvider.refresh();
  });

  const openSwaggerDisposable = registerSafeCommand('b2c-dx.apiBrowser.openSwagger', (schema: SchemaEntry) => {
    swaggerManager.openSwaggerPanel(schema);
  });

  const scapiAddDisposable = registerSafeCommand(
    'b2c-dx.apiBrowser.scapiAdd',
    (item: ApiSchemaTreeItem | SchemaEntry) => {
      log.appendLine(`[API Browser] scapiAdd invoked with arg type=${item?.constructor?.name ?? typeof item}`);
      const schema = item instanceof ApiSchemaTreeItem ? item.schema : item;
      log.appendLine(`[API Browser] scapiAdd schema=${JSON.stringify(schema)}`);
      if (!schema || !isShopperSchema(schema)) {
        const msg = `Storefront Next scapi add is only available for Shopper schemas (got apiFamily="${schema?.apiFamily ?? '<missing>'}", apiName="${schema?.apiName ?? '<missing>'}").`;
        log.appendLine(`[API Browser] ${msg}`);
        vscode.window.showErrorMessage(msg);
        return;
      }
      const cwd = configProvider.getWorkingDirectory();
      runSfnextScapiAdd(schema, cwd, log);
    },
  );

  configProvider.onDidReset(() => {
    treeProvider.refresh();
  });

  context.subscriptions.push(treeView, refreshDisposable, openSwaggerDisposable, scapiAddDisposable, swaggerManager);
}
