/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {generateSkillCatalogs} from './catalog.js';

/** Store only indexes beside authored skills so Git refs retain complete native catalogs */
export function writeSkillIndexes(sourceDirectory: string, check = false): void {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-skill-indexes-'));
  try {
    const output = path.join(temporary, 'catalogs');
    generateSkillCatalogs(sourceDirectory, output);
    const indexes = fs.readdirSync(output).map((collection) => {
      const relative = path.join(collection, 'skills/index.json');
      const destination = path.join(sourceDirectory, relative);
      const content = fs.readFileSync(path.join(output, collection, 'index.json'));
      let previous: Buffer | undefined;
      try {
        const info = fs.lstatSync(destination);
        if (info.isSymbolicLink()) throw new Error(`Cannot publish symbolic link: ${destination}`);
        if (!info.isFile()) throw new Error(`Invalid skill index: ${destination}`);
        previous = fs.readFileSync(destination);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      return {destination, relative, content, changed: !previous?.equals(content)};
    });
    const changed = indexes.filter((index) => index.changed);
    if (check && changed.length) {
      throw new Error(
        `Missing or stale OpenCode indexes: ${changed.map((index) => index.relative).join(', ')}. Run pnpm skills:catalogs`,
      );
    }
    if (!check) for (const index of changed) fs.writeFileSync(index.destination, index.content);
  } finally {
    fs.rmSync(temporary, {recursive: true, force: true});
  }
}

const HELP = `Usage: pnpm skills:catalogs [-c|--check] [-s|--source DIRECTORY]

Generate native OpenCode indexes beside the skills in DIRECTORY (default: repository skills/).
Requires the installed pnpm workspace dependencies and Node.js 22 or later.
The source contains package.json with a stable version, plugins.json with a plugins array,
and <collection>/skills/<skill>/SKILL.md with name and description frontmatter.

  -c, --check             Report missing or stale indexes without modifying source files
  -s, --source DIRECTORY  Use another skills source directory
  -h, --help              Show this help

Exit status: 0 success; 1 invalid source or stale indexes; 2 invalid arguments.
Diagnostics go to stderr. No network access is required.
`;

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const {values} = parseArgs({
      options: {
        check: {type: 'boolean', short: 'c'},
        source: {type: 'string', short: 's'},
        help: {type: 'boolean', short: 'h'},
      },
    });
    if (values.help) process.stdout.write(HELP);
    else {
      if (values.source === '')
        throw Object.assign(new Error('--source must not be empty'), {code: 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE'});
      writeSkillIndexes(
        values.source || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../skills'),
        values.check,
      );
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = String((error as NodeJS.ErrnoException).code).startsWith('ERR_PARSE_ARGS') ? 2 : 1;
  }
}
