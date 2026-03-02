# Salesforce B2C Commerce MCP Server

MCP (Model Context Protocol) server for Salesforce B2C Commerce developer experience tools.

> [!NOTE]
> This project is currently in **Developer Preview**. Tools are functional but require `--allow-non-ga-tools` to enable. Additional tools will be added in future releases.

This MCP server enables AI assistants (Cursor, Claude Desktop, and others) to help with B2C Commerce development tasks. It provides toolsets for **SCAPI**, **CARTRIDGES**, **MRT**, **PWAV3**, and **STOREFRONTNEXT** development.

Full documentation: [https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/)

## Installation

**Prerequisites:** Node.js 22.0.0 or higher, MCP client (Cursor, Claude Desktop, or compatible)

**Cursor** (supports `${workspaceFolder}`):

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp", "--project-directory", "${workspaceFolder}", "--allow-non-ga-tools"]
    }
  }
}
```

**Claude Desktop** (use explicit path):

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp", "--project-directory", "/path/to/your/project", "--allow-non-ga-tools"]
    }
  }
}
```

See the [Installation Guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/installation) for detailed setup.

## Configuration

Always set `--project-directory` (or `SFCC_PROJECT_DIRECTORY`). MCP clients spawn from the home directory (`~`), not your project.

| Environment Variable | Description |
|---------------------|-------------|
| `SFCC_PROJECT_DIRECTORY` | Project directory (enables auto-discovery and config loading) |
| `SFCC_SERVER` | B2C instance hostname |
| `SFCC_USERNAME` | Username for WebDAV |
| `SFCC_PASSWORD` | Password/access key for WebDAV |
| `SFCC_CLIENT_ID` | OAuth client ID |
| `SFCC_CLIENT_SECRET` | OAuth client secret |
| `SFCC_MRT_API_KEY` | MRT API key |

See the [Configuration Guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration) for credentials, flags, and toolset selection.

## Tools

| Toolset | Tools | Docs |
|---------|-------|------|
| CARTRIDGES | `cartridge_deploy` | [toolsets#cartridges](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets#cartridges) |
| MRT | `mrt_bundle_push` | [toolsets#mrt](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets#mrt) |
| SCAPI | `scapi_schemas_list`, `scapi_custom_apis_status`, `scapi_customapi_scaffold` | [toolsets#scapi](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets#scapi) |
| STOREFRONTNEXT | `storefront_next_development_guidelines`, `storefront_next_page_designer_decorator`, `storefront_next_site_theming`, `storefront_next_figma_to_component_workflow`, `storefront_next_generate_component`, `storefront_next_map_tokens_to_theme` | [toolsets#storefrontnext](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets#storefrontnext) |
| PWAV3 | `pwakit_development_guidelines` + SCAPI tools | [toolsets#pwav3](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets#pwav3) |

### cartridge_deploy

Deploy cartridges to a B2C Commerce instance. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/cartridge-deploy)

- "Use the MCP tool to deploy my cartridges to the sandbox."
- "Use the MCP tool to deploy only app_storefront_base."

### mrt_bundle_push

Build and push bundle to Managed Runtime. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/mrt-bundle-push)

- "Use the MCP tool to push my Storefront Next bundle to staging."
- "Use the MCP tool to deploy my PWA Kit bundle to production."

### scapi_schemas_list

List or fetch SCAPI schemas (standard and custom). [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/scapi-schemas-list)

- "Use the MCP tool to list all SCAPI schemas."
- "Use the MCP tool to get the OpenAPI schema for shopper-baskets v1."

### scapi_custom_apis_status

Get custom API endpoint registration status. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/scapi-custom-apis-status)

- "Use the MCP tool to list custom API endpoints on my instance."
- "Use the MCP tool to show which custom APIs are active vs not registered."

### scapi_customapi_scaffold

Generate new custom SCAPI endpoint in a cartridge. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/scapi-custom-api-scaffold)

- "Use the MCP tool to scaffold a new custom API named my-products."
- "Use the MCP tool to create a custom admin API called customer-trips."

### storefront_next_development_guidelines

Get Storefront Next guidelines and best practices. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/storefront-next-development-guidelines)

- "Use the MCP tool to show me critical Storefront Next rules."
- "Use the MCP tool to get data-fetching and component patterns."

### storefront_next_page_designer_decorator

Add Page Designer decorators to components. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/storefront-next-page-designer-decorator)

- "Use the MCP tool to add Page Designer decorators to my component."

### storefront_next_site_theming

Get theming guidelines, questions, and WCAG color validation for Storefront Next. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/storefront-next-site-theming)

- "Use the MCP tool to help me apply my brand colors to my Storefront Next site."
- "Use the MCP tool to validate my color combinations for accessibility."

### storefront_next_figma_to_component_workflow

Workflow orchestrator for Figma-to-component conversion. Parses Figma URL, returns step-by-step instructions for subsequent tool calls. Requires external Figma MCP server. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/storefront-next-figma-to-component-workflow) — [Figma Setup](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/figma-tools-setup)

- "Use the MCP tool to convert this Figma design to a Storefront Next component: [Figma URL with node-id]"
- "Use the MCP tool to create this homepage from the Figma design: [Figma URL with node-id]"

### storefront_next_generate_component

Analyze Figma design and discovered components to recommend REUSE, EXTEND, or CREATE strategy. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/storefront-next-generate-component)

- "Use the MCP tool to analyze the Figma design and recommend whether to reuse, extend, or create a component."

### storefront_next_map_tokens_to_theme

Map Figma design tokens to existing theme tokens in app.css with confidence scores and suggestions. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/storefront-next-map-tokens-to-theme)

- "Use the MCP tool to map these Figma design tokens to my theme."

### pwakit_development_guidelines

Get PWA Kit v3 guidelines. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/pwakit-development-guidelines)

- "Use the MCP tool to get PWA Kit development guidelines."

## Prompting Tips

Explicitly mention "Use the MCP tool" in your prompts for reliable tool usage. See [Prompting Tips](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/#prompting-tips) for best practices and more examples.

## Telemetry

The MCP server collects anonymous usage telemetry by default. Disable with `SF_DISABLE_TELEMETRY=true` or `SFCC_DISABLE_TELEMETRY=true` in your MCP client's `env` config. See the [MCP documentation](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/#telemetry) for details.

## Documentation

Full documentation: [https://salesforcecommercecloud.github.io/b2c-developer-tooling/](https://salesforcecommercecloud.github.io/b2c-developer-tooling/)

For MCP development, testing, and local setup, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

This project is licensed under the Apache License 2.0. See [LICENSE.txt](../../LICENSE.txt) for full details.

## Disclaimer

This project is currently in **Developer Preview** and is provided "as-is" without warranty of any kind. It is not yet generally available (GA) and should not be used in production environments. Features, APIs, and functionality may change without notice in future releases.
