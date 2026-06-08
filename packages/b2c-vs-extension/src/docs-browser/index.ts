/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';

import {registerSafeCommand} from '../safety.js';
import {DocsIndexLoader} from './docs-index.js';
import {DocsRecents} from './docs-recents.js';
import {searchDocs} from './docs-search.js';
import {DocsTreeProvider} from './docs-tree-provider.js';
import {DocsWebviewManager} from './docs-webview.js';
import {extractIdentifierAtOffset, extractScriptApiQualifiedName, findIsmlTagAtOffset} from './symbol-resolver.js';

/**
 * Phase 5 surface:
 *   - Sidebar tree: `b2cDocsBrowser`.
 *   - Webview panel for entry detail.
 *   - Commands:
 *       - `b2c-dx.docs.search`         Quick-pick search across the index.
 *       - `b2c-dx.docs.open`           Invoked by tree clicks and the quick-pick picker.
 *       - `b2c-dx.docs.refresh`        Re-reads the bundled index from disk.
 *       - `b2c-dx.docs.viewSymbolDocs` Right-click in editor → resolve symbol/tag → open docs.
 */
export function registerDocsBrowser(context: vscode.ExtensionContext, log: vscode.OutputChannel): void {
  const loader = new DocsIndexLoader(context, log);
  context.subscriptions.push(loader);

  const tree = new DocsTreeProvider(loader);
  const treeView = vscode.window.createTreeView('b2cDocsBrowser', {
    treeDataProvider: tree,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  const recents = new DocsRecents(context.globalState);
  const webviewManager = new DocsWebviewManager(context, loader, log, recents);
  context.subscriptions.push(webviewManager);

  context.subscriptions.push(
    registerSafeCommand('b2c-dx.docs.refresh', () => {
      loader.reload();
    }),

    registerSafeCommand('b2c-dx.docs.search', async (initial?: string) => {
      await runSearch(loader, webviewManager, recents, typeof initial === 'string' ? initial : '');
    }),

    registerSafeCommand('b2c-dx.docs.open', async (id?: string) => {
      if (typeof id !== 'string' || id.length === 0) {
        await vscode.window.showWarningMessage('B2C DX Docs: missing entry id.');
        return;
      }
      if (!loader.getSearchEntryById(id)) {
        await vscode.window.showWarningMessage(`B2C DX Docs: entry not found (${id}).`);
        return;
      }
      await webviewManager.showEntry(id);
    }),

    registerSafeCommand('b2c-dx.docs.viewSymbolDocs', async () => {
      await runViewSymbolDocs(loader, webviewManager, recents, log);
    }),
  );
}

/**
 * Right-click handler. Picks the best target depending on language:
 *
 *   - ISML  -> `findIsmlTagAtOffset` -> `isml:<tag>` lookup.
 *   - JS/TS -> ask the hover provider, extract `dw.*` qualified name, look up
 *              by qualified name. If that fails, fall back to the bare identifier
 *              (often a class name, e.g. `BasketMgr`).
 *
 * If nothing resolves, opens the search quick-pick prefilled with the best
 * candidate string so the user has a one-keystroke recovery path.
 */
async function runViewSymbolDocs(
  loader: DocsIndexLoader,
  webviewManager: DocsWebviewManager,
  recents: DocsRecents,
  log: vscode.OutputChannel,
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    await vscode.window.showInformationMessage(
      'B2C DX Docs: open a JavaScript, TypeScript, or ISML file to look up docs.',
    );
    return;
  }

  const document = editor.document;
  const position = editor.selection.active;
  const offset = document.offsetAt(position);

  if (document.languageId === 'isml') {
    const tagName = findIsmlTagAtOffset(document.getText(), offset);
    if (tagName) {
      const id = `isml:${tagName.toLowerCase()}`;
      if (loader.getSearchEntryById(id)) {
        await webviewManager.showEntry(id);
        return;
      }
      // Tag not in the index — open search prefilled with the bare name.
      await runSearch(loader, webviewManager, recents, tagName);
      return;
    }
    await runSearch(loader, webviewManager, recents, '');
    return;
  }

  // JS/TS path.
  const word = extractIdentifierAtOffset(document.getText(), offset);
  let qualified: string | undefined;
  try {
    const hovers =
      (await vscode.commands.executeCommand<vscode.Hover[]>('vscode.executeHoverProvider', document.uri, position)) ??
      [];
    const text = collectHoverText(hovers);
    qualified = extractScriptApiQualifiedName(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.appendLine(`B2C DX docs: hover lookup failed: ${message}`);
  }

  if (qualified) {
    const entry = loader.findEntryByQualifiedName(qualified);
    if (entry) {
      await webviewManager.showEntry(entry.id);
      return;
    }
  }

  // Try the bare identifier as a fallback. Mostly useful when the cursor is on
  // a class name or method whose hover content didn't include a qualifier.
  if (word) {
    const entry = loader.findEntryByQualifiedName(word) ?? findBestSearchHit(loader, word);
    if (entry) {
      await webviewManager.showEntry(entry.id);
      return;
    }
  }

  // Final fallback: open search prefilled with whichever candidate we have.
  await runSearch(loader, webviewManager, recents, qualified ?? word ?? '');
}

function collectHoverText(hovers: vscode.Hover[]): string {
  const parts: string[] = [];
  for (const hover of hovers) {
    for (const content of hover.contents) {
      if (typeof content === 'string') {
        parts.push(content);
      } else if (content instanceof vscode.MarkdownString) {
        parts.push(content.value);
      } else {
        // MarkedString shape: {language, value}
        const value = (content as {value?: unknown}).value;
        if (typeof value === 'string') parts.push(value);
      }
    }
  }
  return parts.join('\n');
}

function findBestSearchHit(loader: DocsIndexLoader, query: string) {
  const entries = loader.getSearchEntries();
  const hits = searchDocs(entries, query, {limit: 1});
  return hits[0]?.entry;
}

async function runSearch(
  loader: DocsIndexLoader,
  webviewManager: DocsWebviewManager,
  recents: DocsRecents,
  initialQuery: string,
): Promise<void> {
  const manifest = loader.getManifest();
  if (!manifest) {
    const error = loader.getManifestError() ?? 'Docs index unavailable.';
    await vscode.window.showWarningMessage(`B2C DX Docs: ${error}`);
    return;
  }

  const entries = loader.getSearchEntries();
  if (entries.length === 0) {
    await vscode.window.showInformationMessage('B2C DX Docs: index is empty.');
    return;
  }

  const quickPick = vscode.window.createQuickPick<DocsQuickPickItem>();
  quickPick.title = `B2C DX Docs · Script API v${manifest.scriptApiVersion}`;
  quickPick.placeholder = 'Search Script API, ISML, or Business Manager docs…';
  quickPick.matchOnDescription = true;
  quickPick.matchOnDetail = true;

  const recentItems = (): DocsQuickPickItem[] => {
    const recentIds = recents.list();
    if (recentIds.length === 0) return [];
    const items: DocsQuickPickItem[] = [];
    for (const id of recentIds) {
      const entry = loader.getSearchEntryById(id);
      if (!entry) continue;
      items.push({
        label: `$(history) ${entry.title}`,
        description: entry.qualifiedName,
        detail: `Recent · ${entry.kind}`,
        entryId: entry.id,
      });
    }
    return items;
  };

  const renderResults = (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      quickPick.items = recentItems();
      return;
    }
    const hits = searchDocs(entries, trimmed, {limit: 50});
    quickPick.items = hits.map((hit) => ({
      label: hit.entry.title,
      description: hit.entry.qualifiedName,
      detail: hit.entry.kind,
      entryId: hit.entry.id,
    }));
  };

  if (initialQuery) {
    quickPick.value = initialQuery;
    renderResults(initialQuery);
  } else {
    quickPick.items = recentItems();
  }

  quickPick.onDidChangeValue(renderResults);
  quickPick.onDidAccept(() => {
    const picked = quickPick.activeItems[0];
    quickPick.hide();
    if (picked) {
      void webviewManager.showEntry(picked.entryId);
    }
  });
  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
}

interface DocsQuickPickItem extends vscode.QuickPickItem {
  entryId: string;
}
