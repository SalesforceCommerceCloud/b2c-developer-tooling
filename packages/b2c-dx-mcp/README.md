# Salesforce B2C Commerce MCP Server

MCP (Model Context Protocol) server for Salesforce B2C Commerce developer experience tools.

This MCP server enables AI assistants (Cursor, Claude Code, and others) to help with B2C Commerce development tasks. It provides toolsets for **SCAPI**, **CARTRIDGES**, **MRT**, **PWAV3**, and **STOREFRONTNEXT** development.

Full documentation: [https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/)

## Installation

**Prerequisites:** Node.js 22.16.0 or higher, MCP client (Cursor, Claude Code, GitHub Copilot, or compatible)

**Cursor** (project-level configuration - recommended):

```json
{
  "mcpServers": {
    "b2c-dx-mcp": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--allow-non-ga-tools"]
    }
  }
}
```

> **Note:** Project-level configuration (`.cursor/mcp.json`) automatically detects your project location. For user-level configuration, add `--project-directory "${workspaceFolder}"` to the args array.

**GitHub Copilot / VS Code**:

```json
{
  "servers": {
    "b2c-dx-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--allow-non-ga-tools"]
    }
  },
  "inputs": []
}
```

> **Note:** GitHub Copilot/VS Code uses `"servers"` (not `"mcpServers"`) and requires `"type": "stdio"` for stdio-based servers.

**Claude Code**:

Claude Code supports MCP servers via CLI installation:

```bash
# Project scope (recommended)
cd /path/to/your/project
claude mcp add --transport stdio --scope project b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest --allow-non-ga-tools

# User scope
claude mcp add --transport stdio --scope user b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest --allow-non-ga-tools
```

See the [Installation Guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/installation) for detailed setup.

## Configuration

**Project-level configuration** (recommended for Cursor and GitHub Copilot) automatically detects your project location. For **user-level configuration** or when using explicit paths, set `--project-directory` (or `SFCC_PROJECT_DIRECTORY`). MCP clients spawn from the home directory (`~`), not your project.

| Environment Variable     | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| `SFCC_PROJECT_DIRECTORY` | Project directory (enables auto-discovery and config loading) |
| `SFCC_SERVER`            | B2C instance hostname                                         |
| `SFCC_USERNAME`          | Username for WebDAV                                           |
| `SFCC_PASSWORD`          | Password/access key for WebDAV                                |
| `SFCC_CLIENT_ID`         | OAuth client ID                                               |
| `SFCC_CLIENT_SECRET`     | OAuth client secret                                           |
| `MRT_API_KEY`            | MRT API key (`SFCC_MRT_API_KEY` also supported)               |

See the [Configuration Guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration) for credentials, flags, and toolset selection.

## Tools

| Toolset        | Tools                                                                                      | Docs                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| CARTRIDGES     | `cartridge_deploy`                                                                         | [toolsets#cartridges](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets#cartridges)         |
| MRT            | `mrt_bundle_push`                                                                          | [toolsets#mrt](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets#mrt)                       |
| SCAPI          | `scapi_schemas_list`, `scapi_custom_apis_get_status`, `scapi_custom_api_generate_scaffold` | [toolsets#scapi](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets#scapi)                   |
| STOREFRONTNEXT | `mrt_bundle_push` + SCAPI tools (auto-enabled for Storefront Next projects)                | [toolsets#storefrontnext](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets#storefrontnext) |
| PWAV3          | `pwakit_get_guidelines` + SCAPI tools                                                      | [toolsets#pwav3](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets#pwav3)                   |

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

### scapi_custom_apis_get_status

Get custom API endpoint registration status. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/scapi-custom-apis-get-status)

- "Use the MCP tool to list custom API endpoints on my instance."
- "Use the MCP tool to show which custom APIs are active vs not registered."

### scapi_custom_api_generate_scaffold

Generate new custom SCAPI endpoint in a cartridge. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/scapi-custom-api-generate-scaffold)

- "Use the MCP tool to scaffold a new custom API named my-products."
- "Use the MCP tool to create a custom admin API called customer-trips."

### pwakit_get_guidelines

Get PWA Kit v3 guidelines. [Details](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/tools/pwakit-get-guidelines)

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
