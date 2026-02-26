# Site Theming Tool

Tool for applying colors, fonts, and visual styling to Storefront Next sites with guided questions and automatic WCAG color contrast validation.

## Overview

This tool provides theming guidelines, collects user preferences through structured questions, and validates color combinations for accessibility before implementation. **Call this tool FIRST** when the user requests theming changes—even if they have already provided colors or fonts.

## Key Features

- **Mandatory workflow**: Ensures questions are asked and validation is performed before implementation
- **Automatic WCAG validation**: Validates color contrast when `colorMapping` is provided in `conversationContext.collectedAnswers`
- **Content-driven**: Loads guidance from markdown files in `content/site-theming/`
- **Merge support**: Combines multiple theming files via `fileKey` or `fileKeys`
- **Custom content**: Add custom files via `THEMING_FILES` environment variable

## File Structure

```
site-theming/
├── index.ts           # Main tool implementation
├── theming-store.ts   # Content loading and parsing
└── color-contrast.ts  # WCAG 2.1 contrast calculation and validation
```

Content files (in `packages/b2c-dx-mcp/content/site-theming/`):

- `theming-questions.md` - Questions, critical rules, DO/DON'T guidelines
- `theming-validation.md` - Validation workflow, color/font validation rules
- `theming-accessibility.md` - Accessibility-specific guidance

## Usage

### Workflow

1. **First call**: Call tool with `conversationContext.collectedAnswers` (can be empty `{colors: [], fonts: []}`)
2. **Ask questions**: Tool returns questions—ask user one at a time, collect answers
3. **Validation call**: Construct `colorMapping` from answers, call tool again with `collectedAnswers.colorMapping`
4. **Present findings**: Show validation results (contrast ratios, WCAG status) to user
5. **Wait for confirmation**: Do not implement until user confirms
6. **Implement**: Apply theme changes to `app.css` or project theme files

### Basic Usage

```json
// First call - get guidelines and questions
{
  "name": "storefront_next_site_theming",
  "arguments": {
    "conversationContext": {
      "collectedAnswers": {"colors": [], "fonts": []}
    }
  }
}

// Validation call - after constructing colorMapping
{
  "name": "storefront_next_site_theming",
  "arguments": {
    "conversationContext": {
      "collectedAnswers": {
        "colors": [{"hex": "#635BFF", "type": "primary"}],
        "colorMapping": {
          "lightText": "#000000",
          "lightBackground": "#FFFFFF",
          "buttonText": "#FFFFFF",
          "buttonBackground": "#0A2540"
        }
      }
    }
  }
}
```

### List Available Files

```json
{}
```

Returns list of loaded theming file keys. Use `fileKey` or `fileKeys` to add custom files to the default set.

### Custom Theming Files

Set `THEMING_FILES` environment variable (JSON array of `{key, path}`):

```bash
export THEMING_FILES='[{"key":"custom-theming","path":"path/to/custom-theming.md"}]'
```

Paths are relative to the project directory (from `--project-directory` or `SFCC_PROJECT_DIRECTORY`).

## Architecture

### Content Loading

The tool loads markdown files from `content/site-theming/` at initialization. It parses:

- Workflow steps (## WORKFLOW)
- Validation rules (## VALIDATION)
- Critical guidelines (## CRITICAL)
- DO/DON'T rules (### What TO Change / What NOT to Change)
- Generated questions from guidelines

### Color Contrast Validation

When `colorMapping` is present in `collectedAnswers` (colorMapping alone is sufficient; the colors array is not required), the tool:

1. Derives foreground/background combinations from the mapping
2. Calculates WCAG 2.1 contrast ratios
3. Determines AA/AAA compliance
4. Returns validation results with recommendations for failing combinations

### Merging Guidance

Multiple files are merged: questions are deduplicated by ID, guidelines and rules are concatenated, workflow and validation sections are combined.

## When to Use This Tool

Use this tool when:

- User wants to apply brand colors, fonts, or visual styling to a Storefront Next site
- User has provided colors/fonts and needs validation before implementation
- You need to follow the theming workflow (questions, validation, confirmation)

## Testing

### Automated Tests

```bash
cd packages/b2c-dx-mcp
pnpm run test:agent -- test/tools/storefrontnext/site-theming/
```

The test suite covers tool metadata, behavior, color validation, file merging, edge cases, `color-contrast.ts`, and `theming-store.ts`.

See [`test/tools/storefrontnext/site-theming/README.md`](../../../../test/tools/storefrontnext/site-theming/README.md) for detailed testing instructions and manual test scenarios.

## License

Apache-2.0 - Copyright (c) 2025, Salesforce, Inc.
