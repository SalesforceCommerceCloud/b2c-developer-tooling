# Testing Figma MCP Tools

## Test Status

The Figma tools have comprehensive unit tests covering:

- **figma-url-parser**: Valid URLs (design/file), invalid host, missing node-id, malformed URL, unrecognized path pattern
- **figma-to-component**: Valid/invalid URLs, custom workflow files, no-metadata workflow, output structure, next steps reminder, error format, metadata parsing
- **generate-component**: CREATE/EXTEND/REUSE decision paths, strategy selection (props/variant/composition), difference detection (styling, structural, behavioral, props), RSC vs client directive
- **formatter**: All action types (CREATE/EXTEND/REUSE), all extend strategies, conditional sections
- **map-tokens (css-parser)**: Light/dark/shared themes, data-theme selectors, token type classification, var() resolution, findThemeFilePath, parseThemeFile workspace discovery
- **map-tokens (token-matcher)**: Exact color match, fuzzy matching, semantic matching, no-match suggestions, batch matching, theme:light/dark semantics

All tests use the standard Mocha test framework. The Figma tools achieve ~99% statement coverage. Run with `pnpm test`.

## Testing Approaches

### 1. Unit Tests (Automated)

Run the Figma test suite:

```bash
cd packages/b2c-dx-mcp
pnpm run test:agent -- test/tools/storefrontnext/figma/
```

### 2. MCP Inspector (Interactive Testing)

Use the MCP Inspector to test the tools interactively:

```bash
cd packages/b2c-dx-mcp
pnpm run inspect:dev
```

Or with STOREFRONTNEXT toolset only:

```bash
mcp-inspector node --conditions development bin/dev.js --toolsets STOREFRONTNEXT --allow-non-ga-tools
```

Then in the inspector:

1. Click **Connect**
2. Click **List Tools** - you should see `storefront_next_figma_to_component_workflow`, `storefront_next_generate_component`, `storefront_next_map_tokens_to_theme`
3. Click on each tool to test with sample inputs

### 3. CLI Testing

Test via command line (run from `packages/b2c-dx-mcp`):

```bash
cd packages/b2c-dx-mcp

# List all tools (should include Figma tools)
npx mcp-inspector --cli node bin/run.js --toolsets STOREFRONTNEXT --allow-non-ga-tools --method tools/list

# Call figma-to-component workflow
npx mcp-inspector --cli node bin/run.js --toolsets STOREFRONTNEXT --allow-non-ga-tools \
  --method tools/call \
  --tool-name storefront_next_figma_to_component_workflow \
  --args '{"figmaUrl": "https://figma.com/design/abc123/MyDesign?node-id=1-2"}'

# Call generate-component
npx mcp-inspector --cli node bin/run.js --toolsets STOREFRONTNEXT --allow-non-ga-tools \
  --method tools/call \
  --tool-name storefront_next_generate_component \
  --args '{"figmaMetadata": "{}", "figmaCode": "<div>Hello</div>", "componentName": "TestComponent", "discoveredComponents": []}'

# Call map-tokens (requires --project-directory with Storefront Next project containing app.css)
npx mcp-inspector --cli node bin/run.js --toolsets STOREFRONTNEXT --allow-non-ga-tools \
  --project-directory /path/to/storefront-next \
  --method tools/call \
  --tool-name storefront_next_map_tokens_to_theme \
  --args '{"figmaTokens": [{"name": "Primary", "value": "#2563eb", "type": "color"}]}'
```

### 4. Running Tests Against a Local Storefront Next Installation

For `map-tokens` and `generate-component`, the tools use the project directory for theme file discovery and workspace context. Set `--project-directory` when starting the MCP server, or use `SFCC_WORKING_DIRECTORY` / `SFCC_PROJECT_DIRECTORY` if supported by your MCP client configuration.

### 5. Manual Testing with Real Figma Design

**Prerequisites:**

- Figma MCP tools enabled (external; e.g., Figma's official MCP or compatible provider) for full end-to-end conversion
- Storefront Next project with `--project-directory` pointing to the project root
- Valid Figma design URL with `node-id` parameter (e.g., `https://figma.com/design/:fileKey/:fileName?node-id=1-2`)

**Steps:**

1. Configure the b2c-dx-mcp server with `--toolsets STOREFRONTNEXT --allow-non-ga-tools` and `--project-directory` set to your Storefront Next project
2. Use the tools via MCP Inspector or your IDE's MCP integration (e.g., Cursor Composer)
3. Follow the end-to-end workflow below

### 6. Test Scenarios

#### storefront_next_figma_to_component_workflow

**Valid Figma URL**

```json
{
  "figmaUrl": "https://figma.com/design/abc123/MyDesign?node-id=1-2"
}
```

Expected: Returns workflow guide with fileKey, nodeId, step-by-step instructions, and next steps reminder.

**Invalid URL**

```json
{
  "figmaUrl": "not-a-valid-url"
}
```

Expected: Error message with URL format guidance.

**Custom workflow file (optional)**

```json
{
  "figmaUrl": "https://figma.com/design/abc123/MyDesign?node-id=1-2",
  "workflowFilePath": "/path/to/custom-workflow.md"
}
```

Expected: Uses custom workflow content instead of default.

#### storefront_next_generate_component

**Empty discovered components (CREATE)**

```json
{
  "figmaMetadata": "{}",
  "figmaCode": "<div className=\"flex p-4\">Hello</div>",
  "componentName": "HeroBanner",
  "discoveredComponents": []
}
```

Expected: CREATE recommendation with confidence ~95%.

**With discovered components (REUSE/EXTEND)**

```json
{
  "figmaMetadata": "{}",
  "figmaCode": "<button className=\"bg-primary\">Click</button>",
  "componentName": "PrimaryButton",
  "discoveredComponents": [
    {
      "path": "/src/components/ui/Button/index.tsx",
      "name": "Button",
      "similarity": 85,
      "matchType": "name",
      "code": "export default function Button({ children }) { return <button>{children}</button>; }"
    }
  ]
}
```

Expected: REUSE, EXTEND, or CREATE based on analyzed differences.

#### storefront_next_map_tokens_to_theme

**Basic token mapping**

```json
{
  "figmaTokens": [
    { "name": "Primary", "value": "#2563eb", "type": "color" },
    { "name": "Large Spacing", "value": "24px", "type": "spacing" },
    { "name": "Medium Radius", "value": "0.375rem", "type": "radius" }
  ]
}
```

Expected: Summary with exact/fuzzy/no matches, confidence scores, and recommendations. Requires project directory with `app.css` or `src/app.css`.

**With explicit theme file path**

```json
{
  "figmaTokens": [{ "name": "Primary", "value": "#2563eb", "type": "color" }],
  "themeFilePath": "/path/to/storefront-next/src/app.css"
}
```

Expected: Uses specified theme file instead of auto-discovery.

## End-to-End Workflow (Manual)

For a full Figma-to-component conversion, execute in order:

1. **Call `storefront_next_figma_to_component_workflow`** with the Figma URL. Receive fileKey, nodeId, and workflow instructions.

2. **Call Figma MCP tools** (external) with the returned fileKey and nodeId:
   - `mcp__figma__get_design_context` (REQUIRED)
   - `mcp__figma__get_screenshot` (REQUIRED)
   - `mcp__figma__get_metadata` (OPTIONAL)

3. **Discover similar components** using Glob/Grep/Read to search the codebase for components similar to the Figma design.

4. **Call `storefront_next_generate_component`** with figmaMetadata, figmaCode, componentName, and discoveredComponents. Receive REUSE/EXTEND/CREATE recommendation.

5. **Call `storefront_next_map_tokens_to_theme`** with design tokens extracted from Figma. Receive token mapping and suggestions.

6. **Implement** the recommended approach and present the component to the developer for review.

## Troubleshooting

### Theme File Not Found

If `map_tokens_to_theme` returns "Theme file (app.css) not found":

- Ensure `--project-directory` points to a Storefront Next project root
- Verify `app.css` or `src/app.css` exists in that directory
- Or pass `themeFilePath` explicitly with an absolute path

### Invalid Figma URL

If `figma_to_component_workflow` returns an error:

- Use a URL from figma.com (design or file)
- Include the `node-id` query parameter (e.g., `?node-id=1-2`)
- Example: `https://figma.com/design/abc123/MyDesign?node-id=1-2`

### Project Directory Resolution

`generate_component` and `map_tokens` use the MCP server's project directory (from `--project-directory`). If tools cannot find files:

- Confirm the MCP server was started with `--project-directory` set to your Storefront Next project
- Check that your MCP client (e.g., Cursor) passes the workspace folder correctly

### Validation Errors

For Zod validation errors:

- **figma-to-component**: `figmaUrl` must be a valid URL string
- **generate-component**: All of figmaMetadata, figmaCode, componentName, discoveredComponents are required; discoveredComponents must be an array of objects with path, name, similarity, matchType, code
- **map-tokens**: figmaTokens must be an array of objects with name, value, type (one of: color, spacing, radius, opacity, fontSize, fontFamily, other)

## See Also

For user-facing setup, Figma MCP configuration, and prerequisites, see the [Figma-to-Component Tools Setup](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/figma-tools-setup) guide in the documentation.
