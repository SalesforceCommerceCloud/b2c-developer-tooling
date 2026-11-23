/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {SECURITY_RULES_DOCS_URL} from '../rule.js';
import type {SecurityRuleInfo} from '../types.js';
import type {XmlElement} from './xml.js';

/** The kinds of metadata files the metadata analyzer reads. */
export type MetadataFileKind = 'csrf-allowlist' | 'metadata' | 'ocapi-settings' | 'preferences' | 'services';

/** A parsed metadata file. */
export type MetadataDocument =
  | {kind: Exclude<MetadataFileKind, 'ocapi-settings'>; format: 'xml'; file: string; text: string; root: XmlElement}
  | {kind: 'ocapi-settings'; format: 'json'; file: string; text: string; data: unknown};

/** A problem a metadata rule reports. */
export interface MetadataReport {
  /** 1-based. */
  line: number;
  /** 1-based; defaults to 1. */
  column?: number;
  message: string;
}

/** A rule over import/export metadata (site archives, OCAPI settings). */
export interface MetadataRule {
  meta: {b2c: SecurityRuleInfo};
  /** The file kinds the rule checks. */
  kinds: readonly MetadataFileKind[];
  check(document: MetadataDocument, report: (problem: MetadataReport) => void): void;
}

/** Input to {@link defineMetadataRule}. */
export type MetadataRuleDefinition = Omit<SecurityRuleInfo, 'analyzer' | 'docsUrl'> & {
  kinds: readonly MetadataFileKind[];
  check: MetadataRule['check'];
};

/** Defines a metadata rule. */
export function defineMetadataRule(definition: MetadataRuleDefinition): MetadataRule {
  const {kinds, check, ...rest} = definition;
  return {
    meta: {b2c: {...rest, analyzer: 'metadata', docsUrl: `${SECURITY_RULES_DOCS_URL}#${rest.id}`}},
    kinds,
    check,
  };
}

/** The 1-based line of a character offset in `text`. */
export function lineAt(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

/**
 * Lines in a JSON text where `"key": <value>` appears, for locating findings in
 * JSON files that were parsed without positions. `value` may be a string to
 * match exactly or a predicate over the raw value text.
 */
export function jsonKeyLines(text: string, key: string, value?: string | ((raw: string) => boolean)): number[] {
  const re = new RegExp(
    `"${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|\\[[^\\]]*\\]|[^,}\\s]+)`,
    'g',
  );
  const lines: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const raw = match[1];
    const ok = value === undefined ? true : typeof value === 'string' ? raw === JSON.stringify(value) : value(raw);
    if (ok) lines.push(lineAt(text, match.index));
  }
  return lines;
}
