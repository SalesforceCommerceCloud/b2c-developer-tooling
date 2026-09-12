/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, '../../docs/public');
const freeze = process.env.FREEZE_BIN || 'freeze';
const staging = mkdtempSync(join(tmpdir(), 'b2c-docs-images-'));
const codeCommand = 'b2c code list -c id,active,rollback';
const customCommand = 'b2c scapi custom status -c apiName,httpMethod,status';
const code = readFileSync(join(here, 'code-versions.txt'), 'utf8').trimEnd();
const custom = readFileSync(join(here, 'custom-api-status.txt'), 'utf8').trimEnd();
const prompt = (command) => `\u001b[38;2;112;214;255m$ ${command}\u001b[0m`;
const colorTable = (table) => table.replace(/\b(Yes|active)\b/g, '\u001b[38;2;144;232;191m$1\u001b[0m');

// The overview shows an explicit excerpt; focused images keep the full output.
const captures = {
  'cli-workflow': `${prompt(codeCommand)}\n${colorTable(code)}\n\n${prompt(customCommand)}\n${colorTable(custom.split('\n').slice(0, 4).join('\n'))}\n...`,
  'cli-code-versions': `${prompt(codeCommand)}\n\n${colorTable(code)}`,
  'cli-custom-api-status': `${prompt(customCommand)}\n\n${colorTable(custom)}`,
};

try {
  for (const [name, transcript] of Object.entries(captures)) {
    const input = join(staging, `${name}.ansi`);
    writeFileSync(input, transcript);
    execFileSync(freeze, [input, '--config', join(here, 'freeze.json'), '--output', join(output, `${name}.png`)], {
      stdio: 'inherit',
    });
  }
} finally {
  rmSync(staging, {recursive: true, force: true});
}
