/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Map tokens tool for Figma-to-component workflow.
 *
 * Maps Figma design tokens to Storefront Next theme tokens in app.css with exact/fuzzy matching.
 *
 * @module tools/storefrontnext/figma/map-tokens
 */

import {z} from 'zod';
import type {McpTool} from '../../../../utils/index.js';
import type {Services} from '../../../../services.js';
import {createToolAdapter, textResult} from '../../../adapter.js';
import {parseThemeFile} from './css-parser.js';
import {matchTokens, type FigmaToken} from './token-matcher.js';

export const mapTokensToThemeSchema = z
  .object({
    figmaTokens: z
      .array(
        z.object({
          name: z.string().describe('Token name from Figma (e.g., "Primary/Blue", "Spacing/Large")'),
          value: z.string().describe('Token value (e.g., "#2563eb", "16px", "0.5rem")'),
          type: z
            .enum(['color', 'spacing', 'radius', 'opacity', 'fontSize', 'fontFamily', 'other'])
            .describe('Type of the token'),
          description: z.string().optional().describe('Optional description from Figma'),
        }),
      )
      .describe('Array of design tokens extracted from Figma'),
    themeFilePath: z
      .string()
      .optional()
      .describe(
        'Optional absolute path to theme CSS file. If not provided, will search for app.css in common locations.',
      ),
  })
  .strict();

export type MapTokensToThemeInput = z.infer<typeof mapTokensToThemeSchema>;

function formatTokenMatch(match: ReturnType<typeof matchTokens>[0]): string {
  let output = `### ${match.figmaToken.name}\n\n`;
  output += `- **Figma Value**: \`${match.figmaToken.value}\`\n`;
  output += `- **Type**: ${match.figmaToken.type}\n`;

  if (match.figmaToken.description) {
    output += `- **Description**: ${match.figmaToken.description}\n`;
  }

  output += `\n#### Match Result\n\n`;
  output += `- **Match Type**: ${match.matchType}\n`;
  output += `- **Confidence**: ${match.confidence}%\n`;

  if (match.matchedToken) {
    output += `- **Matched Token**: \`${match.matchedToken.name}\`\n`;
    output += `- **Token Value**: \`${match.matchedToken.value}\`\n`;
    output += `- **Resolved Value**: \`${match.matchedToken.resolvedValue || match.matchedToken.value}\`\n`;
    output += `- **Theme**: ${match.matchedToken.theme}\n`;
  }

  output += `- **Reason**: ${match.reason}\n\n`;

  if (match.suggestions && match.suggestions.length > 0) {
    output += `#### Suggestions\n\n`;
    for (const [index, suggestion] of match.suggestions.entries()) {
      output += `${index + 1}. **${suggestion.tokenName}**\n`;
      output += `   - Value: \`${suggestion.value}\`\n`;
      output += `   - Theme: ${suggestion.theme}\n`;
      output += `   - Reason: ${suggestion.reason}\n`;
      if (suggestion.insertAfter) {
        output += `   - Insert after: \`${suggestion.insertAfter}\`\n`;
      }
      output += `\n`;
    }
  }

  return output;
}

function generateSummary(matches: ReturnType<typeof matchTokens>): string {
  const exactMatches = matches.filter((m) => m.matchType === 'exact');
  const fuzzyMatches = matches.filter((m) => m.matchType === 'fuzzy');
  const noMatches = matches.filter((m) => m.matchType === 'none');
  const highConfidence = matches.filter((m) => m.confidence >= 70 && m.matchedToken);
  const lowConfidence = matches.filter((m) => m.confidence < 70 && m.confidence > 0);

  let summary = `## Summary\n\n`;
  summary += `- **Total Tokens**: ${matches.length}\n`;
  summary += `- **Exact Matches**: ${exactMatches.length}\n`;
  summary += `- **Fuzzy Matches**: ${fuzzyMatches.length}\n`;
  summary += `- **No Matches**: ${noMatches.length}\n`;
  summary += `- **High Confidence (≥70%)**: ${highConfidence.length}\n`;
  summary += `- **Low Confidence (<70%)**: ${lowConfidence.length}\n\n`;

  if (exactMatches.length > 0) {
    summary += `### ✅ Exact Matches (Use these tokens directly)\n\n`;
    for (const match of exactMatches) {
      if (match.matchedToken) {
        summary += `- \`${match.figmaToken.name}\` → \`${match.matchedToken.name}\`\n`;
      }
    }
    summary += `\n`;
  }

  if (highConfidence.length > 0) {
    summary += `### ⚠️ High Confidence Fuzzy Matches (Review and confirm)\n\n`;
    for (const match of highConfidence) {
      if (match.matchedToken) {
        summary += `- \`${match.figmaToken.name}\` → \`${match.matchedToken.name}\` (${match.confidence}%)\n`;
      }
    }
    summary += `\n`;
  }

  if (lowConfidence.length > 0) {
    summary += `### ⚠️ Low Confidence Matches (Verify before using)\n\n`;
    for (const match of lowConfidence) {
      if (match.matchedToken) {
        summary += `- \`${match.figmaToken.name}\` → \`${match.matchedToken.name}\` (${match.confidence}%)\n`;
      }
    }
    summary += `\n`;
  }

  if (noMatches.length > 0) {
    summary += `### ❌ No Matches (New tokens needed)\n\n`;
    for (const match of noMatches) {
      summary += `- \`${match.figmaToken.name}\`: ${match.figmaToken.value}\n`;
      if (match.suggestions && match.suggestions.length > 0) {
        summary += `  - Suggested: \`${match.suggestions[0].tokenName}\`\n`;
      }
    }
    summary += `\n`;
  }

  return summary;
}

function generateRecommendations(matches: ReturnType<typeof matchTokens>): string {
  const needsNewTokens = matches.filter((m) => m.matchType === 'none');
  const needsReview = matches.filter((m) => m.matchType === 'fuzzy' && m.confidence < 70);

  if (needsNewTokens.length === 0 && needsReview.length === 0) {
    return `## ✅ Recommendations\n\nAll tokens have been matched with high confidence. You can proceed with using the matched tokens in your component.\n\n`;
  }

  let recommendations = `## 📝 Recommendations\n\n`;

  if (needsNewTokens.length > 0) {
    recommendations += `### Create New Tokens\n\n`;
    recommendations += `The following tokens from Figma don't have matches in your theme. Consider adding them to your \`app.css\` file:\n\n`;

    for (const match of needsNewTokens) {
      if (match.suggestions && match.suggestions.length > 0) {
        const suggestion = match.suggestions[0];
        recommendations += `\`\`\`css\n`;
        recommendations += `/* Add to ${suggestion.theme === 'both' ? ':root and .dark' : suggestion.theme === 'light' ? ':root' : '.dark'} section */\n`;
        recommendations += `${suggestion.tokenName}: ${suggestion.value};\n`;
        recommendations += `\`\`\`\n\n`;
      }
    }
  }

  if (needsReview.length > 0) {
    recommendations += `### Review Low Confidence Matches\n\n`;
    recommendations += `The following matches have confidence below 70%. Please review and confirm they are correct before using:\n\n`;

    for (const match of needsReview) {
      if (match.matchedToken) {
        recommendations += `- **${match.figmaToken.name}** (${match.figmaToken.value})\n`;
        recommendations += `  - Matched: \`${match.matchedToken.name}\` (${match.matchedToken.resolvedValue})\n`;
        recommendations += `  - Confidence: ${match.confidence}%\n`;
        recommendations += `  - Reason: ${match.reason}\n\n`;
      }
    }
  }

  return recommendations;
}

/**
 * Maps Figma design tokens to existing theme tokens in app.css.
 *
 * @param args - Figma tokens array and optional theme file path
 * @param workspaceRoot - Optional workspace root for theme file discovery; used when themeFilePath is not provided
 * @returns Formatted mapping report with exact/fuzzy matches, confidence scores, and usage instructions, or error message on failure
 */
export function mapFigmaTokensToTheme(args: MapTokensToThemeInput, workspaceRoot?: string): string {
  try {
    const parsedTheme = parseThemeFile(args.themeFilePath, workspaceRoot);

    const figmaTokens: FigmaToken[] = args.figmaTokens.map((token) => ({
      name: token.name,
      value: token.value,
      type: token.type,
      description: token.description,
    }));

    const matches = matchTokens(figmaTokens, parsedTheme);

    let response = `# Figma Design Tokens → StorefrontNext Theme Mapping\n\n`;

    if (parsedTheme.warnings.length > 0) {
      response += `## ⚠️ Warnings\n\n`;
      for (const warning of parsedTheme.warnings) {
        response += `- ${warning}\n`;
      }
      response += `\n`;
    }

    response += generateSummary(matches);

    response += `## Detailed Mapping Results\n\n`;
    for (const match of matches) {
      response += formatTokenMatch(match);
    }

    response += generateRecommendations(matches);

    response += `## 💡 Usage Instructions\n\n`;
    response += `### Using Matched Tokens in Components\n\n`;
    response += `For exact and high-confidence matches, use the token directly in your Tailwind classes:\n\n`;
    response += `\`\`\`tsx\n`;
    response += `// Instead of hardcoded colors\n`;
    response += `<div className="bg-[#2563eb]">\n\n`;
    response += `// Use theme tokens\n`;
    response += `<div className="bg-primary">\n`;
    response += `\`\`\`\n\n`;

    response += `### Creating New Tokens\n\n`;
    response += `If you need to add new tokens, add them to your \`app.css\` file in both light and dark theme sections:\n\n`;
    response += `\`\`\`css\n`;
    response += `:root {\n`;
    response += `  --your-new-token: #value;\n`;
    response += `}\n\n`;
    response += `.dark {\n`;
    response += `  --your-new-token: #dark-value;\n`;
    response += `}\n`;
    response += `\`\`\`\n\n`;

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `# Error: Token Mapping Failed\n\n${errorMessage}\n\nPlease ensure the theme file path is correct and accessible.`;
  }
}

/**
 * Creates the storefront_next_map_tokens_to_theme MCP tool.
 *
 * @param loadServices - Function that loads configuration and returns Services instance
 * @returns MCP tool for token mapping
 */
export function createMapTokensToThemeTool(loadServices: () => Services): McpTool {
  return createToolAdapter<MapTokensToThemeInput, string>(
    {
      name: 'storefront_next_map_tokens_to_theme',
      description:
        'Maps Figma design tokens to existing StorefrontNext theme tokens in app.css. ' +
        'Analyzes Figma design tokens (colors, spacing, radius, etc.) and finds exact matches, ' +
        'provides fuzzy matches with confidence scores, suggests new token names for unmatched values, ' +
        'and recommends where to add new tokens in the CSS file. ' +
        'Use this tool after retrieving design variables from Figma MCP to ensure components use theme tokens instead of hardcoded values.',
      toolsets: ['STOREFRONTNEXT'],
      isGA: false,
      requiresInstance: false,
      inputSchema: mapTokensToThemeSchema.shape,
      async execute(args, context) {
        return mapFigmaTokensToTheme(args, context.services.resolveWithProjectDirectory());
      },
      formatOutput: (output) => textResult(output),
    },
    loadServices,
  );
}
