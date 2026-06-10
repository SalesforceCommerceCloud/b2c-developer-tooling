/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import {
  type DocEntry,
  type DocSource,
  type IndexManifest,
  type SearchEntry,
  SUPPORTED_SCHEMA_VERSION,
} from './types.js';

interface SourcePaths {
  manifest: string;
  scriptApi: string;
  scriptApiSearch: string;
}

interface LoadedFullSource {
  source: DocSource;
  byId: Map<string, DocEntry>;
}

/**
 * Loads the Script API docs index from `resources/docs/` inside the
 * extension install location. Three-tier laziness:
 *
 *   1. `getManifest()`      — reads manifest.json on first call, then cached.
 *   2. `getSearchEntries()` — reads the search dictionary on first call,
 *      cached. ~5 MB of JSON parsed once per session.
 *   3. `getFullEntry(id)`   — loads the full source file (~8 MB) only when
 *      the user actually opens an entry. Cached thereafter.
 *
 * No network calls. Failures degrade gracefully:
 *   - Missing manifest -> getManifest() returns undefined; caller shows guidance.
 *   - Bad JSON         -> error logged once, that source is omitted.
 *   - Checksum mismatch -> warning logged, contents still served (we don't want
 *                          to silently break the panel for a contributor who
 *                          edited the JSON intentionally).
 */
export class DocsIndexLoader implements vscode.Disposable {
  private readonly paths: SourcePaths;
  private manifest?: IndexManifest;
  private manifestLoadAttempted = false;
  private manifestError?: string;

  private searchEntries?: SearchEntry[];
  private searchByQualifiedName?: Map<string, SearchEntry>;
  private searchById?: Map<string, SearchEntry>;
  private searchLoadAttempted = false;

  private readonly fullSources = new Map<DocSource, LoadedFullSource>();

  private readonly _onDidReload = new vscode.EventEmitter<void>();
  readonly onDidReload: vscode.Event<void> = this._onDidReload.event;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly log: vscode.OutputChannel,
  ) {
    const docsDir = path.join(context.extensionPath, 'resources', 'docs');
    this.paths = {
      manifest: path.join(docsDir, 'manifest.json'),
      scriptApi: path.join(docsDir, 'script-api.json'),
      scriptApiSearch: path.join(docsDir, 'script-api-search.json'),
    };
  }

  dispose(): void {
    this._onDidReload.dispose();
  }

  /** Force a re-read of all sources on next access. Fires `onDidReload`. */
  reload(): void {
    this.manifest = undefined;
    this.manifestLoadAttempted = false;
    this.manifestError = undefined;
    this.searchEntries = undefined;
    this.searchByQualifiedName = undefined;
    this.searchById = undefined;
    this.searchLoadAttempted = false;
    this.fullSources.clear();
    this._onDidReload.fire();
  }

  /** Returns the manifest, or `undefined` if the index has not been built. */
  getManifest(): IndexManifest | undefined {
    if (!this.manifestLoadAttempted) this.loadManifest();
    return this.manifest;
  }

  /** Last manifest-load failure message if any. */
  getManifestError(): string | undefined {
    if (!this.manifestLoadAttempted) this.loadManifest();
    return this.manifestError;
  }

  /** Search dictionary across all sources. Empty array if nothing loaded. */
  getSearchEntries(): readonly SearchEntry[] {
    if (!this.searchLoadAttempted) this.loadSearchEntries();
    return this.searchEntries ?? [];
  }

  /** O(1) lookup by id from the search dictionary. */
  getSearchEntryById(id: string): SearchEntry | undefined {
    if (!this.searchLoadAttempted) this.loadSearchEntries();
    return this.searchById?.get(id);
  }

  /**
   * Resolve a qualified name like `dw.order.BasketMgr.getCurrentBasket` (or its
   * `dw/order/BasketMgr#getCurrentBasket` slash form) to a search entry.
   * Returns the closest match if no exact entry exists (e.g. drops a method
   * suffix to find the parent class).
   */
  findEntryByQualifiedName(name: string): SearchEntry | undefined {
    if (!this.searchLoadAttempted) this.loadSearchEntries();
    if (!this.searchByQualifiedName) return undefined;
    const normalized = name.replace(/\//g, '.').replace(/#/g, '.');
    const exact = this.searchByQualifiedName.get(normalized);
    if (exact) return exact;
    // Try dropping trailing components — useful for hover text that includes
    // a generic instantiation or argument list.
    const parts = normalized.split('.');
    while (parts.length > 1) {
      parts.pop();
      const candidate = this.searchByQualifiedName.get(parts.join('.'));
      if (candidate) return candidate;
    }
    return undefined;
  }

  /**
   * Load the full DocEntry for a search hit. Lazily reads the full source file.
   * Returns `undefined` if the source file is missing or the entry was
   * dropped between the search dictionary and the full file (shouldn't happen,
   * but loader stays robust).
   */
  getFullEntry(id: string): DocEntry | undefined {
    const colon = id.indexOf(':');
    if (colon <= 0) return undefined;
    const source = id.slice(0, colon) as DocSource;
    const loaded = this.loadFullSource(source);
    return loaded?.byId.get(id);
  }

  private loadManifest(): void {
    this.manifestLoadAttempted = true;
    try {
      const raw = fs.readFileSync(this.paths.manifest, 'utf8');
      const parsed = JSON.parse(raw) as IndexManifest;
      if (parsed.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
        this.manifestError =
          `Docs index schemaVersion ${parsed.schemaVersion} is not supported (expected ${SUPPORTED_SCHEMA_VERSION}). ` +
          `Run \`pnpm --filter b2c-vs-extension run build:docs-index\` against a matching extension build.`;
        this.log.appendLine(`B2C DX docs: ${this.manifestError}`);
        return;
      }
      this.manifest = parsed;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException | undefined)?.code;
      if (code === 'ENOENT') {
        this.manifestError =
          'Docs index not found. Run `pnpm --filter b2c-vs-extension run build:docs-index` to generate it.';
      } else {
        this.manifestError = `Failed to read docs manifest: ${err instanceof Error ? err.message : String(err)}`;
      }
      this.log.appendLine(`B2C DX docs: ${this.manifestError}`);
    }
  }

  private loadSearchEntries(): void {
    this.searchLoadAttempted = true;
    if (!this.getManifest()) return;

    const collected: SearchEntry[] = [];
    this.appendSearchEntriesFrom(this.paths.scriptApiSearch, collected);

    this.searchEntries = collected;
    this.searchByQualifiedName = new Map();
    this.searchById = new Map();
    for (const entry of collected) {
      this.searchById.set(entry.id, entry);
      // First write wins on collision (Script API entries come first; later
      // sources don't share qualified-name space).
      const key = entry.qualifiedName;
      if (!this.searchByQualifiedName.has(key)) this.searchByQualifiedName.set(key, entry);
    }
  }

  private appendSearchEntriesFrom(filePath: string, into: SearchEntry[]): void {
    let raw: string;
    try {
      raw = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      const code = (err as NodeJS.ErrnoException | undefined)?.code;
      if (code !== 'ENOENT') {
        this.log.appendLine(
          `B2C DX docs: Failed to read ${path.basename(filePath)}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      this.log.appendLine(
        `B2C DX docs: Malformed ${path.basename(filePath)}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }
    if (!Array.isArray(parsed)) {
      this.log.appendLine(`B2C DX docs: Expected array in ${path.basename(filePath)}.`);
      return;
    }
    for (const item of parsed) {
      if (isSearchEntry(item)) into.push(item);
    }
  }

  private loadFullSource(source: DocSource): LoadedFullSource | undefined {
    const cached = this.fullSources.get(source);
    if (cached) return cached;

    // Currently only 'script-api' is a valid DocSource. Adding more in the
    // future means extending the SourcePaths interface and routing here.
    const filePath = this.paths.scriptApi;
    let raw: string;
    try {
      raw = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      const code = (err as NodeJS.ErrnoException | undefined)?.code;
      if (code !== 'ENOENT') {
        this.log.appendLine(
          `B2C DX docs: Failed to read ${path.basename(filePath)}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      return undefined;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      this.log.appendLine(
        `B2C DX docs: Malformed ${path.basename(filePath)}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return undefined;
    }
    if (!Array.isArray(parsed)) {
      this.log.appendLine(`B2C DX docs: Expected array in ${path.basename(filePath)}.`);
      return undefined;
    }

    const byId = new Map<string, DocEntry>();
    for (const item of parsed) {
      if (isDocEntry(item)) byId.set(item.id, item);
    }
    const loaded: LoadedFullSource = {source, byId};
    this.fullSources.set(source, loaded);
    return loaded;
  }
}

function isSearchEntry(value: unknown): value is SearchEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.qualifiedName === 'string' &&
    typeof v.kind === 'string'
  );
}

function isDocEntry(value: unknown): value is DocEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.source === 'string' &&
    typeof v.kind === 'string' &&
    typeof v.title === 'string' &&
    typeof v.qualifiedName === 'string'
  );
}
