/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export interface AutoModeContext {
  componentName: string;
  file: string;
  componentId: string;
  selectedPropCount: number;
  autoConfigCount: number;
  autoInferredCount: number;
  hasNoSuitableProps: boolean;
  selectedProps: string;
  decoratorCode: string;
  componentGroup: string;
}

export function renderAutoMode(context: AutoModeContext): string {
  return `# Auto Mode - Page Designer Decorator Generation

## LLM INSTRUCTIONS

### Auto Mode Behavior

**Single-Step Execution:**
- NO user interaction required
- NO questions to ask
- Analyze component automatically
- Auto-select all suitable props
- Auto-infer types based on naming patterns
- Generate code immediately

**Auto-Selection Criteria:**
- ✅ Include: Simple props (string, number, boolean)
- ❌ Exclude: Complex types (objects, arrays, functions)
- ❌ Exclude: UI-only props (className, style, etc.)

**Auto-Inference Patterns:**
- \`*Url\`, \`*Link\` → \`url\` type
- \`*Image\`, \`*Icon\` → \`image\` type
- \`is*\`, \`has*\`, \`enable*\`, \`show*\` → \`boolean\` type (default: false)
- \`*Size\` → \`enum\` type (values: ['default', 'primary', 'secondary'])
- \`*Variant\` → \`enum\` type (values: ['default', 'primary', 'secondary'])

**Regions:**
- NOT configured in auto mode
- User must use interactive mode for regions

### Component Analysis Summary

**Component Name**: ${context.componentName}
**File**: ${context.file}
**Component ID**: ${context.componentId}
**Selected Props**: ${context.selectedPropCount}
**Auto-configured**: ${context.autoConfigCount}
**Auto-inferred**: ${context.autoInferredCount}

${
  context.hasNoSuitableProps
    ? `⚠️ **No suitable props found**. The component has only complex or UI-only props.
Consider adding new attributes manually or using interactive mode.`
    : ''
}

---

# USER-FACING RESPONSE

# ✅ Page Designer Decorators Generated (Auto Mode)

## Auto-Configuration Summary

- **Component**: \`${context.componentName}\`
- **Component ID**: \`${context.componentId}\`
- **File**: \`${context.file}\`
- **Selected Props**: ${context.selectedProps}
- **Auto-configured**: ${context.autoConfigCount}
- **Auto-inferred**: ${context.autoInferredCount}

${
  context.hasNoSuitableProps
    ? `⚠️ **No suitable props found**. The component has only complex or UI-only props.
Consider adding new attributes manually or using interactive mode.`
    : ''
}

## Generated Code

Add this metadata class to your component file:

\`\`\`typescript
${context.decoratorCode}
\`\`\`

## Next Steps

1. **Add the code** to \`${context.file}\` (after imports, before component)
2. **Update component props** to make them optional and add type unions as needed
3. **Generate metadata**: Run \`sfnext generate-cartridge --project-directory .\`
4. **Deploy cartridge**: Run \`sfnext deploy-cartridge --project-directory .\`
5. **Verify in Business Manager**: Check Components > ${context.componentGroup} > ${context.componentName}`;
}
