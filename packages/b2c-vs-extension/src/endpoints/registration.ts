/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

import type {ProjectIndexService} from '../cartridges/project-index-service.js';
import {registerSafeCommand} from '../safety.js';
import {openCommand} from './endpoints-tree.js';
import {absolutePath, type RowModel} from './model.js';

/**
 * Registers "Open Registration": jumps from a hook or custom job step row (in
 * the Endpoints or Cartridges view) to its entry in hooks.json or steptypes.json.
 */
export function registerOpenRegistration(context: vscode.ExtensionContext, indexService: ProjectIndexService): void {
  context.subscriptions.push(
    registerSafeCommand('b2c-dx.project.openRegistration', async (node?: {row?: RowModel}) => {
      const location = node?.row?.registration;
      if (!location) return;
      const file = absolutePath(indexService.getIndex(), location);
      if (!file) return;
      const command = openCommand(file, location.line);
      await vscode.commands.executeCommand(command.command, ...(command.arguments ?? []));
    }),
  );
}
