---
description: Choose the project, credentials, and tools available to your B2C Commerce coding assistant.
---

# Configuration

Configure the MCP for the project and environments you intend your assistant to
use. It shares credential formats with the B2C CLI and VS Code extension.

## Project and instance {#project-directory}

Set `--project-directory /absolute/path/to/project` in your MCP launch arguments.
This selects the default project for configuration and local files. Do not
rely on the client's starting directory, especially with user-level or plugin
installations.

To use a particular configuration file or named instance, add `--config` and
`--instance` to the launch arguments. Relative configuration paths resolve from
the project directory. A shared global configuration may also provide defaults
and named instances; see [shared configuration](../guide/configuration).

Ask your assistant to **inspect the B2C MCP configuration** with `config_inspect`
to confirm the project, instance, and hostname. Secrets are redacted by default.
This usually avoids opening credential files manually and shows which sources
provided the effective settings.
Tools that support multiple projects can select a different project or instance
for an individual task, so verify the target before deploying or debugging.

Documentation tools can use the task's project to tailor storefront results.
Skills are available independently of the project directory. The server's
launch directory does not determine tool availability.

## Credentials {#dw-json}

Use your project's `dw.json`, environment variables, or existing shared B2C
configuration. Skills and documentation do not require Commerce credentials.
For connected operations, configure only the access you need:

| Capability                     | Required access                                                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cartridge deployment           | Instance hostname, code version, and WebDAV write credentials. Reloading also requires the relevant OCAPI access.                                  |
| Instance logs                  | Instance hostname and WebDAV log-read credentials.                                                                                                 |
| Script debugging               | Instance hostname and Business Manager username/password or access key with debugger permission. OAuth is not supported.                           |
| SCAPI offline discovery        | No Commerce credentials required.                                                                                                                  |
| SCAPI Admin execution          | Short code, tenant ID, and Account Manager client credentials with the operation's API scopes; for example, `sfcc.products.rw` to create products. |
| SCAPI live schemas             | Short code, tenant ID, and OAuth client with `sfcc.scapi-schemas` scope.                                                                           |
| Custom API registration status | Short code, tenant ID, and OAuth client with `sfcc.custom-apis` scope.                                                                             |
| MRT bundles and logs           | MRT API key and project. Select an environment for deployment or live logs.                                                                        |

See [authentication setup](../guide/authentication) for creating clients, setting
scopes, and configuring WebDAV. See [configuration file formats](../guide/configuration#configuration-file)
for `dw.json` examples and named instances. See [security](./security) before
sharing credentials or enabling write operations.

### Environment variables {#env-file}

A project `.env` file can supply B2C and MRT configuration. For example:

```dotenv
SFCC_SERVER=your-sandbox.demandware.net
SFCC_CODE_VERSION=your-code-version
SFCC_CONFIG=./config/dw.json
```

Keep credential-bearing files out of version control. See the
[environment variable reference](../guide/configuration#environment-variables)
for authentication variables and precedence. Explicit launch flags and environment
settings can override values in configuration files.

### Managed Runtime credentials {#mrt-credentials}

Provide `mrtApiKey`, `mrtProject`, and, where needed, `mrtEnvironment` in your
B2C configuration. Existing `~/.mobify` credentials are also supported.
`MRT_API_KEY`, `MRT_PROJECT`, and `MRT_ENVIRONMENT` are the corresponding
environment variables. See [MRT authentication](../guide/authentication#managed-runtime-api-key).

## Tool selection {#toolset-selection}

Find exact tool names in [Tools and Capabilities](./toolsets).
All toolsets are enabled by default. To choose a smaller set, append either
option to the MCP server launch arguments:

```bash
--toolsets CARTRIDGES,MRT
```

```bash
--tools skills_read,docs_search,docs_read
```

Explicit selection replaces the default of all toolsets. Combining `--toolsets` and
`--tools` includes both selections. Valid toolsets are `CARTRIDGES`, `DIAGNOSTICS`,
`MRT`, `PWAV3`, `SCAPI`, `STOREFRONTNEXT`, and `all`.

Skills and documentation are included with every toolset. When selecting
individual tools, include `skills_read` for the broader skill collections and
the documentation tools you want. MCP-specific skill resources remain available.
Check the
client's tool list after changing configuration: invalid names are ignored, and
if no valid selection remains the server falls back to all toolsets.

### Launch options {#mcp-server-flags}

| Option                | Environment variable     | Use                                                         |
| --------------------- | ------------------------ | ----------------------------------------------------------- |
| `--project-directory` | `SFCC_PROJECT_DIRECTORY` | Select the project.                                         |
| `--config`            | `SFCC_CONFIG`            | Select a B2C configuration file.                            |
| `--instance`          | `SFCC_INSTANCE`          | Select a named instance.                                    |
| `--toolsets`          | `SFCC_TOOLSETS`          | Enable toolsets, comma-separated.                           |
| `--tools`             | `SFCC_TOOLS`             | Enable individual tools, comma-separated.                   |
| `--docs-topics`       | `SFCC_DOCS_TOPICS`       | Limit documentation topics.                                 |
| `--log-level`         | `SFCC_LOG_LEVEL`         | Set `trace`, `debug`, `info`, `warn`, `error`, or `silent`. |

Set launch environment variables in your MCP client's server configuration or
the environment that starts the server. Project `.env` files supply per-project
credentials and settings; use the client environment for startup options.

### Documentation topics {#documentation-tools-restriction}

`--docs-topics` accepts `script-api`, `job-step`, `commerce-api`,
`pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`, `tooling`,
`help-admin`, and `help-merchant`, separated by commas. Omit it to make all
available topics accessible. It does not restrict bundled workflow skills.

## Saved workflows {#saved-workflows}

Built-in SCAPI workflows are included with the package. User-saved workflows live
under `scapi/snippets/` in the shared B2C data directory, normally
`~/.local/share/b2c` on macOS/Linux or `%LOCALAPPDATA%\b2c` on Windows. Oclif data
directory overrides apply. This storage is shared across MCP clients and the B2C
CLI installation; a separate client profile alone does not isolate it.

Each user workflow is a JSON file containing JavaScript source, its description,
and input schema. Back up these files to preserve your workflows; remove a file
to remove that workflow. Existing names are not overwritten when saving. Built-in
workflows update with the package and are separate from your saved files.

## Logging and telemetry

Use `--log-level debug` temporarily when investigating a connection or
configuration problem. Review logs before sharing them.

For telemetry settings and data handling, see [security](./security#telemetry).
