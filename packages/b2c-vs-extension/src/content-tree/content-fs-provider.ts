/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {Library, LibraryNode} from '@salesforce/b2c-tooling-sdk/operations/content';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {siteArchiveImport, getJobLog, JobExecutionError} from '@salesforce/b2c-tooling-sdk';
import JSZip from 'jszip';
import * as xml2js from 'xml2js';
import * as vscode from 'vscode';
import type {ContentConfigProvider} from './content-config.js';
import {openJobLog} from '../job-log-viewer.js';

export const CONTENT_SCHEME = 'b2c-content';

interface ParsedContentUri {
  libraryId: string;
  contentId?: string;
  isSiteLibrary: boolean;
}

function parseContentUri(uri: vscode.Uri): ParsedContentUri {
  const parts = uri.path.replace(/^\//, '').split('/');
  if (parts[0] === 'site') {
    return {
      libraryId: parts[1],
      contentId: parts[2]?.replace(/\.xml$/, ''),
      isSiteLibrary: true,
    };
  }
  return {
    libraryId: parts[0],
    contentId: parts[1]?.replace(/\.xml$/, ''),
    isSiteLibrary: false,
  };
}

export function contentItemUri(libraryId: string, isSiteLibrary: boolean, contentId: string): vscode.Uri {
  const uriPath = isSiteLibrary ? `/site/${libraryId}/${contentId}.xml` : `/${libraryId}/${contentId}.xml`;
  return vscode.Uri.from({scheme: CONTENT_SCHEME, path: uriPath});
}

/**
 * Import a single library XML payload to an instance.
 *
 * Wraps the XML at the correct archive path (site-private vs shared library),
 * zips it, and runs a site-archive import job. Shared by the content file-system
 * writeFile flow and the "Convert to Content Block" command.
 *
 * @throws Re-throws the underlying error (e.g. JobExecutionError) so callers can
 *   surface the job log; performs no cache invalidation or UI itself.
 */
export async function importLibraryXML(
  instance: B2CInstance,
  libraryId: string,
  isSiteLibrary: boolean,
  xmlString: string,
): Promise<void> {
  const archivePath = isSiteLibrary ? `sites/${libraryId}/library/library.xml` : `libraries/${libraryId}/library.xml`;
  const zip = new JSZip();
  zip.file(archivePath, xmlString);
  const buffer = await zip.generateAsync({type: 'nodebuffer'});
  await siteArchiveImport(instance, buffer);
}

/**
 * Generate library XML for a single content item and its descendants,
 * without mutating the cached Library instance.
 */
export function generateContentXML(library: Library, contentId: string): string {
  let target: LibraryNode | undefined;
  for (const node of library.nodes({traverseHidden: true, callbackHidden: true})) {
    if (node.id === contentId) {
      target = node as LibraryNode;
      break;
    }
  }
  if (!target) {
    throw new Error(`Content "${contentId}" not found in library`);
  }

  // Collect xml objects from target and all descendants
  const xmlObjects: Record<string, unknown>[] = [];
  function collect(node: LibraryNode): void {
    if (node.xml) {
      // Sync in-memory data back to the xml representation
      if (node.data) {
        const dataEl = (node.xml['data'] as Array<Record<string, string>>)?.[0];
        if (dataEl) {
          dataEl['_'] = JSON.stringify(node.data, null, 2);
        }
      }
      xmlObjects.push(node.xml);
    }
    for (const child of node.children) {
      collect(child);
    }
  }
  collect(target);

  // Build a minimal library XML document with just the selected content
  const origLibrary = library.xml['library'] as Record<string, unknown>;
  const xmlDoc = {
    library: {
      $: origLibrary['$'],
      content: xmlObjects,
    },
  };

  return new xml2js.Builder().buildObject(xmlDoc);
}

export class ContentFileSystemProvider implements vscode.FileSystemProvider {
  private _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile = this._onDidChangeFile.event;
  // Cache of last-known mtime/size for content items, keyed by `${libraryId}:${contentId}`.
  // Without this, returning Date.now() from stat() makes VS Code think the file changed externally
  // on every stat call, triggering phantom "file modified" prompts that can clobber unsaved buffers.
  // Cache only mtime — size is intentionally omitted because readFile returns dynamically
  // generated XML whose byte length doesn't match the bytes the user wrote.
  private mtimes = new Map<string, number>();

  constructor(private configProvider: ContentConfigProvider) {}

  watch(): vscode.Disposable {
    return new vscode.Disposable(() => {});
  }

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    const {libraryId, contentId} = parseContentUri(uri);
    if (!contentId) {
      // Library root — directory
      return {type: vscode.FileType.Directory, ctime: 0, mtime: 0, size: 0};
    }
    // Content item — file. Use cached mtime if known; otherwise return 0
    // (VS Code treats mtime: 0 as "unknown / no change detected").
    return {
      type: vscode.FileType.File,
      ctime: 0,
      mtime: this.mtimes.get(`${libraryId}:${contentId}`) ?? 0,
      size: 0,
    };
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const {libraryId} = parseContentUri(uri);
    const library = this.configProvider.getCachedLibrary(libraryId);
    if (!library) {
      return [];
    }
    return library.tree.children
      .filter((node) => !node.hidden)
      .map((node) => [`${node.id}.xml`, vscode.FileType.File] as [string, vscode.FileType]);
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    const {libraryId, contentId} = parseContentUri(uri);
    if (!contentId) {
      throw vscode.FileSystemError.FileIsADirectory(uri);
    }

    const library = this.configProvider.getCachedLibrary(libraryId);
    if (!library) {
      throw vscode.FileSystemError.Unavailable(
        `Library "${libraryId}" not loaded. Expand it in the Content tree first.`,
      );
    }

    const xmlString = generateContentXML(library, contentId);
    return new TextEncoder().encode(xmlString);
  }

  async writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void> {
    const {libraryId, contentId, isSiteLibrary} = parseContentUri(uri);
    const instance = this.configProvider.getInstance();
    if (!instance) {
      throw vscode.FileSystemError.Unavailable('No B2C Commerce instance configured');
    }

    const xmlContent = Buffer.from(content).toString('utf-8');

    try {
      await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Importing content to ${libraryId}...`},
        async () => {
          await importLibraryXML(instance, libraryId, isSiteLibrary, xmlContent);
        },
      );
    } catch (err) {
      // Show job log in editor on failure
      if (err instanceof JobExecutionError && err.execution.is_log_file_existing) {
        try {
          const log = await getJobLog(instance, err.execution);
          await openJobLog(err.execution.id ?? 'job', log);
        } catch {
          // Fall through to generic error
        }
      }
      const message = err instanceof Error ? err.message : String(err);
      throw vscode.FileSystemError.Unavailable(`Import failed: ${message}`);
    }

    // Invalidate cache since the instance was updated
    this.configProvider.invalidateLibrary(libraryId);
    // Record mtime so subsequent stat() calls return a stable timestamp instead of Date.now(),
    // preventing VS Code from thinking the file changed externally.
    if (contentId) {
      this.mtimes.set(`${libraryId}:${contentId}`, Date.now());
    }
    this._onDidChangeFile.fire([{type: vscode.FileChangeType.Changed, uri}]);
    vscode.window.showInformationMessage(`Content imported to ${libraryId} successfully.`);
  }

  createDirectory(): never {
    throw vscode.FileSystemError.NoPermissions('Content structure is managed by the commerce platform');
  }

  delete(): never {
    throw vscode.FileSystemError.NoPermissions('Content structure is managed by the commerce platform');
  }

  rename(): never {
    throw vscode.FileSystemError.NoPermissions('Rename not supported');
  }

  fireDidChange(uri: vscode.Uri): void {
    this._onDidChangeFile.fire([{type: vscode.FileChangeType.Changed, uri}]);
  }
}
