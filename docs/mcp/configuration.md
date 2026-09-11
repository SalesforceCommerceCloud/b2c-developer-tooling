---
description: Customize B2C MCP tools, documentation topics, startup defaults, and saved workflows.
---

# MCP Configuration

The MCP uses the same B2C Commerce configuration as the CLI and IDE extension.
See [Configuration](../guide/configuration) for project files, environment variables,
and named instances, and [Authentication](../guide/authentication) for credentials
and API access. Documentation and skills need no B2C Commerce credentials.

This page covers settings specific to running the MCP server.

## Startup configuration {#advanced-manual-configuration}

Plugin installation needs no additional launch settings. For a
[manual installation](./#setup), add options to the server command in your client's
MCP configuration. For example, to select two toolsets:

```bash
npx -y @salesforce/b2c-dx-mcp@latest --toolsets CARTRIDGES,MRT
```

Set startup environment variables in your MCP client's server configuration or
the environment that launches it. Use that environment for toolset and documentation
selection; project `.env` files supply per-project B2C configuration.
Restart the MCP connection after changing startup settings.

### Project defaults {#project-directory}

Your assistant can select a project or named instance for each task. To fix a
startup default, use the shared `--project-directory`, `--config`, or `--instance`
options. See [Configuration](../guide/configuration) for their values and file formats.
These defaults do not restrict which projects the assistant can access.

## Tools and toolsets {#toolset-selection}

All toolsets are enabled by default. Use names from [MCP Tools](./toolsets) to
choose a subset:

| Option       | Environment variable | Selection                                                                |
| ------------ | -------------------- | ------------------------------------------------------------------------ |
| `--toolsets` | `SFCC_TOOLSETS`      | Comma-separated toolsets, such as `CARTRIDGES,MRT`.                      |
| `--tools`    | `SFCC_TOOLS`         | Comma-separated tool names, such as `skills_read,docs_search,docs_read`. |

Explicit selection replaces the default of all toolsets. Combining `--toolsets`
and `--tools` includes both selections. Valid toolsets are `CARTRIDGES`,
`DIAGNOSTICS`, `MRT`, `PWAV3`, `SCAPI`, `STOREFRONTNEXT`, and `all`.

Toolsets include shared skills and documentation. When selecting individual tools,
include `skills_read` for the skill collections and the documentation tools you
want. Invalid names are ignored; if no valid selection remains, the server
falls back to all toolsets.

## Documentation topics {#documentation-tools-restriction}

Use `--docs-topics` or `SFCC_DOCS_TOPICS` to select documentation topics,
separated by commas:

`script-api`, `job-step`, `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`,
`sfra`, `b2c-commerce`, `tooling`, `help-admin`, `help-merchant`.

Omit this option to include all available topics. It does not restrict the
included skills.

## Saved workflows {#saved-workflows}

Saved SCAPI workflows remain available across sessions and clients. To back them
up, copy the `scapi/snippets/` folder from your B2C data directory:

- macOS/Linux: `~/.local/share/b2c/scapi/snippets/`
- Windows: `%LOCALAPPDATA%\b2c\scapi\snippets\`

These are the default locations; a custom B2C data directory changes the path.
Built-in workflows update with the package and are separate from your saved files.

## Logging

Use `--log-level debug` temporarily when investigating a connection or
configuration problem. Review logs before sharing them.

See [Security and Access](./security#protect-credentials-and-data) before sharing logs.
