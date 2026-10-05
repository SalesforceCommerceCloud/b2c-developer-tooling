/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Writes the dw.json JSON Schema built from `src/config/dw-json-schema.ts` to
 * `data/schemas/dw.schema.json` (shipped with the SDK and bundled by the VS Code
 * extension) and `docs/public/schemas/dw.schema.json` (served at DW_JSON_SCHEMA_URL).
 *
 * Usage:
 *   tsx scripts/generate-dw-json-schema.ts          # write
 *   tsx scripts/generate-dw-json-schema.ts --check  # fail if out of date
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildDwJsonSchema} from '../src/config/dw-json-schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const outputs = [
  path.join(packageRoot, 'data', 'schemas', 'dw.schema.json'),
  path.resolve(packageRoot, '..', '..', 'docs', 'public', 'schemas', 'dw.schema.json'),
];

const content = JSON.stringify(buildDwJsonSchema(), null, 2) + '\n';
const check = process.argv.includes('--check');
let stale = false;

for (const output of outputs) {
  const current = fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : undefined;
  if (current === content) continue;
  if (check) {
    console.error(`Out of date: ${path.relative(process.cwd(), output)}`);
    stale = true;
  } else {
    fs.mkdirSync(path.dirname(output), {recursive: true});
    fs.writeFileSync(output, content);
    console.log(`Wrote ${path.relative(process.cwd(), output)}`);
  }
}

if (stale) {
  console.error('Run: pnpm --filter @salesforce/b2c-tooling-sdk run generate:dw-json-schema');
  process.exit(1);
}
