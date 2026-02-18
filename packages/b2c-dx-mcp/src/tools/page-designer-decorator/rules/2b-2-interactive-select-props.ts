/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export interface NewAttribute {
  name: string;
  description?: string;
  required?: boolean;
}

export interface SelectPropsContext {
  componentMetadata: {
    id: string;
    name: string;
    description: string;
    group?: string;
  };
  selectedProps: string[];
  newAttributes: NewAttribute[];
  selectedPropsCount: number;
  newAttributesCount: number;
  totalAttributeCount: number;
  hasSelectedProps: boolean;
  hasNewAttributes: boolean;
}

export function renderSelectPropsConfirmation(context: SelectPropsContext): string {
  return `# Step 2: Selection Confirmation

## LLM INSTRUCTIONS

### Purpose
Present a clear confirmation of the user's selections from Step 1 (analyze).

### Context Provided
- Component identity (id, name, description, group)
- Array of selected existing prop names
- Array of new attributes to add
- Counts and flags

### Next Actions
After showing confirmation, instruct user to confirm proceeding to type configuration.

---

# USER-FACING RESPONSE

# ✅ Selection Confirmed

## Component Configuration

- **ID**: \`${context.componentMetadata.id}\`
- **Name**: "${context.componentMetadata.name}"
- **Description**: "${context.componentMetadata.description}"
- **Group**: \`${context.componentMetadata.group || 'odyssey_base'}\`

${
  context.hasSelectedProps
    ? `## 📋 Selected Existing Props (${context.selectedPropsCount})

${context.selectedProps.map((prop) => `- \`${prop}\``).join('\n')}`
    : `## 📋 Selected Existing Props

None selected.`
}

${
  context.hasNewAttributes
    ? `## ➕ New Attributes to Add (${context.newAttributesCount})

${context.newAttributes.map((attr) => `- \`${attr.name}\`${attr.description ? ` - ${attr.description}` : ''}${attr.required ? ' (required)' : ''}`).join('\n')}`
    : `## ➕ New Attributes to Add

None requested.`
}

---

## 🎯 Next Step: Attribute Configuration

Now I'll analyze the types for these ${context.totalAttributeCount} attribute(s) and help you configure them for Page Designer.

**Please confirm**: Ready to proceed with type configuration? (Say "yes" or "proceed")`;
}
