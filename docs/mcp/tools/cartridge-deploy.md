---
description: Deploy cartridges to a B2C Commerce instance via WebDAV with automatic code version reload.
---

# Cartridge Deployment

MCP tools for deploying cartridge code to a B2C Commerce instance. Part of the **CARTRIDGES** toolset; auto-enabled for cartridge projects.

## cartridge_deploy

Deploys cartridges to a B2C Commerce instance via WebDAV. Searches for cartridges by `.project` files, creates a ZIP archive, uploads it, and optionally reloads the code version.

### Authentication

Requires WebDAV access credentials. Supports two authentication methods:

**Required:**

- **Basic Auth (recommended)** - `hostname`, `username`, and `password` (WebDAV access key). Provides better performance for WebDAV operations.
- **OAuth** - `hostname`, `client-id`, and `client-secret`. Requires WebDAV Client Permissions configured.

**Configuration priority:** Flags → Environment variables → `dw.json` config file

See [Configuration](../configuration) for complete credential setup details including flags and environment variables. See [Authentication Setup](../../guide/authentication#webdav-access) for WebDAV access key and OAuth configuration instructions.

### Parameters

| Parameter    | Type     | Required | Default                                                         | Description                                                                                                                                                                                                                                     |
| ------------ | -------- | -------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `directory`  | string   | No       | Project directory (from `--project-directory` or auto-detected) | Path to directory to search for cartridges. The tool recursively searches for `.project` files to identify cartridges.                                                                                                                          |
| `cartridges` | string[] | No       | All found cartridges                                            | Array of cartridge names to include in the deployment. Use this to selectively deploy specific cartridges when you have multiple cartridges but only want to update some. If not specified, all cartridges found in the directory are deployed. |
| `exclude`    | string[] | No       | None                                                            | Array of cartridge names to exclude from the deployment. Use this to skip deploying certain cartridges, such as third-party or unchanged cartridges. Applied after the include filter.                                                          |
| `reload`     | boolean  | No       | `false`                                                         | Whether to reload the code version after deployment. When `true`, the tool triggers a code version reload on the instance.                                                                                                                      |

### Usage

Deploy all cartridges:

```
Deploy my cartridges to the sandbox instance.
```

Deploy specific cartridges and reload the code version:

```
Deploy app_storefront_base and reload the code version.
```

**Returns:** `{cartridges, codeVersion, reloaded}` — array of deployed cartridge mappings, code version name, and whether the code version was reloaded.

## See Also

- [CARTRIDGES Toolset](../toolsets#cartridges) - Overview of cartridge development tools
- [Authentication Setup](../../guide/authentication) - Set up WebDAV access and OAuth credentials
- [Configuration](../configuration) - Configure credentials and instance settings
- [CLI Reference](../../cli/code) - Equivalent CLI command: `b2c code deploy`
