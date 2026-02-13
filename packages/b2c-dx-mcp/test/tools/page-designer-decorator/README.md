# Testing Page Designer Decorator Tool

## Test Status

The page-designer-decorator tool has comprehensive unit tests covering:
- ✅ Tool metadata (name, description, toolsets, isGA)
- ✅ Mode selection flow
- ✅ Error handling
- ✅ Input validation

Some integration tests may require actual component files in a real workspace to fully validate component resolution.

## Testing Approaches

### 1. Unit Tests (Automated)

Run the test suite:

```bash
cd packages/b2c-dx-mcp
pnpm run test:agent -- test/tools/page-designer-decorator/index.test.ts
```

### 2. MCP Inspector (Interactive Testing)

Use the MCP Inspector to test the tool interactively:

```bash
cd packages/b2c-dx-mcp
pnpm run inspect:dev
```

Then in the inspector:
1. Click **Connect**
2. Click **List Tools** - you should see `add_page_designer_decorator`
3. Click on the tool to test it with real inputs

### 3. CLI Testing

Test via command line:

```bash
# List all tools (should include add_page_designer_decorator)
npx mcp-inspector --cli node bin/dev.js --toolsets STOREFRONTNEXT --allow-non-ga-tools --method tools/list

# Call the tool
npx mcp-inspector --cli node bin/dev.js --toolsets STOREFRONTNEXT --allow-non-ga-tools \
  --method tools/call \
  --tool-name add_page_designer_decorator \
  --args '{"component": "MyComponent"}'
```

### 4. Manual Testing with Real Components

1. Set up a Storefront Next project (or use an existing one)
2. Create a test component:

```tsx
// src/components/TestComponent.tsx
export interface TestComponentProps {
  title: string;
  description?: string;
}

export default function TestComponent({title, description}: TestComponentProps) {
  return <div>{title}</div>;
}
```

3. Set environment variable:
```bash
export SFCC_WORKING_DIRECTORY=/path/to/storefront-next
```

4. Use the tool via MCP Inspector or your IDE's MCP integration

### 5. Test Scenarios

#### Mode Selection
```json
{
  "component": "TestComponent"
}
```
Expected: Returns mode selection instructions

#### Auto Mode
```json
{
  "component": "src/components/TestComponent.tsx",
  "autoMode": true
}
```
Expected: Generates decorators automatically

#### Interactive Mode - Analyze Step
```json
{
  "component": "src/components/TestComponent.tsx",
  "conversationContext": {
    "step": "analyze"
  }
}
```
Expected: Returns component analysis

## Troubleshooting

### Component Not Found Errors

If you get "Component not found" errors:
1. Verify `SFCC_WORKING_DIRECTORY` is set correctly
2. Check that the component file exists at the expected path
3. Try using the full relative path: `"component": "src/components/MyComponent.tsx"`

### Validation Errors

If you get Zod validation errors:
- Check that all required fields are provided
- Verify field types match the schema (e.g., `component` must be a string)
