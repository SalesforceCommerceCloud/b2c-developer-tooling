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
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, textResult} from '../adapter.js';

// Get current file's directory for loading markdown files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONTENT_DIR = join(__dirname, 'content');

/**
 * Available guideline sections.
 */
const _SECTIONS = [
  'quick-reference',
  'data-fetching',
  'state-management',
  'auth',
  'config',
  'i18n',
  'components',
  'page-designer',
  'performance',
  'testing',
  'extensions',
  'pitfalls',
] as const;

type SectionKey = (typeof _SECTIONS)[number];

/**
 * Input schema for the developer guidelines tool.
 */
interface DeveloperGuidelinesInput {
  sections?: SectionKey[];
}

/**
 * Helper function to load markdown content from file.
 * @param section - The section key
 * @returns The markdown content as a string
 */
function loadSectionContent(section: SectionKey): string {
  const filename = `${section}.md`;
  const filePath = join(CONTENT_DIR, filename);
  return readFileSync(filePath, 'utf8');
}

/**
 * Detailed section content loaded from markdown files.
 */
const SECTION_CONTENT: Record<SectionKey, string> = {
  'quick-reference': loadSectionContent('quick-reference'),
  'data-fetching': loadSectionContent('data-fetching'),
  'state-management': loadSectionContent('state-management'),
  auth: loadSectionContent('auth'),
  config: loadSectionContent('config'),
  i18n: loadSectionContent('i18n'),
  components: loadSectionContent('components'),
  'page-designer': loadSectionContent('page-designer'),
  performance: loadSectionContent('performance'),
  testing: loadSectionContent('testing'),
  extensions: loadSectionContent('extensions'),
  pitfalls: loadSectionContent('pitfalls'),
};

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
        'ESSENTIAL FIRST STEP: Critical rules and guidelines for Storefront Next developers. ' +
        'Use this tool FIRST when new to Storefront Next, before writing any code, or when learning critical rules and architectural patterns. ' +
        'Provides the official quick reference with non-negotiable architecture rules, coding standards, and best practices. ' +
        'Covers critical topics: server-only data loading (no client loaders), synchronous loaders for streaming, TypeScript-only, ' +
        'authentication, i18n patterns, component best practices, data fetching patterns, performance optimization, testing, and common pitfalls. ' +
        'Returns quick reference by default (critical rules) or specific section(s) when requested. ' +
        'Supports selecting multiple sections in a single call for contextual learning.',
      toolsets: ['STOREFRONTNEXT'],
      isGA: true,
      requiresInstance: false,
      inputSchema: {
        sections: z
          .array(z.enum([..._SECTIONS] as [string, ...string[]]))
          .optional()
          .describe(
            'One or more sections to retrieve. If not specified, returns quick-reference. ' +
              `Available sections: ${_SECTIONS.join(', ')}`,
          ),
      },
      async execute(args) {
        // Default to quick-reference if no sections specified
        const sections = args.sections || ['quick-reference'];

        // If single section, return it directly (backward compatible)
        if (sections.length === 1) {
          return SECTION_CONTENT[sections[0]];
        }

        // Multiple sections: combine with separators
        const combinedContent = sections.map((section) => SECTION_CONTENT[section]).join('\n\n---\n\n');

        return combinedContent;
      },
      formatOutput: (output) => textResult(output),
    },
    services,
  );
}
