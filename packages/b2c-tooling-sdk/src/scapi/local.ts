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

const REMOTE = /^https?:\/\//i;
const REMOTE_TIMEOUT_MS = 30_000;

/** Whether a `scapiSchemas` entry is an http(s) URL rather than a file or directory. */
export function isRemoteScapiSchema(entry: string): boolean {
  return REMOTE.test(entry);
}

/** Describe one local OpenAPI file; its identity comes from the `/<family>/<name>/<version>` server path. */
function localDocument(file: string, text = readFileSync(file, 'utf8')): ScapiSchemaDocument {
  let document: ApiDocument | null;
  try {
    document = JSON.parse(text) as ApiDocument | null;
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

/** Expand files and directories into their contract files, in order. */
function localFiles(path: string): string[] {
  try {
    return statSync(path).isDirectory() ? jsonFiles(path) : [path];
  } catch (error) {
    throw new Error(`SCAPI_LOCAL_SCHEMA_INVALID: ${path}: ${(error as Error).message}`);
  }
}

/** Key contracts by API id, rejecting two sources for the same API. */
function byApiId(documents: readonly ScapiSchemaDocument[]): ScapiSchemaDocument[] {
  const byId = new Map<string, ScapiSchemaDocument>();
  for (const document of documents) {
    const previous = byId.get(document.entry.id);
    if (previous)
      throw new Error(
        `SCAPI_LOCAL_SCHEMA_INVALID: ${document.entry.id} is defined by both ${previous.entry.file} and ${document.entry.file}.`,
      );
    byId.set(document.entry.id, document);
  }
  return [...byId.values()].sort((a, b) => a.entry.id.localeCompare(b.entry.id, 'en'));
}

/**
 * Load developer-supplied SCAPI contracts from OpenAPI 3 JSON files or directories of them.
 * Each contract replaces the bundled or live contract with the same `family/name/version`,
 * or adds a new API. Intended for beta and pre-release APIs.
 *
 * @throws When a file is not an identifiable OpenAPI 3 contract, or two files share an API id.
 */
export function loadLocalScapiSchemas(paths: readonly string[]): ScapiSchemaDocument[] {
  return byApiId(paths.flatMap((path) => localFiles(resolve(path))).map((file) => localDocument(file)));
}

export interface ScapiSchemaOverrideOptions {
  /** Reuses fetched contracts by URL; failed fetches are not kept. */
  cache?: Map<string, Promise<ScapiSchemaDocument>>;
  fetch?: typeof globalThis.fetch;
  signal?: AbortSignal;
}

async function remoteDocument(url: string, options: ScapiSchemaOverrideOptions): Promise<ScapiSchemaDocument> {
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(REMOTE_TIMEOUT_MS)])
    : AbortSignal.timeout(REMOTE_TIMEOUT_MS);
  let text: string;
  try {
    const response = await (options.fetch ?? fetch)(url, {headers: {accept: 'application/json'}, signal});
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
    text = await response.text();
  } catch (error) {
    throw new Error(`SCAPI_LOCAL_SCHEMA_INVALID: ${url}: ${(error as Error).message}`);
  }
  return localDocument(url, text);
}

/**
 * Load developer-supplied SCAPI contracts like {@link loadLocalScapiSchemas}, where each entry may
 * also be an http(s) URL of a single OpenAPI 3 JSON contract. Paths are resolved from the
 * current directory; resolve relative paths first when they belong to another base.
 *
 * @throws When an entry cannot be read or fetched, is not an identifiable OpenAPI 3 contract,
 * or two entries share an API id.
 */
export async function loadScapiSchemaOverrides(
  entries: readonly string[],
  options: ScapiSchemaOverrideOptions = {},
): Promise<ScapiSchemaDocument[]> {
  const documents = await Promise.all(
    entries.map(async (entry) => {
      if (!isRemoteScapiSchema(entry)) return localFiles(resolve(entry)).map((file) => localDocument(file));
      const cached = options.cache?.get(entry);
      if (cached) return [await cached];
      const pending = remoteDocument(entry, options);
      options.cache?.set(entry, pending);
      try {
        return [await pending];
      } catch (error) {
        options.cache?.delete(entry);
        throw error;
      }
    }),
  );
  return byApiId(documents.flat());
}
