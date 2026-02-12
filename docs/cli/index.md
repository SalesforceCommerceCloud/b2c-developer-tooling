---
description: B2C CLI command reference with global flags and authentication options for managing Salesforce Commerce Cloud instances.
---

# CLI Reference

The `b2c` CLI provides commands for managing Salesforce B2C Commerce instances.

## Global Flags

These flags are available on all commands that interact with B2C instances:

### Instance Flags

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--server`, `-s` | `SFCC_SERVER` | B2C instance hostname |
| `--webdav-server` | `SFCC_WEBDAV_SERVER` | Secure WebDAV hostname |
| `--code-version`, `-v` | `SFCC_CODE_VERSION` | Code version |

### Authentication Flags

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--client-id` | `SFCC_CLIENT_ID` | OAuth client ID |
| `--client-secret` | `SFCC_CLIENT_SECRET` | OAuth client secret |
| `--username`, `-u` | `SFCC_USERNAME` | Username for Basic Auth |
| `--password`, `-p` | `SFCC_PASSWORD` | Password/access key for Basic Auth |

### Other Environment Variables

| Environment Variable | Description |
|---------------------|-------------|
| `B2C_SKIP_NEW_VERSION_CHECK` | Skip the new version availability check |

## Command Topics

### Instance Operations

- [Code Commands](./code) - Deploy cartridges and manage code versions
- [Job Commands](./jobs) - Execute and monitor jobs, import/export site archives
- [Sites Commands](./sites) - List and manage sites
- [WebDAV Commands](./webdav) - File operations on instance WebDAV

### Services

- [Sandbox Commands](./sandbox) - Create and manage On-Demand Sandboxes
- [MRT Commands](./mrt) - Manage Managed Runtime (MRT) projects and deployments
- [SLAS Commands](./slas) - Manage Shopper Login and Access Service (SLAS) API clients
- [Custom APIs](./custom-apis) - SCAPI Custom API endpoint status

### Development

- [Scaffold Commands](./scaffold) - Generate cartridges, controllers, hooks, and more from templates

### Account Management

- [Account Manager Commands](./account-manager) - Manage Account Manager users, roles, organizations, and API clients

All Account Manager commands are under the `am` topic:
- `b2c am users ...` - User management commands
- `b2c am roles ...` - Role management commands
- `b2c am orgs ...` - Organization management commands
- `b2c am clients ...` - API client management (list, get, create, update, delete, password)

### Utilities

- [Auth Commands](./auth) - Authentication and token management
- [Logging](./logging) - Log levels, output formats, and environment variables

## Getting Help

Get help for any command:

```bash
b2c --help
b2c code --help
b2c code deploy --help
```
