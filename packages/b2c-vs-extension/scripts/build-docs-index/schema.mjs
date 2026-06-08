/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Shared schema for the docs index.
 *
 * This is the single source of truth for the JSON shape produced by the build
 * scripts under `scripts/build-docs-index/` and consumed by the runtime loader
 * under `src/docs-browser/`. Bumping `SCHEMA_VERSION` is a breaking change for
 * the loader and must be paired with a loader update.
 *
 * @typedef {'script-api' | 'isml' | 'bm'} DocSource
 *
 * @typedef {'package' | 'class' | 'interface' | 'enum' | 'method' | 'property' | 'constant' | 'tag' | 'attribute' | 'topic'} DocEntryKind
 *
 * @typedef {object} DocParam
 * @property {string} name
 * @property {string} [type]
 * @property {string} [description]
 * @property {boolean} [optional]
 *
 * @typedef {object} DocSection
 * @property {string} heading
 * @property {string} body  Markdown source. Renderer pre-processes this at build time when possible.
 *
 * @typedef {object} DocAttribute
 * @property {string} name
 * @property {boolean} [required]
 * @property {string} [description]
 *
 * @typedef {object} DocReturn
 * @property {string} [type]
 * @property {string} [description]
 *
 * @typedef {object} DocThrows
 * @property {string} type
 * @property {string} [description]
 *
 * @typedef {object} DocDeprecation
 * @property {string} [since]
 * @property {string} [message]
 *
 * @typedef {object} DocEntry
 * @property {string} id              Stable cross-source id (e.g. "script-api:dw/order/BasketMgr#getCurrentBasket").
 * @property {DocSource} source
 * @property {DocEntryKind} kind
 * @property {string} title           Short display title (e.g. "BasketMgr.getCurrentBasket").
 * @property {string} qualifiedName   Fully qualified (e.g. "dw.order.BasketMgr.getCurrentBasket").
 * @property {string} [parentId]
 * @property {string} [packagePath]   Slash form (e.g. "dw/order").
 * @property {string} [signature]     One-line signature string.
 * @property {string} [description]   Short summary (first paragraph).
 * @property {DocParam[]} [params]
 * @property {DocReturn} [returns]
 * @property {DocThrows[]} [throws]
 * @property {string} [sinceApiVersion]
 * @property {DocDeprecation} [deprecated]
 * @property {DocSection[]} [sections]
 * @property {string[]} [examples]    Each is a code block (no fences). Caller decides language.
 * @property {string[]} [tags]        Free-form search keywords.
 * @property {DocAttribute[]} [attributes]  Only for ISML kind 'tag'.
 *
 * @typedef {object} IndexCounts
 * @property {number} scriptApi
 * @property {number} isml
 * @property {number} bm
 *
 * @typedef {object} IndexManifest
 * @property {1} schemaVersion
 * @property {string} scriptApiVersion
 * @property {string} ismlVersion
 * @property {string} bmVersion
 * @property {string} generatedAt    ISO-8601 instant.
 * @property {IndexCounts} counts
 * @property {string} checksum       sha256 of concatenated source JSON files.
 */

export const SCHEMA_VERSION = 1;

/** All DocSource values. Keep in lockstep with the typedef above. */
export const DOC_SOURCES = Object.freeze(['script-api', 'isml', 'bm']);

/** All DocEntryKind values. Keep in lockstep with the typedef above. */
export const DOC_ENTRY_KINDS = Object.freeze([
  'package',
  'class',
  'interface',
  'enum',
  'method',
  'property',
  'constant',
  'tag',
  'attribute',
  'topic',
]);

/**
 * Validate a DocEntry. Throws if invalid. Cheap enough to run on every entry
 * during build so we fail loudly rather than ship a malformed index.
 *
 * @param {unknown} entry
 * @param {string} [context]
 */
export function assertValidDocEntry(entry, context = '') {
  if (!entry || typeof entry !== 'object') {
    throw new Error(`Invalid DocEntry${context ? ` (${context})` : ''}: not an object`);
  }
  const e = /** @type {Record<string, unknown>} */ (entry);
  const required = ['id', 'source', 'kind', 'title', 'qualifiedName'];
  for (const key of required) {
    if (typeof e[key] !== 'string' || e[key] === '') {
      throw new Error(`Invalid DocEntry${context ? ` (${context})` : ''}: missing or empty ${key}`);
    }
  }
  if (!DOC_SOURCES.includes(/** @type {string} */ (e.source))) {
    throw new Error(`Invalid DocEntry source: ${String(e.source)}`);
  }
  if (!DOC_ENTRY_KINDS.includes(/** @type {string} */ (e.kind))) {
    throw new Error(`Invalid DocEntry kind: ${String(e.kind)}`);
  }
}

/**
 * Stable JSON.stringify for committed output: sorted keys, 2-space indent, trailing newline.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function stableStringify(value) {
  return JSON.stringify(value, sortedReplacer(), 2) + '\n';
}

function sortedReplacer() {
  return function replacer(_key, value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const sorted = {};
      for (const k of Object.keys(value).sort()) {
        sorted[k] = value[k];
      }
      return sorted;
    }
    return value;
  };
}
