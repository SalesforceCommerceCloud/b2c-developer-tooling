---
description: Deploy cartridges to a B2C Commerce instance via WebDAV with automatic code version reload.
---

# cartridge_deploy

Deploys cartridges to a B2C Commerce instance via WebDAV. Finds cartridges by `.project` files, creates a ZIP archive, uploads via WebDAV, and optionally reloads the code version.

## Overview

The `cartridge_deploy` tool automates cartridge deployment to B2C Commerce instances. It:

1. Searches the specified directory for cartridges (identified by `.project` files).
2. Applies the include/exclude filters to select which cartridges to deploy.
3. Creates a ZIP archive of all selected cartridge directories.
4. Uploads the ZIP to WebDAV and triggers server-side unzip.
5. Optionally reloads the code version after deployment.

This tool is useful for deploying custom code cartridges for SFRA or other B2C Commerce code. It requires the instance to have a code version configured.

## Authentication

Supports two authentication methods:

- **Basic Authentication (WebDAV)** - See [B2C Credentials](../configuration#b2c-credentials) (Username/Password section)
- **OAuth** - See [B2C Credentials](../configuration#b2c-credentials) (OAuth Client Credentials section)

**Configuration Priority:**
1. Flags (`--server`, `--username`, `--password`, `--client-id`, `--client-secret`)
2. Environment variables (`SFCC_SERVER`, `SFCC_USERNAME`, `SFCC_PASSWORD`, `SFCC_CLIENT_ID`, `SFCC_CLIENT_SECRET`)
3. `dw.json` config file (auto-discovered or via `--config` flag)

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `directory` | string | No | Current working directory | Path to directory to search for cartridges. The tool recursively searches for `.project` files to identify cartridges. |
| `cartridges` | string[] | No | All found cartridges | Array of cartridge names to include in the deployment. Use this to selectively deploy specific cartridges when you have multiple cartridges but only want to update some. |
| `exclude` | string[] | No | None | Array of cartridge names to exclude from the deployment. Use this to skip deploying certain cartridges, such as third-party or unchanged cartridges. Applied after the include filter. |
| `reload` | boolean | No | `false` | Whether to reload the code version after deployment. When `true`, the tool triggers a code version reload on the instance. |

## Usage Examples

### Basic Deployment

Deploy all cartridges found in the current directory:

```
Use the MCP tool to deploy my cartridges to the sandbox instance.
```

### Deploy Specific Cartridges

Deploy only selected cartridges:

```
Use the MCP tool to deploy only the app_storefront_base cartridge to production.
```

### Deploy from Specific Directory

Deploy cartridges from a specific directory:

```
Use the MCP tool to deploy cartridges from the ./cartridges directory and reload the code version.
```

### Exclude Cartridges

Deploy all cartridges except certain ones:

```
Use the MCP tool to deploy cartridges excluding test_cartridge and bm_extensions.
```

## Output

Returns a deployment result object containing:

- `cartridges` - Array of cartridge names that were deployed
- `codeVersion` - Code version name used for deployment
- `hostname` - Instance hostname where cartridges were deployed
- `reloaded` - Whether the code version was reloaded (if `reload: true`)

## Requirements

- B2C Commerce instance with WebDAV access
- Code version configured on the instance
- Cartridges must have `.project` files in their directories
- Valid authentication credentials (Basic auth or OAuth)

## Related Tools

- Part of the [CARTRIDGES](../toolsets#cartridges) toolset
- Auto-enabled for cartridge projects (detected by `.project` file)

## See Also

- [CARTRIDGES Toolset](../toolsets#cartridges) - Overview of cartridge development tools
- [Authentication Setup](../../guide/authentication) - Set up WebDAV access and OAuth credentials
- [Configuration](../configuration) - Configure credentials and instance settings
- [CLI Reference](../../cli/code) - Equivalent CLI command: `b2c code deploy`
