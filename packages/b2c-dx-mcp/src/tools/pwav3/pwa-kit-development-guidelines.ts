/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Developer Guidelines tool for PWA Kit.
 *
 * Provides critical development guidelines and best practices for building
 * PWA Kit applications with React, Chakra UI, and Commerce API.
 *
 * @module tools/pwav3/pwa-kit-development-guidelines
 */

import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {z} from 'zod';
import type {McpTool} from '../../utils/index.js';
import type {Services} from '../../services.js';
import {createToolAdapter, textResult} from '../adapter.js';

// Resolve the content directory from the package root
const require = createRequire(import.meta.url);
const packageRoot = path.dirname(require.resolve('@salesforce/b2c-dx-mcp/package.json'));
const CONTENT_DIR = path.join(packageRoot, 'content', 'pwav3');

/**
 * Section metadata with key and optional description.
 * Single source of truth for all available sections.
 */
const SECTIONS_METADATA = [
  {key: 'quick-reference', description: null}, // Meta-section, excluded from topics list
  {
    key: 'components',
    description: 'component patterns, Chakra UI, special components (_app, _app-config, _error), React Hooks',
  },
  {
    key: 'data-fetching',
    description: 'commerce-sdk-react hooks, useCustomQuery/useCustomMutation, React Query, custom APIs, caching',
  },
  {
    key: 'routing',
    description: 'Express.js, React Router, configureRoutes, SSR/CSR navigation, withReactQuery, getProps patterns',
  },
  {
    key: 'config',
    description: 'configuration files, environment variables, file precedence, proxy setup, multi-site',
  },
  {
    key: 'state-management',
    description: 'Context API, useReducer, Redux integration, AppConfig methods',
  },
  {
    key: 'extensibility',
    description: 'template extension, ccExtensibility configuration, overrides directory',
  },
  {key: 'testing', description: 'Jest, React Testing Library, MSW, test organization, coverage'},
  {
    key: 'i18n',
    description: 'React Intl, translation extraction/compilation, multi-locale support',
  },
  {key: 'styling', description: 'Chakra UI theming, Emotion CSS-in-JS, responsive design'},
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
const DEFAULT_SECTIONS: SectionKey[] = ['quick-reference', 'components', 'data-fetching', 'routing'];

/**
 * Creates the developer guidelines tool for PWA Kit.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns The configured MCP tool
 */
export function createDeveloperGuidelinesTool(loadServices: () => Services): McpTool {
  return createToolAdapter<DeveloperGuidelinesInput, string>(
    {
      name: 'pwakit_development_guidelines',
      description:
        'ESSENTIAL FIRST STEP for PWA Kit v3 development. Returns critical architecture rules, coding standards, and best practices. ' +
        'Use this tool FIRST before writing any PWA Kit code to understand non-negotiable patterns for React components, ' +
        'data fetching, routing, configuration, and framework constraints. Returns comprehensive guidelines by default (quick-reference + key sections); ' +
        'supports retrieving specific topic sections. ' +
        'CRITICAL INSTRUCTION: ALWAYS present ALL returned content in FULL - DO NOT SUMMARIZE, DO NOT ADD SUMMARIES, ' +
        'DO NOT ADD OVERVIEWS. The returned content IS the complete answer - display it exactly as provided.',
      toolsets: ['PWAV3'],
      isGA: false,
      requiresInstance: false,
      inputSchema: {
        sections: z
          .array(z.enum([..._SECTIONS] as [string, ...string[]]))
          .optional()
          .describe(
            'Optional array of specific sections to retrieve. If not specified, returns comprehensive guidelines ' +
              '(quick-reference, components, data-fetching, routing). ' +
              'CRITICAL: Present ALL returned content in FULL - DO NOT SUMMARIZE. ' +
              'Available sections: quick-reference, components, data-fetching, routing, config, state-management, ' +
              'extensibility, testing, i18n, styling. ' +
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
        const isMultiSection = sections.length > 1;

        // Prepend explicit instruction to present full content (not summarized)
        const fullContentInstruction = isMultiSection
          ? '⚠️ CRITICAL: Display the FULL content below. DO NOT summarize, condense, or add overviews.\n\n' +
            '📋 PWA KIT DEVELOPMENT GUIDELINES\n\n' +
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
    loadServices,
  );
}
