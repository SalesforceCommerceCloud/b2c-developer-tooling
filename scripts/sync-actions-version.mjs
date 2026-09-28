#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 *
 * Sync the GitHub Actions release version with the @salesforce/b2c-cli version.
 * Actions are released alongside every stable CLI publish (publish.yml dispatches
 * release-actions.yml), so each release gets a matching `vX.Y.Z` Action tag.
 *
 * Updates:
 * - actions/VERSION
 * - internal `actions/setup@vX.Y.Z` / `actions/run@vX.Y.Z` references
 * - the `version` input default (CLI major) in every Action manifest
 *
 * Runs as part of the root `version` script after `changeset version`.
 * .github/scripts/validate-action-release.mjs checks the result.
 */

import {existsSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(readFileSync(join(repoRoot, 'packages/b2c-cli/package.json'), 'utf8')).version ?? '';
const match = version.match(/^(\d+)\.\d+\.\d+$/);

if (!match) {
  // Prerelease (changeset pre mode) and snapshot versions don't get an Action release.
  console.log(`Skipping GitHub Actions version sync for non-release CLI version ${version}`);
  process.exit(0);
}

const cliMajor = match[1];
const exactTag = `v${version}`;

writeFileSync(join(repoRoot, 'actions/VERSION'), `${version}\n`);

const manifests = [
  'action.yml',
  ...readdirSync(join(repoRoot, 'actions'), {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => `actions/${entry.name}/action.yml`),
].filter((file) => existsSync(join(repoRoot, file)));

for (const file of manifests) {
  const path = join(repoRoot, file);
  const source = readFileSync(path, 'utf8');
  const updated = source
    .replaceAll(
      /(SalesforceCommerceCloud\/b2c-developer-tooling\/actions\/(?:setup|run))@v\d+\.\d+\.\d+/g,
      `$1@${exactTag}`,
    )
    .replace(/^(  version:\n(?:    .*\n)*?    default: )'[^']+'/m, `$1'${cliMajor}'`);
  if (updated !== source) {
    writeFileSync(path, updated);
  }
}

console.log(`Synced GitHub Actions to ${exactTag} (default CLI ${cliMajor})`);
