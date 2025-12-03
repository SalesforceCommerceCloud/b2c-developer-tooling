# CLI Reference

The `b2c` CLI provides commands for managing Salesforce B2C Commerce instances.

## Global Flags

These flags are available on all commands that interact with B2C instances:

### Instance Flags

| Flag | Short | Environment Variable | Description |
|------|-------|---------------------|-------------|
| `--server` | `-s` | `SFCC_SERVER` | B2C instance hostname |
| `--webdav-server` | | `SFCC_WEBDAV_SERVER` | Separate WebDAV hostname (if different) |
| `--code-version` | `-v` | `SFCC_CODE_VERSION` | Code version |

### Authentication Flags

| Flag | Short | Environment Variable | Description |
|------|-------|---------------------|-------------|
| `--client-id` | | `SFCC_CLIENT_ID` | OAuth client ID |
| `--client-secret` | | `SFCC_CLIENT_SECRET` | OAuth client secret |
| `--username` | `-u` | `SFCC_USERNAME` | Username for Basic Auth |
| `--password` | `-p` | `SFCC_PASSWORD` | Password/access key for Basic Auth |

## Command Topics

- [Code Commands](./code) - Deploy cartridges and manage code versions
- [Job Commands](./jobs) - Execute and monitor jobs, import/export site archives
- [Sites Commands](./sites) - List and manage sites
- [Sandbox Commands](./sandbox) - Create and manage sandboxes
- [MRT Commands](./mrt) - Manage Managed Runtime environments

## Configuration

- [Logging](./logging) - Log levels, output formats, and environment variables

## Getting Help

Get help for any command:

```bash
b2c --help
b2c code --help
b2c code deploy --help
```
