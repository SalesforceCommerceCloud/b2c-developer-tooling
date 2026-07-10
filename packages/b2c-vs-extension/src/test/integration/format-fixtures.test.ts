/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Vendored real-world ISML fixtures. Each `<name>.isml` under
 * src/test/fixtures/format/ is a real (or lightly-sanitized real) template
 * covering constructs we care about; `<name>.expected.isml` is its committed
 * formatted snapshot. We assert format(input) === snapshot AND idempotency.
 *
 * Regenerate snapshots after an intentional formatter change with:
 *   UPDATE_ISML_SNAPSHOTS=1 pnpm exec vscode-test --label valid-workspace
 * (the .vscode-test.mjs config forwards this env var to the host).
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';
import {formatIsmlText} from '../../isml/formatting.js';
import type * as vscode from 'vscode';

const OPTS = {tabSize: 4, insertSpaces: true} as vscode.FormattingOptions;
const UPDATE = process.env.UPDATE_ISML_SNAPSHOTS === '1';

// Compiled file lives at out/test/integration/; fixtures are shipped to
// out/test/fixtures/format/ by tsconfig (or read from src). Resolve from src so
// snapshot writes land in the source tree.
const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(here, '..', '..', '..', 'src', 'test', 'fixtures', 'format');

function listInputs(): string[] {
  return fs
    .readdirSync(fixturesDir)
    .filter((f) => f.endsWith('.isml') && !f.endsWith('.expected.isml'))
    .sort();
}

suite('ISML formatter — vendored real-world fixtures', () => {
  for (const input of listInputs()) {
    const base = input.replace(/\.isml$/, '');
    test(`${base}: matches snapshot and is idempotent`, () => {
      const src = fs.readFileSync(path.join(fixturesDir, input), 'utf8');
      const formatted = formatIsmlText(src, OPTS);
      const snapshotPath = path.join(fixturesDir, `${base}.expected.isml`);

      if (UPDATE) {
        fs.writeFileSync(snapshotPath, formatted);
      }

      assert.ok(fs.existsSync(snapshotPath), `missing snapshot ${base}.expected.isml (run UPDATE_ISML_SNAPSHOTS=1)`);
      const expected = fs.readFileSync(snapshotPath, 'utf8');
      assert.strictEqual(formatted, expected, `${base}: formatted output drifted from snapshot`);

      // Formatting the snapshot again must be a no-op (our passes are stable).
      const twice = formatIsmlText(formatted, OPTS);
      assert.strictEqual(twice, formatted, `${base}: formatter is not idempotent`);
    });
  }
});
