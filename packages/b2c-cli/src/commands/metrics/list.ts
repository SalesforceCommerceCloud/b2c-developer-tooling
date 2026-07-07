/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {TableRenderer, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {METRIC_CATEGORIES, type MetricCategory} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Category information for display.
 */
interface CategoryInfo {
  category: MetricCategory;
  description: string;
}

const CATEGORY_DESCRIPTIONS: Record<MetricCategory, string> = {
  overall: 'Overall system metrics including requests, errors, and response times',
  sales: 'Sales and order metrics',
  ecdn: 'Enhanced CDN metrics',
  'third-party': 'Third-party service integration metrics',
  scapi: 'Salesforce Commerce API (SCAPI) metrics',
  'scapi-hooks': 'SCAPI hooks execution metrics',
  mrt: 'Managed Runtime (MRT) metrics',
  controller: 'Controller execution metrics',
  ocapi: 'Open Commerce API (OCAPI) metrics',
};

const COLUMNS: Record<string, ColumnDef<CategoryInfo>> = {
  category: {
    header: 'Category',
    get: (c) => c.category,
  },
  description: {
    header: 'Description',
    get: (c) => c.description,
  },
};

const DEFAULT_COLUMNS = ['category', 'description'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to list available metrics categories.
 *
 * ⚠️ **CLOSED BETA:** The Metrics API is a closed beta feature. It must be enabled for your
 * organization, and its behavior, output, and OAuth scopes may change without notice.
 */
export default class MetricsList extends Command {
  static description = withDocs(
    t(
      'commands.metrics.list.description',
      '[CLOSED BETA] List available metrics categories. The Metrics API must be enabled for your organization.',
      {},
    ),
    '/cli/metrics.html#b2c-metrics-list',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --json'];

  async run(): Promise<{categories: CategoryInfo[]}> {
    await this.parse(MetricsList);

    const categories: CategoryInfo[] = METRIC_CATEGORIES.map((category) => ({
      category,
      description: CATEGORY_DESCRIPTIONS[category],
    }));

    const output = {categories};

    if (this.jsonEnabled()) {
      return output;
    }

    this.log(t('commands.metrics.list.header', 'Available metrics categories:', {}));
    this.log('');

    tableRenderer.render(categories, DEFAULT_COLUMNS);

    this.log('');
    this.log(
      t(
        'commands.metrics.list.usage',
        'Use "b2c metrics get <category>" to retrieve metrics for a specific category.',
        {},
      ),
    );

    return output;
  }
}
