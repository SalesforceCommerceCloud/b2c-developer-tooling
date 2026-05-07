---
description: Get theming guidelines, guided questions, and WCAG color contrast validation for Storefront Next.
---

# sfnext_configure_theme

Guides theming changes (colors, fonts, visual styling) for Storefront Next and validates color combinations for WCAG accessibility.

> **Note:** 🚧 This MCP tool is for Storefront Next. Storefront Next is part of a closed pilot and isn't available for general use.

## Overview

The `sfnext_configure_theme` tool provides a structured workflow for applying theming to Storefront Next sites:

1. **Guidelines** - Layout preservation rules, specification compliance, and accessibility requirements
2. **Guided Questions** - Collects user preferences (colors, fonts, mappings) one at a time
3. **WCAG Validation** - Automatically validates color contrast when `colorMapping` is provided

The tool guides you through a structured workflow: answer questions about your design preferences → validate colors for accessibility → review findings → apply theme changes.

## Prerequisites

- Storefront Next project

## Custom Theming Files

Add custom theming guidance files by setting the `THEMING_FILES` environment variable. The value is a JSON array of `{key, path}` objects. Paths are resolved relative to the project directory (absolute paths also supported). Custom files are loaded when `sfnext_configure_theme` initializes for the project and are available via the `fileKeys` parameter.

Use this only when you need project-specific guidance (for example, brand rules or design-system constraints). If the default files are sufficient, you can skip `THEMING_FILES`.

**In `.env` file (recommended):**

```bash
THEMING_FILES='[{"key":"brand-guidelines","path":"docs/brand-guidelines.md"}]'
```

**In MCP client `env` object:**

```json
{
  "env": {
    "THEMING_FILES": "[{\"key\":\"brand-guidelines\",\"path\":\"docs/brand-guidelines.md\"}]"
  }
}
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileKeys` | string[] | No | File keys to add to the default set. Custom keys are merged with defaults: `theming-questions`, `theming-validation`, `theming-accessibility`. |
| `conversationContext` | object | No | Context from previous rounds. Omit to list available files. See [Conversation Context](#conversation-context) for details. |

### Conversation Context

When using the tool across multiple turns, provide `conversationContext` with the following structure:

| Field | Type | Description |
|-------|------|-------------|
| `currentStep` | `"updating-information"` \| `"validation"` | Current step in the workflow |
| `collectedAnswers` | object | Previously collected answers. Include `colorMapping` to trigger automatic WCAG validation. |
| `questionsAsked` | string[] | List of question IDs already asked |

**collectedAnswers** can include:

| Field | Type | Description |
|-------|------|-------------|
| `colors` | object[] | Extracted colors with `hex` and optional `type` |
| `fonts` | object[] | Extracted fonts with `name` and optional `type` |
| `colorMapping` | object | Maps color keys to hex values (for example, `lightText`, `lightBackground`, `buttonText`, `buttonBackground`). **Providing this triggers automatic WCAG contrast validation.** |

## Workflow

The tool guides you through a structured workflow:

1. **Information Gathering** - Answer questions about your brand colors, fonts, and design preferences
2. **Validation** - Automatic WCAG accessibility validation of color combinations
3. **Implementation** - Apply theme changes to your `app.css` file

## Usage Examples

Use natural language prompts to interact with the tool:

**Start theming:**
```
I want to apply my brand colors to my Storefront Next site. Use the MCP tool to help me.
```

**Provide colors upfront:**
```
Use these colors: #635BFF (accent), #0A2540 (dark), #F6F9FC (brand), #FFFFFF (light). Use the MCP tool to guide me through theming.
```

**Specify fonts:**
```
I want to use Inter for body text and Playfair Display for headings. Use the MCP tool to help me theme my site.
```

**Validate colors for accessibility:**
```
I have a color scheme ready. Use the MCP tool to validate my colors for accessibility before I implement.
```

**Change existing theme:**
```
I want to change my site theme. Use the MCP tool to walk me through the process.
```


## Output

The tool returns guidance and questions, or validation results when color mappings are provided. Validation includes contrast ratios, WCAG compliance status (AA/AAA), and recommendations for accessibility improvements.

## Related Tools

- Part of the [STOREFRONTNEXT](../toolsets#storefrontnext) toolset
- Auto-enabled for Storefront Next projects

## See Also

- [STOREFRONTNEXT Toolset](../toolsets#storefrontnext) - Overview of Storefront Next development tools
- [Storefront Next Guide](../../guide/storefront-next) - Storefront Next development guide
- [Configuration](../configuration) - Configure project directory
