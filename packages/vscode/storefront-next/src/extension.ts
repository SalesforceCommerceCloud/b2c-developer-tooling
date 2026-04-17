/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as vscode from 'vscode';
import type {B2CDXApi} from 'b2c-dx-core/api';
import {registerPageDesignerCommands} from './page-designer/page-designer-commands.js';

const CORE_EXTENSION_ID = 'salesforce.b2c-dx-core';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const coreExt = vscode.extensions.getExtension<B2CDXApi>(CORE_EXTENSION_ID);
  if (!coreExt) {
    vscode.window.showErrorMessage('B2C DX Storefront Next requires the B2C DX Core extension.');
    return;
  }

  const api = coreExt.isActive ? coreExt.exports : await coreExt.activate();
  if (!api) {
    vscode.window.showErrorMessage('B2C DX Core failed to activate. See Output > B2C DX for details.');
    return;
  }

  const disposables = registerPageDesignerCommands(context, api);
  context.subscriptions.push(...disposables);
}

export function deactivate(): void {
  // Nothing to clean up
}
