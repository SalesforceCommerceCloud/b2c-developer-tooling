/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {appendFileSync, existsSync, readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve(process.cwd(), process.argv[2] ?? '.');
const version = readFileSync(resolve(root, 'actions/VERSION'), 'utf8').trim();
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);

if (!match) {
  throw new Error(`actions/VERSION must contain a semantic version, got: ${version}`);
}

const cliMajor = match[1];
const majorTag = `v${cliMajor}`;
const exactTag = `v${version}`;
const nestedActions = readdirSync(resolve(root, 'actions'), {withFileTypes: true})
  .filter((entry) => entry.isDirectory())
  .map((entry) => `actions/${entry.name}/action.yml`)
  .filter((file) => existsSync(resolve(root, file)));
const allActions = ['action.yml', ...nestedActions];
const versionedActions = allActions.filter((file) => /^  version:/m.test(readFileSync(resolve(root, file), 'utf8')));

for (const file of versionedActions) {
  const source = readFileSync(resolve(root, file), 'utf8');
  const defaultMatch = /^  version:\n(?:    .*\n)*?    default: '([^']+)'/m.exec(source);

  if (!defaultMatch) {
    throw new Error(`${file} does not declare a quoted version input default`);
  }

  if (defaultMatch[1] !== cliMajor) {
    throw new Error(
      `${file} defaults to CLI ${defaultMatch[1]}, but Action ${version} must default to CLI ${cliMajor}`,
    );
  }
}

const internalReferencePattern =
  /SalesforceCommerceCloud\/b2c-developer-tooling\/actions\/(?:setup|run)@(v\d+\.\d+\.\d+)/g;

for (const file of allActions) {
  const source = readFileSync(resolve(root, file), 'utf8');

  for (const reference of source.matchAll(internalReferencePattern)) {
    if (reference[1] !== exactTag) {
      throw new Error(`${file} references ${reference[1]}, but Action ${version} must reference ${exactTag}`);
    }
  }
}

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `version=${version}\nexact-tag=${exactTag}\nmajor-tag=${majorTag}\ncli-major=${cliMajor}\n`,
  );
}

console.log(`Validated GitHub Actions ${exactTag} (default CLI ${cliMajor}, floating tag ${majorTag})`);
