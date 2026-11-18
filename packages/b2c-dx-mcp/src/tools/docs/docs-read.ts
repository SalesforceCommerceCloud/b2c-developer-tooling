/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {TOOLSETS} from '../../utils/constants.js';
import {z} from 'zod';
import {readDocByQuery, type DocCategory, type DocEntry} from '@salesforce/b2c-tooling-sdk/docs';
import type {ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';
import {guidanceHeadings} from '@salesforce/b2c-tooling-sdk/guidance';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, errorResult, jsonResult} from '../adapter.js';
import {DOCS_CITATION_NOTE, enabledCategoriesNote} from './topics.js';
import {workspaceInputSchema, resolveProjectWorkspace, type WorkspaceContextInput} from './storefront.js';

/** Default maximum characters of content returned per read call, to bound the inline payload. */
const DEFAULT_MAX_LENGTH = 12_000;

interface ReadInput extends WorkspaceContextInput {
  query: string;
  section?: string;
  offset?: number;
  maxLength?: number;
}

interface ReadOutput {
  citation: string;
  content: string;
  entry: DocEntry;
  totalLength: number;
  offset: number;
  section?: string;
  truncated?: boolean;
  nextOffset?: number;
}

/** Unknown section: the page's headings, so the caller can retry with one. */
interface SectionNotFound {
  sectionNotFound: string;
  sections: Array<{id: string; title: string}>;
}

export function createDocsReadTool(
  loadServices: () => Promise<Services> | Services,
  enabledCategories?: readonly DocCategory[],
  detectedWorkspaces: readonly ProjectType[] = [],
): McpTool {
  return createToolAdapter<ReadInput, null | ReadOutput | SectionNotFound>(
    {
      name: 'docs_read',
      searchHint: 'script api class reference documentation guide help article dw',
      effect: 'read',
      idempotent: true,
      openWorld: true,
      description:
        'Read a B2C Commerce (SFCC/Demandware) Script API reference, job step, developer guide, admin/merchant help article, or tooling doc by ID or fuzzy query. ' +
        'Use docs_search to find IDs. ' +
        'Cite by entry.url (sourceUrl for Markdown); never show doc IDs.' +
        enabledCategoriesNote(enabledCategories),
      toolsets: [...TOOLSETS],
      inputSchema: {
        ...workspaceInputSchema,
        query: z
          .string()
          .min(1)
          .describe('Exact id ("dw.catalog.ProductMgr", "sfnext/sfnext-get-started") or fuzzy query.'),
        section: z
          .string()
          .min(1)
          .optional()
          .describe('Heading ID to read one section, e.g. "scopes-by-command"; unknown IDs list the headings.'),
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
      async execute(args, context) {
        // Favor the detected workspace when resolving a fuzzy query so a read
        // picks the same top hit docs_search ranks first. Exact id matches
        // short-circuit inside readDocByQuery before searching, so the boost
        // only affects fuzzy resolution.
        const workspace = await resolveProjectWorkspace(args, detectedWorkspaces);
        const found = await readDocByQuery(args.query, {enabledCategories, workspace});
        if (!found) return null;
        let selected = found.content;
        if (args.section !== undefined) {
          const headings = guidanceHeadings(found.content);
          const heading = headings.find((item) => item.id === args.section);
          if (!heading) return {sectionNotFound: args.section, sections: headings.map(({id, title}) => ({id, title}))};
          selected = found.content.slice(heading.start, heading.end);
        }
        const totalLength = selected.length;
        const offset = Math.min(args.offset ?? 0, totalLength);
        const maxLength = args.maxLength ?? DEFAULT_MAX_LENGTH;
        const slice = selected.slice(offset, offset + maxLength);
        const end = offset + slice.length;
        const truncated = end < totalLength;
        context.recordContentRead?.({
          contentType: 'doc',
          contentId: found.entry.id,
          ...(found.entry.category && {category: found.entry.category}),
          offset,
        });
        return {
          citation: DOCS_CITATION_NOTE,
          entry: found.entry,
          content: slice,
          totalLength,
          offset,
          ...(args.section !== undefined && {section: args.section}),
          ...(truncated && {truncated: true, nextOffset: end}),
        };
      },
      formatOutput(output) {
        if (!output) return errorResult('No documentation found. Try docs_search to find candidates.');
        if ('sectionNotFound' in output) {
          return {
            ...jsonResult({error: 'Unknown section. Retry with an id from sections, or omit section.', ...output}),
            isError: true,
          };
        }
        return jsonResult(output);
      },
    },
    loadServices,
  );
}
