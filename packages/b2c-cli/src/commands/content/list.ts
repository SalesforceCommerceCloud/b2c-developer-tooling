/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {ux} from '@oclif/core';
import {JobCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {fetchContentLibrary} from '@salesforce/b2c-tooling-sdk/operations/content';

interface ContentListItem {
  id: string;
  type: string;
  typeId: string;
  children: number;
}

const COLUMNS: Record<string, ColumnDef<ContentListItem>> = {
  id: {
    header: 'ID',
    get: (item) => item.id,
  },
  type: {
    header: 'TYPE',
    get: (item) => item.type,
  },
  typeId: {
    header: 'TYPE ID',
    get: (item) => item.typeId,
  },
  children: {
    header: 'CHILDREN',
    get: (item) => String(item.children),
  },
};

const DEFAULT_COLUMNS = ['id', 'type', 'typeId', 'children'];

const TYPE_MAP: Record<string, string> = {
  page: 'PAGE',
  content: 'CONTENT',
  component: 'COMPONENT',
};

export default class ContentList extends JobCommand<typeof ContentList> {
  static description = 'List pages and content in a content library';

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --library SharedLibrary',
    '<%= config.bin %> <%= command.id %> --library SharedLibrary --tree',
    '<%= config.bin %> <%= command.id %> --library RefArch --site-library --type page',
  ];

  static flags = {
    ...JobCommand.baseFlags,
    library: Flags.string({
      description: 'Library ID or site ID (also configurable via dw.json "content-library")',
    }),
    'site-library': Flags.boolean({
      description: 'Site-private library',
      default: false,
    }),
    'library-file': Flags.string({
      description: 'Local XML file',
    }),
    type: Flags.string({
      description: 'Filter by node type',
      options: ['page', 'content', 'component'],
    }),
    components: Flags.boolean({
      description: 'Include components in output',
      default: false,
    }),
    tree: Flags.boolean({
      description: 'Show tree structure',
      default: false,
    }),
    timeout: Flags.integer({
      description: 'Job timeout in seconds',
    }),
  };

  protected operations = {
    fetchContentLibrary,
  };

  async run(): Promise<{data: ContentListItem[]}> {
    const {flags} = await this.parse(ContentList);

    const libraryId = flags.library ?? this.resolvedConfig.values.contentLibrary;
    if (!libraryId) {
      this.error('Library is required. Set via --library flag or "content-library" in dw.json.');
    }

    if (!flags['library-file']) {
      this.requireOAuthCredentials();
    }

    const waitOptions = flags.timeout ? {timeout: flags.timeout * 1000} : undefined;

    const instance = flags['library-file'] ? (null as unknown as typeof this.instance) : this.instance;

    const {library} = await this.operations.fetchContentLibrary(instance, libraryId, {
      libraryFile: flags['library-file'],
      isSiteLibrary: flags['site-library'],
      waitOptions,
    });

    const typeFilter = flags.type ? TYPE_MAP[flags.type] : undefined;

    const items: ContentListItem[] = [];

    function collectItems(nodes: typeof library.tree.children, includeComponents: boolean): void {
      for (const child of nodes) {
        // Skip static asset nodes in table view
        if (child.type === 'STATIC') {
          continue;
        }

        // Skip components unless --components is set
        if (child.type === 'COMPONENT' && !includeComponents) {
          continue;
        }

        // Apply type filter
        const matchesType = !typeFilter || child.type === typeFilter;
        if (matchesType) {
          items.push({
            id: child.id,
            type: child.type,
            typeId: child.typeId ?? '',
            children: child.children.length,
          });
        }

        // Recurse into children when --components is set
        if (includeComponents && child.children.length > 0) {
          collectItems(child.children, true);
        }
      }
    }

    collectItems(library.tree.children, flags.components);

    if (flags.tree) {
      ux.stdout(library.getTreeString({colorize: ux.colorize}));
      return {data: items};
    }

    if (this.jsonEnabled()) {
      return {data: items};
    }

    if (items.length === 0) {
      ux.stdout('No content found.');
      return {data: items};
    }

    createTable(COLUMNS).render(items, DEFAULT_COLUMNS);

    return {data: items};
  }
}
