/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export interface ConfigureRegionsContext {
  componentName: string;
}

export function renderConfigureRegions(context: ConfigureRegionsContext): string {
  return `# Step 3: Region Configuration

## LLM INSTRUCTIONS

### 🚨 CRITICAL: Ask User About Regions

**YOU MUST:**
1. Ask user if component needs regions for nested content
2. If YES, ask for region configurations:
   - Region ID (e.g., "main", "sidebar", "footer")
   - Region name (display name)
   - Description (optional)
   - Max components (optional)
   - Component type filters (optional)
3. Wait for user response
4. THEN call tool again with step: "confirm_generation" and regionConfig filled

### Region Context

Regions allow business users to nest other components inside this component.
Examples: Hero with content slots, Layout containers, Section wrappers

---

# USER-FACING RESPONSE

# Step 3: Region Configuration

**Component**: ${context.componentName}

## About Regions

Regions define areas where business users can insert other components in Page Designer.
Use regions for:
- Layout containers (e.g., grid, flex layouts)
- Content areas with multiple components
- Sections that need nested content

**Does this component need regions for nested content?**

Examples:
- ✅ **YES** for: Layout, Container, Section, Grid
- ❌ **NO** for: Button, Image, Text, ProductCarousel

---

**Please answer:**
1. Does this component need regions? (yes/no)
2. If yes, provide region configuration(s)

**Region Configuration Example:**
\`\`\`
- id: "main"
  name: "Main Content"
  description: "Primary content area"
  maxComponents: 10
\`\`\``;
}
