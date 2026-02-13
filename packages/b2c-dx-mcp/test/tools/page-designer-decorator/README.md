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

### 4. Automated Manual Test Runner

A test runner script is available to quickly verify the tool with various test scenarios:

```bash
cd packages/b2c-dx-mcp
pnpm build  # Build the package first
node test/tools/page-designer-decorator/index.test.mjs all
```

Run a specific test case:
```bash
node test/tools/page-designer-decorator/index.test.mjs TC-1.1
```

The script covers 24 automated test cases including:
- Component discovery (name-based, path-based, nested, custom paths)
- Auto mode (basic, type inference, complex props exclusion)
- Interactive mode (mode selection, analyze step)
- Error handling (invalid input, missing parameters)
- Edge cases (no props, optional props, union types, collisions)
- Environment variables (SFCC_WORKING_DIRECTORY)

See the script's JSDoc header for a complete list of available test cases.

#### Running Tests Against a Local Storefront Next Installation

The test runner script supports two modes:

**1. Temporary Directory Mode (Default)**
Creates isolated test environments with temporary directories. Ideal for CI/CD and regression testing.

```bash
cd packages/b2c-dx-mcp
pnpm build
node test/tools/page-designer-decorator/index.test.mjs all
```

**2. Real Storefront Next Project Mode**
Test against an existing Storefront Next installation by setting `SFCC_WORKING_DIRECTORY`:

```bash
cd packages/b2c-dx-mcp
pnpm build
SFCC_WORKING_DIRECTORY=/path/to/storefront-next \
  node test/tools/page-designer-decorator/index.test.mjs all
```

Or set it as an environment variable:
```bash
export SFCC_WORKING_DIRECTORY=/path/to/storefront-next
cd packages/b2c-dx-mcp
pnpm build
node test/tools/page-designer-decorator/index.test.mjs TC-1.1
```

**Important Notes for Real Project Mode**:
- Component discovery searches in your real Storefront Next project (`SFCC_WORKING_DIRECTORY`)
- Test components created by the script are placed in a temporary directory (not in your real project)
- The script will **not** modify your real project files (read-only)
- Tests will use existing components from your real project if they exist
- If a test component doesn't exist in your real project, the test will show a "component not found" result (this is expected)
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
