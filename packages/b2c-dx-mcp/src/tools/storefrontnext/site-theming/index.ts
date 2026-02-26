/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Site Theming tool for Storefront Next.
 *
 * Provides theming guidelines, guided questions, and automatic WCAG color contrast
 * validation. Call this tool first when users request brand colors or theme changes.
 *
 * @module tools/storefrontnext/site-theming
 */

import {z} from 'zod';
import type {McpTool} from '../../../utils/index.js';
import type {Services} from '../../../services.js';
import {createToolAdapter, textResult, errorResult, type ToolExecutionContext} from '../../adapter.js';
import {siteThemingStore, type ThemingGuidance} from './theming-store.js';
import {mergeGuidance} from './guidance-merger.js';
import {generateResponse} from './response-builder.js';
import type {SiteThemingInput} from './types.js';

export type {
  ColorEntry,
  ColorMapping,
  CollectedAnswers,
  ConversationContext,
  FontEntry,
  SiteThemingInput,
} from './types.js';

/**
 * Creates the site theming MCP tool for Storefront Next.
 *
 * The tool guides theming changes (colors, fonts, visual styling) and validates color
 * combinations for WCAG accessibility. It must be called before implementing any
 * theming changes.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns The configured MCP tool
 */
export function createSiteThemingTool(loadServices: () => Services): McpTool {
  return createToolAdapter<SiteThemingInput, {text: string; isError?: boolean}>(
    {
      name: 'storefront_next_site_theming',
      description:
        '⚠️ MANDATORY: Call this tool FIRST before implementing any theming changes. ' +
        'Provides theming guidelines, questions, and automatic validation. ' +
        'CRITICAL RULES: Call immediately when user requests theming (even if colors/fonts provided). ' +
        'NEVER implement without calling this tool first. NEVER skip question-answer workflow. ' +
        'MUST ask questions and WAIT for responses. ' +
        'VALIDATION GATE: After collecting answers, call tool again with colorMapping to trigger validation. ' +
        'DEFAULT FILES: theming-questions, theming-validation, theming-accessibility. ' +
        'Use fileKeys to add custom files. ' +
        'WORKFLOW: Call tool → Ask questions → Call with colorMapping (validation) → Present findings → Wait confirmation → Implement',
      toolsets: ['STOREFRONTNEXT'],
      isGA: false,
      requiresInstance: false,
      inputSchema: {
        fileKeys: z
          .array(z.string())
          .optional()
          .describe(
            'Array of file keys to add to the default set. If provided, guidance from all specified files will be merged with defaults: theming-questions, theming-validation, theming-accessibility. Available keys can be listed by calling the tool without parameters.',
          ),
        conversationContext: z
          .object({
            currentStep: z
              .string()
              .optional()
              .describe('Current step in the theming conversation (e.g., "collecting-colors", "collecting-fonts")'),
            collectedAnswers: z
              .record(z.string(), z.any())
              .optional()
              .describe('Previously collected answers from the user'),
            questionsAsked: z.array(z.string()).optional().describe('List of questions that have already been asked'),
          })
          .optional()
          .describe('Context from previous conversation rounds'),
      },
      async execute(args: SiteThemingInput, context: ToolExecutionContext) {
        siteThemingStore.initialize(context.services.getWorkingDirectory());

        const defaultFileKeys = ['theming-questions', 'theming-validation', 'theming-accessibility'];
        let fileKeys: string[];

        if (args.fileKeys && args.fileKeys.length > 0) {
          const allKeys = [...defaultFileKeys, ...args.fileKeys];
          fileKeys = [...new Set(allKeys)];
        } else {
          fileKeys = defaultFileKeys;
        }

        const hasContext =
          args.conversationContext &&
          (args.conversationContext.collectedAnswers ||
            args.conversationContext.questionsAsked ||
            args.conversationContext.currentStep);

        if (!args.fileKeys && !hasContext) {
          const availableKeys = siteThemingStore.getKeys();
          if (availableKeys.length === 0) {
            return {
              text: 'No theming files have been loaded. Please ensure theming files are configured at server startup.',
              isError: false,
            };
          }

          return {
            text: `Available theming files:\n\n${availableKeys.map((key) => `- ${key}`).join('\n')}\n\nDefault files (always used): theming-questions, theming-validation, theming-accessibility\n\nUse the \`fileKeys\` parameter to add additional files. User-provided files are merged with the defaults.`,
            isError: false,
          };
        }

        const guidanceArray: ThemingGuidance[] = [];
        const missingKeys: string[] = [];

        for (const key of fileKeys) {
          const guidance = siteThemingStore.get(key);
          if (guidance) {
            guidanceArray.push(guidance);
          } else {
            missingKeys.push(key);
          }
        }

        if (guidanceArray.length === 0 || missingKeys.length > 0) {
          const availableKeys = siteThemingStore.getKeys();
          const keysList = fileKeys.length === 1 ? `key "${fileKeys[0]}"` : `keys: ${fileKeys.join(', ')}`;
          const missingList = missingKeys.length === 1 ? `"${missingKeys[0]}"` : missingKeys.join(', ');
          return {
            text: `Theming file(s) with ${keysList} not found.\n\nMissing: ${missingList}\nAvailable keys: ${availableKeys.join(', ')}\n\nFiles are loaded at server startup. To add more files, configure them via the THEMING_FILES environment variable or update the server initialization.`,
            isError: true,
          };
        }

        const guidance = fileKeys.length > 1 ? mergeGuidance(guidanceArray) : guidanceArray[0];
        const response = generateResponse(guidance, args.conversationContext);

        return {
          text: response,
          isError: false,
        };
      },
      formatOutput: (output: {text: string; isError?: boolean}) =>
        output.isError ? errorResult(output.text) : textResult(output.text),
    },
    loadServices,
  );
}
