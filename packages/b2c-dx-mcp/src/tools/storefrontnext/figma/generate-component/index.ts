/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {z} from 'zod';
import type {McpTool} from '../../../../utils/index.js';
import type {Services} from '../../../../services.js';
import {createToolAdapter, textResult} from '../../../adapter.js';
import {analyzeComponentDifferences, determineAction} from './decision.js';
import {formatRecommendation} from './formatter.js';

export interface SimilarComponent {
  path: string;
  name: string;
  similarity: number;
  matchType: 'name' | 'structure' | 'visual';
  code: string;
}

const discoveredComponentSchema = z.object({
  path: z.string().describe('Absolute file path to the component'),
  name: z.string().describe('Component name'),
  similarity: z.number().min(0).max(100).describe('Similarity score (0-100)'),
  matchType: z.enum(['name', 'structure', 'visual']).describe('Type of match found'),
  code: z.string().describe('Full source code of the component'),
});

export const generateComponentSchema = z
  .object({
    figmaMetadata: z.string().describe('JSON string containing Figma design metadata (from mcp__figma__get_metadata)'),
    figmaCode: z.string().describe('Generated React code from Figma (from mcp__figma__get_design_context)'),
    componentName: z.string().describe('Suggested name for the component extracted from Figma design'),
    discoveredComponents: z
      .array(discoveredComponentSchema)
      .describe(
        'Array of similar components discovered using Glob/Grep/Read. Pass empty array if no similar components found.',
      ),
    workspacePath: z
      .string()
      .optional()
      .describe('Optional workspace root path. Defaults to the MCP server project directory.'),
  })
  .strict();

export type GenerateComponentInput = z.infer<typeof generateComponentSchema>;

export interface ComponentAnalysisResult {
  action: 'CREATE' | 'EXTEND' | 'REUSE';
  confidence: number;
  matchedComponent?: {
    path: string;
    name: string;
    similarity: number;
  };
  differences?: string[];
  recommendation: string;
  suggestedApproach?: string;
  extendStrategy?: 'composition' | 'props' | 'variant';
}

function analyzeComponent(input: GenerateComponentInput): ComponentAnalysisResult {
  const similarComponents = input.discoveredComponents;

  if (similarComponents.length === 0) {
    return {
      action: 'CREATE',
      confidence: 95,
      recommendation: `No similar components found in the codebase. Will create new component: ${input.componentName}`,
      suggestedApproach: 'Create a new component following StorefrontNext patterns.',
    };
  }

  const topMatch = similarComponents[0];
  const differences = analyzeComponentDifferences(topMatch, input.figmaCode, input.figmaMetadata);
  const decision = determineAction(topMatch, differences);

  return decision;
}

export function generateComponentRecommendation(input: GenerateComponentInput): string {
  try {
    const analysis = analyzeComponent(input);
    const recommendation = formatRecommendation(analysis, input);

    return recommendation;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `# Error: Component Generation Failed\n\n${errorMessage}\n\nPlease check the input parameters and try again.`;
  }
}

export function createGenerateComponentTool(loadServices: () => Services): McpTool {
  return createToolAdapter<GenerateComponentInput, string>(
    {
      name: 'storefront_next_generate_component',
      description:
        'Analyzes Figma design and discovered components to recommend component generation strategy. ' +
        'Workflow: 1) Discover similar components using Glob/Grep/Read tools, ' +
        '2) Call this tool with the discoveredComponents parameter, ' +
        '3) Tool analyzes differences and recommends REUSE/EXTEND/CREATE action, ' +
        '4) Tool provides formatted recommendation with code examples and workflow steps. ' +
        'Call this tool AFTER retrieving Figma design data and discovering similar components.',
      toolsets: ['STOREFRONTNEXT'],
      isGA: false,
      requiresInstance: false,
      inputSchema: generateComponentSchema.shape,
      async execute(args, context) {
        return generateComponentRecommendation({
          ...args,
          workspacePath: args.workspacePath ?? context.services.getWorkingDirectory(),
        });
      },
      formatOutput: (output) => textResult(output),
    },
    loadServices,
  );
}
