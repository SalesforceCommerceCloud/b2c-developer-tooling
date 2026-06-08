/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Runtime mirror of the schema produced by `scripts/build-docs-index/schema.mjs`.
 * Keep these types in lockstep — bumping the build-time schemaVersion is a
 * breaking change for this module.
 */

export type DocSource = 'script-api' | 'isml' | 'bm';

export type DocEntryKind =
  | 'package'
  | 'class'
  | 'interface'
  | 'enum'
  | 'method'
  | 'property'
  | 'constant'
  | 'tag'
  | 'attribute'
  | 'topic';

export interface DocParam {
  name: string;
  type?: string;
  description?: string;
  optional?: boolean;
}

export interface DocSection {
  heading: string;
  body: string;
}

export interface DocAttribute {
  name: string;
  required?: boolean;
  description?: string;
}

export interface DocReturn {
  type?: string;
  description?: string;
}

export interface DocThrows {
  type: string;
  description?: string;
}

export interface DocDeprecation {
  since?: string;
  message?: string;
}

export interface DocEntry {
  id: string;
  source: DocSource;
  kind: DocEntryKind;
  title: string;
  qualifiedName: string;
  parentId?: string;
  packagePath?: string;
  signature?: string;
  description?: string;
  params?: DocParam[];
  returns?: DocReturn;
  throws?: DocThrows[];
  sinceApiVersion?: string;
  deprecated?: DocDeprecation;
  sections?: DocSection[];
  examples?: string[];
  tags?: string[];
  attributes?: DocAttribute[];
}

/**
 * Lightweight entry shape used by the search dictionary. Every field is also
 * present on the full DocEntry; this subset is what gets loaded eagerly.
 */
export interface SearchEntry {
  id: string;
  title: string;
  qualifiedName: string;
  kind: DocEntryKind;
  packagePath?: string;
  parentId?: string;
  tags?: string[];
}

export interface IndexCounts {
  scriptApi: number;
  isml: number;
  bm: number;
}

export interface IndexManifest {
  schemaVersion: 1;
  scriptApiVersion: string;
  ismlVersion: string;
  bmVersion: string;
  generatedAt: string;
  counts: IndexCounts;
  checksum: string;
}

export const SUPPORTED_SCHEMA_VERSION = 1 as const;
