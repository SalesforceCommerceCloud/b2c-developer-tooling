/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export interface TypeSuggestion {
  type: string;
  priority: string;
  reason: string;
}

export interface ConfigureAttrsContext {
  totalAttributes: number;
  autoInferredCount: number;
  needsConfigCount: number;
  hasAutoInferred: boolean;
  autoInferredAttrs: Array<{name: string; tsType: string}>;
  hasNeedsConfig: boolean;
  needsConfigAttrs: Array<{
    name: string;
    tsType: string;
    source: string;
    hasSuggestions: boolean;
    suggestions: TypeSuggestion[];
    suggestedTypes: string;
    humanReadableName: string;
    hasEnumSuggestion: boolean;
  }>;
}

export function renderConfigureAttrs(context: ConfigureAttrsContext): string {
  return `# Step 2: Attribute Configuration

## LLM INSTRUCTIONS

### Analysis Complete

Total attributes to configure: ${context.totalAttributes}
Auto-inferred: ${context.autoInferredCount}
Need configuration: ${context.needsConfigCount}

### Next Steps for LLM

**WAIT for user to:**
1. Provide explicit type overrides (if desired)
2. Provide custom names/descriptions (if desired)
3. Provide enum values (if applicable)
4. Or confirm "use defaults"

**THEN** call tool again with step: "configure_regions"

---

# USER-FACING RESPONSE

# Attribute Configuration

${
  context.hasAutoInferred
    ? `## ✅ Auto-Configured Attributes

These attributes will use auto-inferred types (no explicit configuration needed):

${context.autoInferredAttrs.map((attr) => `- **${attr.name}** (${attr.tsType}) → Auto-inferred as Page Designer type`).join('\n')}`
    : ''
}

${
  context.hasNeedsConfig
    ? `## ⚙️ Attributes Needing Configuration

${context.needsConfigAttrs
  .map(
    (attr, index) => `### ${index + 1}. \`${attr.name}\`

- **TypeScript Type**: \`${attr.tsType}\`
- **Source**: ${attr.source}

${
  attr.hasSuggestions
    ? `**Recommendations**:

${attr.suggestions.map((s) => `- **${s.type}** (${s.priority} priority): ${s.reason}`).join('\n')}`
    : ''
}

**Questions**:
- What Page Designer type should this be? (${attr.suggestedTypes})
- Custom display name? (default: "${attr.humanReadableName}")
- Default value?
${attr.hasEnumSuggestion ? '- Enum values? (e.g., ["option1", "option2", "option3"])' : ''}`,
  )
  .join('\n\n')}`
    : ''
}

---

**Please provide configuration for attributes that need it, or say "use defaults" to proceed.**`;
}
