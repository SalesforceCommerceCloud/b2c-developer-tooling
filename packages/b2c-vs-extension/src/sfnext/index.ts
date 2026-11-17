/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Storefront Next: warns when a saved `@Component` / `@PageType` source no
 * longer matches its generated Page Designer metadata, with a Quick Fix that
 * regenerates it using the project's own generator.
 *
 * Cost when it does nothing: one string check per saved TypeScript file. The
 * generator only runs for saved files that contain a decorator, in a
 * Storefront Next workspace, one run at a time per file.
 */
import * as path from 'path';
import * as vscode from 'vscode';
import {isStorefrontNextWorkspace} from '../project-type.js';
import {sfnextDecoratedTypes} from '../content-tree/type-sources.js';
import {checkMetadataDrift, findSfnextProjectRoot, regenerateMetadata, type StaleMetadata} from './metadata-drift.js';

const SOURCE = 'b2c-dx';
const DIAGNOSTIC_CODE = 'sfnext-metadata-stale';
const REGENERATE_COMMAND = 'b2c-dx.storefrontNext.regenerateMetadata';
const DECORATOR_PATTERN = /@(Component|PageType)\(/;

function enabled(): boolean {
  return vscode.workspace.getConfiguration('b2c-dx').get<boolean>('storefrontNext.metadataDiagnostics', true);
}

/** Project root for a decorated source document, or undefined when it is not one. */
function projectFor(document: vscode.TextDocument): string | undefined {
  if (document.uri.scheme !== 'file' || !/\.tsx?$/.test(document.fileName)) return undefined;
  if (!isStorefrontNextWorkspace() || !enabled()) return undefined;
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!folder) return undefined;
  if (!DECORATOR_PATTERN.test(document.getText())) return undefined;
  const root = findSfnextProjectRoot(document.fileName, folder.uri.fsPath);
  if (!root) return undefined;
  // The generator only reads sources under src/.
  const relative = path.relative(root, document.fileName);
  return relative.split(path.sep)[0] === 'src' ? root : undefined;
}

function toDiagnostics(document: vscode.TextDocument, stale: StaleMetadata[]): vscode.Diagnostic[] {
  const decorated = sfnextDecoratedTypes(document.getText());
  return stale.map((item) => {
    const line = decorated.find((d) => d.kind === item.kind && d.typeId === item.typeId)?.line ?? 0;
    const range = document.lineAt(Math.min(line, document.lineCount - 1)).range;
    const what = item.kind === 'page' ? 'page type' : 'component type';
    const message =
      item.reason === 'missing'
        ? `Page Designer metadata for ${what} "${item.typeId}" has not been generated.`
        : `Page Designer metadata for ${what} "${item.typeId}" is out of date with this source.`;
    const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning);
    diagnostic.source = SOURCE;
    diagnostic.code = DIAGNOSTIC_CODE;
    diagnostic.relatedInformation = [
      new vscode.DiagnosticRelatedInformation(
        new vscode.Location(vscode.Uri.file(item.file), new vscode.Position(0, 0)),
        'Generated metadata',
      ),
    ];
    return diagnostic;
  });
}

export function registerStorefrontNext(context: vscode.ExtensionContext, log: vscode.OutputChannel): void {
  const collection = vscode.languages.createDiagnosticCollection('storefront-next');
  context.subscriptions.push(collection);

  // One check per file at a time; a save during a check queues one re-check.
  const running = new Set<string>();
  const pending = new Set<string>();

  const check = async (document: vscode.TextDocument): Promise<void> => {
    const key = document.uri.toString();
    const root = projectFor(document);
    if (!root) {
      collection.delete(document.uri);
      return;
    }
    if (running.has(key)) {
      pending.add(key);
      return;
    }
    running.add(key);
    try {
      const stale = await checkMetadataDrift(root, document.fileName, {
        onError: (message) =>
          log.appendLine(`[Storefront Next] Metadata check skipped for ${document.fileName}: ${message}`),
      });
      if (stale === undefined || document.isClosed) collection.delete(document.uri);
      else collection.set(document.uri, toDiagnostics(document, stale));
    } finally {
      running.delete(key);
      if (pending.delete(key)) void check(document);
    }
  };

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => void check(document)),
    vscode.workspace.onDidCloseTextDocument((document) => collection.delete(document.uri)),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('b2c-dx.storefrontNext.metadataDiagnostics') && !enabled()) collection.clear();
    }),
    vscode.commands.registerCommand(REGENERATE_COMMAND, async (uri?: vscode.Uri) => {
      const target = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (!target) return;
      const document = await vscode.workspace.openTextDocument(target);
      if (document.isDirty) await document.save();
      const folder = vscode.workspace.getWorkspaceFolder(target);
      const root = folder ? findSfnextProjectRoot(target.fsPath, folder.uri.fsPath) : undefined;
      if (!root) {
        void vscode.window.showWarningMessage('This file is not in a Storefront Next project.');
        return;
      }
      const result = await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Window, title: 'Regenerating Page Designer metadata'},
        () => regenerateMetadata(root, target.fsPath),
      );
      if (!result.ok) {
        log.appendLine(`[Storefront Next] Regenerating metadata for ${target.fsPath} failed: ${result.error}`);
        void vscode.window.showErrorMessage(
          'Could not regenerate Page Designer metadata. Run "sfnext generate-cartridge" in the project for details.',
        );
        return;
      }
      await check(document);
    }),
    vscode.languages.registerCodeActionsProvider(
      [
        {scheme: 'file', language: 'typescript'},
        {scheme: 'file', language: 'typescriptreact'},
      ],
      {
        provideCodeActions(document, _range, ctx) {
          const diagnostics = ctx.diagnostics.filter((d) => d.source === SOURCE && d.code === DIAGNOSTIC_CODE);
          if (diagnostics.length === 0) return [];
          const action = new vscode.CodeAction('Regenerate Page Designer metadata', vscode.CodeActionKind.QuickFix);
          action.command = {command: REGENERATE_COMMAND, title: action.title, arguments: [document.uri]};
          action.diagnostics = diagnostics;
          action.isPreferred = true;
          return [action];
        },
      },
      {providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]},
    ),
  );
}
