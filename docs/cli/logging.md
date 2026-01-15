---
description: Configure CLI logging with log levels, JSON output for CI/CD, and environment variables for debugging.
---

# Logging

The CLI uses [pino](https://github.com/pinojs/pino) for structured logging with pretty-printed output by default.

## Output Modes

### Pretty Print (Default)

Human-readable output with colors, suitable for interactive terminal use:

```
[18:31:58] INFO: Deploying cartridges...
[18:31:59] INFO: Upload complete
```

### JSON Lines (`--json`)

Machine-readable output for scripting, CI/CD pipelines, and log aggregation:

```bash
b2c code deploy --json
```

```json
{"level":"info","time":1764113529411,"command":"code deploy","msg":"Deploying cartridges..."}
{"level":"info","time":1764113529412,"command":"code deploy","msg":"Upload complete"}
```

## Log Levels

Control verbosity with `--log-level` or `-D` for debug:

| Level | Description |
|-------|-------------|
| `trace` | Maximum verbosity |
| `debug` | Detailed operational info |
| `info` | Normal messages (default) |
| `warn` | Warnings |
| `error` | Errors only |
| `silent` | No output |

```bash
b2c code deploy --log-level debug
b2c code deploy -D  # shorthand for --log-level debug
```

In debug/trace mode, context objects are displayed:

```
[18:31:58] INFO: Upload complete
    command: "code deploy"
    file: "cartridge.zip"
    bytes: 45678
    duration: 1234
```

## Flags

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--log-level` | `SFCC_LOG_LEVEL` | Set log verbosity |
| `-D, --debug` | `SFCC_DEBUG` | Enable debug logging |
| `--json` | | Output JSON lines |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SFCC_LOG_LEVEL` | Log level (trace, debug, info, warn, error, silent) |
| `SFCC_DEBUG` | Enable debug logging |
| `SFCC_LOG_TO_STDOUT` | Send logs to stdout instead of stderr |
| `SFCC_LOG_COLORIZE` | Force colors on/off |
| `SFCC_REDACT_SECRETS` | Set to `false` to disable secret redaction |
| `NO_COLOR` | Industry standard to disable colors |
| `DEBUG` | Set to `oclif*` for CLI framework debug logs |

### CLI Framework Debugging

For low-level debugging of the CLI parser and command loading, use the oclif debug flag:

```bash
DEBUG=oclif* b2c code deploy
```

This outputs internal oclif framework logs, useful for troubleshooting command resolution, plugin loading, and argument parsing issues.

## Output Streams

By default, logs go to **stderr** so that command output (data, IDs, etc.) can be piped cleanly:

```bash
# Logs go to stderr, JSON output goes to stdout
b2c sites list --json 2>/dev/null | jq '.sites[0].id'
```

To send logs to stdout instead:

```bash
SFCC_LOG_TO_STDOUT=1 b2c code deploy
```

## Secret Redaction

Sensitive fields are automatically redacted from log output:

- `password`, `secret`, `token`
- `client_secret`, `access_token`, `refresh_token`
- `api_key`, `authorization`

```
[18:31:58] INFO: Authenticating
    client_id: "my-client"
    client_secret: "[REDACTED]"
```

To disable redaction (for debugging):

```bash
SFCC_REDACT_SECRETS=false b2c code deploy --debug
```

## CI/CD Usage

For CI/CD pipelines, use JSON output and disable colors:

```bash
NO_COLOR=1 b2c code deploy --json 2>&1 | tee deploy.log
```

Or explicitly set the log level:

```bash
SFCC_LOG_LEVEL=info b2c code deploy --json
```
