/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {BaseCommand, TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  createScaffoldRegistry,
  type Scaffold,
  type ScaffoldCategory,
  type ScaffoldSource,
} from '@salesforce/b2c-tooling-sdk/scaffold';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Response type for the list command.
 */
interface ScaffoldListResponse {
  count: number;
  categories: ScaffoldCategory[];
  sources: ScaffoldSource[];
  data: Array<{
    id: string;
    displayName: string;
    description: string;
    category: ScaffoldCategory;
    source: string;
    path: string;
  }>;
}

const COLUMNS: Record<string, ColumnDef<Scaffold>> = {
  id: {
    header: 'ID',
    get: (s) => s.id,
  },
  displayName: {
    header: 'Name',
    get: (s) => s.manifest.displayName,
  },
  category: {
    header: 'Category',
    get: (s) => s.manifest.category,
  },
  source: {
    header: 'Source',
    get: (s) => s.source,
  },
  description: {
    header: 'Description',
    get: (s) => s.manifest.description,
    extended: true,
  },
  path: {
    header: 'Path',
    get: (s) => s.path,
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['id', 'displayName', 'category', 'source'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list available project scaffolds.
 */
export default class ScaffoldList extends BaseCommand<typeof ScaffoldList> {
  static description = withDocs(
    t('commands.scaffold.list.description', 'List available project scaffolds'),
    '/cli/scaffold.html#b2c-scaffold-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --category cartridge',
    '<%= config.bin %> <%= command.id %> --source project',
    '<%= config.bin %> <%= command.id %> --extended',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    category: Flags.string({
      char: 'c',
      description: 'Filter by category',
    }),
    source: Flags.string({
      char: 's',
      description: 'Filter by source (built-in, user, project, plugin)',
      options: ['built-in', 'user', 'project', 'plugin'],
    }),
    columns: Flags.string({
      description: `Columns to display (comma-separated). Available: ${Object.keys(COLUMNS).join(', ')}`,
    }),
    extended: Flags.boolean({
      char: 'x',
      description: 'Show all columns including extended fields',
      default: false,
    }),
  };

  async run(): Promise<ScaffoldListResponse> {
    const registry = createScaffoldRegistry();
    const category = this.flags.category as ScaffoldCategory | undefined;
    const source = this.flags.source as ScaffoldSource | undefined;
    const projectRoot = this.flags['working-directory'] || process.cwd();

    const scaffolds = await registry.getScaffolds({
      category,
      sources: source ? [source] : undefined,
      projectRoot,
    });

    // Collect unique categories and sources for metadata
    const uniqueCategories = [...new Set(scaffolds.map((s) => s.manifest.category))];
    const uniqueSources = [...new Set(scaffolds.map((s) => s.source))];

    const response: ScaffoldListResponse = {
      count: scaffolds.length,
      categories: uniqueCategories,
      sources: uniqueSources,
      data: scaffolds.map((s) => ({
        id: s.id,
        displayName: s.manifest.displayName,
        description: s.manifest.description,
        category: s.manifest.category,
        source: s.source,
        path: s.path,
      })),
    };

    if (this.jsonEnabled()) {
      return response;
    }

    if (scaffolds.length === 0) {
      this.log(t('commands.scaffold.list.noScaffolds', 'No scaffolds found.'));
      return response;
    }

    this.log(t('commands.scaffold.list.foundScaffolds', 'Found {{count}} scaffold(s):', {count: scaffolds.length}));
    this.log('');

    tableRenderer.render(scaffolds, this.getSelectedColumns());

    return response;
  }

  /**
   * Determines which columns to display based on flags.
   */
  private getSelectedColumns(): string[] {
    const columnsFlag = this.flags.columns;
    const extended = this.flags.extended;

    if (columnsFlag) {
      const requested = columnsFlag.split(',').map((c) => c.trim());
      const valid = tableRenderer.validateColumnKeys(requested);
      if (valid.length === 0) {
        this.warn(`No valid columns specified. Available: ${tableRenderer.getColumnKeys().join(', ')}`);
        return DEFAULT_COLUMNS;
      }
      return valid;
    }

    if (extended) {
      return tableRenderer.getColumnKeys();
    }

    return DEFAULT_COLUMNS;
  }
}
