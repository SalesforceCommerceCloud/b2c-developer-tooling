/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags, ux} from '@oclif/core';
import {
  InstanceCommand,
  TableRenderer,
  columnFlagsFor,
  selectColumns,
  type ColumnDef,
} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ExperiencesRequestError,
  ExperiencesUnavailableError,
  walkContentFolder,
  type ContentFolderNode,
} from '@salesforce/b2c-tooling-sdk/operations/content';
import {LIBRARY_FLAG, LIBRARY_REQUIRED, localizedValue, resolveLibraryId} from '../../../utils/content/library.js';

export interface FolderListItem {
  id: string;
  kind: 'asset' | 'folder';
  /** Default-locale name (see \`names\` for all locales). */
  name: string;
  /** Localized names. */
  names: Record<string, string>;
  /** Parent folder ID. */
  folder: string;
  /** Folder path from the start folder, e.g. `root/promos/summer`. */
  path: string;
  /** Folder: boolean. Asset: online in the default locale. Undefined when not set. */
  online?: boolean;
}

function localizedMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, String(v)]));
}

function defaultBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value && typeof value === 'object') {
    const map = value as Record<string, unknown>;
    const v = map.default ?? Object.values(map)[0];
    return typeof v === 'boolean' ? v : undefined;
  }
  return undefined;
}

function flatten(node: ContentFolderNode, parentPath: string, out: FolderListItem[]): void {
  const path = parentPath ? `${parentPath}/${node.folder.id}` : node.folder.id;
  for (const asset of node.content) {
    out.push({
      id: asset.id,
      kind: 'asset',
      name: localizedValue(asset.name),
      names: localizedMap(asset.name),
      folder: node.folder.id,
      path,
      online: defaultBoolean(asset.online),
    });
  }
  for (const child of node.folders) {
    const f = child.folder as {id: string; name?: unknown; online?: boolean};
    out.push({
      id: f.id,
      kind: 'folder',
      name: localizedValue(f.name),
      names: localizedMap(f.name),
      folder: node.folder.id,
      path,
      online: defaultBoolean(f.online),
    });
    flatten(child, path, out);
  }
}

function renderTree(node: ContentFolderNode, prefix: string, lines: string[]): void {
  const entries: Array<{label: string; node?: ContentFolderNode}> = [
    ...node.folders.map((c) => ({label: `${c.folder.id}/`, node: c})),
    ...node.content.map((a) => ({label: a.id})),
  ];
  for (const [i, entry] of entries.entries()) {
    const last = i === entries.length - 1;
    lines.push(`${prefix}${last ? '└── ' : '├── '}${entry.label}`);
    if (entry.node) renderTree(entry.node, prefix + (last ? '    ' : '│   '), lines);
  }
}

const COLUMNS: Record<string, ColumnDef<FolderListItem>> = {
  id: {header: 'ID', get: (i) => i.id},
  kind: {header: 'KIND', get: (i) => i.kind},
  name: {header: 'NAME', get: (i) => i.name || '-'},
  path: {header: 'PATH', get: (i) => i.path},
  online: {header: 'ONLINE', get: (i) => (i.online === undefined ? '-' : String(i.online))},
  folder: {header: 'FOLDER', get: (i) => i.folder, extended: true},
};

const tableRenderer = new TableRenderer(COLUMNS);

export default class ContentFolderList extends InstanceCommand<typeof ContentFolderList> {
  static description =
    'Walk the folder tree of a content library and list its folders and content assets (no export job)';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --library SharedLibrary --tree',
    '<%= config.bin %> <%= command.id %> --folder promos --depth 1',
    '<%= config.bin %> <%= command.id %> --folders-only --json',
  ];

  static flags = {
    ...LIBRARY_FLAG,
    folder: Flags.string({description: 'Folder to start from', default: 'root'}),
    depth: Flags.integer({description: 'Maximum folder depth below the start folder', min: 0}),
    'folders-only': Flags.boolean({description: 'List folders without their content assets'}),
    tree: Flags.boolean({description: 'Show a tree instead of a table'}),
    ...columnFlagsFor(COLUMNS),
  };

  protected operations = {walkContentFolder};

  async run(): Promise<{data: FolderListItem[]; libraryId: string; tree: ContentFolderNode}> {
    this.requireOAuthCredentials();
    const libraryId = resolveLibraryId(this.flags.library, this.resolvedConfig.values);
    if (!libraryId) this.error(LIBRARY_REQUIRED);

    let tree;
    try {
      tree = await this.operations.walkContentFolder(this.instance, libraryId, {
        folderId: this.flags.folder,
        depth: this.flags.depth,
        includeContent: !this.flags['folders-only'],
      });
    } catch (error) {
      if (error instanceof ExperiencesUnavailableError || error instanceof ExperiencesRequestError) {
        this.error(error.message);
      }
      throw error;
    }

    const data: FolderListItem[] = [];
    flatten(tree, '', data);
    const result = {libraryId, tree, data};
    if (this.jsonEnabled()) return result;

    if (this.flags.tree) {
      const lines = [`${tree.folder.id}/`];
      renderTree(tree, '', lines);
      ux.stdout(lines.join('\n'));
    } else if (data.length === 0) {
      ux.stdout(
        `Folder ${tree.folder.id} is empty. Assets that are not in any folder can't be listed this way; use "b2c content list".`,
      );
    } else {
      tableRenderer.render(
        data,
        selectColumns(this.flags, tableRenderer, ['id', 'kind', 'name', 'path', 'online'], this.warn.bind(this)),
      );
    }
    return result;
  }
}
