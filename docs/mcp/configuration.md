---
description: Configure the B2C DX MCP Server with credentials, flags, environment variables, and toolset selection.
---

# Configuration

The B2C DX MCP Server uses the same configuration system as the B2C CLI.

See the shared [Configuration guide](../guide/configuration) and [Authentication Setup guide](../guide/authentication) for credential formats and setup details.

## Credentials

### `dw.json` (Recommended) {#dw-json}

Create a [`dw.json`](../guide/configuration#configuration-file) file in your project root. The MCP server uses the same format as the CLI and loads it automatically with project-level installation.

```json
{
  "hostname": "xxx.demandware.net",
  "username": "...",
  "password": "...",
  "client-id": "...",
  "client-secret": "...",
  "short-code": "...",
  "tenant-id": "..."
}
```

With user-level Cursor configuration, add `--project-directory "${workspaceFolder}"` to the args array so the server can find `dw.json`. Claude Code and GitHub Copilot automatically detect the project location.

See the [Configuration guide](../guide/configuration#configuration-file) for the complete `dw.json` format, supported fields, and multi-instance configuration.

**Required fields per toolset:**

| Toolset            | Required Fields                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SCAPI**          | `short-code`, `tenant-id`, `client-id`, `client-secret`                                                                                                                                           |
| **CARTRIDGES**     | `hostname`, `username`, `password` (or OAuth: `hostname`, `client-id`, `client-secret`)                                                                                                           |
| **MRT**            | `mrtProject`, `mrtApiKey` (or `api_key` in `~/.mobify`, or `MRT_API_KEY` env var). `mrtEnvironment` required when deploying.                                                                      |
| **PWAV3**          | None for guidelines tools (project directory auto-detected). MRT credentials (`mrtProject`, `mrtEnvironment`, `mrtApiKey`) required for `mrt_bundle_push` and the `mrt_logs_watch_*` tools.       |
| **STOREFRONTNEXT** | None for guidelines/Figma tools (project directory auto-detected). MRT credentials (`mrtProject`, `mrtEnvironment`, `mrtApiKey`) required for `mrt_bundle_push` and the `mrt_logs_watch_*` tools. |

**Note:** The `mrt_logs_watch_*` tools also appear in the always-on **DIAGNOSTICS** toolset and require the same MRT credentials (`mrtProject`, `mrtEnvironment`, `mrtApiKey`). Some tools require specific scopes. See [Configuring Scopes](../guide/authentication#configuring-scopes) in the Authentication Setup guide and individual tool pages for scope requirements.

### `.env` File {#env-file}

As an alternative to `dw.json`, you can place a `.env` file in your project root. For project-aware tool calls, the server parses the `.env` from the effective `projectDirectory` and applies all supported B2C/MRT variables during configuration resolution. Arbitrary project variables are also retained for tools that consume them, such as `THEMING_FILES`.

```bash
SFCC_SERVER=xxx.demandware.net
SFCC_CLIENT_ID=...
SFCC_CLIENT_SECRET=...
SFCC_SHORTCODE=...
SFCC_TENANT_ID=...
```

The project `.env` can also point to a shared `dw.json`. Relative `SFCC_CONFIG` paths are resolved from `projectDirectory`:

```bash
SFCC_CONFIG=./config/shared.dw.json
```

Project `.env` values are scoped to the tool call instead of being copied permanently into the long-lived MCP process, preventing one project's environment from leaking into another project.

See the [Environment Variables Reference](#environment-variables-reference) for the complete list of supported variables.

### MRT Credentials (`~/.mobify`) {#mrt-credentials}

MRT tools require an API key. You can include `mrtApiKey`, `mrtProject`, and `mrtEnvironment` in `dw.json` (see [required fields](#dw-json) above), or store the API key in a separate [`~/.mobify`](../guide/configuration#mrt-api-key) file (user-level, shared across projects):

```json
{
  "api_key": "your-mrt-api-key"
}
```

**`~/.mobify` file locations:**

- Default: `~/.mobify`
- With `--cloud-origin`: `~/.mobify--{hostname}` (e.g., `~/.mobify--custom.example.com`)
- With `--credentials-file` (or `MRT_CREDENTIALS_FILE`): uses the specified path

If both `dw.json` and `~/.mobify` contain an API key, `dw.json` takes precedence. For complete setup instructions, see the [Authentication Guide](../guide/authentication#managed-runtime-api-key).

## Per-call Project Context {#project-directory}

Tools expose only the context they consume. Local project tools accept `projectDirectory`. Tools that resolve B2C/MRT configuration use the same three flat, optional arguments:

- `projectDirectory` is an absolute project root for the call. It overrides the server-level project directory. When omitted, the server-level directory is used if configured; otherwise the MCP process working directory is used. Run `config_inspect` to see the resolved paths.
- `configPath` selects the primary configuration file in `dw.json` format. Relative paths resolve from `projectDirectory`. The shared default `dw.json` remains available for fallback and named-instance lookup.
- `instanceName` selects a named instance from the primary and shared default files without changing either file. The primary file is searched first. When omitted, the active/default instance is used.

Specialized roots such as `cartridgeDirectory`, `buildDirectory`, and `outputDirectory` remain separate and resolve from `projectDirectory` when relative. Pure documentation tools and follow-up calls that operate only on existing server-side state do not expose project or configuration fields.

The server resolves the project directory in this order:

1. **Per-call tool argument** (highest) — every tool that needs project context accepts an explicit `projectDirectory`. This is the reliable outlet when the agent knows the project path.
2. **`--project-directory` flag / `SFCC_PROJECT_DIRECTORY` env var** — set once in `mcp.json` for the whole server.
3. **Process working directory** (`cwd`) — the fallback, but **MCP clients disagree on what the working directory is**. Claude Code and GitHub Copilot set it to the project root; Cursor user-level config (`~/.cursor/mcp.json`) sets it to your home directory. Because it's inconsistent, don't rely on it alone.

For reliable behavior, either set `--project-directory "${workspaceFolder}"` (or your client's project-path variable) in `mcp.json`, or let the agent pass `projectDirectory` per call. A per-call override controls both project-local configuration discovery (`.env`, `SFCC_CONFIG`, and `dw.json`) and relative filesystem paths. Use `configPath` when the desired `dw.json`-format file is not the project default. JSON-returning filesystem tools echo the resolved directory back in their output so you can confirm which path was used.

Each configuration-aware call selects its primary configuration path in this order, then adds the global `dw.json` to the available instances:

1. Per-call `configPath`
2. Server startup `--config` / `SFCC_CONFIG`
3. `SFCC_CONFIG` from `${projectDirectory}/.env`
4. `${projectDirectory}/dw.json`
5. The shared global `dw.json` set with `b2c setup default-config set <path>`
6. Other normal configuration sources

This list selects the primary `dw.json`-format file. Individual configuration values are still merged according to the normal CLI source priority (explicit flags/environment, plugin sources, `dw.json`, MRT credentials, and `package.json`).

The global `dw.json` is shared with the CLI and B2C DX VS Code extension. It is useful when an MCP client starts the server outside your project or when you want its instances available alongside project instances.

The primary and global `dw.json` files form one instance catalog. An instance named by the MCP `instanceName` argument, CLI `--instance`, or `SFCC_INSTANCE` is searched in the primary file first and then the global file; same-name primary entries shadow global entries. The selected instance's fields are not merged across files.

Configuration- and project-aware tools return an authoritative, compact `resolution` block showing the effective project directory, selected configuration file, instance name, target hostname, and any specialized directories, together with the source of each choice. Session and watch start tools capture this block; their corresponding list tools return it so callers do not need to repeat context on follow-up calls.

::: tip Diagnosing configuration
Run the `config_inspect` tool (ask your agent to "inspect the B2C MCP configuration") to see the resolved configuration — instance, auth, SCAPI/MRT settings, the complete source graph, and the same compact `resolution` block returned by ordinary tools. Secrets are redacted by default.
:::

`config_inspect` uses the same SDK `loadConfig` resolver and globally registered CLI plugin configuration sources as `b2c setup inspect`. Given the same installed plugins, environment, `projectDirectory`, `configPath`, and `instanceName`, its resolved values and source provenance follow the same pipeline; MCP adds compact call-resolution context to its response.

This is the [Agent Plugins](https://agent-plugins.org/plugin-authors/mcp-servers) `cwd` model: when a plugin declares an MCP server without an explicit `cwd`, the working directory defaults to the plugin root rather than your open project — which is exactly why the explicit outlets above matter.

## Configuration Priority

When the same setting is provided in multiple places, the server resolves values in this order:

1. **Flags** (highest) — e.g., `--server`, `--api-key` in the `args` array
2. **Environment variables** — via `.env` file, MCP client `env` object, or system environment
3. **Config files** (lowest) — `dw.json` and `~/.mobify`

In practice, you rarely need flags or env vars in `mcp.json` — `dw.json` and `.env` handle most cases. Flags and the `env` object are available for overrides or CI environments.

## Toolset Selection

### Auto-Discovery (Default)

By default, the server automatically detects your project type and enables relevant toolsets. No configuration needed. See [Project Type Detection](./#project-type-detection) for details.

### Manual Selection

Override auto-discovery with `--toolsets` or `SFCC_TOOLSETS`:

```json
{
  "mcpServers": {
    "b2c-dx-mcp": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--toolsets", "CARTRIDGES,MRT", "--allow-non-ga-tools"]
    }
  }
}
```

**Available toolsets:** `CARTRIDGES`, `MRT`, `PWAV3`, `SCAPI`, `STOREFRONTNEXT`, `all`

With auto-discovery, the `SCAPI` toolset is always included. When using `--toolsets` or `--tools`, only the specified toolsets/tools are enabled.

### Individual Tool Selection

Enable specific tools instead of entire toolsets:

```json
{
  "args": ["--tools", "cartridge_deploy,scapi_schemas_list", "--allow-non-ga-tools"]
}
```

## Logging

Set logging verbosity with `--log-level` or `SFCC_LOG_LEVEL`:

```json
{
  "args": ["--log-level", "debug"]
}
```

**Available levels:** `trace`, `debug`, `info`, `warn`, `error`, `silent`

The `--debug` flag (or `SFCC_DEBUG`) is a shorthand for `--log-level debug`.

## Telemetry

Telemetry is enabled by default and collects anonymous usage data to help improve the developer experience.

**What we collect:** server lifecycle events, tool usage (which tools and execution time), command metrics, and environment info (platform, Node.js version, package version).

**What we don't collect:** credentials, business data, tool arguments/results, or file contents.

To disable, set either variable in your `.env` file or MCP client `env` object:

| Variable                 | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `SFCC_DISABLE_TELEMETRY` | Set to `true` to disable telemetry                   |
| `SF_DISABLE_TELEMETRY`   | Set to `true` to disable telemetry (sf CLI standard) |

## MCP Server Flags Reference {#mcp-server-flags}

Flags specific to the MCP server (in addition to the shared CLI flags in the [Configuration guide](../guide/configuration)):

| Flag                   | Type    | Default     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--toolsets`           | string  | Auto-detect | Toolsets to enable (comma-separated)                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `--tools`              | string  | -           | Individual tools to enable (comma-separated)                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `--docs-topics`        | string  | All         | Hard configuration allowlist bounding the docs tools' corpus to these categories (comma-separated): `script-api`, `job-step`, `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`, `tooling`, `help-admin`, `help-merchant`. Per-call `category` hard-filters within the allowlist; `workspace` (comma-separated multi-value allowed, e.g. `sfra,pwa-kit-v3`) boosts relevant categories and de-boosts competing storefront frameworks within the allowlist |
| `--allow-non-ga-tools` | boolean | `false`     | Enable non-GA (experimental) tools                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

Environment variable equivalents for these flags are listed in [MCP Server Environment Variables](#mcp-server-environment-variables).

### Documentation Tools Restriction

The `--docs-topics` flag (or `SFCC_DOCS_TOPICS` env var) sets a hard configuration boundary for the entire corpus available to the `docs_*` tools. When set, it affects tool behavior in several ways:

- **Tool schemas** - The `category` parameter enums narrow to only the allowlisted categories
- **Tool descriptions** - Tools note the restriction in their descriptions shown to the AI agent
- **ID resolution** - `docs_read` will reject document IDs outside the allowlist
- **Per-call filtering** - The `category` parameter hard-filters to one allowlisted category; the `workspace` parameter (comma-separated multi-value allowed, e.g. `sfra,pwa-kit-v3`) provides boosting (relevance weighting) and de-boosting within the allowlist, but never hides results

Unknown category names in the allowlist are ignored with a warning at server startup.

Unlike `--docs-topics`, which is a startup-time configuration boundary, the per-call `workspace` parameter only affects ranking and never filters content from view.

## Environment Variables Reference {#environment-variables-reference}

These can be set in a `.env` file, the MCP client `env` object, or as system environment variables.

### MCP Server Environment Variables {#mcp-server-environment-variables}

MCP-specific environment variables (flag equivalents):

| Env Variable              | Equivalent Flag        | Type    | Default     | Description                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------- | ---------------------- | ------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SFCC_TOOLSETS`           | `--toolsets`           | string  | Auto-detect | Toolsets to enable (comma-separated)                                                                                                                                                                                                                                                                                                                                                                                  |
| `SFCC_TOOLS`              | `--tools`              | string  | -           | Individual tools to enable (comma-separated)                                                                                                                                                                                                                                                                                                                                                                          |
| `SFCC_DOCS_TOPICS`        | `--docs-topics`        | string  | All         | Hard configuration allowlist bounding the docs tools' corpus to these categories (comma-separated): `script-api`, `job-step`, `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`, `tooling`, `help-admin`, `help-merchant`. Per-call `category` hard-filters within the allowlist; `workspace` boosts relevant categories and de-boosts competing storefront frameworks within the allowlist |
| `SFCC_ALLOW_NON_GA_TOOLS` | `--allow-non-ga-tools` | boolean | `false`     | Enable non-GA (experimental) tools                                                                                                                                                                                                                                                                                                                                                                                    |

**B2C instance:**

| Variable             | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| `SFCC_SERVER`        | B2C instance hostname                                           |
| `SFCC_CODE_VERSION`  | Code version for deployments                                    |
| `SFCC_USERNAME`      | Username for Basic auth (WebDAV)                                |
| `SFCC_PASSWORD`      | Password/access key for Basic auth                              |
| `SFCC_CLIENT_ID`     | OAuth client ID (`SFCC_OAUTH_CLIENT_ID` also supported)         |
| `SFCC_CLIENT_SECRET` | OAuth client secret (`SFCC_OAUTH_CLIENT_SECRET` also supported) |
| `SFCC_SHORTCODE`     | SCAPI short code                                                |
| `SFCC_TENANT_ID`     | Organization/tenant ID                                          |

**MRT:**

| Variable               | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| `MRT_API_KEY`          | MRT API key (`SFCC_MRT_API_KEY` also supported)             |
| `MRT_PROJECT`          | MRT project slug (`SFCC_MRT_PROJECT` also supported)        |
| `MRT_ENVIRONMENT`      | Target environment (`SFCC_MRT_ENVIRONMENT` also supported)  |
| `MRT_CLOUD_ORIGIN`     | MRT API origin URL (`SFCC_MRT_CLOUD_ORIGIN` also supported) |
| `MRT_CREDENTIALS_FILE` | Path to MRT credentials file (overrides `~/.mobify`)        |

**General:**

| Variable                 | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| `SFCC_PROJECT_DIRECTORY` | Project directory (`SFCC_WORKING_DIRECTORY` also supported) |
| `SFCC_CONFIG`            | Path to config file                                         |
| `SFCC_INSTANCE`          | Instance name from configuration file                       |
| `SFCC_LOG_LEVEL`         | Logging level                                               |
| `SFCC_DEBUG`             | Enable debug logging                                        |

See the [Configuration guide](../guide/configuration#environment-variables) for the complete list including OAuth and advanced options.

## Next Steps

- [Installation](./installation) - Set up the MCP server
- [Configuration](../guide/configuration) - Learn about `dw.json`, environment variables, and credential resolution
- [Authentication Setup](../guide/authentication) - Set up API clients, WebDAV access, and MRT API keys
- [Toolsets & Tools](./toolsets) - Explore available toolsets and tools
- [MCP Server Overview](./) - Learn more about the MCP server
