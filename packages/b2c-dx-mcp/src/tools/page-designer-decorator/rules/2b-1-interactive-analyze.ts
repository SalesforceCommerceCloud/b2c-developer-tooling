/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export interface PropInfo {
  name: string;
  type: string;
  optional: boolean;
}

export interface AnalyzeStepContext {
  componentName: string;
  file: string;
  hasDecorators: boolean;
  interfaceName?: string;
  totalProps: number;
  exportType: string;
  hasEditableProps: boolean;
  editableProps: PropInfo[];
  hasComplexProps: boolean;
  complexProps: PropInfo[];
  hasUIProps: boolean;
  uiProps: PropInfo[];
  suggestedComponentId: string;
  suggestedComponentName: string;
}

export function renderAnalyzeStep(context: AnalyzeStepContext): string {
  return `# Step 1: Component Analysis

## LLM INSTRUCTIONS

### Component Analysis Results

**Component Name**: ${context.componentName}
**File**: ${context.file}
**Has Decorators**: ${context.hasDecorators ? 'Yes (STOP - already decorated)' : 'No (proceed)'}
**Props Interface**: ${context.interfaceName || 'None found'}
**Total Props**: ${context.totalProps}

${
  context.hasDecorators
    ? `⚠️ **CRITICAL**: Component already has Page Designer decorators.
**ACTION**: Stop here and inform user. Do not proceed with generation.`
    : ''
}

### Next Actions (LLM)

1. Present the analysis to the user
2. Ask all configuration questions (component identity, props selection, new properties)
3. Wait for user's complete response
4. THEN call tool again with step: "select_props" with collected answers

---

# USER-FACING RESPONSE

${
  context.hasDecorators
    ? `# Analysis: ${context.componentName}

✅ **This component already has Page Designer support.**

The component has existing decorators (@Component, @AttributeDefinition, etc.).

Would you like to modify the existing decorators instead?`
    : `# Analysis: ${context.componentName}

## Current State

- **Component**: \`${context.componentName}\`
- **File**: \`${context.file}\`
- **Props Interface**: \`${context.interfaceName || 'None found'}\`
- **Export Type**: ${context.exportType}

## Existing Properties Analysis

${
  context.hasEditableProps
    ? `### ✅ Suitable for Page Designer:

${context.editableProps.map((prop) => `- \`${prop.name}\` (${prop.type})${prop.optional ? ' - optional' : ''}`).join('\n')}`
    : '### ⚠️ No suitable properties found'
}

${
  context.hasComplexProps
    ? `### ⚠️ Complex (needs simplification):

${context.complexProps.map((prop) => `- \`${prop.name}\` (${prop.type}) - Too complex for Page Designer`).join('\n')}

These complex types cannot be used directly. Consider creating simpler alternatives.`
    : ''
}

${
  context.hasUIProps
    ? `### 🎨 UI Props (typically not exposed):

${context.uiProps.map((prop) => `- \`${prop.name}\` (${prop.type})`).join('\n')}

These are styling/layout props, usually not exposed to Page Designer.`
    : ''
}

## Configuration Questions

### 1️⃣ Component Identity

I suggest:
- **ID**: \`${context.suggestedComponentId}\`
- **Name**: "${context.suggestedComponentName}"
- **Description**: *[Please provide a description]*
- **Group**: \`odyssey_base\` (default) or specify custom group

✏️ Are these acceptable, or would you like to change them?

### 2️⃣ Existing Properties

${
  context.hasEditableProps
    ? `**Which properties should be editable in Page Designer?**

${context.editableProps.map((prop) => `- [ ] \`${prop.name}\` - ${prop.type}`).join('\n')}`
    : '⚠️ No existing properties are suitable.'
}

### 3️⃣ New Properties

**Should I add any new properties** that don't exist in the component interface?

Examples:
- Button text, labels, or headings
- Toggle flags (show/hide elements)
- Configuration options

---

**Please answer these questions to proceed.**`
}`;
}
