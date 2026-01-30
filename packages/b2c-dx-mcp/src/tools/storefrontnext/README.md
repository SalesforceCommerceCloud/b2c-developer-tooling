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
    "sections": ["quick-reference", "data-fetching", "state-management", "auth", "config", "i18n", "components", "page-designer", "performance", "testing", "extensions", "pitfalls"]
  }
}
```

## Implementation Details

### Architecture

The tool loads content from markdown files in the `content/` directory:

- **Content source**: Markdown files loaded at runtime from `packages/b2c-dx-mcp/content/*.md`
- **Quick Reference**: `quick-reference.md` - Critical rules and patterns
- **Section-Based**: Individual markdown files per topic (~100-200 lines each)
- **Default behavior**: Returns 4 sections by default for comprehensive coverage

### Content Structure

Each section markdown file includes:

- Critical rules and best practices
- Code examples (correct ✅ and incorrect ❌ patterns)
- Quick reference snippets
- Framework-specific patterns for React Server Components

### Behavior

- **No sections specified**: Returns default comprehensive set (`quick-reference`, `data-fetching`, `components`, `testing`)
- **Single section**: Returns content directly without separators
- **Multiple sections**: Combines content with `---` separators and includes instructions for full content display
- **Empty array**: Returns empty string

### Benefits

✅ **Token Efficient**: Returns only relevant content (200-500 lines vs 20K+ full doc)  
✅ **Modular**: Access specific sections as needed  
✅ **Multi-Select**: Combine related sections in a single call for contextual learning  
✅ **Always Current**: Content loaded from markdown files (easy to update)  
✅ **Comprehensive Default**: Returns key sections by default for immediate value  

## Placeholder Tools

The following tools are placeholders awaiting implementation:

- `storefront_next_site_theming` - Configure and manage site theming for Storefront Next
- `storefront_next_figma_to_component_workflow` - Convert Figma designs to Storefront Next components
- `storefront_next_generate_component` - Generate a new Storefront Next component
- `storefront_next_map_tokens_to_theme` - Map design tokens to Storefront Next theme configuration
- `storefront_next_design_decorator` - Apply design decorators to Storefront Next components
- `storefront_next_generate_page_designer_metadata` - Generate Page Designer metadata for Storefront Next components

Use `--allow-non-ga-tools` flag to enable placeholder tools.
