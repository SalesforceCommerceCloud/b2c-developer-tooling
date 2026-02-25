/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Mode selection rule - Entry point for Page Designer decorator tool
 */
export interface ModeSelectionContext {
  componentName: string;
  file: string;
}

export function renderModeSelection(context: ModeSelectionContext): string {
  return `# 🎯 Choose Page Designer Setup Mode

I need to know which mode you'd like to use for adding Page Designer support to **\`${context.componentName}\`**.

## Available Modes

### 🤖 Auto Mode (Quick & Automatic)
- **Best for**: Quick setup, standard components, batch processing
- **What happens**: 
  - Automatically analyzes the component
  - Auto-selects suitable props (excludes complex types)
  - Auto-infers types based on naming patterns
  - Generates decorators immediately with sensible defaults
  - **No confirmation needed** - code generated instantly
- **Time**: ~1 step
- **Control**: Low (uses smart defaults)

### 👤 Interactive Mode (Step-by-Step)
- **Best for**: Complex components, custom requirements, learning the process
- **What happens**:
  - Multi-step workflow with your input at each stage
  - Review and approve prop selections
  - Configure attribute types, names, and defaults
  - Configure regions for nested content (optional)
  - **Requires confirmation** before generating code
- **Time**: ~4-5 steps
- **Control**: High (you decide everything)

## ⚡ How to Proceed

**⚠️ IMPORTANT: WAIT for the user to choose a mode. DO NOT proceed automatically.**

Please ask the user: **"Which mode would you like to use: Auto Mode or Interactive Mode?"**

Once the user responds:

**For Auto Mode**, call the tool again with:
\`\`\`json
{
  "file": "${context.file}",
  "autoMode": true
}
\`\`\`

**For Interactive Mode**, call the tool again with:
\`\`\`json
{
  "file": "${context.file}",
  "conversationContext": {
    "step": "analyze"
  }
}
\`\`\`

---

💡 **Tip**: If unsure, try **Auto Mode** first. You can always modify the generated decorators later or rerun in Interactive Mode for more control.`;
}
