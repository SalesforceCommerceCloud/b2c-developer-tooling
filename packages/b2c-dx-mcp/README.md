# Salesforce B2C Commerce MCP Server

MCP (Model Context Protocol) server for Salesforce B2C Commerce developer experience tools.

> ⚠️ **Preview Release**: This package is in preview. Tools are functional but require `--allow-non-ga-tools` to enable. Additional tools will be added in future releases.

## Overview

This MCP server enables AI assistants to help with B2C Commerce development tasks. It provides toolsets for **SCAPI**, **CARTRIDGES**, **MRT**, **PWAV3**, and **STOREFRONTNEXT** development.

The server automatically detects your project type and enables relevant tools. See [Available Toolsets and Tools](#available-toolsets-and-tools) for details.

## Usage

### Project Directory and Auto-Discovery

The most important flag is **`--project-directory`** (or env var `SFCC_PROJECT_DIRECTORY`). It tells the server where your project is located, enabling:

1. **Auto-discovery** - Detects your project type and enables appropriate toolsets
2. **Configuration loading** - Reads [`dw.json`](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html#configuration-file) from your project for credentials
3. **Scaffolding** - Creates new files in the correct location

> **Important:** MCP clients like Cursor and Claude Desktop spawn servers from the home directory (`~`), not your project. Always set `--project-directory`.

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

### Project Type Detection

The server analyzes your project directory and enables toolsets based on what it finds:

| Project Type | Detection | Toolsets Enabled |
|--------------|-----------|------------------|
| **PWA Kit v3** | `@salesforce/pwa-kit-*`, `@salesforce/retail-react-app`, or `ccExtensibility` in package.json | PWAV3, MRT, SCAPI |
| **Storefront Next** | Root or a workspace package has `@salesforce/storefront-next*` dependency, or package name starting with `storefront-next`. | STOREFRONTNEXT, MRT, CARTRIDGES, SCAPI |
| **Cartridges** | `.project` file in cartridge directory | CARTRIDGES, SCAPI |
| **No project detected** | No B2C markers found | SCAPI (base toolset only) |

The **SCAPI** toolset is always enabled. Hybrid projects (e.g., cartridges + PWA Kit) get combined toolsets.

### Manual Toolset Selection

Override auto-discovery by specifying toolsets explicitly:

```json
"args": ["--project-directory", "${workspaceFolder}", "--toolsets", "CARTRIDGES,MRT", "--allow-non-ga-tools"]
```

### Prompting Tips and Examples

AI assistants (like Cursor, Claude Desktop) automatically decide which MCP tools to use based on your prompts. To get the best results, use clear, specific prompts that describe what you want to accomplish.

> ⚠️ **IMPORTANT**: **Explicitly mention "Use the MCP tool"** in your prompts for reliable tool usage. While AI assistants (like Cursor's Composer) can automatically select MCP tools based on context, explicit instructions ensure that the assistant prioritizes MCP tools over general knowledge, especially when multiple approaches are possible. This is particularly important for getting project-specific, up-to-date information rather than generic responses.

#### Best Practices

1. **Always explicitly request MCP tool usage** (see warning above): Start prompts with "Use the MCP tool to..." or include "Use the MCP tool" in your request.
2. **Be specific about your goal**: Instead of "help me with Storefront Next", say "Use the MCP tool to show me how to build a product detail page with authentication"
3. **Mention the tool or domain explicitly**: Reference the framework (Storefront Next, PWA Kit), operation (deploy, discover), or domain (SCAPI, cartridges)
4. **Use natural language**: Describe what you want to achieve, not the tool name
5. **Provide context**: Mention your project type, what you're building, or what you need to learn
6. **Ask for guidelines first**: When starting a new project or learning a framework, ask for development guidelines before writing code

#### Examples by Tool Category

##### Storefront Next Development Guidelines

The `storefront_next_development_guidelines` tool provides critical architecture rules and best practices. **Use this tool first** when starting new Storefront Next development or when you need architecture guidance.

**Prompt examples:**
- ✅ "I'm new to Storefront Next. Use the MCP tool to show me the critical rules I need to know."
- ✅ "I need to build a product detail page. Use the MCP tool to show me best practices for data fetching and component patterns."
- ✅ "I need to build a checkout form with authentication and validation. Use the MCP tool to show me how to handle form submissions, authentication, and internationalized error messages."
- ✅ "Use the MCP tool to show me the data fetching patterns for Storefront Next."
- ✅ "Show me all available Storefront Next development guidelines."

**Available sections:**
- `quick-reference` - Critical rules and architecture principles (default)
- `data-fetching` - Data loading patterns with loaders
- `state-management` - Client-side state management
- `auth` - Authentication and session management
- `components` - Component patterns and best practices
- `styling` - Tailwind CSS 4, Shadcn/ui, styling guidelines
- `page-designer` - Page Designer integration
- `performance` - Performance optimization
- `testing` - Testing strategies
- `i18n` - Internationalization patterns
- `config` - Configuration management
- `extensions` - Extension development
- `pitfalls` - Common pitfalls

##### PWA Kit Development

**Prompt examples:**
- ✅ "I'm starting a new PWA Kit project. Use the MCP tool to get the development guidelines."
- ✅ "Use the MCP tool to create a new product listing page component in my PWA Kit project."
- ✅ "Use the MCP tool to recommend React hooks for fetching product data in PWA Kit."

##### SCAPI Discovery

Use **scapi_schemas_list** for both standard SCAPI (Shop, Admin, Shopper APIs) and custom APIs. Use **scapi_custom_apis_status** for endpoint-level registration status (active/not_registered).

**SCAPI Schemas (tool: `scapi_schemas_list`):**

Discover schema metadata and fetch OpenAPI specs for both standard and custom SCAPI:

**Standard SCAPI:**
- ✅ "Use the MCP tool to list all available SCAPI schemas." → list mode (no includeSchemas).
- ✅ "Use the MCP tool to show me what checkout APIs exist." → list with apiFamily: checkout.
- ✅ "Use the MCP tool to discover SCAPI product endpoints." → list with apiFamily: product.
- ✅ "Use the MCP tool to get the OpenAPI schema for shopper-baskets v1." → fetch with apiFamily, apiName, apiVersion, includeSchemas: true.
- ✅ "Use the MCP tool to show me the full OpenAPI spec for shopper-products v1." → fetch with includeSchemas: true, expandAll: true.

**Custom APIs (use apiFamily: "custom"):**
- ✅ "Use the MCP tool to list custom API definitions." → list with apiFamily: custom.
- ✅ "Use the MCP tool to show me the loyalty-points custom API schema." → apiFamily: custom, apiName: loyalty-points, apiVersion: v1, includeSchemas: true.

**Custom API Endpoint Status (tool: `scapi_custom_apis_status`):**

Get registration status of custom API endpoints deployed on the instance (remote only). Returns individual HTTP endpoints (e.g., GET /hello, POST /items/{id}) with registration status (active/not_registered), one row per endpoint per site. Requires OAuth with `sfcc.custom-apis` scope.

- ✅ "Use the MCP tool to list custom SCAPI endpoints on my instance."
- ✅ "Use the MCP tool to show which custom APIs are active vs not registered."
- ✅ "Use the MCP tool to list custom API endpoints grouped by site." → groupBy: site
- ✅ "Use the MCP tool to list custom API endpoints grouped by type." → groupBy: type
- ✅ "Use the MCP tool to list only active custom API endpoints." → status: active
- ✅ "Use the MCP tool to find custom API endpoints that failed to register." → status: not_registered
- ✅ "Use the MCP tool to show endpoint details with all fields." → extended: true
- ✅ "Use the MCP tool to show only apiName and status for active endpoints." → status: active, columns: "apiName,status"

##### Cartridge Deployment

**Prompt examples:**
- ✅ "Use the MCP tool to deploy my cartridges to the sandbox instance."
- ✅ "Use the MCP tool to deploy only the app_storefront_base cartridge to production."
- ✅ "Use the MCP tool to deploy cartridges from the ./cartridges directory and reload the code version."

##### MRT Bundle Operations

**Prompt examples:**
- ✅ "Use the MCP tool to build and push my Storefront Next bundle to staging."
- ✅ "Use the MCP tool to push the bundle from ./build directory to Managed Runtime."
- ✅ "Use the MCP tool to deploy my PWA Kit or Storefront Next bundle to production with a deployment message."

#### Tips for Better Results

- **Start with guidelines**: When learning a new framework, ask for development guidelines first using "Use the MCP tool to get..."
- **Combine related topics**: Ask for multiple related sections (e.g., "data fetching and components") in one request
- **Provide project context**: Mention your project type (Storefront Next, PWA Kit, cartridges) for better tool selection
- **Specify operations clearly**: For deployment operations, mention the target (sandbox, staging, production) and what to deploy

### Configuration

Credentials can be provided via **config files** (recommended), **environment variables**, or **flags**. Priority: Flags > Env vars > Config files.

| Toolset | Required Credentials |
|---------|---------------------|
| **SCAPI** | `hostname` + `client-id` + `client-secret` (for `scapi_custom_apis_status`: requires `sfcc.custom-apis` scope) |
| **CARTRIDGES** | `hostname` + `username` + `password` (or OAuth) |
| **MRT** | `api-key` + `project` (optionally `environment`) |
| **PWAV3** | `--project-directory` only (+ MRT config for deployments) |
| **STOREFRONTNEXT** | `--project-directory` only (+ MRT/CARTRIDGES config for those tools) |

> **Note:** SCAPI and CARTRIDGES use the same `hostname` (your B2C instance). All B2C credentials are typically stored together in `dw.json`.

**Option 1: Config files (recommended)**

B2C credentials — [`dw.json`](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html#configuration-file) in your project root:
```json
{ "hostname": "xxx.demandware.net", "username": "...", "password": "...", "client-id": "...", "client-secret": "..." }
```

MRT credentials — [`~/.mobify`](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html#mobify-config-file) (create manually or via [B2C CLI](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/mrt.html)):
```json
{ "api_key": "..." }
```

**Option 2: Environment variables**
```json
"env": { "SFCC_SERVER": "xxx.demandware.net", "SFCC_USERNAME": "...", "SFCC_PASSWORD": "...", "SFCC_MRT_API_KEY": "..." }
```

**Option 3: Flags**
```json
"args": ["--server", "xxx.demandware.net", "--username", "...", "--password", "...", "--api-key", "..."]
```

See [Flag Reference](#flag-reference) for all available flags and env vars.

- `username`/`password` = B2C username + [WebDAV access key](https://help.salesforce.com/s/articleView?id=cc.b2c_account_manager_sso_use_webdav_file_access.htm&type=5)
- `client-id`/`client-secret` = API client credentials from Account Manager

### Flag Reference

<details>
<summary>Click to expand flag reference</summary>

#### Core Flags

| Flag | Env Variable | Description |
|------|--------------|-------------|
| `--project-directory` | `SFCC_PROJECT_DIRECTORY` | Project directory (enables auto-discovery and config loading) |
| `--toolsets` | — | Comma-separated toolsets to enable |
| `--tools` | — | Comma-separated individual tools to enable |
| `--allow-non-ga-tools` | — | Enable experimental (non-GA) tools |
| `--config` | — | Explicit path to [`dw.json`](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html#configuration-file) (advanced) |
| `--log-level` | — | Logging verbosity (trace, debug, info, warn, error, silent) |
| `--debug` | — | Enable debug logging |

#### B2C Instance Flags

| Flag | Env Variable | Description |
|------|--------------|-------------|
| `--server` | `SFCC_SERVER` | B2C instance hostname |
| `--username` | `SFCC_USERNAME` | Username for Basic auth (WebDAV) |
| `--password` | `SFCC_PASSWORD` | Password/access key for Basic auth |
| `--client-id` | `SFCC_CLIENT_ID` | OAuth client ID |
| `--client-secret` | `SFCC_CLIENT_SECRET` | OAuth client secret |
| `--code-version` | `SFCC_CODE_VERSION` | Code version for deployments |

#### MRT Flags

| Flag | Env Variable | Description |
|------|--------------|-------------|
| `--api-key` | `SFCC_MRT_API_KEY` | MRT API key |
| `--project` | `SFCC_MRT_PROJECT` | MRT project slug |
| `--environment` | `SFCC_MRT_ENVIRONMENT` | MRT environment (staging, production) |
| `--cloud-origin` | `SFCC_MRT_CLOUD_ORIGIN` | MRT cloud origin URL |

</details>

### Available Toolsets and Tools

Use `--toolsets all` to enable all toolsets, or select specific ones with `--toolsets CARTRIDGES,MRT`.

> **Note:** Tools require `--allow-non-ga-tools` to enable (preview release).

#### CARTRIDGES
Cartridge development, deployment, and code version management.
- **Status:** 🚧 Early Access

| Tool | Description |
|------|-------------|
| `cartridge_deploy` | Deploy cartridges to a B2C Commerce instance |

#### MRT
Managed Runtime operations for PWA Kit and Storefront Next deployments.
- **Status:** 🚧 Early Access

| Tool | Description |
|------|-------------|
| `mrt_bundle_push` | Build, push bundle (optionally deploy) |

#### PWAV3
PWA Kit v3 development tools for building headless storefronts.
- **Status:** 🚧 Early Access (PWA Kit-specific tools planned)

| Tool | Description |
|------|-------------|
| `scapi_schemas_list` | List or fetch SCAPI schemas (standard and custom). Use apiFamily: "custom" for custom APIs. |
| `scapi_custom_apis_status` | Get registration status of custom API endpoints (active/not_registered). Remote only, requires OAuth. |
| `mrt_bundle_push` | Build, push bundle (optionally deploy) |

#### SCAPI
Salesforce Commerce API discovery and exploration.
- **Status:** 🚧 Early Access

| Tool | Description |
|------|-------------|
| `scapi_schemas_list` | List or fetch SCAPI schemas (standard and custom). Use apiFamily: "custom" for custom APIs. |
| `scapi_custom_apis_status` | Get registration status of custom API endpoints (active/not_registered). Remote only, requires OAuth. |

#### STOREFRONTNEXT
Storefront Next development tools for building modern storefronts.
- **Status:** 🚧 Early Access

| Tool | Description |
|------|-------------|
| `storefront_next_development_guidelines` | Get Storefront Next development guidelines and best practices |
| `storefront_next_figma_to_component_workflow` | Workflow orchestrator for Figma-to-component conversion. Parses Figma URL, returns step-by-step instructions for subsequent tool calls |
| `storefront_next_generate_component` | Analyze Figma design and discovered components to recommend REUSE, EXTEND, or CREATE strategy |
| `storefront_next_map_tokens_to_theme` | Map Figma design tokens to existing theme tokens in app.css with confidence scores and suggestions |
| `storefront_next_page_designer_decorator` | Add Page Designer decorators to Storefront Next components |
| `scapi_schemas_list` | List or fetch SCAPI schemas (standard and custom). Use apiFamily: "custom" for custom APIs. |
| `scapi_custom_apis_status` | Get registration status of custom API endpoints (active/not_registered). Remote only, requires OAuth. |
| `mrt_bundle_push` | Build, push bundle (optionally deploy) |

**Figma-to-Component Tools** (`storefront_next_figma_to_component_workflow`, `storefront_next_generate_component`, `storefront_next_map_tokens_to_theme`): Require an external Figma MCP server enabled in your MCP client, `--project-directory` pointing to a Storefront Next project, and a valid Figma URL with `node-id`. See [Figma Tools Setup](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/figma-tools-setup) for prerequisites and configuration.

> **Note:** Some tools appear in multiple toolsets (e.g., `mrt_bundle_push`, `scapi_schemas_list`, `scapi_custom_apis_status`). When using multiple toolsets, tools are automatically deduplicated.

## Telemetry

The MCP server collects anonymous usage telemetry to help improve the developer experience. Telemetry is enabled by default.

**Development mode**: Telemetry is automatically disabled when using `bin/dev.js`, so local development and testing won't pollute production data.

### Configuring telemetry

Set options in the `env` object of your server entry in `.cursor/mcp.json` or `~/.cursor/mcp.json` (the client injects these when it starts the server):

- **Disable**: `SF_DISABLE_TELEMETRY=true` or `SFCC_DISABLE_TELEMETRY=true`
- **Custom endpoint**: `SFCC_APP_INSIGHTS_KEY=your-key`

### What We Collect

- **Server lifecycle events**: When the server starts, stops, or encounters errors
- **Tool usage**: Which tools are called and their execution time (not the arguments or results)
- **Command metrics**: Command duration and success/failure status
- **Environment info**: Platform, architecture, Node.js version, and package version

### What We Don't Collect

- **No credentials**: No API keys, passwords, or secrets
- **No business data**: No product data, customer information, or site content
- **No tool arguments**: No input parameters or output results from tool calls
- **No file contents**: No source code, configuration files, or project data

## Development

### Quick Start

```bash
# Install dependencies (from monorepo root)
pnpm install

# Navigate to the package directory
cd packages/b2c-dx-mcp

# Launch MCP Inspector for development (no build needed, uses TypeScript directly)
pnpm run inspect:dev

# Launch MCP Inspector with production build (runs build first)
pnpm run inspect

# Build the package
pnpm run build

# Run tests (includes linting)
pnpm run test

# Format code
pnpm run format

# Run linter only
pnpm run lint

# Clean build artifacts
pnpm run clean
```

### Project Directory

Commands should be run from the `packages/b2c-dx-mcp` directory:

```bash
cd packages/b2c-dx-mcp
```

Or use pnpm's filter flag from the monorepo root:

```bash
pnpm --filter @salesforce/b2c-dx-mcp run <script>
```

### Testing the MCP Server Locally

#### 1. MCP Inspector

Use MCP Inspector to browse tools and test them in a web UI:

```bash
pnpm run inspect:dev
```

This runs TypeScript directly (no build needed). Open the localhost URL shown in the terminal, click **Connect**, then **List Tools** to see available tools.

For CLI-based testing:

```bash
# List all tools
npx mcp-inspector --cli node bin/dev.js --toolsets all --allow-non-ga-tools --method tools/list

# Call a specific tool
npx mcp-inspector --cli node bin/dev.js --toolsets all --allow-non-ga-tools \
  --method tools/call \
  --tool-name storefront_next_page_designer_decorator
```

#### 2. IDE Integration

Configure your IDE to use the local MCP server. Add this to your IDE's MCP configuration:

```json
{
  "mcpServers": {
    "b2c-dx-local": {
      "command": "node",
      "args": [
        "/full/path/to/packages/b2c-dx-mcp/bin/dev.js",
        "--toolsets", "all",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

> **Note:** Make sure that the script is executable: `chmod +x /full/path/to/packages/b2c-dx-mcp/bin/dev.js`
>
> The script's shebang (`#!/usr/bin/env -S node --conditions development`) handles Node.js setup automatically.

> **Note:** Restart the MCP server in your IDE to pick up code changes.

#### 3. JSON-RPC via stdin

Send raw MCP protocol messages:

```bash
# List all tools (--allow-non-ga-tools required for preview tools)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node bin/dev.js --toolsets all --allow-non-ga-tools

# Call a specific tool
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"cartridge_deploy","arguments":{}}}' | node bin/dev.js --toolsets all --allow-non-ga-tools
```

## License

Apache-2.0
