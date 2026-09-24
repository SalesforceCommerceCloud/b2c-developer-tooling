---
description: B2C CLI command reference with global flags and authentication options for managing Salesforce Commerce Cloud instances.
---

# CLI Reference

The `b2c` CLI provides commands for managing Salesforce B2C Commerce instances.

## Global Flags

These flags are available on all commands that interact with B2C instances:

### Instance Flags

| Flag                   | Environment Variable | Description            |
| ---------------------- | -------------------- | ---------------------- |
| `--server`, `-s`       | `SFCC_SERVER`        | B2C instance hostname  |
| `--webdav-server`      | `SFCC_WEBDAV_SERVER` | Secure WebDAV hostname |
| `--code-version`, `-v` | `SFCC_CODE_VERSION`  | Code version           |

### Authentication Flags

| Flag               | Environment Variable | Description                        |
| ------------------ | -------------------- | ---------------------------------- |
| `--client-id`      | `SFCC_CLIENT_ID`     | OAuth client ID                    |
| `--client-secret`  | `SFCC_CLIENT_SECRET` | OAuth client secret                |
| `--username`, `-u` | `SFCC_USERNAME`      | Username for Basic Auth            |
| `--password`, `-p` | `SFCC_PASSWORD`      | Password/access key for Basic Auth |

### Safety Mode

Use Safety Mode to limit changes while investigating an issue, running automated
scripts, or letting an assistant run CLI commands. It shares its settings with
the IDE Extension and MCP tools.

| Environment Variable   | Values | Description |
| ---------------------- | ------ | ----------- |
| `SFCC_SAFETY_LEVEL` | `NONE` (default) | No restrictions |
| | `NO_DELETE` | Block DELETE operations |
| | `READ_ONLY` | Block POST, PUT, PATCH, and DELETE requests |
| `SFCC_SAFETY_CONFIRM` | `true`, `1` | Ask for approval instead of blocking requests under the selected level, where supported. Explicit block rules still block. |
| `SFCC_SAFETY_CONFIG` | File path | Use a shared safety configuration file. |

Existing `NO_UPDATE` configurations still work, but this legacy setting allows
many updates. See [choosing a safety level](/guide/safety#safety-levels) before
using it for new work.

**Example:**
```bash
# Prevent deletions in CI/CD
export SFCC_SAFETY_LEVEL=NO_DELETE
b2c sandbox create --realm test  # Allowed
b2c sandbox delete test-id       # Blocked

# Read-only mode for reporting
export SFCC_SAFETY_LEVEL=READ_ONLY
b2c sandbox list                 # Allowed
b2c sandbox create --realm test  # Blocked
```

Rules can allow specific tasks or ask for approval in a terminal. Commands that
need approval stop in automated runs where nobody can answer. See the
[Safety Mode guide](/guide/safety) for setup examples and supported confirmations.

### Other Environment Variables

| Environment Variable         | Description                             |
| ---------------------------- | --------------------------------------- |
| `B2C_SKIP_NEW_VERSION_CHECK` | Skip the new version availability check |

## Command Topics

### Instance Operations

- [Code Commands](./code) - Deploy, download, and manage code versions
- [Job Commands](./jobs) - Execute and monitor jobs, import/export site archives
- [Sites Commands](./sites) - List and manage sites
- [WebDAV Commands](./webdav) - File operations on instance WebDAV
- [Logs Commands](./logs) - Tail and retrieve instance logs
- [Content Commands](./content) - Export Page Designer content from a site
- [Business Manager Commands](./bm) - Manage instance-level BM roles, users, access keys, and identity

### Services

- [Sandbox Commands](./sandbox) - Create and manage On-Demand Sandboxes
- [MRT Commands](./mrt) - Manage Managed Runtime (MRT) projects and deployments
- [SLAS Commands](./slas) - Manage Shopper Login and Access Service (SLAS) API clients
- [CIP Commands](./cip) - Run CIP SQL queries and curated analytics reports
- [eCDN Commands](./ecdn) - Manage eCDN zones, certificates, WAF, Page Shield, and edge configuration
- [Custom APIs](./custom-apis) - SCAPI Custom API endpoint status
- [SCAPI Schemas](./scapi-schemas) - Browse and retrieve SCAPI OpenAPI schemas
- [Granular Replications](./replications) - Trigger and monitor SCAPI granular replications
- [CAP Commands](./cap) - Manage Commerce App Packages

### Development

- [Scaffold Commands](./scaffold) - Generate cartridges, controllers, hooks, and more from templates
- [Debug Command](./debug) - Start a DAP adapter for IDE-driven script debugging

### Account Management

- [Account Manager Commands](./account-manager) - Manage Account Manager users, roles, organizations, and API clients

All Account Manager commands are under the `am` topic:

- `b2c am users ...` - User management commands
- `b2c am roles ...` - Role management commands
- `b2c am orgs ...` - Organization management commands
- `b2c am clients ...` - API client management (list, get, create, update, delete, password)

### Setup & Utilities

- [Setup Commands](./setup) - Configure instances, install IDE integrations, and install agent skills
- [Auth Commands](./auth) - Authentication and token management
- [Docs Commands](./docs) - Search/read Script API, Developer Center guides, tooling docs, job steps, and XSD schemas; download docs from an instance
- [Logging](./logging) - Log levels, output formats, and environment variables

## Getting Help

Get help for any command:

```bash
b2c --help
b2c code --help
b2c code deploy --help
```
