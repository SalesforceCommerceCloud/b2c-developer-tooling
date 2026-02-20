/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as path from 'path';
import * as vscode from 'vscode';
import type {WebDavConfigProvider} from './webdav-config.js';

export const WEBDAV_SCHEME = 'b2c-webdav';

/** Standard B2C Commerce WebDAV root directories. */
export const WEBDAV_ROOTS: {key: string; path: string}[] = [
  {key: 'Impex', path: 'Impex'},
  {key: 'Temp', path: 'Temp'},
  {key: 'Cartridges', path: 'Cartridges'},
  {key: 'Realmdata', path: 'Realmdata'},
  {key: 'Catalogs', path: 'Catalogs'},
  {key: 'Libraries', path: 'Libraries'},
  {key: 'Static', path: 'Static'},
  {key: 'Logs', path: 'Logs'},
  {key: 'Securitylogs', path: 'Securitylogs'},
];

const CACHE_TTL_MS = 30_000;

const MIME_BY_EXT: Record<string, string> = {
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.zip': 'application/zip',
  '.js': 'application/javascript',
  '.ts': 'application/typescript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.txt': 'text/plain',
};

interface CachedStat {
  stat: vscode.FileStat;
  timestamp: number;
}

interface CachedDir {
  entries: [string, vscode.FileType][];
  timestamp: number;
}

/** Convert a b2c-webdav URI to a WebDAV path (strip leading slash). */
function uriToWebdavPath(uri: vscode.Uri): string {
  return uri.path.replace(/^\//, '');
}

/** Build a b2c-webdav URI from a WebDAV path. */
export function webdavPathToUri(webdavPath: string): vscode.Uri {
  return vscode.Uri.parse(`${WEBDAV_SCHEME}:/${webdavPath}`);
}

function isStale(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_TTL_MS;
}

function mapHttpError(err: unknown, uri: vscode.Uri): vscode.FileSystemError {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('404') || message.includes('Not Found')) {
    return vscode.FileSystemError.FileNotFound(uri);
  }
  if (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('Unauthorized') ||
    message.includes('Forbidden')
  ) {
    return vscode.FileSystemError.NoPermissions(uri);
  }
  return vscode.FileSystemError.Unavailable(message);
}

export class WebDavFileSystemProvider implements vscode.FileSystemProvider {
  private _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile = this._onDidChangeFile.event;

  private statCache = new Map<string, CachedStat>();
  private dirCache = new Map<string, CachedDir>();

  constructor(private configProvider: WebDavConfigProvider) {}

  watch(): vscode.Disposable {
    // WebDAV has no push notifications — return no-op disposable.
    return new vscode.Disposable(() => {});
  }

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    const webdavPath = uriToWebdavPath(uri);

    // Synthetic root directory — avoids PROPFIND on "/"
    if (!webdavPath) {
      return {type: vscode.FileType.Directory, ctime: 0, mtime: 0, size: 0};
    }

    const cached = this.statCache.get(webdavPath);
    if (cached && !isStale(cached.timestamp)) {
      return cached.stat;
    }

    const instance = this.configProvider.getInstance();
    if (!instance) {
      throw vscode.FileSystemError.Unavailable('No B2C Commerce instance configured');
    }

    try {
      const entries = await instance.webdav.propfind(webdavPath, '0');
      if (!entries.length) {
        throw vscode.FileSystemError.FileNotFound(uri);
      }
      const entry = entries[0];
      const mtime = entry.lastModified ? entry.lastModified.getTime() : 0;
      const fileStat: vscode.FileStat = {
        type: entry.isCollection ? vscode.FileType.Directory : vscode.FileType.File,
        ctime: mtime,
        mtime,
        size: entry.contentLength ?? 0,
      };
      this.statCache.set(webdavPath, {stat: fileStat, timestamp: Date.now()});
      return fileStat;
    } catch (err) {
      if (err instanceof vscode.FileSystemError) throw err;
      throw mapHttpError(err, uri);
    }
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const webdavPath = uriToWebdavPath(uri);

    // Synthetic root listing — return the well-known roots
    if (!webdavPath) {
      return WEBDAV_ROOTS.map((r) => [r.key, vscode.FileType.Directory] as [string, vscode.FileType]);
    }

    const cached = this.dirCache.get(webdavPath);
    if (cached && !isStale(cached.timestamp)) {
      return cached.entries;
    }

    const instance = this.configProvider.getInstance();
    if (!instance) {
      throw vscode.FileSystemError.Unavailable('No B2C Commerce instance configured');
    }

    try {
      const allEntries = await instance.webdav.propfind(webdavPath, '1');

      // Filter out the self-entry
      const normalizedPath = webdavPath.replace(/\/$/, '');
      const children = allEntries.filter((entry) => {
        const entryPath = decodeURIComponent(entry.href);
        return !entryPath.endsWith(`/${normalizedPath}`) && !entryPath.endsWith(`/${normalizedPath}/`);
      });

      const now = Date.now();
      const result: [string, vscode.FileType][] = [];

      for (const entry of children) {
        const displayName = entry.displayName ?? entry.href.split('/').filter(Boolean).at(-1) ?? entry.href;
        const childPath = `${webdavPath}/${displayName}`;
        const fileType = entry.isCollection ? vscode.FileType.Directory : vscode.FileType.File;
        const mtime = entry.lastModified ? entry.lastModified.getTime() : 0;

        // Populate stat cache for each child
        this.statCache.set(childPath, {
          stat: {
            type: fileType,
            ctime: mtime,
            mtime,
            size: entry.contentLength ?? 0,
          },
          timestamp: now,
        });

        result.push([displayName, fileType]);
      }

      this.dirCache.set(webdavPath, {entries: result, timestamp: now});
      return result;
    } catch (err) {
      if (err instanceof vscode.FileSystemError) throw err;
      throw mapHttpError(err, uri);
    }
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    const webdavPath = uriToWebdavPath(uri);
    const instance = this.configProvider.getInstance();
    if (!instance) {
      throw vscode.FileSystemError.Unavailable('No B2C Commerce instance configured');
    }

    try {
      const buffer = await instance.webdav.get(webdavPath);
      return new Uint8Array(buffer);
    } catch (err) {
      if (err instanceof vscode.FileSystemError) throw err;
      throw mapHttpError(err, uri);
    }
  }

  async writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    _options: {create: boolean; overwrite: boolean},
  ): Promise<void> {
    const webdavPath = uriToWebdavPath(uri);
    const instance = this.configProvider.getInstance();
    if (!instance) {
      throw vscode.FileSystemError.Unavailable('No B2C Commerce instance configured');
    }

    try {
      const ext = path.extname(webdavPath).toLowerCase();
      const contentType = MIME_BY_EXT[ext];
      await instance.webdav.put(webdavPath, Buffer.from(content), contentType);
      this.clearCache(webdavPath);
      this.fireDid(vscode.FileChangeType.Changed, uri);
    } catch (err) {
      if (err instanceof vscode.FileSystemError) throw err;
      throw mapHttpError(err, uri);
    }
  }

  async createDirectory(uri: vscode.Uri): Promise<void> {
    const webdavPath = uriToWebdavPath(uri);
    const instance = this.configProvider.getInstance();
    if (!instance) {
      throw vscode.FileSystemError.Unavailable('No B2C Commerce instance configured');
    }

    try {
      await instance.webdav.mkcol(webdavPath);
      this.clearCache(webdavPath);
      this.fireDid(vscode.FileChangeType.Created, uri);
    } catch (err) {
      if (err instanceof vscode.FileSystemError) throw err;
      throw mapHttpError(err, uri);
    }
  }

  async delete(uri: vscode.Uri): Promise<void> {
    const webdavPath = uriToWebdavPath(uri);
    const instance = this.configProvider.getInstance();
    if (!instance) {
      throw vscode.FileSystemError.Unavailable('No B2C Commerce instance configured');
    }

    try {
      await instance.webdav.delete(webdavPath);
      this.clearCache(webdavPath);
      this.fireDid(vscode.FileChangeType.Deleted, uri);
    } catch (err) {
      if (err instanceof vscode.FileSystemError) throw err;
      throw mapHttpError(err, uri);
    }
  }

  rename(): never {
    throw vscode.FileSystemError.NoPermissions('Rename not supported');
  }

  /** Clear cached data for a path and its parent directory. If no path, clear everything. */
  clearCache(webdavPath?: string): void {
    if (!webdavPath) {
      this.statCache.clear();
      this.dirCache.clear();
      return;
    }
    this.statCache.delete(webdavPath);
    this.dirCache.delete(webdavPath);
    // Also invalidate parent
    const parentPath = webdavPath.includes('/') ? webdavPath.substring(0, webdavPath.lastIndexOf('/')) : '';
    if (parentPath) {
      this.statCache.delete(parentPath);
      this.dirCache.delete(parentPath);
    }
  }

  private fireDid(type: vscode.FileChangeType, uri: vscode.Uri): void {
    this._onDidChangeFile.fire([{type, uri}]);
  }
}
