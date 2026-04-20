#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 *
 * Auth-free XSD validation for B2C Commerce metadata XML files.
 *
 * Uses xmllint (system) + XSDs shipped with the b2c CLI (via `b2c docs schema --path`).
 * Requires no instance credentials, no OAuth, no network calls beyond whatever `b2c`
 * already does locally.
 *
 * Usage:
 *   node validate.mjs --file <path> --schema <name>
 *   node validate.mjs --file catalog.xml --schema catalog
 *
 * Exits 0 on valid, 1 on validation error, 2 on setup/usage error.
 */

import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {parseArgs} from 'node:util';

const {values} = parseArgs({
  options: {
    file: {type: 'string', short: 'f'},
    schema: {type: 'string', short: 's'},
  },
  strict: true,
});

if (!values.file || !values.schema) {
  console.error('Usage: validate.mjs --file <xml-path> --schema <schema-name>');
  console.error('Example: validate.mjs --file catalog.xml --schema catalog');
  console.error('List available schemas: b2c docs schema --list');
  process.exit(2);
}

if (!existsSync(values.file)) {
  console.error(`File not found: ${values.file}`);
  process.exit(2);
}

// Resolve XSD path via the b2c CLI.
const b2cCmd = process.env.B2C_CMD || 'b2c';
let schemaPath;
try {
  schemaPath = execFileSync(b2cCmd, ['docs', 'schema', values.schema, '--path'], {
    encoding: 'utf8',
  }).trim();
} catch (err) {
  console.error(`Failed to resolve schema "${values.schema}" via \`${b2cCmd} docs schema --path\`.`);
  console.error('If b2c is not on PATH, try: B2C_CMD="npx @salesforce/b2c-cli" node validate.mjs ...');
  console.error(err.stderr?.toString() || err.message);
  process.exit(2);
}

if (!schemaPath || !existsSync(schemaPath)) {
  console.error(`Schema path not resolvable: ${schemaPath || '(empty)'}`);
  process.exit(2);
}

// xmllint is shipped with macOS and most Linux distros.
const result = spawnSync('xmllint', ['--noout', '--schema', schemaPath, values.file], {
  encoding: 'utf8',
});

if (result.error && result.error.code === 'ENOENT') {
  console.error('xmllint not found. Install libxml2-utils (Linux) or use macOS system xmllint.');
  process.exit(2);
}

process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
process.exit(result.status ?? 1);
