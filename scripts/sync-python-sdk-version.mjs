#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 *
 * Sync the @salesforce/b2c-tooling-sdk-python workspace package version into
 * the Python distribution's own version sources. That package.json is
 * private/unpublished — it exists purely so Changesets can version and
 * changelog the Python SDK; this script is what makes the bump take effect on
 * the Python side (pyproject.toml is that SDK's actual source of truth).
 *
 * Runs as part of the root `version` script after `changeset version`.
 */

import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = join(repoRoot, 'python/b2c-tooling-sdk');

const version = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).version;
if (!version) {
  console.error('python/b2c-tooling-sdk/package.json has no version field');
  process.exit(1);
}

// pyproject.toml: the `[project]` table's unindented `version = "..."` line.
// Anchored at line-start so it can't match an unrelated key on the same line
// prefix, e.g. `[tool.mypy]`'s `python_version = "3.11"`.
const pyprojectPath = join(pkgDir, 'pyproject.toml');
const pyproject = readFileSync(pyprojectPath, 'utf8');
const versionLine = /^version = "[^"]*"/m;
if (!versionLine.test(pyproject)) {
  console.error(`${pyprojectPath} has no top-level 'version = "..."' line`);
  process.exit(1);
}
writeFileSync(pyprojectPath, pyproject.replace(versionLine, `version = "${version}"`));

// version.py: the source-checkout fallback used when the package isn't
// installed (so `importlib.metadata.version()` has nothing to read).
const versionPyPath = join(pkgDir, 'src/b2c_tooling_sdk/version.py');
const versionPy = readFileSync(versionPyPath, 'utf8');
const fallbackLine = /SDK_VERSION = "[^"]*"/;
if (!fallbackLine.test(versionPy)) {
  console.error(`${versionPyPath} has no 'SDK_VERSION = "..."' fallback line`);
  process.exit(1);
}
writeFileSync(versionPyPath, versionPy.replace(fallbackLine, `SDK_VERSION = "${version}"`));

console.log(`Synced Python SDK version sources to ${version}`);
