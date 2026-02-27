/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {ComponentAnalysisResult, GenerateComponentInput} from './index.js';

/**
 * Formats the component generation recommendation for AI/developer.
 *
 * @param analysis - Component analysis result with REUSE/EXTEND/CREATE decision
 * @param input - Original generate-component input (component name, etc.)
 * @returns Formatted markdown string with recommendation, key differences, suggested approach, and next steps
 */
export function formatRecommendation(analysis: ComponentAnalysisResult, input: GenerateComponentInput): string {
  let output = '# Component Generation Recommendation\n\n';

  // Decision and confidence
  output += `**Decision:** ${analysis.action}\n`;
  output += `**Confidence:** ${analysis.confidence}%\n\n`;

  // Matched component (if any)
  if (analysis.matchedComponent) {
    output += `**Matched Component:**\n`;
    output += `- \`${analysis.matchedComponent.name}\` at \`${analysis.matchedComponent.path}\`\n`;
    output += `- Similarity: ${analysis.matchedComponent.similarity}%\n\n`;
  }

  // Recommendation
  output += `**Recommendation:** ${analysis.recommendation}\n\n`;

  // Key differences
  if (analysis.differences && analysis.differences.length > 0) {
    output += `**Key Differences:**\n`;
    for (const [i, diff] of analysis.differences.entries()) {
      output += `${i + 1}. ${diff}\n`;
    }
    output += '\n';
  }

  // Suggested approach
  if (analysis.suggestedApproach) {
    output += `## Suggested Approach\n\n${analysis.suggestedApproach}\n\n`;
  }

  // Next steps
  output += formatNextSteps(analysis, input);

  return output;
}

/**
 * Formats next steps based on action type
 */
function formatNextSteps(analysis: ComponentAnalysisResult, input: GenerateComponentInput): string {
  let section = '## Next Steps\n\n';

  switch (analysis.action) {
    case 'CREATE': {
      section += `Create new component: \`${input.componentName}\`\n\n`;
      section += `**Implementation:**\n`;
      section += `1. Create component file structure (index.tsx, types.ts if needed)\n`;
      section += `2. Convert Figma code to StorefrontNext patterns:\n`;
      section += `   - Use React Server Components by default (add 'use client' if needed)\n`;
      section += `   - Replace inline styles with Tailwind classes\n`;
      section += `   - Map colors/spacing to theme tokens\n`;
      section += `   - Add proper TypeScript types and accessibility attributes\n`;
      section += `3. Export component from index\n`;

      if (analysis.matchedComponent) {
        section += `4. Reference patterns from \`${analysis.matchedComponent.path}\` for consistency\n`;
      }

      section += '\n';
      break;
    }

    case 'EXTEND': {
      const strategy = analysis.extendStrategy || 'props';
      section += `**Strategy:** ${strategy === 'props' ? 'Add new props' : strategy === 'variant' ? 'Add variant' : 'Composition'}\n\n`;
      section += `1. Modify \`${analysis.matchedComponent?.path}\`\n`;

      if (strategy === 'props') {
        section += `2. Add new optional props to the interface\n`;
        section += `3. Implement new prop behavior while maintaining backward compatibility\n`;
      } else if (strategy === 'variant') {
        section += `2. Add new variant to existing variant definitions\n`;
        section += `3. Apply variant styling using theme tokens\n`;
      } else {
        section += `2. Create wrapper component that composes the base component\n`;
        section += `3. Add additional elements/functionality in the wrapper\n`;
      }

      section += `4. Validate: ensure existing usages still work\n\n`;
      break;
    }

    case 'REUSE': {
      section += `Import and use \`${analysis.matchedComponent?.name}\` from \`${analysis.matchedComponent?.path}\`.\n`;
      section += `Customize through props and Tailwind classes to match the Figma design.\n\n`;
      break;
    }
  }

  section += '**Confirm before proceeding with implementation.**\n';

  return section;
}
