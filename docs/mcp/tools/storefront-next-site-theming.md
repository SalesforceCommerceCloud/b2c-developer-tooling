---
description: Get theming guidelines, guided questions, and WCAG color contrast validation for Storefront Next.
---

# storefront_next_site_theming

Guides theming changes (colors, fonts, visual styling) for Storefront Next and validates color combinations for WCAG accessibility. **Call this tool first** when the user wants to apply brand colors or change the site theme.

## Overview

The `storefront_next_site_theming` tool provides a structured workflow for applying theming to Storefront Next sites:

1. **Guidelines** - Layout preservation rules, specification compliance, and accessibility requirements
2. **Guided Questions** - Collects user preferences (colors, fonts, mappings) one at a time
3. **WCAG Validation** - Automatically validates color contrast when `colorMapping` is provided

The tool enforces a mandatory workflow: ask questions → validate colors → present findings → wait for confirmation → implement. Never implement theming changes without calling this tool first.

## Authentication

No authentication required. This tool operates on local content and returns guidance text.

**Requirements:**
- `--allow-non-ga-tools` flag (preview release)
- Storefront Next project (for implementation; tool itself works without project)

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileKey` | string | No | Single theming file key to add to the default set. Custom keys are merged with defaults: `theming-questions`, `theming-validation`, `theming-accessibility`. |
| `fileKeys` | string[] | No | Multiple file keys to add to the default set. Takes precedence over `fileKey` if both provided. |
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

## Operation Modes

### List Available Files

Call the tool without `conversationContext` (and without `fileKey` or `fileKeys`) to list loaded theming file keys:

```json
{}
```

Returns the list of available keys. Default files are always used when `conversationContext` is provided.

### Theming Workflow

When `conversationContext` is provided, the tool returns guidelines and questions, or validation results when `colorMapping` is included.

## Workflow

### Phase 1: Information Gathering

1. **First call** - Call the tool with `conversationContext.collectedAnswers` (can be empty `{colors: [], fonts: []}`)
2. **Extract** - If the user provided colors/fonts in their message, extract and include in `collectedAnswers`
3. **Ask questions** - Tool returns questions; ask the user one at a time and collect answers
4. **Update** - Call the tool again with updated `collectedAnswers` after each user response

### Phase 2: Validation (Mandatory)

1. **Construct colorMapping** - Map each color to its usage (text, buttons, links, accents) based on user answers
2. **Validation call** - Call the tool with `collectedAnswers.colorMapping` to trigger automatic WCAG validation
3. **Present findings** - Show contrast ratios, WCAG status (AA/AAA/FAIL), and recommendations to the user
4. **Wait for confirmation** - Do not implement until the user explicitly confirms

### Phase 3: Implementation

Only after completing Phases 1 and 2 may you apply theme changes to `app.css` (or project theme files).

## Usage Examples

### First Call - Get Guidelines and Questions

```
I want to apply my brand colors to my Storefront Next site. Use the MCP tool to help me.
```

**Example arguments:**

```json
{
  "conversationContext": {
    "collectedAnswers": {"colors": [], "fonts": []}
  }
}
```

### Validation Call - After Constructing colorMapping

After collecting user answers, construct the color mapping and call the tool to validate.

**Example arguments:**

```json
{
  "conversationContext": {
    "collectedAnswers": {
      "colorMapping": {
        "lightText": "#000000",
        "lightBackground": "#FFFFFF",
        "buttonText": "#FFFFFF",
        "buttonBackground": "#0A2540"
      }
    }
  }
}
```

### With Pre-Provided Colors

When the user provides colors upfront, extract and include them:

```
Use these colors: #635BFF (accent), #0A2540 (dark), #F6F9FC (brand), #FFFFFF (light). Use the MCP tool to guide me through theming.
```

**Example arguments:**

```json
{
  "conversationContext": {
    "collectedAnswers": {
      "colors": [
        {"hex": "#635BFF", "type": "accent"},
        {"hex": "#0A2540", "type": "dark"},
        {"hex": "#F6F9FC", "type": "brand"},
        {"hex": "#FFFFFF", "type": "light"}
      ]
    }
  }
}
```

## Rules and Constraints

- `colorMapping` triggers automatic WCAG validation; `colors` and `fonts` arrays are optional when `colorMapping` is provided
- `fileKey` and `fileKeys` add to the default files; they do not replace them
- Call the tool first before implementing any theming changes; never skip the question-answer or validation workflow
- Theme changes apply to `app.css` (standalone: `src/app.css`; monorepo: `packages/template-retail-rsc-app/src/app.css`)

## Output

The tool returns text content that includes:

- **Internal instructions** - Workflow steps, critical rules, validation requirements
- **User-facing response** - What to say to the user, questions to ask
- **Validation results** (when `colorMapping` provided) - Contrast ratios, WCAG compliance status, recommendations for failing combinations

## Requirements

- `--allow-non-ga-tools` flag (preview release)
- Storefront Next project (for applying theme changes to `app.css`)

## Features

- **Mandatory workflow** - Ensures questions are asked and validation is performed before implementation
- **Automatic WCAG validation** - Validates color contrast when `colorMapping` is provided
- **Content-driven** - Loads guidance from markdown files (`theming-questions`, `theming-validation`, `theming-accessibility`)
- **Layout preservation** - Guidelines enforce that only colors, typography, and visual styling change—never layout or positioning

## Related Tools

- Part of the [STOREFRONTNEXT](../toolsets#storefrontnext) toolset
- Auto-enabled for Storefront Next projects (with `--allow-non-ga-tools`)
- Related: [`storefront_next_development_guidelines`](../toolsets#storefrontnext) - Architecture and coding guidelines

## See Also

- [STOREFRONTNEXT Toolset](../toolsets#storefrontnext) - Overview of Storefront Next development tools
- [Storefront Next Guide](../../guide/storefront-next) - Storefront Next development guide
- [Configuration](../configuration) - Configure project directory
