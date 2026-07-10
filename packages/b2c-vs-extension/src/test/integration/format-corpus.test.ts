/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Opt-in discovery probe (NOT part of the default suite gate — self-skips unless
 * B2C_ISML_CORPUS is set). Formats every `.isml` file under the corpus and looks
 * for idempotency failures — `format(format(x)) !== format(x)` — the sharpest
 * signal of an indentation-nuance bug. Run with:
 *   B2C_ISML_CORPUS=/path/to/project pnpm exec vscode-test --label valid-workspace
 *
 * It distinguishes two causes so it only FAILS on OUR bugs:
 *  - "engine" instability: the underlying HTML formatter (js-beautify via
 *    vscode-html-languageservice) is itself non-idempotent on some inline
 *    mixed-content HTML (e.g. `<div><span>x:</span> y</div>` reflow). Not ours —
 *    reported, not failed.
 *  - "ours" instability: the file is stable through the raw HTML formatter but
 *    NOT through our full pipeline → our ISML passes introduced drift. FAILS.
 */
import * as assert from 'assert';
import {execSync} from 'child_process';
import * as fs from 'fs';
import {formatIsmlText, rawHtmlFormat} from '../../isml/formatting.js';
import type * as vscode from 'vscode';

const OPTS = {tabSize: 4, insertSpaces: true} as vscode.FormattingOptions;
const CORPUS = process.env.B2C_ISML_CORPUS;

(CORPUS ? suite : suite.skip)('ISML formatter — corpus idempotency probe', () => {
  test('our ISML passes never introduce instability the HTML engine did not already have', function () {
    this.timeout(600000);
    const files = execSync(`find ${CORPUS} -name '*.isml' -not -path '*/node_modules/*'`, {
      encoding: 'utf8',
      maxBuffer: 1 << 28,
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    const engineUnstable: string[] = [];
    const oursUnstable: string[] = [];
    let threw = 0;

    for (const file of files) {
      let text: string;
      try {
        text = fs.readFileSync(file, 'utf8');
      } catch {
        continue;
      }
      try {
        const fullOnce = formatIsmlText(text, OPTS);
        const fullTwice = formatIsmlText(fullOnce, OPTS);
        if (fullOnce === fullTwice) continue; // stable — fine

        // Unstable: is the raw HTML engine also unstable on this file? If so it's
        // an upstream quirk, not ours.
        const rawOnce = rawHtmlFormat(text, OPTS);
        const rawTwice = rawHtmlFormat(rawOnce, OPTS);
        if (rawOnce !== rawTwice) engineUnstable.push(file);
        else oursUnstable.push(file);
      } catch {
        threw++;
        oursUnstable.push(`THREW: ${file}`);
      }
    }

    console.log(
      `\n[corpus] ${files.length} files, ${threw} threw, ` +
        `${engineUnstable.length} engine-unstable (upstream), ${oursUnstable.length} OURS.`,
    );
    for (const f of engineUnstable.slice(0, 40)) console.log('  engine ', f);
    for (const f of oursUnstable.slice(0, 40)) console.log('  OURS   ', f);

    assert.deepStrictEqual(
      oursUnstable,
      [],
      `${oursUnstable.length} files are non-idempotent due to OUR ISML passes (engine-only instability is tolerated)`,
    );
  });
});
