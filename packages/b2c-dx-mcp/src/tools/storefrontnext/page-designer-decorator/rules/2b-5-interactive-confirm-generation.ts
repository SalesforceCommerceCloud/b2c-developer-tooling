/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export interface ConfirmGenerationContext {
  decoratorCode: string;
  componentName: string;
  componentId: string;
  componentGroup: string;
  file: string;
  attributeCount: number;
  hasRegions: boolean;
  regionCount?: number;
}

export function renderConfirmGeneration(context: ConfirmGenerationContext): string {
  return `# Step 5: Code Generation

## LLM INSTRUCTIONS

### Purpose
Present the generated Page Designer decorator code and next steps.

### Context Provided
- Complete generated metadata class with decorators
- Component name, ID, group
- File path, attribute count, region info

### Next Actions
1. Show the generated code
2. Provide clear next steps for deployment
3. Optionally offer to add code to the file

---

# USER-FACING RESPONSE

# ✅ Page Designer Decorators Generated

## Generated Code

Add this metadata class to \`${context.file}\`:

\`\`\`typescript
${context.decoratorCode}
\`\`\`

## Summary

- **Component**: ${context.componentName}
- **Component ID**: \`${context.componentId}\`
- **Group**: \`${context.componentGroup}\`
- **Attributes**: ${context.attributeCount}
${context.hasRegions ? `- **Regions**: ${context.regionCount} configured` : ''}

## Next Steps

### 1. Add the Code

Add the generated metadata class to \`${context.file}\`:
- Place it **after imports**
- Place it **before the component definition**

### 2. Update Component Props (if needed)

Make decorated props optional in your component interface:

\`\`\`typescript
interface ${context.componentName}Props {
    title?: string;  // Add ? if attribute is not required
    // ... other props
}
\`\`\`

### 3. Generate Cartridge Metadata

\`\`\`bash
cd packages/template-retail-rsc-app
pnpm sfnext generate-cartridge --project-directory .
\`\`\`

This creates JSON files in \`cartridges/app_storefrontnext_base/cartridge/experience/components/\`.

### 4. Deploy Cartridge

\`\`\`bash
pnpm sfnext deploy-cartridge --project-directory .
\`\`\`

### 5. Verify in Business Manager

1. Log into Business Manager
2. Navigate to: **Merchant Tools > Site > Page Designer**
3. Find your component: **Components > ${context.componentGroup} > ${context.componentName}**
4. Verify all attributes appear correctly
5. Test editing a page with your component

---

**Would you like me to add this code to your component file?**`;
}
