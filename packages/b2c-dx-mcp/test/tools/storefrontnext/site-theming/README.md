# Testing Site Theming Tool

## Test Status

The site-theming tool has comprehensive unit tests covering:

- **Tool metadata**: Name, description, toolsets, inputSchema
- **Tool behavior**: List files, retrieve guidance, error handling, question filtering
- **Color validation**: Automated WCAG contrast validation when `colorMapping` is provided
- **File merging**: `fileKeys` array, `fileKey` with defaults, missing file errors
- **Edge cases**: Ready to Implement flow, validation summary for failing contrast
- **color-contrast.ts**: Luminance, contrast ratio, WCAG levels, validateContrast, formatValidationResult
- **theming-store.ts**: Initialize, loadFile, get/getKeys, THEMING_FILES env, workflow/validation parsing

All tests use the standard Mocha test framework and run with `pnpm test`.

## Testing Approaches

### 1. Unit Tests (Automated)

Run the test suite:

```bash
cd packages/b2c-dx-mcp
pnpm run test:agent -- test/tools/storefrontnext/site-theming/
```

### 2. MCP Inspector (Interactive Testing)

Use the MCP Inspector to test the tool interactively:

```bash
cd packages/b2c-dx-mcp
pnpm run inspect:dev
```

Then in the inspector:

1. Click **Connect**
2. Click **List Tools** - you should see `storefront_next_site_theming`
3. Click on the tool to test it with real inputs

### 3. CLI Testing

Test via command line:

```bash
# List all tools (should include storefront_next_site_theming)
npx mcp-inspector --cli node bin/dev.js --toolsets STOREFRONTNEXT --allow-non-ga-tools --method tools/list

# Call the tool - list available files
npx mcp-inspector --cli node bin/dev.js --toolsets STOREFRONTNEXT --allow-non-ga-tools \
  --method tools/call \
  --tool-name storefront_next_site_theming \
  --args '{}'

# Call with conversation context - get guidelines and questions
npx mcp-inspector --cli node bin/dev.js --toolsets STOREFRONTNEXT --allow-non-ga-tools \
  --method tools/call \
  --tool-name storefront_next_site_theming \
  --args '{"conversationContext":{"collectedAnswers":{"colors":[],"fonts":[]}}}'
```

### 4. Manual Test Scenarios

#### List Available Files

```json
{}
```

Expected: Returns list of available theming files (theming-questions, theming-validation, theming-accessibility)

#### First Call - Get Guidelines and Questions

```json
{
  "conversationContext": {
    "collectedAnswers": {
      "colors": [],
      "fonts": []
    }
  }
}
```

Expected: Returns theming guidelines, critical rules, and questions to ask the user

#### With Collected Colors and Fonts

```json
{
  "conversationContext": {
    "questionsAsked": ["color-1"],
    "collectedAnswers": {
      "colors": [{"hex": "#635BFF", "type": "primary"}, {"hex": "#0A2540", "type": "secondary"}],
      "fonts": [{"name": "sohne-var", "type": "body"}]
    }
  }
}
```

Expected: Returns "Information You've Provided" section with colors and fonts, plus next questions

#### Validation Call - Trigger Color Contrast Check

```json
{
  "conversationContext": {
    "collectedAnswers": {
      "colors": [{"hex": "#635BFF", "type": "primary"}],
      "colorMapping": {
        "lightText": "#000000",
        "lightBackground": "#FFFFFF",
        "darkText": "#FFFFFF",
        "darkBackground": "#18181B",
        "buttonText": "#FFFFFF",
        "buttonBackground": "#0A2540"
      }
    }
  }
}
```

Expected: Returns "AUTOMATED COLOR VALIDATION RESULTS" with contrast ratios and WCAG status

#### Merge Multiple Files

```json
{
  "fileKeys": ["theming-questions", "theming-validation"],
  "conversationContext": {
    "collectedAnswers": {"colors": [], "fonts": []}
  }
}
```

Expected: Returns merged guidance from both files

#### Non-Existent File Key

```json
{
  "fileKey": "non-existent",
  "conversationContext": {
    "collectedAnswers": {"colors": [], "fonts": []}
  }
}
```

Expected: Returns error with "not found" and lists available keys

### 5. Custom Theming Files (THEMING_FILES)

To test with custom content, set the `THEMING_FILES` environment variable:

```bash
export THEMING_FILES='[{"key":"custom-theming","path":"/path/to/custom-theming.md"}]'
```

The path is relative to the project directory (or absolute). The custom file is merged with the default files.

## Troubleshooting

### "No theming files have been loaded"

- Ensure the MCP server was started from a directory where the package's `content/site-theming/` files are available
- Default files are loaded from the installed package at runtime

### "File not found" for custom THEMING_FILES

- Verify the path in `THEMING_FILES` is correct (relative to project dir or absolute)
- Ensure the JSON is valid: `[{"key":"my-key","path":"path/to/file.md"}]`

### Validation Not Appearing

- `colorMapping` must be present in `conversationContext.collectedAnswers`
- `collectedAnswers.colors` must be a non-empty array for validation to run
