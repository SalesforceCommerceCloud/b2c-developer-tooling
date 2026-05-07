---
description: Start a DAP debug adapter for B2C Commerce server-side script debugging.
---

# Debug Command

The `b2c debug` command launches a [Debug Adapter Protocol (DAP)](https://microsoft.github.io/debug-adapter-protocol/) adapter that bridges your IDE to the B2C Commerce script debugger. It's designed to be invoked by an IDE (VS Code, JetBrains, etc.) over stdio, not run directly in a shell.

## Authentication

The script debugger uses **Basic auth** (Business Manager username and password). OAuth credentials are not sufficient. Provide credentials via any of:

- `--username` / `--password` flags
- `SFCC_USERNAME` / `SFCC_PASSWORD` environment variables
- `username` / `password` fields in `dw.json`

See the [Authentication Guide](/guide/authentication) for details.

## b2c debug

Start the DAP adapter for the configured B2C instance.

### Usage

```bash
b2c debug [--cartridge-path <PATH>] [--client-id <ID>]
```

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--cartridge-path` | Path to your cartridges directory. The adapter recursively discovers cartridges under this path and maps them to the running instance. | `.` |
| `--client-id` | Client ID reported to the B2C script debugger API. Useful when multiple debug sessions share an instance. | `b2c-cli` |

Inherits the [global instance and authentication flags](./index#global-flags) (`--server`, `--username`, `--password`, etc.).

### Examples

```bash
# Run from a project root with cartridges in ./cartridges or ./
b2c debug

# Point at an explicit cartridges directory
b2c debug --cartridge-path ./cartridges

# Use a non-default debugger client ID
b2c debug --client-id my-debugger
```

### IDE Integration

Most IDEs spawn DAP adapters automatically based on a launch configuration. The adapter speaks DAP over **stdin/stdout**, so direct shell invocation will appear to hang — that's expected. Configure your IDE's debug launcher to invoke `b2c debug` and supply the appropriate environment.

## Notes

- A warning is emitted if no cartridges are found at `--cartridge-path`.
- Source maps are derived from the discovered cartridge layout; ensure your local cartridge tree matches what's deployed to the instance, otherwise breakpoints may not bind.
- The adapter exits when its stdin stream closes.
