/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join, resolve} from 'node:path';
import type {ApiDocument, ScapiSchemaDocument} from './catalog.js';

const IDENTITY = /^[a-z0-9-]+$/i;

/** List `*.json` files under a directory, recursively, in a stable order. */
function jsonFiles(directory: string): string[] {
  return readdirSync(directory, {withFileTypes: true})
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return jsonFiles(path);
      return entry.isFile() && entry.name.endsWith('.json') ? [path] : [];
    });
}

/** Describe one local OpenAPI file; its identity comes from the `/<family>/<name>/<version>` server path. */
function localDocument(file: string): ScapiSchemaDocument {
  let document: ApiDocument | null;
  try {
    document = JSON.parse(readFileSync(file, 'utf8')) as ApiDocument | null;
  } catch (error) {
    throw new Error(`SCAPI_LOCAL_SCHEMA_INVALID: ${file}: ${(error as Error).message}`);
  }
  if (
    !document ||
    typeof document !== 'object' ||
    !/^3\./.test(document.openapi) ||
    !document.paths ||
    typeof document.paths !== 'object' ||
    Array.isArray(document.paths)
  )
    throw new Error(`SCAPI_LOCAL_SCHEMA_INVALID: ${file}: expected an OpenAPI 3 contract with paths.`);
  const server = document.servers?.[0]?.url;
  let parts: string[] = [];
  try {
    parts = new URL(typeof server === 'string' ? server.replaceAll(/[{}]/g, '') : '').pathname
      .split('/')
      .filter(Boolean);
  } catch {
    // Reported below.
  }
  if (parts.length !== 3 || !parts.every((part) => IDENTITY.test(part)))
    throw new Error(
      `SCAPI_LOCAL_SCHEMA_INVALID: ${file}: servers[0].url must end in /<family>/<name>/<version> to identify the API.`,
    );
  const [apiFamily, apiName, apiVersion] = parts;
  return {
    entry: {
      id: `${apiFamily}/${apiName}/${apiVersion}`,
      apiFamily,
      apiName,
      apiVersion,
      schemaVersion: document.info?.version ?? apiVersion,
      status: 'local',
      file,
      source: file,
      origin: 'local',
    },
    schema: document,
  };
}

/**
 * Load developer-supplied SCAPI contracts from OpenAPI 3 JSON files or directories of them.
 * Each contract replaces the bundled or live contract with the same `family/name/version`,
 * or adds a new API. Intended for beta and pre-release APIs.
 *
 * @throws When a file is not an identifiable OpenAPI 3 contract, or two files share an API id.
 */
export function loadLocalScapiSchemas(paths: readonly string[]): ScapiSchemaDocument[] {
  const byId = new Map<string, ScapiSchemaDocument>();
  for (const path of paths.map((value) => resolve(value))) {
    let files: string[];
    try {
      files = statSync(path).isDirectory() ? jsonFiles(path) : [path];
    } catch (error) {
      throw new Error(`SCAPI_LOCAL_SCHEMA_INVALID: ${path}: ${(error as Error).message}`);
    }
    for (const file of files) {
      const document = localDocument(file);
      const previous = byId.get(document.entry.id);
      if (previous)
        throw new Error(
          `SCAPI_LOCAL_SCHEMA_INVALID: ${document.entry.id} is defined by both ${previous.entry.file} and ${file}.`,
        );
      byId.set(document.entry.id, document);
    }
  }
  return [...byId.values()].sort((a, b) => a.entry.id.localeCompare(b.entry.id, 'en'));
}
