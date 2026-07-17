/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import {readDocByQuery, type DocCategory, type DocEntry} from '@salesforce/b2c-tooling-sdk/docs';
import type {ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, errorResult, jsonResult} from '../adapter.js';
import {enabledCategoriesNote} from './topics.js';

/** Default maximum characters of content returned per read call, to bound the inline payload. */
const DEFAULT_MAX_LENGTH = 12_000;

interface ReadInput {
  query: string;
  offset?: number;
  maxLength?: number;
}

interface ReadOutput {
  content: string;
  entry: DocEntry;
  totalLength: number;
  offset: number;
  truncated?: boolean;
  nextOffset?: number;
}

export function createDocsReadTool(
  loadServices: () => Promise<Services> | Services,
  enabledCategories?: readonly DocCategory[],
  detectedWorkspaces: readonly ProjectType[] = [],
): McpTool {
  return createToolAdapter<ReadInput, null | ReadOutput>(
    {
      name: 'docs_read',
      description:
        'Read B2C Commerce documentation (markdown) for a class, module, job step, guide, or Help article. ' +
        'Accepts an exact id (e.g. "dw.catalog.ProductMgr", "sfnext/sfnext-get-started") or a fuzzy ' +
        'query — best match wins (a fuzzy query favors the detected workspace, matching docs_search). ' +
        'Job-step content is bundled; Script API, Developer Center guide, and Salesforce Help content is ' +
        'fetched from its published URL on demand and cached locally (with a summary/headings fallback if ' +
        'the network is unavailable). If you do not know the id, call docs_search first. Long docs are ' +
        'truncated to maxLength chars; page with offset when truncated=true. The returned entry ' +
        'includes the canonical url for citation and, for Help landing articles, relatedEntries ids for ' +
        'the linked child articles.' +
        enabledCategoriesNote(enabledCategories),
      toolsets: ['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT'],
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe('Exact id ("dw.catalog.ProductMgr", "sfnext/sfnext-get-started") or fuzzy query.'),
        offset: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe('Character offset to start reading from (for paging long docs). Defaults to 0.'),
        maxLength: z
          .number()
          .int()
          .positive()
          .optional()
          .describe(`Maximum characters of content to return. Defaults to ${DEFAULT_MAX_LENGTH}.`),
      },
      async execute(args) {
        // Favor the detected workspace when resolving a fuzzy query so a read
        // picks the same top hit docs_search ranks first. Exact id matches
        // short-circuit inside readDocByQuery before searching, so the boost
        // only affects fuzzy resolution.
        const workspace = detectedWorkspaces.length > 0 ? [...detectedWorkspaces] : undefined;
        const found = await readDocByQuery(args.query, {enabledCategories, workspace});
        if (!found) return null;
        const totalLength = found.content.length;
        const offset = Math.min(args.offset ?? 0, totalLength);
        const maxLength = args.maxLength ?? DEFAULT_MAX_LENGTH;
        const slice = found.content.slice(offset, offset + maxLength);
        const end = offset + slice.length;
        const truncated = end < totalLength;
        return {
          entry: found.entry,
          content: slice,
          totalLength,
          offset,
          ...(truncated && {truncated: true, nextOffset: end}),
        };
      },
      formatOutput: (output) =>
        output ? jsonResult(output) : errorResult('No documentation found. Try docs_search to find candidates.'),
    },
    loadServices,
  );
}
