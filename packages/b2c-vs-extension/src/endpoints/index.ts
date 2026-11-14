/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

import type {ProjectIndexService} from '../cartridges/project-index-service.js';
import {registerSafeCommand} from '../safety.js';
import {EndpointsTreeProvider, openCommand, type EndpointsNode} from './endpoints-tree.js';

/** Registers the Endpoints view: controller endpoints, Custom APIs, and hooks from the project index. */
export function registerEndpoints(context: vscode.ExtensionContext, indexService: ProjectIndexService): void {
  const provider = new EndpointsTreeProvider(indexService);
  const view = vscode.window.createTreeView('b2cEndpointsExplorer', {
    treeDataProvider: provider,
    showCollapseAll: true,
  });

  const updateDescription = () => {
    const parts = [
      provider.filter ? `filter: ${provider.filter}` : '',
      provider.showingIssuesOnly ? 'issues only' : '',
    ];
    view.description = parts.filter(Boolean).join(' · ') || undefined;
    void vscode.commands.executeCommand('setContext', 'b2c-dx.endpoints.issuesOnly', provider.showingIssuesOnly);
    void vscode.commands.executeCommand('setContext', 'b2c-dx.endpoints.filtered', Boolean(provider.filter));
  };
  updateDescription();

  context.subscriptions.push(
    provider,
    view,
    registerSafeCommand('b2c-dx.endpoints.refresh', () => provider.refresh()),
    registerSafeCommand('b2c-dx.endpoints.filter', async () => {
      const text = await vscode.window.showInputBox({
        title: 'Filter Endpoints',
        prompt: 'Show endpoints, Custom APIs, and hooks whose name contains this text',
        value: provider.filter,
        placeHolder: 'Cart-, afterPOST, loyalty',
      });
      if (text === undefined) return;
      provider.setFilter(text);
      updateDescription();
    }),
    registerSafeCommand('b2c-dx.endpoints.clearFilter', () => {
      provider.setFilter('');
      updateDescription();
    }),
    registerSafeCommand('b2c-dx.endpoints.showIssuesOnly', () => {
      provider.setIssuesOnly(true);
      updateDescription();
    }),
    registerSafeCommand('b2c-dx.endpoints.showAll', () => {
      provider.setIssuesOnly(false);
      updateDescription();
    }),
    registerSafeCommand('b2c-dx.endpoints.openImplementation', async (node?: EndpointsNode) => {
      if (node?.type !== 'row' || !node.implementation) return;
      const file = provider.resolve(node.implementation);
      if (!file) return;
      const command = openCommand(file, node.implementation.line);
      await vscode.commands.executeCommand(command.command, ...(command.arguments ?? []));
    }),
  );
}
