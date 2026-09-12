/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {readFileSync, readdirSync, mkdirSync, writeFileSync, linkSync, unlinkSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {join, dirname} from 'node:path';
import {Validator, type Schema} from 'jsonschema';
import {resolveOclifDataDir} from '../plugins/discovery.js';
import {createRankedIndex} from '../search/ranking.js';

/** A parameterized program, discoverable without loading its source. */
export interface ScapiSnippet {
  name: string;
  description: string;
  effect: 'read' | 'write' | 'destructive';
  code: string;
  inputSchema: Schema;
  savedAt?: string;
}

let injectedDataDir: string | undefined;

/** Use the host's resolved oclif data directory; standalone SDK uses the shared B2C directory. */
export function initializeScapiSnippetStore(dataDir: string): void {
  injectedDataDir = dataDir;
}

/** Durable user library location, shared by CLI and MCP. */
export function getScapiSnippetDirectory(): string {
  return join(injectedDataDir ?? resolveOclifDataDir(), 'scapi', 'snippets');
}

function validateSnippet(snippet: ScapiSnippet): void {
  if (
    !snippet ||
    !/^(builtin|user)\/[a-z0-9][a-z0-9-]{0,79}$/.test(snippet.name) ||
    typeof snippet.description !== 'string' ||
    !snippet.description.trim() ||
    snippet.description.length > 500 ||
    !['read', 'write', 'destructive'].includes(snippet.effect) ||
    typeof snippet.code !== 'string' ||
    !snippet.code.trim() ||
    Buffer.byteLength(snippet.code) > 32_768 ||
    !snippet.inputSchema ||
    typeof snippet.inputSchema !== 'object' ||
    Array.isArray(snippet.inputSchema)
  )
    throw new Error('SCAPI_SNIPPET_INVALID: invalid name, description, effect, code, or input schema.');
  // Native syntax validation only; execution and input validation happen at invocation.
  new Function('return (' + snippet.code + ');');
}

/** Load the release's read-only catalog. Sources ship as ordinary JavaScript files. */
export function loadBuiltinScapiSnippets(): ScapiSnippet[] {
  const root = join(
    dirname(createRequire(import.meta.url).resolve('@salesforce/b2c-tooling-sdk/package.json')),
    'data/scapi-snippets',
  );
  const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8')) as {
    version: number;
    snippets: (Omit<ScapiSnippet, 'code'> & {file: string})[];
  };
  if (manifest.version !== 1) throw new Error('Unsupported snippet manifest.');
  return manifest.snippets.map(({file, ...entry}) => {
    if (!/^[a-z0-9-]+\.js$/.test(file)) throw new Error('Invalid snippet source path.');
    const snippet = {...entry, code: readFileSync(join(root, file), 'utf8')};
    validateSnippet(snippet);
    if (!snippet.name.startsWith('builtin/')) throw new Error('Invalid built-in snippet name.');
    return snippet;
  });
}

/** Load shipped and user snippets; a malformed user file is reported, never silently substituted. */
export function loadScapiSnippets(directory = getScapiSnippetDirectory()): ScapiSnippet[] {
  const snippets = loadBuiltinScapiSnippets();
  let files: string[];
  try {
    files = readdirSync(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return snippets;
    throw error;
  }
  for (const file of files.filter((name) => name.endsWith('.json')).sort()) {
    try {
      const content = readFileSync(join(directory, file), 'utf8');
      if (Buffer.byteLength(content) > 65_536) throw new Error('File exceeds 64 KiB.');
      const snippet = JSON.parse(content) as ScapiSnippet;
      validateSnippet(snippet);
      if (snippet.name !== `user/${file.slice(0, -5)}`) throw new Error('File must match the user snippet name.');
      snippets.push(snippet);
    } catch (error) {
      throw new Error(`SCAPI_SNIPPET_INVALID: repair or remove ${join(directory, file)}: ${String(error)}`);
    }
  }
  return snippets;
}

/** Save a new user snippet without replacing an existing workflow. */
export function saveScapiSnippet(snippet: ScapiSnippet, directory = getScapiSnippetDirectory()): void {
  validateSnippet(snippet);
  if (!snippet.name.startsWith('user/')) throw new Error('SCAPI_SNIPPET_NAME: saved snippets require user/ prefix.');
  const content = JSON.stringify({...snippet, savedAt: new Date().toISOString()}, null, 2) + '\n';
  if (Buffer.byteLength(content) > 65_536) throw new Error('SCAPI_SNIPPET_INVALID: snippet exceeds 64 KiB.');
  mkdirSync(directory, {recursive: true, mode: 0o700});
  const path = join(directory, snippet.name.slice(5) + '.json');
  const temporary = join(directory, randomUUID() + '.tmp');
  writeFileSync(temporary, content, {flag: 'wx', mode: 0o600});
  try {
    // Publish the complete file atomically without replacing an existing name.
    linkSync(temporary, path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      throw new Error('SCAPI_SNIPPET_EXISTS: choose a new user/ name; existing snippets are not overwritten.');
    throw error;
  } finally {
    unlinkSync(temporary);
  }
}

/** Build the runtime's search/describe/run resolver using the shared documentation ranking. */
export function createScapiSnippetResolver(snippets: ScapiSnippet[]) {
  const byName = new Map(snippets.map((snippet) => [snippet.name, snippet]));
  const index = createRankedIndex(snippets.map((s) => ({id: s.name, title: s.name, summary: s.description})));
  const validator = new Validator();
  return (operation: string, name: string, input?: unknown): unknown => {
    if (operation === 'search') {
      const names = name.trim() ? index.search(name).map((result) => result.id as string) : [...byName.keys()];
      return {
        total: names.length,
        results: names.slice(0, 10).map((id) => {
          const s = byName.get(id)!;
          return {kind: 'snippet', name: s.name, description: s.description, effect: s.effect};
        }),
      };
    }
    const snippet = byName.get(name);
    if (!snippet) throw new Error(`SCAPI_SNIPPET_NOT_FOUND: ${name}. Use codemode.search to find available snippets.`);
    if (operation === 'describe') return snippet;
    if (operation !== 'run') throw new Error('Unknown snippet operation.');
    const result = validator.validate(input, snippet.inputSchema, {
      required: Boolean(snippet.inputSchema.type || snippet.inputSchema.required),
    });
    if (!result.valid) throw new Error(`SCAPI_SNIPPET_INPUT: ${name}: ${result.errors.map((e) => e.stack).join('; ')}`);
    return snippet.code;
  };
}
