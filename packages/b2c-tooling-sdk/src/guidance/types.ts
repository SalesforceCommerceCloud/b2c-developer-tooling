/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/** Authored source collection, independent of native plugin installation. */
export interface GuidanceCollection {
  id: string;
  title: string;
  isGA: boolean;
  workspaces?: string[];
}

/** Inventoried Markdown file. Hashes cover the exact shipped UTF-8 bytes. */
export interface GuidanceFile {
  path: string;
  bytes: number;
}

/** One workflow entrypoint and its progressively disclosed supporting files. */
export interface GuidanceEntry {
  id: string;
  collection: string;
  title: string;
  description: string;
  entrypoint: string;
  /** Advertise this entrypoint individually in resources/list. Does not restrict reads. */
  featured?: boolean;
  source: string;
  headings: string;
  files: GuidanceFile[];
}

/** Deterministic distribution manifest; no absolute source paths or timestamps. */
export interface GuidanceManifest {
  version: 1;
  collections: GuidanceCollection[];
  entries: GuidanceEntry[];
}

/** List/search pagination and exact file or section selectors with optional slicing. */
export interface GuidanceRequest {
  id?: string;
  uri?: string;
  file?: string;
  section?: string;
  query?: string;
  collection?: string;
  workspace?: string | string[];
  limit?: number;
  offset?: number;
  maxLength?: number;
}

/** Compact discovery entry; supporting files appear only when reading. */
export interface GuidanceSummary {
  id: string;
  title: string;
  description: string;
  /** Readable through the resource template, whether or not individually advertised. */
  uri: string;
  score?: number;
}

/** Bounded directory or ranked search page. */
export interface GuidancePage {
  kind: 'directory' | 'search';
  collections: GuidanceCollection[];
  entries: GuidanceSummary[];
  total: number;
  offset: number;
  nextOffset?: number;
}

/** Skill content with explicit position and length within the selected file or section. */
export interface GuidanceRead {
  kind: 'read';
  id: string;
  /** Readable through the resource template, whether or not individually advertised. */
  uri: string;
  source: string;
  content: string;
  totalLength: number;
  offset: number;
  truncated?: boolean;
  nextOffset?: number;
  sections: {id: string; title: string}[];
  references: string[];
}

/** Guidance errors are safe for clients and contain no host filesystem paths. */
export class GuidanceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly sections?: {id: string; title: string}[],
  ) {
    super(message);
    this.name = 'GuidanceError';
  }
}
