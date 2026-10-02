/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/** Public collection identity for skill discovery. */
export interface GuidanceCollection {
  id: string;
  title: string;
}

/** Internal distribution metadata; never returned by catalog reads. */
interface GuidanceCollectionMetadata extends GuidanceCollection {
  isGA: boolean;
  workspaces?: string[];
}

/** Inventoried Markdown file. Hashes cover the exact shipped UTF-8 bytes. */
export interface GuidanceFile {
  path: string;
  bytes: number;
  /** `sha256:<64 lowercase hex>` of the shipped bytes. */
  digest: string;
}

/** One workflow entrypoint and its progressively disclosed supporting files. */
export interface GuidanceEntry {
  id: string;
  collection: string;
  title: string;
  description: string;
  entrypoint: string;
  /** Entrypoint YAML frontmatter as JSON, verbatim; `name` equals the entry folder. */
  frontmatter: Record<string, unknown>;
  /** Advertise this entrypoint in resources/list and skills/list. Does not restrict reads. */
  featured?: boolean;
  source: string;
  headings: string;
  files: GuidanceFile[];
}

/** Deterministic distribution manifest; no absolute source paths or timestamps. */
export interface GuidanceManifest {
  version: 1;
  collections: GuidanceCollectionMetadata[];
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

/** One file of a skill, as listed by the MCP skills extension (SEP-2640). */
export interface GuidanceSkillResource {
  uri: string;
  digest: string;
  size: number;
}

/** MCP skills extension entry: entrypoint URI, verbatim frontmatter, and every file. */
export interface GuidanceSkill {
  uri: string;
  frontmatter: Record<string, unknown>;
  resources: GuidanceSkillResource[];
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
