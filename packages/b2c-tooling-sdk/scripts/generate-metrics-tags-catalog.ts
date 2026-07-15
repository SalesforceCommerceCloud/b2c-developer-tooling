/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Generates the metrics tags extraction catalog as JSON.
 *
 * This declarative catalog defines how series ids are parsed into dimension
 * tags. It is consumed by the Go Grafana plugin to replicate the TypeScript
 * parsing logic server-side.
 *
 * Run with: pnpm --filter @salesforce/b2c-tooling-sdk run generate:metrics-tags-catalog
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EXTRACTOR_CATALOG} from '../src/operations/metrics/tags.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../specs/metrics-tags-catalog.json');

interface CatalogOutput {
  version: string;
  generatedAt: string;
  description: string;
  strategies: string[];
  rules: typeof EXTRACTOR_CATALOG;
}

async function generateCatalog(): Promise<void> {
  const catalog: CatalogOutput = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    description:
      'Declarative catalog of metrics series tag extraction rules. Defines how packed series ids are parsed into structured dimension tags.',
    strategies: [
      'familyOrStatus',
      'familyOrOverallAgg',
      'lastSpaceSplit',
      'lastDotSplit',
      'wholeAs',
      'ecdnSuccessError',
    ],
    rules: EXTRACTOR_CATALOG,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(catalog, null, 2) + '\n');

  console.log(`Generated metrics tags catalog with ${catalog.rules.length} rules at ${OUTPUT_PATH}`);
}

generateCatalog().catch((err) => {
  console.error('Failed to generate metrics tags catalog:', err);
  process.exit(1);
});
