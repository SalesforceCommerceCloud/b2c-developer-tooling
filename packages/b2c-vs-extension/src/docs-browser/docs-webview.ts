/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {randomBytes} from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import type {DocsIndexLoader} from './docs-index.js';
import type {DocsRecents} from './docs-recents.js';
import {type EntryChildLookup, type MemberRow, renderDocEntryWithMembersHtml} from './docs-entry-renderer.js';
import {searchDocs} from './docs-search.js';
import type {IndexManifest, SearchEntry} from './types.js';

export type WebviewIncomingMessage =
  | {type: 'ready'}
  | {type: 'search'; query: string}
  | {type: 'openEntry'; id: string};

export type WebviewOutgoingMessage =
  | {type: 'searchResults'; query: string; results: SearchHitPayload[]}
  | {type: 'showEntry'; id: string; qualifiedName: string; html: string}
  | {type: 'showEmpty'; message?: string; recents?: SearchHitPayload[]}
  | {type: 'updateVersion'; label: string};

export interface SearchHitPayload {
  id: string;
  title: string;
  qualifiedName: string;
  kind: string;
}

const PANEL_VIEW_TYPE = 'b2c-dx.docs.panel';

/**
 * Owns the single Docs webview panel. Reuses the panel across `openEntry` calls
 * so the URL shows the same column placement and the user's scroll/search state
 * persists. The panel is recreated on demand if the user closes it.
 */
export class DocsWebviewManager implements vscode.Disposable {
  private panel?: vscode.WebviewPanel;
  private currentEntryId?: string;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly loader: DocsIndexLoader,
    private readonly log: vscode.OutputChannel,
    private readonly recents: DocsRecents,
  ) {
    this.disposables.push(
      this.loader.onDidReload(() => {
        if (!this.panel) return;
        this.postVersionLabel();
        if (this.currentEntryId) {
          void this.showEntry(this.currentEntryId);
        }
      }),
    );
  }

  dispose(): void {
    for (const d of this.disposables) {
      try {
        d.dispose();
      } catch {
        /* ignore */
      }
    }
    this.disposables.length = 0;
    this.panel?.dispose();
    this.panel = undefined;
  }

  /** Reveal the panel without selecting any entry. */
  reveal(): void {
    const panel = this.ensurePanel();
    panel.reveal(panel.viewColumn ?? vscode.ViewColumn.One);
    if (!this.currentEntryId) {
      this.postEmpty();
    }
  }

  /** Reveal the panel and render the given entry. */
  async showEntry(id: string): Promise<void> {
    const search = this.loader.getSearchEntryById(id);
    if (!search) {
      this.reveal();
      this.post({type: 'showEmpty', message: `Entry not found (${id}).`, recents: this.collectRecentPayloads()});
      return;
    }
    const full = this.loader.getFullEntry(id);
    if (!full) {
      this.reveal();
      this.post({
        type: 'showEmpty',
        message: `Could not load entry: ${search.qualifiedName}`,
        recents: this.collectRecentPayloads(),
      });
      return;
    }

    const panel = this.ensurePanel();
    panel.title = `Docs · ${search.title}`;
    panel.reveal(panel.viewColumn ?? vscode.ViewColumn.One, true);

    this.currentEntryId = id;
    this.post({
      type: 'showEntry',
      id,
      qualifiedName: search.qualifiedName,
      html: renderDocEntryWithMembersHtml(full, this.buildChildLookup()),
    });
    try {
      await this.recents.push(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.appendLine(`B2C DX docs: failed to update recents: ${message}`);
    }
  }

  private ensurePanel(): vscode.WebviewPanel {
    if (this.panel) return this.panel;

    const panel = vscode.window.createWebviewPanel(PANEL_VIEW_TYPE, 'B2C Docs', vscode.ViewColumn.Beside, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [this.context.extensionUri],
    });

    panel.webview.html = this.buildHtml(panel.webview);

    panel.webview.onDidReceiveMessage(
      (message: WebviewIncomingMessage) => this.handleMessage(message),
      undefined,
      this.disposables,
    );

    panel.onDidDispose(
      () => {
        this.panel = undefined;
        this.currentEntryId = undefined;
      },
      undefined,
      this.disposables,
    );

    this.panel = panel;
    return panel;
  }

  private handleMessage(message: WebviewIncomingMessage): void {
    if (!message || typeof message !== 'object') return;
    if (message.type === 'ready') {
      this.postVersionLabel();
      if (this.currentEntryId) {
        void this.showEntry(this.currentEntryId);
      } else {
        this.postEmpty();
      }
      return;
    }
    if (message.type === 'search') {
      this.runSearch(message.query);
      return;
    }
    if (message.type === 'openEntry') {
      void this.showEntry(message.id);
      return;
    }
  }

  private postEmpty(): void {
    this.post({type: 'showEmpty', recents: this.collectRecentPayloads()});
  }

  private buildChildLookup(): EntryChildLookup {
    return {
      childrenOf: (parentId: string): MemberRow[] => {
        const children = this.loader.getSearchEntries().filter((entry) => entry.parentId === parentId);
        const rows: MemberRow[] = [];
        for (const child of children) {
          const full = this.loader.getFullEntry(child.id);
          rows.push({
            id: child.id,
            title: child.title,
            kind: child.kind,
            signature: full?.signature,
            description: full?.description,
            deprecated: Boolean(full?.deprecated),
            sinceApiVersion: full?.sinceApiVersion,
          });
        }
        return rows;
      },
    };
  }

  private collectRecentPayloads(): SearchHitPayload[] {
    const ids = this.recents.list();
    const out: SearchHitPayload[] = [];
    for (const id of ids) {
      const entry: SearchEntry | undefined = this.loader.getSearchEntryById(id);
      if (!entry) continue;
      out.push({id: entry.id, title: entry.title, qualifiedName: entry.qualifiedName, kind: entry.kind});
    }
    return out;
  }

  private runSearch(query: string): void {
    const entries = this.loader.getSearchEntries();
    const hits = searchDocs(entries, query, {limit: 25});
    const payload: SearchHitPayload[] = hits.map((hit) => ({
      id: hit.entry.id,
      title: hit.entry.title,
      qualifiedName: hit.entry.qualifiedName,
      kind: hit.entry.kind,
    }));
    this.post({type: 'searchResults', query, results: payload});
  }

  private postVersionLabel(): void {
    const manifest = this.loader.getManifest();
    this.post({type: 'updateVersion', label: formatVersionLabel(manifest)});
  }

  private post(message: WebviewOutgoingMessage): void {
    if (!this.panel) return;
    void this.panel.webview.postMessage(message);
  }

  private buildHtml(webview: vscode.Webview): string {
    const templatePath = path.join(this.context.extensionPath, 'src', 'docs-browser', 'docs-webview.html');
    let html: string;
    try {
      html = fs.readFileSync(templatePath, 'utf8');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.appendLine(`B2C DX docs: failed to read webview template: ${message}`);
      return fallbackHtml(message);
    }

    const nonce = randomBytes(16).toString('hex');
    html = html.replace(/__NONCE__/g, nonce);
    html = html.replace(/__CSP_SOURCE__/g, webview.cspSource);
    html = html.replace('__VERSION_LABEL__', escapeAttribute(formatVersionLabel(this.loader.getManifest())));
    return html;
  }
}

function formatVersionLabel(manifest: IndexManifest | undefined): string {
  if (!manifest) return 'Docs index unavailable';
  const parts: string[] = [];
  if (manifest.scriptApiVersion) {
    parts.push(`Script API v${manifest.scriptApiVersion} (${manifest.counts.scriptApi})`);
  }
  if (manifest.counts.isml > 0) {
    const ismlLabel = manifest.ismlVersion ? `ISML ${manifest.ismlVersion}` : 'ISML';
    parts.push(`${ismlLabel} (${manifest.counts.isml})`);
  }
  if (manifest.counts.bm > 0) {
    const bmLabel = manifest.bmVersion ? `BM ${manifest.bmVersion}` : 'BM';
    parts.push(`${bmLabel} (${manifest.counts.bm})`);
  }
  return parts.join(' · ');
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fallbackHtml(error: string): string {
  return `<!DOCTYPE html><html><body><pre>Docs panel unavailable: ${escapeAttribute(error)}</pre></body></html>`;
}
