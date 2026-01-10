/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Generates the search indexes for Script API documentation and XSD schemas.
 *
 * Run with: pnpm --filter @salesforce/b2c-tooling-sdk run generate:docs-index
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

interface DocEntry {
  id: string;
  title: string;
  filePath: string;
  preview?: string;
}

interface SchemaEntry {
  id: string;
  filePath: string;
}

interface SearchIndex {
  version: string;
  generatedAt: string;
  entries: DocEntry[];
}

interface SchemaIndex {
  version: string;
  generatedAt: string;
  entries: SchemaEntry[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_API_DIR = path.resolve(__dirname, '../data/script-api');
const XSD_DIR = path.resolve(__dirname, '../data/xsd');

function extractTitle(content: string): string {
  // Match first # heading
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? 'Unknown';
}

function extractPreview(content: string): string | undefined {
  // Skip the title line and inheritance chain, find first paragraph
  const lines = content.split('\n');
  let foundTitle = false;
  let preview = '';

  for (const line of lines) {
    // Skip until we've passed the title
    if (line.startsWith('# ')) {
      foundTitle = true;
      continue;
    }

    if (!foundTitle) continue;

    // Skip empty lines and inheritance chain (lines starting with -)
    if (!line.trim() || line.startsWith('-') || line.startsWith('<!--')) {
      continue;
    }

    // Skip section headers
    if (line.startsWith('#')) {
      break;
    }

    // Found a content paragraph
    preview = line.trim();
    break;
  }

  if (!preview) return undefined;

  // Truncate to ~200 chars at word boundary
  if (preview.length > 200) {
    preview = preview.slice(0, 200).replace(/\s+\S*$/, '...');
  }

  return preview;
}

async function generateScriptApiIndex(): Promise<void> {
  const files = fs.readdirSync(SCRIPT_API_DIR).filter((f) => f.endsWith('.md'));

  const entries: DocEntry[] = [];

  for (const file of files) {
    const filePath = path.join(SCRIPT_API_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const id = file.replace(/\.md$/, '');
    const title = extractTitle(content);
    const preview = extractPreview(content);

    entries.push({
      id,
      title,
      filePath: file,
      ...(preview && {preview}),
    });
  }

  // Sort by ID for consistent output
  entries.sort((a, b) => a.id.localeCompare(b.id));

  const index: SearchIndex = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    entries,
  };

  const outputPath = path.join(SCRIPT_API_DIR, 'index.json');
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));

  console.log(`Generated Script API index with ${entries.length} entries at ${outputPath}`);
}

async function generateXsdIndex(): Promise<void> {
  const files = fs.readdirSync(XSD_DIR).filter((f) => f.endsWith('.xsd'));

  const entries: SchemaEntry[] = files.map((file) => ({
    id: file.replace(/\.xsd$/, ''),
    filePath: file,
  }));

  // Sort by ID for consistent output
  entries.sort((a, b) => a.id.localeCompare(b.id));

  const index: SchemaIndex = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    entries,
  };

  const outputPath = path.join(XSD_DIR, 'index.json');
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));

  console.log(`Generated XSD index with ${entries.length} entries at ${outputPath}`);
}

async function generateAllIndexes(): Promise<void> {
  await generateScriptApiIndex();
  await generateXsdIndex();
}

generateAllIndexes().catch((err) => {
  console.error('Failed to generate indexes:', err);
  process.exit(1);
});
