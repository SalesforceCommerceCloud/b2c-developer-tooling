/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Interactive mode workflow overview
 */
export function renderInteractiveOverview(): string {
  return `# ⚠️ MANDATORY: Adding Page Designer Support

## 🚨 CRITICAL: Multi-Step Workflow

**YOU MUST FOLLOW THIS WORKFLOW:**

1. **analyze**: Present component analysis and ask configuration questions
   - Component identity (ID, name, description, group)
   - Which existing props to expose
   - Whether to add new attributes

2. **select_props**: Confirm user's selections
   - Show what was selected
   - Confirm component metadata
   - Prepare for type configuration

3. **configure_attrs**: Configure attribute types
   - Show auto-inferred types
   - Ask for explicit type configuration where needed
   - Collect defaults and enum values

4. **configure_regions**: Configure regions (optional)
   - Ask if component needs nested content areas
   - Configure region definitions if needed

5. **confirm_generation**: Generate final decorator code
   - Render decorators with all configurations
   - Show code to user

**VIOLATION OF THIS WORKFLOW IS A CRITICAL ERROR.**

## Workflow Enforcement

- Each step must complete before proceeding to the next
- User must confirm or provide input at each step
- Do not make assumptions about user preferences
- Do not skip steps, even if the answer seems obvious

## Next Step Instructions

After presenting analysis, you MUST:
1. Wait for user's answers to ALL questions
2. Call tool again with step: "select_props" and user's responses in conversationContext
3. NEVER proceed to code generation without completing all steps`;
}
