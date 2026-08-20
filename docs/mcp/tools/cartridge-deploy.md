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

| Parameter            | Type     | Required | Default                       | Description                                                                                                                                                                                                                                     |
| -------------------- | -------- | -------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projectDirectory`   | string   | No       | Server project directory/cwd  | Absolute project root used for configuration discovery and relative path resolution. Run `config_inspect` to see the resolved paths.                                                                                                            |
| `configPath`         | string   | No       | Resolved from project context | Primary `dw.json`-format configuration file. Relative paths resolve from `projectDirectory`; the shared default remains available for instance lookup.                                                                                          |
| `instanceName`       | string   | No       | Active/default instance       | Named instance selected from the primary file first, then the shared default `dw.json`.                                                                                                                                                         |
| `cartridgeDirectory` | string   | No       | `projectDirectory`            | Cartridge discovery root. Relative paths resolve from `projectDirectory`.                                                                                                                                                                       |
| `directory`          | string   | No       | —                             | Deprecated alias for `cartridgeDirectory`.                                                                                                                                                                                                      |
| `cartridges`         | string[] | No       | All found cartridges          | Array of cartridge names to include in the deployment. Use this to selectively deploy specific cartridges when you have multiple cartridges but only want to update some. If not specified, all cartridges found in the directory are deployed. |
| `exclude`            | string[] | No       | None                          | Array of cartridge names to exclude from the deployment. Use this to skip deploying certain cartridges, such as third-party or unchanged cartridges. Applied after the include filter.                                                          |
| `reload`             | boolean  | No       | `false`                       | Whether to reload the code version after deployment. When `true`, the tool triggers a code version reload on the instance.                                                                                                                      |

### Usage

Deploy all cartridges:

```
Deploy my cartridges to the sandbox instance.
```

Deploy specific cartridges and reload the code version:

```
Deploy app_storefront_base and reload the code version.
```

**Returns:** deployed cartridge mappings, code version, reload status, and a `resolution` block identifying the selected project, configuration, instance, hostname, and cartridge directory.

## See Also

- [CARTRIDGES Toolset](../toolsets#cartridges) - Overview of cartridge development tools
- [Authentication Setup](../../guide/authentication) - Set up WebDAV access and OAuth credentials
- [Configuration](../configuration) - Configure credentials and instance settings
- [CLI Reference](../../cli/code) - Equivalent CLI command: `b2c code deploy`
