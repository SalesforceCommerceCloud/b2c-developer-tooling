/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Post-processes the vendored Script API types (run after re-vendoring).
//
// Upstream declares many APIs with an explicit `any` type argument
// (`ProductMgr.getProduct(): Product<any>`), which turns `product.custom` into
// `any`. Dropping the argument makes these types use their default,
// `ICustomAttributes.<Type>`, so generated custom attribute declarations apply.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const TYPES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'types', 'dw');
const GENERIC_ANY = /\b(ActiveData|LineItem|LineItemCtnr|PaymentInstrument|Product|SearchRefinementDefinition)<any>/g;

let changed = 0;
for (const entry of fs.readdirSync(TYPES_DIR, {recursive: true, withFileTypes: true})) {
  if (!entry.isFile() || !entry.name.endsWith('.d.ts')) continue;
  const file = path.join(entry.parentPath, entry.name);
  const content = fs.readFileSync(file, 'utf8');
  const patched = content.replace(GENERIC_ANY, '$1');
  if (patched !== content) {
    fs.writeFileSync(file, patched);
    changed++;
  }
}
console.log(`Patched ${changed} file(s).`);
