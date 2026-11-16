/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

import type {ProjectIndexService} from '../cartridges/project-index-service.js';
import {controllerLenses} from './model.js';

/**
 * Code lenses on controller route statements (`server.get('Show', ...)`) that
 * summarize the composed endpoint and reveal it in the Endpoints view.
 */
export class ControllerLensProvider implements vscode.CodeLensProvider, vscode.Disposable {
  readonly onDidChangeCodeLenses: vscode.Event<void>;

  private readonly emitter = new vscode.EventEmitter<void>();
  private readonly sub: vscode.Disposable;

  constructor(private readonly indexService: ProjectIndexService) {
    this.onDidChangeCodeLenses = this.emitter.event;
    this.sub = indexService.onDidChange(() => this.emitter.fire());
  }

  dispose(): void {
    this.sub.dispose();
    this.emitter.dispose();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    return controllerLenses(this.indexService.getIndex(), document.uri.fsPath).map((lens) => {
      const line = Math.min(Math.max(0, lens.line - 1), document.lineCount - 1);
      return new vscode.CodeLens(document.lineAt(line).range, {
        title: lens.title,
        tooltip: lens.tooltip,
        command: 'b2c-dx.endpoints.reveal',
        arguments: [lens.endpoint],
      });
    });
  }
}
