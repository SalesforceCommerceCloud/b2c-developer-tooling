# Page Designer Decorator Tool

Tool for adding Page Designer decorators to React components using native TypeScript template literals.

## 🎯 Overview

This tool analyzes React components and generates Page Designer decorators (`@Component`, `@AttributeDefinition`, `@RegionDefinition`) to make components available in Page Designer for Storefront Next.

## ✨ Key Features

- **Name-Based Lookup**: Find components by name (e.g., "ProductCard") without knowing paths
- **Auto-Discovery**: Automatically searches common component directories
- **Type-Safe**: Full TypeScript type inference for all contexts
- **Fast**: Direct function execution, no file I/O or compilation overhead
- **Flexible Input**: Supports component names or file paths
- **Two Modes**: Auto mode for quick setup, Interactive mode for fine-tuned control

## 📁 File Structure

```
page-designer-decorator/
├── analyzer.ts                    # Component parsing and analysis
├── rules.ts                       # Rule loader and exports
├── index.ts                       # Main tool implementation
├── rules/
│   ├── 1-mode-selection.ts           # Entry point
│   ├── 2a-auto-mode.ts               # Auto mode workflow
│   ├── 2b-0-interactive-overview.ts  # Interactive workflow overview
│   ├── 2b-1-interactive-analyze.ts   # Step 1: Analysis
│   ├── 2b-2-interactive-select-props.ts  # Step 2: Selection
│   ├── 2b-3-interactive-configure-attrs.ts  # Step 3: Configuration
│   ├── 2b-4-interactive-configure-regions.ts  # Step 4: Regions
│   └── 2b-5-interactive-confirm-generation.ts  # Step 5: Generation
└── templates/
    └── decorator-generator.ts    # Decorator code generation
```

## 🚀 Usage

### Basic Usage (Name-Based - Recommended)

```bash
# By component name (automatically finds the file)
add_page_designer_decorator({
  component: "ProductCard",
  autoMode: true
})

# Interactive mode
add_page_designer_decorator({
  component: "Hero",
  conversationContext: { step: "analyze" }
})

# With custom search paths (for unusual locations)
add_page_designer_decorator({
  component: "ProductCard",
  searchPaths: ["packages/retail/src", "app/features"],
  autoMode: true
})
```

### Path-Based Usage

```bash
# If you prefer to specify the exact path
add_page_designer_decorator({
  component: "src/components/ProductCard.tsx",
  autoMode: true
})
```

### Workflow

1. **Component Discovery**: Provide name (e.g., "ProductCard") or path
2. **Mode Selection**: Choose Auto or Interactive mode
3. **Analysis** (Interactive only): Review component props
4. **Selection** (Interactive only): Select which props to expose
5. **Configuration** (Interactive only): Configure types and defaults
6. **Regions** (Interactive only): Configure nested content areas
7. **Generation**: Get decorator code

### Component Discovery

The tool automatically searches for components in these locations (in order):

1. `src/components/**` (PascalCase and kebab-case)
2. `app/components/**`
3. `components/**`
4. `src/**` (broader search)
5. Custom paths (if provided via `searchPaths`)

**Working Directory:**
Component discovery uses the working directory resolved from `--working-directory` flag or `SFCC_WORKING_DIRECTORY` environment variable (via Services). This ensures searches start from the correct project directory, especially when MCP clients spawn servers from the home directory.

**Examples:**

- `"ProductCard"` → finds `src/components/product-tile/ProductCard.tsx`
- `"Hero"` → finds `src/components/hero/Hero.tsx` or `app/components/hero.tsx`
- `"product-card"` → finds `src/components/product-card.tsx` or `product-card/index.tsx`

**Tips:**

- Use component name for portability
- Use path for unusual locations
- Add `searchPaths` for monorepos or non-standard structures
- Ensure `--working-directory` flag or `SFCC_WORKING_DIRECTORY` env var is set correctly

## 🏗️ Architecture

### Rule Rendering

Rules are pure TypeScript functions that return strings:

```typescript
${context.hasEditableProps
  ? context.editableProps.map(prop =>
      `- \`${prop.name}\` (${prop.type})`
    ).join('\n')
  : ''
}
```

### Type Safety

Every rule has a strongly-typed context interface:

```typescript
export interface AnalyzeStepContext {
  componentName: string;
  file: string;
  hasEditableProps: boolean;
  editableProps: PropInfo[];
  // ... more fields
}

export function renderAnalyzeStep(context: AnalyzeStepContext): string {
  // TypeScript checks all variable access at compile time
}
```

### Template Generation

Code generation uses pure functions:

```typescript
export function generateDecoratorCode(context: MetadataContext): string {
  const imports = generateImports(context);
  const decorator = generateComponentDecorator(context);
  const attributes = generateAttributes(context);

  return `${imports}${decorator}\nexport class ${context.metadataClassName} {\n${attributes}\n}`;
}
```

## 📦 Build Process

All rules and templates are compiled into the JavaScript output:

```json
{
  "scripts": {
    "build": "tsc"
  }
}
```

## 🎯 When to Use This Tool

Use this tool when:

- ✅ You need to add Page Designer support to React components
- ✅ You want automatic component discovery by name
- ✅ You prefer type-safe decorator generation
- ✅ You need both quick auto-mode and detailed interactive workflows

## 🔧 Development

### Adding a New Rule

1. Create a new file in `rules/`:

```typescript
// rules/my-new-rule.ts
export interface MyRuleContext {
  message: string;
}

export function renderMyRule(context: MyRuleContext): string {
  return `# My Rule\n\n${context.message}`;
}
```

2. Export it from `rules.ts`:

```typescript
import {renderMyRule, type MyRuleContext} from './rules/my-new-rule.js';

export const pageDesignerDecoratorRules = {
  // ... existing rules
  getMyRule(context: MyRuleContext): string {
    return renderMyRule(context);
  },
};
```

3. Use it in `index.ts`:

```typescript
const instructions = pageDesignerDecoratorRules.getMyRule({
  message: 'Hello World',
});
```

### Modifying Code Generation

Edit `templates/decorator-generator.ts` directly. Changes require recompilation.

## 📊 Performance

The tool uses direct function execution with no file I/O or compilation overhead. Typical tool invocations complete in under 1ms.

## ✅ Testing

### Automated Tests

```bash
pnpm build
pnpm test
```

Comprehensive test suite covers all workflow modes, component discovery, and error handling.

### Running Tests

Run the comprehensive Mocha test suite:

```bash
cd packages/b2c-dx-mcp
pnpm run test:agent -- test/tools/page-designer-decorator/index.test.ts
```

The test suite covers:
- Component discovery (name-based, kebab-case, nested, path-based, custom paths, name collisions)
- Auto mode (basic, type inference, complex props exclusion, UI-only props exclusion, edge cases)
- Interactive mode (all steps: analyze, select_props, configure_attrs, configure_regions, confirm_generation)
- Error handling (invalid input, invalid step name, missing parameters)
- Edge cases (no props, only complex props, optional props, union types, already decorated components)
- Working directory resolution (from --working-directory flag or SFCC_WORKING_DIRECTORY env var via Services)

See [`test/tools/page-designer-decorator/README.md`](../../../test/tools/page-designer-decorator/README.md) for detailed testing instructions.

## 🎓 Learning Resources

- [Template Literals (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [MCP Tools Documentation](https://modelcontextprotocol.io/docs)

## 📝 License

Apache-2.0 - Copyright (c) 2025, Salesforce, Inc.
