/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Figma-to-component workflow orchestrator tool.
 *
 * Parses Figma URLs, loads workflow instructions, and returns step-by-step guidance
 * for converting Figma designs to Storefront Next components.
 *
 * @module tools/storefrontnext/figma/figma-to-component
 */

import {z} from 'zod';
import {readFileSync, existsSync} from 'node:fs';
import type {McpTool} from '../../../../utils/index.js';
import type {Services} from '../../../../services.js';
import {createToolAdapter, textResult} from '../../../adapter.js';
import {parseFigmaUrl, type FigmaParams} from './figma-url-parser.js';

// prettier-ignore
const DEFAULT_WORKFLOW_CONTENT = `---
description: Figma to StorefrontNext component conversion workflow
taskType: component
---
# Figma to StorefrontNext Component Workflow

IMPORTANT: The figma_to_component tool is a WORKFLOW ORCHESTRATOR that provides instructions only. It does NOT fetch design data or generate components.

After calling figma_to_component, you MUST:
1. Call Figma MCP tools to fetch design data
2. Discover similar components using Glob/Grep/Read
3. Call generate-component tool for REUSE/EXTEND/CREATE recommendation
4. Call map-tokens tool for token mapping
5. Implement the recommended approach

DO NOT STOP after receiving workflow instructions. Execute all steps to complete the conversion.

## WORKFLOW_GUIDELINES

### Overview
This workflow guides through converting a Figma design into a StorefrontNext-compliant component.

### Key Principles
1. Review workflow plan and list out todos to user before fetching designs
2. ALWAYS fetch design context and visual reference from Figma MCP tools first. Do not attempt to generate code without retrieving at minimum the design context and screenshot. Metadata is optional
2a. **NEVER pass dirForAssetWrites on the initial get_design_context call.** Call it first WITHOUT that parameter to inspect the response. Only pass dirForAssetWrites after the user has explicitly approved image export.
2b. **MANDATORY GATE - Image export requires user approval:** Do NOT call get_design_context with dirForAssetWrites for ANY node until you have: (1) identified all image-containing nodes, (2) presented the list to the user, (3) asked "Should I export these N image assets now? (yes/no)", and (4) received an explicit "yes". Do NOT export images automatically.
2c. **Single prompt per batch:** Ask ONCE for the entire batch of image nodes. After the user says "yes", export all of them (via one or more get_design_context calls with dirForAssetWrites). Do NOT prompt again for each individual image.
3. Only call the Figma MCP tools listed in this workflow. If a tool is not available or not enabled, inform the user
4. ALWAYS discover similar components before creating new ones. Use Glob/Grep/Read to search the codebase
5. ALWAYS call generate-component tool with discovered components to get REUSE/EXTEND/CREATE recommendation
6. ALWAYS call map-tokens tool to map Figma tokens to existing theme variables rather than hardcoding values
7. Follow StorefrontNext patterns. All components must adhere to StorefrontNext architecture
8. Present a detailed plan to the user and wait for approval before implementing
9. Validate thoroughly. Always run validation checks before presenting the final component to the developer

### Figma MCP Tools
When calling these tools, always include: clientLanguages="typescript", clientFrameworks="react"
- mcp__figma__get_design_context (REQUIRED): Generates UI code and returns asset URLs. **Initial call: do NOT pass dirForAssetWrites.** Call first without it to inspect the response. Only pass dirForAssetWrites after user has approved export (see Image and Asset Export below).
- mcp__figma__get_screenshot (REQUIRED): Provides visual reference of the design
- mcp__figma__get_metadata (REQUIRED when node is a section): Retrieves node hierarchy, layer types, names, positions, and sizes. Use when get_design_context returns sparse metadata (section nodes do not export assets)

### Image and Asset Export (REQUIRED)
**MANDATORY GATE: Do not call get_design_context with dirForAssetWrites until the user has approved. You MUST ask ONCE for the entire batch—never prompt per image.**

Section nodes return sparse metadata and do NOT export images. You MUST:

1. **Initial probe (no export)**: Call get_design_context WITHOUT dirForAssetWrites first. Never pass dirForAssetWrites on the first call.
2. **Detect sparse response**: If get_design_context returns "sparse metadata" or "section node", call get_metadata with the same nodeId to retrieve the XML with child node IDs
3. **Identify image-containing nodes**: From the metadata XML (or from the initial response if it's a leaf with images), find nodes that contain images. Include: RECTANGLE with fills; nodes named with image-like names (e.g., photo, image, banner, hero); logos and brand assets (nodes named "logo", "Logo", "brand", "icon", "header", "footer", or similar); vector/component instances that represent logos or icons; frames that visually contain photos/illustrations; any node the screenshot suggests contains a logo or brand asset
4. **STOP and ask for approval (MANDATORY)**: Present the list of identified nodes (names and node IDs) to the user. Ask explicitly: "I found N image-containing nodes. Should I export these assets now? (yes/no)". STOP and wait for the user to respond. Do NOT call get_design_context with dirForAssetWrites for any node until the user confirms "yes". If you proceed without user confirmation, you have violated this workflow
5. **Download image nodes** (ONLY after user says "yes"): For each identified image-containing node, call get_design_context with:
   - nodeId: the node ID from metadata or initial selection (e.g., "3351:1234")
   - dirForAssetWrites: absolute path to the project's public images folder (e.g., \`{workspace}/packages/template-retail-rsc-app/public/images/figma-exports\`)
6. **Track downloaded assets**: Note which exported file path corresponds to which node/component (e.g., hero banner → hero-banner.webp, logo → nettle-logo.webp, category card 1 → infused-beverages.webp)
7. **Set image URLs in implementation**: When implementing the component, use the downloaded file paths for any img src or imageUrl props. Replace placeholder paths with the actual exported asset paths (e.g., \`/images/figma-exports/hero-banner.webp\`)

### StorefrontNext MCP Tools (REQUIRED)
- generate-component: Analyzes Figma design and discovered components, recommends REUSE/EXTEND/CREATE strategy. MUST be called with discoveredComponents parameter
- map-tokens: Maps Figma design tokens to existing theme tokens. MUST be called to avoid hardcoded values
- validate_component: Validates component against StorefrontNext patterns (optional, not yet implemented)

### AI-Driven Component Discovery (Before calling generate-component)
Before calling generate-component, you must discover similar components using your tools:

**Discovery Strategy:**
1. **Name-Based Search (Primary):**
   - Use Glob to find component files: \`**/components/**/*.tsx\`, \`**/src/**/*.tsx\`
   - Exclude: \`**/node_modules/**\`, \`**/dist/**\`, \`**/*.test.tsx\`, \`**/*.stories.tsx\`
   - Use Grep to search for component names similar to the Figma component name
   - Look in: export statements, function names, interface names

2. **Structure-Based Search (Secondary):**
   - If name search yields poor results, search by code structure
   - Look for similar hooks (useState, useEffect, etc.)
   - Look for similar element patterns (buttons, forms, layouts)
   - Search for 'use client' directive if Figma code is client-side

3. **Read and Score Components:**
   - Read each promising match
   - Score similarity (0-100) based on:
     * Name similarity: How close is the name?
     * Purpose similarity: Does it serve the same function?
     * Structure similarity: Similar JSX structure, hooks, props?
     * Styling similarity: Similar Tailwind classes or theme usage?
   - Assign match type: 'name', 'structure', or 'visual'

4. **Select Top Matches:**
   - Select top 1-3 matches with similarity >= 50%
   - Sort by similarity score (highest first)
   - If no matches found, pass empty array to generate-component

**Discovery Tips:**
- Be semantic: "PrimaryButton" and "CallToAction" might serve the same purpose
- Consider component purpose and context, not just file names
- Check common directories first: components/ui/, components/shared/
- Read component code to understand structure, props, and behavior
- Trust your judgment using React patterns knowledge

### Component Requirements
- Use React Server Components (RSC) pattern by default
- Use Tailwind CSS classes with theme tokens, no inline styles or hardcoded values
- Follow TypeScript strict mode conventions
- Include proper accessibility attributes
- Follow existing file naming conventions
- Use absolute imports from '@/components', '@/lib', etc.

## General Development Guidelines

### Core Principles
- Thoroughly analyze requests and the existing project for successful implementation
- Promptly clarify ambiguous requirements

### Development Workflow
- **Analyze Requirements** - Clearly define the objectives and functionalities required
- **Review Existing Code** - Examine the current codebase to identify similar solutions and potentially reusable components
- **Understand Existing Hooks and Utilities** - Familiarize with hooks and utility functions available within the project
- **Plan Implementation** - Design component structure before coding
- **Implement Incrementally** - Develop and test the service in small, manageable steps
- **Test Thoroughly** - Ensure comprehensive testing

### After Generation
- Present the component code to the developer for review
- Provide file path suggestions based on component type
- Highlight any design tokens that don't have existing mappings
- List any validation warnings or suggestions

## WORKFLOW_STEPS

**Create and present to the user a task plan that reflects these steps while keeping the Workflow Guidelines in mind. Wait for approval before proceeding.**

1. REQUIRED: Retrieve design context using mcp__figma__get_design_context with fileKey and nodeId. **Do NOT pass dirForAssetWrites on this initial call.** If the response is sparse (section node): call get_metadata, identify image-containing nodes, then STOP and ask the user "Should I export these N image assets now? (yes/no)". WAIT for user to respond. Only after user says "yes", call get_design_context for each image-containing node with dirForAssetWrites
2. REQUIRED: Retrieve visual reference using mcp__figma__get_screenshot with the provided fileKey and nodeId
3. REQUIRED when sparse: If get_design_context returns sparse metadata (section node), call mcp__figma__get_metadata to get child node IDs, identify image-containing nodes, then STOP and ask user for approval. Do NOT call get_design_context with dirForAssetWrites until user confirms "yes"
4. REQUIRED: Discover similar components in the codebase:
   - Use Glob to find component files in common directories
   - Use Grep to search for components with similar names or structure
   - Use Read to examine promising matches
   - Score similarity (0-100) and select top 1-3 matches
   - Prepare discoveredComponents array for next step
5. REQUIRED: Analyze component generation strategy using generate-component tool with discovered components. This provides REUSE/EXTEND/CREATE recommendation. Wait for user approval of strategy before code changes
6. REQUIRED: Map Figma design tokens to existing StorefrontNext theme tokens using the map-tokens tool. Extract color, spacing, and other design tokens from Figma data and pass them to this tool for matching
7. OPTIONAL (not implemented): Validate the generated component against StorefrontNext patterns using the validate_component tool
8. REQUIRED: Implement the recommended approach and present the final component code to the developer for review`;

export const figmaToComponentSchema = z
  .object({
    figmaUrl: z
      .string()
      .url()
      .describe('The Figma design URL to convert to a StorefrontNext component. Must include node-id parameter.'),
    workflowFilePath: z
      .string()
      .optional()
      .describe('Optional absolute path to custom workflow .md file. If not provided, uses default built-in workflow.'),
  })
  .strict();

export type FigmaToComponentInput = z.infer<typeof figmaToComponentSchema>;

export interface WorkflowConfig {
  /** YAML frontmatter key-value pairs. Parsed for future use (e.g., taskType-specific behavior). */
  metadata: Record<string, string>;
  content: string;
}

function extractWorkflowContent(content: string): {metadata: Record<string, string>; body: string} {
  const metadata: Record<string, string> = {};
  let body = content;

  const metadataMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (metadataMatch) {
    const metadataText = metadataMatch[1];
    body = metadataMatch[2];

    for (const line of metadataText.split('\n')) {
      const match = line.match(/^(.+?):\s*(.+)$/);
      if (match) {
        metadata[match[1].trim()] = match[2].trim();
      }
    }
  }

  return {metadata, body: body.trim()};
}

function parseWorkflowFile(filePath?: string): WorkflowConfig {
  let fileContent: string;

  if (filePath) {
    if (!existsSync(filePath)) {
      throw new Error(`Workflow file not found: ${filePath}`);
    }
    fileContent = readFileSync(filePath, 'utf8');
  } else {
    fileContent = DEFAULT_WORKFLOW_CONTENT;
  }

  const {metadata, body} = extractWorkflowContent(fileContent);

  return {metadata, content: body};
}

function formatFigmaParams(params: FigmaParams, originalUrl: string): string {
  let section = '## Figma Design Parameters\n\n';
  section += '```json\n';
  section += JSON.stringify(
    {
      fileKey: params.fileKey,
      nodeId: params.nodeId,
      originalUrl,
    },
    null,
    2,
  );
  section += '\n```\n\n';
  section +=
    'IMPORTANT: Use these exact parameters when calling Figma MCP tools. The `clientLanguages` parameter should be set to "typescript" and `clientFrameworks` should be set to "react".\n\n';
  return section;
}

function formatWorkflowContent(content: string): string {
  return `${content}\n\n`;
}

function formatNextStepsReminder(): string {
  return `---
## CRITICAL: Next Steps Required

This tool has provided workflow instructions only. You MUST now execute ALL steps below.

**EXPECTED FINAL OUTPUT:** A recommendation with confidence score from generate_component tool AND a token mapping summary from map_tokens_to_theme tool.

### Step 1: Fetch Figma Design Data (Parallel Calls)
Call these Figma MCP tools with the parameters above:
- \`mcp__figma__get_design_context\` (REQUIRED) - **Do NOT pass dirForAssetWrites on the initial call.** Call first without it to inspect the response. If response is sparse (section node): call get_metadata to get child node IDs, identify image-containing nodes, then STOP and present the list to the user. Ask "Should I export these N image assets now? (yes/no)" and WAIT for user response. Only after user says "yes", call get_design_context per image-containing node with dirForAssetWrites
- \`mcp__figma__get_screenshot\` (REQUIRED) - Get visual reference
- \`mcp__figma__get_metadata\` (REQUIRED when sparse) - Use when get_design_context returns sparse metadata. After identifying image nodes: STOP, present list to user, wait for "yes" before exporting

### Step 2: Discover Similar Components
Use your tools to find existing components:
- Use \`Glob\` to find component files: \`**/components/**/*.tsx\`
- Use \`Grep\` to search for similar names or patterns
- Use \`Read\` to examine promising matches
- Score each match (0-100) based on similarity

### Step 3: Analyze Component Strategy (CRITICAL - DO NOT SKIP)
You MUST call \`generate_component\` tool with:
- figmaMetadata (from step 1, or empty string if not fetched)
- figmaCode (from step 1)
- componentName (extracted from Figma)
- discoveredComponents (from step 2)

This tool returns the recommendation with confidence score that MUST be shown to the user.

### Step 4: Map Design Tokens (CRITICAL - DO NOT SKIP)
You MUST call \`map_tokens_to_theme\` tool with tokens extracted from Figma design.

This tool returns the token mapping summary that MUST be shown to the user.

### Step 5: Implement
After showing the recommendation and token mapping to the user, wait for approval then implement the code changes. Use the downloaded asset paths from Step 1 for any img src or imageUrl props—do not use placeholder paths.

**DO NOT STOP until you have called generate_component AND map_tokens_to_theme and shown their outputs to the user.**
`;
}

function formatErrorResponse(details: string): string {
  let response = `# Error: Invalid Figma URL\n\n${details}\n\n`;
  response += 'Please provide a valid Figma URL in the format:\n';
  response += 'https://figma.com/design/:fileKey/:fileName?node-id=1-2\n\n';
  response += 'Example:\nhttps://figma.com/design/abc123/MyDesign?node-id=1-2\n';
  return response;
}

/**
 * Generates the workflow guide for Figma-to-component conversion.
 *
 * @param figmaUrl - Figma design URL with node-id query parameter
 * @param workflowFilePath - Optional absolute path to custom workflow .md file; uses built-in default if omitted
 * @returns Formatted workflow guide string with Figma parameters and step-by-step instructions, or error message if URL or workflow file is invalid
 */
export function generateWorkflowResponse(figmaUrl: string, workflowFilePath?: string): string {
  let figmaParams: FigmaParams;
  try {
    figmaParams = parseFigmaUrl(figmaUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return formatErrorResponse(errorMessage);
  }

  let workflowConfig: WorkflowConfig;
  try {
    workflowConfig = parseWorkflowFile(workflowFilePath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `# Error: Workflow File Not Found\n\n${errorMessage}\n\nPlease provide a valid workflow file path or omit the parameter to use the default workflow.\n`;
  }

  let response = '# Figma to StorefrontNext Workflow Guide\n\n';
  response += formatFigmaParams(figmaParams, figmaUrl);
  response += formatWorkflowContent(workflowConfig.content);
  response += formatNextStepsReminder();

  return response;
}

/**
 * Creates the storefront_next_figma_to_component_workflow MCP tool.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns MCP tool for workflow orchestration
 */
export function createFigmaToComponentTool(loadServices: () => Services): McpTool {
  return createToolAdapter<FigmaToComponentInput, string>(
    {
      name: 'storefront_next_figma_to_component_workflow',
      description:
        'WORKFLOW ORCHESTRATOR: Call this tool FIRST when converting Figma designs. ' +
        'Parses Figma URL to extract fileKey and nodeId, returns step-by-step workflow instructions ' +
        'and parameters for subsequent tool calls. ' +
        'CRITICAL: This is only the FIRST step. After calling this tool, you MUST continue executing ' +
        'the complete workflow: 1) Call Figma MCP tools, 2) Discover similar components, ' +
        '3) Call generate_component tool, 4) Call map_tokens_to_theme tool, ' +
        '5) Show both outputs to the user then implement the recommended approach.',
      toolsets: ['STOREFRONTNEXT'],
      isGA: false,
      requiresInstance: false,
      inputSchema: figmaToComponentSchema.shape,
      async execute(args) {
        return generateWorkflowResponse(args.figmaUrl, args.workflowFilePath);
      },
      formatOutput: (output) => textResult(output),
    },
    loadServices,
  );
}
