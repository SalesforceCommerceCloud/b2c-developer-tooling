/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Developer Guidelines tool for Storefront Next.
 *
 * Provides critical development guidelines and best practices for building
 * Storefront Next applications with React Server Components.
 *
 * @module tools/storefrontnext/developer-guidelines
 */

import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, textResult} from '../adapter.js';

// Resolve the content directory from the package root
// Uses createRequire to find the package.json location, which is robust
// regardless of where this module is located in the build output
const require = createRequire(import.meta.url);
const packageRoot = path.dirname(require.resolve('@salesforce/b2c-dx-mcp/package.json'));
const CONTENT_DIR = path.join(packageRoot, 'content');

/**
 * Section metadata with key and optional description.
 * Single source of truth for all available sections.
 */
const SECTIONS_METADATA = [
  {key: 'quick-reference', description: null}, // Meta-section, excluded from topics list
  {
    key: 'data-fetching',
    description:
      'server-only data loading (no client loaders), synchronous loaders for streaming, data fetching patterns',
  },
  {key: 'state-management', description: 'state management patterns'},
  {key: 'auth', description: 'authentication and session management'},
  {key: 'config', description: 'configuration'},
  {key: 'i18n', description: 'i18n patterns and internationalization'},
  {key: 'components', description: 'component best practices'},
  {key: 'page-designer', description: 'Page Designer integration'},
  {key: 'performance', description: 'performance optimization'},
  {key: 'testing', description: 'testing strategies'},
  {key: 'extensions', description: 'framework extensions'},
  {key: 'pitfalls', description: 'common pitfalls'},
] as const;

/**
 * Derived: array of section keys for validation.
 */
const _SECTIONS = SECTIONS_METADATA.map((s) => s.key);

type SectionKey = (typeof SECTIONS_METADATA)[number]['key'];

/**
 * Generates the topics list for the tool description.
 * Excludes meta-sections (like quick-reference) that don't have descriptions.
 * @returns Comma-separated list of topics
 */
function generateTopicsList(): string {
  return SECTIONS_METADATA.filter((s) => s.description !== null)
    .map((s) => s.description)
    .join(', ');
}

/**
 * Input schema for the developer guidelines tool.
 */
interface DeveloperGuidelinesInput {
  sections?: SectionKey[];
}

/**
 * Detailed section content loaded from markdown files.
 * Built dynamically from SECTIONS_METADATA to avoid duplication.
 */
const SECTION_CONTENT: Record<SectionKey, string> = Object.fromEntries(
  SECTIONS_METADATA.map((section) => {
    const filename = `${section.key}.md`;
    const filePath = path.join(CONTENT_DIR, filename);
    const content = readFileSync(filePath, 'utf8');
    return [section.key, content];
  }),
) as Record<SectionKey, string>;

/**
 * Default sections to return when no sections are specified.
 * Includes quick-reference plus the most critical detailed sections
 * to provide comprehensive guidelines by default.
 */
const DEFAULT_SECTIONS: SectionKey[] = ['quick-reference', 'data-fetching', 'components', 'testing'];

/**
 * Creates the developer guidelines tool for Storefront Next.
 *
 * @param services - MCP services
 * @returns The configured MCP tool
 */
export function createDeveloperGuidelinesTool(services: Services): McpTool {
  return createToolAdapter<DeveloperGuidelinesInput, string>(
    {
      name: 'storefront_next_development_guidelines',
      description:
        'ESSENTIAL FIRST STEP for Storefront Next development. Returns critical architecture rules, coding standards, and best practices. ' +
        'Use this tool FIRST before writing any Storefront Next code to understand non-negotiable patterns for React Server Components, ' +
        'data loading, and framework constraints. Returns comprehensive guidelines by default (quick-reference + key sections); ' +
        'supports retrieving specific topic sections. ' +
        'CRITICAL INSTRUCTION: ALWAYS present ALL returned content in FULL - DO NOT SUMMARIZE, DO NOT ADD SUMMARIES, ' +
        'DO NOT ADD OVERVIEWS. The returned content IS the complete answer - display it exactly as provided.',
      toolsets: ['STOREFRONTNEXT'],
      isGA: false,
      requiresInstance: false,
      inputSchema: {
        sections: z
          .array(z.enum([..._SECTIONS] as [string, ...string[]]))
          .optional()
          .describe(
            'Optional array of specific sections to retrieve. If not specified, returns comprehensive guidelines ' +
              '(quick-reference, data-fetching, components, testing). ' +
              'CRITICAL: Present ALL returned content in FULL - DO NOT SUMMARIZE. ' +
              'Available sections: quick-reference, data-fetching, state-management, auth, config, i18n, ' +
              'components, page-designer, performance, testing, extensions, pitfalls. ' +
              `Topics covered: ${generateTopicsList()}. ` +
              'Content is complete - present exactly as provided, no summaries.',
          ),
      },
      async execute(args) {
        // Handle empty array case explicitly
        if (args.sections && args.sections.length === 0) {
          return '';
        }

        // Default to comprehensive set of key sections if no sections specified
        const sections = args.sections || DEFAULT_SECTIONS;

        // Multiple sections: combine with separators
        const combinedContent = sections.map((section) => SECTION_CONTENT[section]).join('\n\n---\n\n');

        // Apply instructions for all multi-section responses to ensure full content display
        // Single sections are typically smaller and don't need heavy instructions
        const isMultiSection = sections.length > 1;

        // Prepend explicit instruction to present full content (not summarized)
        // This helps AI assistants understand they should show the complete guidelines without summarization
        const fullContentInstruction = isMultiSection
          ? '⚠️ CRITICAL: Display the FULL content below. DO NOT summarize, condense, or add overviews.\n\n' +
            '📋 STOREFRONT NEXT DEVELOPMENT GUIDELINES\n\n' +
            '---\n\n'
          : '';

        // Add footer instruction to reinforce the message for multi-section responses
        const footerInstruction = isMultiSection
          ? '\n\n---\n\n⚠️ END OF CONTENT - Full content displayed above. Do not add summaries.\n'
          : '';

        // For single sections, return directly (backward compatible)
        // For multiple sections, wrap with instructions
        if (sections.length === 1) {
          return SECTION_CONTENT[sections[0]];
        }

        return fullContentInstruction + combinedContent + footerInstruction;
      },
      formatOutput: (output) => textResult(output),
    },
    services,
  );
}
