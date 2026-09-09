/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {mkdir, writeFile, rename, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {parseArgs, promisify} from 'node:util';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import type {OpenApiSchema, SchemaListItem} from '../src/clients/scapi-schemas.js';

const {values} = parseArgs({options: {'project-directory': {type: 'string'}, instance: {type: 'string'}}});
const context = [
  ...(values['project-directory'] ? ['--project-directory', values['project-directory']] : []),
  ...(values.instance ? ['--instance', values.instance] : []),
];
async function cli(args: string[]): Promise<string> {
  const {stdout} = await promisify(execFile)('b2c', ['scapi', 'schemas', ...args, '--json', ...context], {
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}
const listed = JSON.parse(await cli(['list'])) as {schemas: SchemaListItem[]; total: number};
const entries = listed.schemas.filter((entry) => entry.apiFamily !== 'custom');
if (listed.total !== listed.schemas.length) throw new Error('Incomplete schema listing; refusing partial refresh.');
const root = fileURLToPath(new URL('../../../schemas/', import.meta.url));
const staging = join(root, '.refresh');
await mkdir(staging, {recursive: true});
try {
  const results = [];
  // Keep requests bounded and avoid refreshing credentials concurrently.
  for (const entry of entries.sort((a, b) =>
    `${a.apiFamily}/${a.apiName}/${a.apiVersion}`.localeCompare(`${b.apiFamily}/${b.apiName}/${b.apiVersion}`, 'en'),
  )) {
    const {apiFamily, apiName, apiVersion} = entry;
    if (!apiFamily || !apiName || !apiVersion) throw new Error('Missing schema identity.');
    if (![apiFamily, apiName, apiVersion].every((part) => /^[a-z0-9-]+$/.test(part)))
      throw new Error('Invalid schema identity.');
    // No expand=custom_properties: this is a distributable standard corpus.

    const fetched = JSON.parse(
      await cli(['get', apiFamily, apiName, apiVersion, '--expand-all', '--no-expand-custom-properties']),
    ) as {schema: OpenApiSchema};
    const schema = fetched.schema;
    if (!schema.openapi || !schema.paths) throw new Error(`Invalid OpenAPI: ${apiName}`);
    const id = `${apiFamily}/${apiName}/${apiVersion}`;
    const file = `scapi/${id}.json`;
    const content = `${JSON.stringify(schema, null, 2)}\n`;

    await mkdir(join(staging, 'scapi', apiFamily, apiName), {recursive: true});

    await writeFile(join(staging, file), content);
    results.push({
      id,
      apiFamily,
      apiName,
      apiVersion,
      schemaVersion: entry.schemaVersion,
      status: entry.status,
      file,
      sha256: createHash('sha256').update(content).digest('hex'),
      source: `https://{shortCode}.api.commercecloud.salesforce.com/dx/scapi-schemas/v1/organizations/{organizationId}/schemas/${id}`,
    });
    process.stdout.write(`Fetched ${id}\n`);
  }
  await writeFile(
    join(staging, 'manifest.json'),
    `${JSON.stringify({formatVersion: 1, customProperties: false, schemas: results}, null, 2)}\n`,
  );
  await rm(join(root, 'scapi'), {recursive: true, force: true});
  await rename(join(staging, 'scapi'), join(root, 'scapi'));
  await rename(join(staging, 'manifest.json'), join(root, 'manifest.json'));
  process.stdout.write(`Bundled ${results.length} standard SCAPI contracts.\n`);
} finally {
  await rm(staging, {recursive: true, force: true});
}
