# Testing Page Designer Decorator Tool

## Test Status

The page-designer-decorator tool has comprehensive unit tests covering:
- ✅ Tool metadata (name, description, toolsets, isGA)
- ✅ Mode selection flow
- ✅ Auto mode (basic, type inference, complex/UI props exclusion, edge cases)
- ✅ Interactive mode (all steps: analyze, select_props, configure_attrs, configure_regions, confirm_generation)
- ✅ Component resolution (name-based, kebab-case, nested, path-based, custom searchPaths, name collisions)
- ✅ Error handling (invalid input, invalid step name, missing parameters)
- ✅ Input validation
- ✅ Edge cases (no props, only complex props, optional props, union types, already decorated components)
- ✅ Environment variables (SFCC_WORKING_DIRECTORY)

All tests use the standard Mocha test framework and run with `pnpm test`.

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

### 4. Running Tests Against a Local Storefront Next Installation

The Mocha test suite supports testing against a real Storefront Next installation by setting `SFCC_WORKING_DIRECTORY`:

```bash
cd packages/b2c-dx-mcp
SFCC_WORKING_DIRECTORY=/path/to/storefront-next \
  pnpm run test:agent -- test/tools/page-designer-decorator/index.test.ts
```

Or set it as an environment variable:
```bash
export SFCC_WORKING_DIRECTORY=/path/to/storefront-next
cd packages/b2c-dx-mcp
pnpm run test:agent -- test/tools/page-designer-decorator/index.test.ts
```

**Important Notes for Real Project Mode**:
- Component discovery searches in your real Storefront Next project (`SFCC_WORKING_DIRECTORY`)
- Tests create temporary directories for test components (not in your real project)
- Tests will **not** modify your real project files (read-only)
- Tests will use existing components from your real project if they exist
- The real project directory is preserved after testing
- To test with specific components, ensure they exist in your real project's `src/components/` directory

**Alternative Testing Methods**:
- **MCP Inspector**: Interactive UI testing (see section 2 above)
- **CLI Testing**: Command-line testing (see section 3 above)
- **Manual Test Plan**: Full integration testing including Business Manager and Page Designer (see [manual test plan](../../../../../Documents/page-designer-decorator-manual-test-plan.md) for TC-7.x tests)

### 5. Manual Testing with Real Components

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

### 6. Test Scenarios

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
