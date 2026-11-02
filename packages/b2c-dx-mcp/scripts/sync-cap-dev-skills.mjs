/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Vendors the `cap-dev` (Commerce App Package development) skills from the
 * public commerce-apps repository into `vendor/cap-dev/skills`, which
 * `generate:guidance` bundles as the `cap-dev` collection.
 *
 * The skills are authored upstream; never edit the vendored copy. Refresh with:
 *
 *   pnpm --filter @salesforce/b2c-dx-mcp run sync:cap-dev-skills [-- --ref <branch|tag|sha>]
 *
 * Only Markdown is vendored (the guidance bundle serves Markdown only). Links
 * from a skill into the upstream `shared/` folder are rewritten to a copy inside
 * that skill, because bundled skills must be self-contained.
 */
import {execFileSync} from 'node:child_process';
import {cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, posix, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const REPO = 'SalesforceCommerceCloud/commerce-apps';
const SKILLS_PATH = '.claude/skills';
const SHARED = 'shared';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vendorRoot = join(packageRoot, 'vendor/cap-dev');
const refIndex = process.argv.indexOf('--ref');
const ref = refIndex === -1 ? 'main' : process.argv[refIndex + 1];
if (!ref) throw new Error('--ref requires a branch, tag, or commit');

function git(cwd, ...args) {
  return execFileSync('git', args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit']}).trim();
}

function markdownFiles(root, prefix = '') {
  const files = [];
  for (const item of readdirSync(root, {withFileTypes: true})) {
    if (item.name === 'evals' || item.name.startsWith('.')) continue;
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) files.push(...markdownFiles(join(root, item.name), path));
    else if (item.isFile() && item.name.endsWith('.md')) files.push(path);
  }
  return files;
}

const checkout = mkdtempSync(join(tmpdir(), 'cap-dev-skills-'));
try {
  git(checkout, 'init', '--quiet');
  git(checkout, 'remote', 'add', 'origin', `https://github.com/${REPO}.git`);
  git(checkout, 'fetch', '--quiet', '--depth', '1', 'origin', ref);
  git(checkout, 'checkout', '--quiet', 'FETCH_HEAD');
  const sha = git(checkout, 'rev-parse', 'HEAD');
  const committedAt = git(checkout, 'show', '-s', '--format=%cI', 'HEAD');
  const source = join(checkout, SKILLS_PATH);

  const destination = join(vendorRoot, 'skills');
  rmSync(destination, {recursive: true, force: true});
  const skills = readdirSync(source, {withFileTypes: true})
    .filter((item) => item.isDirectory() && item.name !== SHARED && !item.name.startsWith('.'))
    .map((item) => item.name)
    .sort();
  for (const skill of skills) {
    for (const file of markdownFiles(join(source, skill))) {
      let content = readFileSync(join(source, skill, file), 'utf8');
      content = content.replaceAll(/\]\(([^)\s#]+)(#[^)\s]*)?\)/g, (match, target, anchor = '') => {
        if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return match;
        const resolved = posix.normalize(posix.join(skill, posix.dirname(file), target));
        if (!resolved.startsWith(`${SHARED}/`)) return match;
        const copy = `references/${resolved.slice(SHARED.length + 1)}`;
        mkdirSync(dirname(join(destination, skill, copy)), {recursive: true});
        cpSync(join(source, resolved), join(destination, skill, copy));
        return `](${posix.relative(posix.dirname(file), copy)}${anchor})`;
      });
      mkdirSync(dirname(join(destination, skill, file)), {recursive: true});
      writeFileSync(join(destination, skill, file), content);
    }
  }

  writeFileSync(
    join(vendorRoot, 'source.json'),
    `${JSON.stringify({repository: REPO, path: SKILLS_PATH, ref, sha, committedAt}, null, 2)}\n`,
  );
  process.stdout.write(`Vendored ${skills.length} cap-dev skills from ${REPO}@${sha.slice(0, 12)} (${ref}).\n`);
} finally {
  rmSync(checkout, {recursive: true, force: true});
}
