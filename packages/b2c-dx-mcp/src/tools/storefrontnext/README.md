# Storefront Next Toolset

MCP tools for Storefront Next development with React Server Components.

## Tools

### `storefront_next_development_guidelines`

**ESSENTIAL FIRST STEP** for Storefront Next development. Returns critical architecture rules, coding standards, and best practices. Use this tool FIRST before writing any Storefront Next code to understand non-negotiable patterns for React Server Components, data loading, and framework constraints.

**Status**: ✅ Implemented

**Use cases**:

- Understand critical rules before writing code
- Learn recommended patterns and conventions
- Get guidance on architecture, data fetching, auth, i18n, components, performance, testing
- Troubleshoot issues and avoid common pitfalls
- Access comprehensive documentation on specific topics

**Parameters**:

- `sections` (optional, array): Specific guideline sections to retrieve
  - **Default**: `['quick-reference', 'data-fetching', 'components', 'testing']` - Returns comprehensive guidelines covering the most critical topics
  - **Single section**: Specify one section name to get focused content
  - **Multiple sections**: Specify an array of section names to combine related documentation
  - **Empty array**: Returns empty string
  - Available section values:
    - `quick-reference` - Critical rules, architecture principles, and quick patterns
    - `data-fetching` - Data loading patterns with loaders, actions, and useScapiFetcher
    - `state-management` - Client-side state management with Zustand
    - `auth` - Authentication and session management
    - `config` - Configuration system
    - `i18n` - Internationalization patterns
    - `components` - Component best practices
    - `styling` - Tailwind CSS 4, Shadcn/ui, styling guidelines
    - `page-designer` - Page Designer integration and component registry
    - `performance` - Optimization techniques
    - `testing` - Testing strategy
    - `extensions` - Framework extensions
    - `pitfalls` - Common mistakes to avoid

**Returns**: Text content with guidelines for the requested section(s)

**Output format**:

- **Single section**: Returns content directly (no separators or instructions)
- **Multiple sections**: Returns content with `---` separators between sections, prefixed with instructions to display full content without summarization

**Example usage**:

```json
// Default - returns comprehensive guidelines (quick-reference + data-fetching + components + testing)
{
  "name": "storefront_next_development_guidelines"
}

// Single section
{
  "name": "storefront_next_development_guidelines",
  "arguments": {
    "sections": ["data-fetching"]
  }
}

// Multiple related sections
{
  "name": "storefront_next_development_guidelines",
  "arguments": {
    "sections": ["data-fetching", "components", "performance"]
  }
}

// All sections
{
  "name": "storefront_next_development_guidelines",
  "arguments": {
    "sections": ["quick-reference", "data-fetching", "state-management", "auth", "config", "i18n", "components", "styling", "page-designer", "performance", "testing", "extensions", "pitfalls"]
  }
}
```

### `storefront_next_page_designer_decorator`

Add Page Designer decorators (`@Component`, `@AttributeDefinition`, `@RegionDefinition`) to existing React components for Storefront Next.

**Status**: ✅ Implemented (non-GA - use `--allow-non-ga-tools` flag)

**Use cases**:

- Add Page Designer support to new components
- Convert existing components to be Page Designer-compatible
- Generate decorator code automatically or interactively
- Configure component attributes and regions for Page Designer

**Parameters**:

- `component` (required, string): Component name (e.g., "ProductCard") or file path
- `autoMode` (optional, boolean): Enable auto mode for quick setup
- `searchPaths` (optional, array): Additional directories to search for components
- `componentId` (optional, string): Override component ID
- `conversationContext` (optional, object): For interactive mode workflow steps

**Returns**: Generated decorator code and instructions for adding to component file

**Example usage**:

```json
// Auto mode (quick setup)
{
  "name": "storefront_next_page_designer_decorator",
  "arguments": {
    "component": "ProductCard",
    "autoMode": true
  }
}

// Interactive mode (step-by-step)
{
  "name": "storefront_next_page_designer_decorator",
  "arguments": {
    "component": "Hero",
    "conversationContext": {
      "step": "analyze"
    }
  }
}
```

### `storefront_next_site_theming`

**MANDATORY** before implementing any theming changes. Provides theming guidelines, questions, and automatic color contrast validation. Call this tool FIRST when the user requests theming (even if colors/fonts are provided). Never implement without calling it first.

**Status**: ✅ Implemented (non-GA - use `--allow-non-ga-tools` flag)

**Use cases**:

- Apply colors, fonts, or visual styling to a Storefront Next site
- Validate color combinations for WCAG accessibility before implementing
- Follow the theming workflow (questions → validation → confirmation → implement)

**Parameters**:

- `fileKeys` (optional, array): File keys to add to the default set. Defaults use `theming-questions`, `theming-validation`, `theming-accessibility`
- `conversationContext` (optional, object): Context from previous rounds
  - `currentStep` (optional): Current step in the conversation
  - `collectedAnswers` (optional): Previously collected answers; include `colorMapping` to trigger automatic validation (colorMapping alone is sufficient; colors array is not required)
  - `questionsAsked` (optional): List of question IDs already asked

**Returns**: Theming guidelines, questions to ask, and (when `colorMapping` provided, with or without colors array) automated WCAG contrast validation results

**Example usage**:

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

// Validation call - after constructing colorMapping (colorMapping alone triggers validation)
{
  "name": "storefront_next_site_theming",
  "arguments": {
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
}
```

## Implementation Details

### Architecture

#### `storefront_next_development_guidelines`

The tool loads content from markdown files in the `content/` directory:

- **Content source**: Markdown files loaded at runtime from `packages/b2c-dx-mcp/content/*.md`
- **Quick Reference**: `quick-reference.md` - Critical rules and patterns
- **Section-Based**: Individual markdown files per topic (~100-200 lines each)
- **Default behavior**: Returns 4 sections by default for comprehensive coverage

**Content Structure**:

Each section markdown file includes:

- Critical rules and best practices
- Code examples (correct ✅ and incorrect ❌ patterns)
- Quick reference snippets
- Framework-specific patterns for React Server Components

**Behavior**:

- **No sections specified**: Returns default comprehensive set (`quick-reference`, `data-fetching`, `components`, `testing`)
- **Single section**: Returns content directly without separators
- **Multiple sections**: Combines content with `---` separators and includes instructions for full content display
- **Empty array**: Returns empty string

**Benefits**:

✅ **Token Efficient**: Returns only relevant content (200-500 lines vs 20K+ full doc)  
✅ **Modular**: Access specific sections as needed  
✅ **Multi-Select**: Combine related sections in a single call for contextual learning  
✅ **Always Current**: Content loaded from markdown files (easy to update)  
✅ **Comprehensive Default**: Returns key sections by default for immediate value

#### `storefront_next_page_designer_decorator`

The tool uses a rule-based architecture with TypeScript template literals for generating Page Designer decorators:

- **Rule Rendering**: Pure TypeScript functions that return strings based on typed context
- **Type Safety**: Every rule has a strongly-typed context interface checked at compile time
- **Template Generation**: Code generation uses pure functions for decorator creation
- **Component Discovery**: Automatically searches common component directories (e.g., `src/components/**`, `app/components/**`)

**Key Features**:

- **Name-Based Lookup**: Find components by name (e.g., "ProductCard") without knowing paths
- **Auto-Discovery**: Searches common component directories automatically
- **Type-Safe**: Full TypeScript type inference for all contexts
- **Fast**: Direct function execution, no file I/O or compilation overhead
- **Flexible Input**: Supports component names or file paths

**Modes**:

- **Auto Mode**: Generates decorators immediately with sensible defaults
- **Interactive Mode**: Multi-step workflow with user confirmation at each stage

**Component Discovery**:

The tool automatically searches for components in these locations (in order):

1. `src/components/**` (PascalCase and kebab-case)
2. `app/components/**`
3. `components/**`
4. `src/**` (broader search)
5. Custom paths (if provided via `searchPaths`)

**Project Directory**:

Component discovery uses the project directory resolved from `--project-directory` flag or `SFCC_PROJECT_DIRECTORY` environment variable (via Services). This ensures searches start from the correct project directory, especially when MCP clients spawn servers from the home directory.

**See also**: [Detailed documentation](./page-designer-decorator/README.md) for complete usage guide, architecture details, and examples.

#### `storefront_next_site_theming`

The tool loads theming guidance from markdown files in `content/site-theming/` and runs automatic WCAG contrast validation when `colorMapping` is provided:

- **Content source**: `theming-questions`, `theming-validation`, `theming-accessibility` (default); custom files via `fileKeys` or `THEMING_FILES` env
- **Workflow**: Call tool → Ask questions → Call with `colorMapping` (triggers validation) → Present findings → Wait for confirmation → Implement

**See also**: [Detailed documentation](./site-theming/README.md) for complete usage guide, architecture details, and examples.
