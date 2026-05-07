---
description: Configure Safety Mode to prevent accidental destructive operations with safety levels, per-instance rules, confirmation mode, and global policies.
---

# Safety Mode

The CLI and SDK include a **Safety Mode** feature that prevents accidental or unwanted destructive operations via HTTP middleware and command-level checks. This is particularly important when:

- Providing the CLI as a tool to AI agents/LLMs
- Working in production environments
- Training new team members
- Running commands from untrusted scripts

## Quick Start

Set an environment variable to enable safety for all operations:

```bash
export SFCC_SAFETY_LEVEL=NO_DELETE
```

Or configure per-instance in `dw.json`:

```json
{
  "hostname": "prod.example.com",
  "safety": {
    "level": "NO_UPDATE",
    "confirm": true
  }
}
```

## Safety Levels

Safety levels provide broad protection by category:

| Level | Description | Blocks |
|-------|-------------|--------|
| `NONE` | No restrictions (default) | Nothing |
| `NO_DELETE` | Prevent deletions | DELETE operations |
| `NO_UPDATE` | Prevent deletions and destructive updates | DELETE + reset/stop/restart |
| `READ_ONLY` | Read-only mode | All writes (POST/PUT/PATCH/DELETE) |

Levels apply to all HTTP requests made through the SDK. They are enforced by middleware, so they work regardless of which SDK method or CLI command initiates the request.

### Setting a Level

**Environment variable** (recommended for AI agent environments):

```bash
export SFCC_SAFETY_LEVEL=NO_UPDATE
```

Environment variables are preferred over command-line flags because LLMs control commands and flags, but not the environment.

**Per-instance in `dw.json`**:

```json
{
  "hostname": "prod.example.com",
  "safety": {
    "level": "READ_ONLY"
  }
}
```

**Global config** (see [Global Safety Config](#global-safety-config)):

```json
{
  "level": "NO_DELETE"
}
```

When multiple sources set a level, the **most restrictive** wins.

## Safety Rules

Rules provide granular control over specific operations. Each rule matches an operation and specifies an action (`allow`, `block`, or `confirm`). Rules are evaluated in order -- the first matching rule wins.

### Rule Actions

| Action | Behavior |
|--------|----------|
| `allow` | Operation is permitted -- overrides level restrictions |
| `block` | Operation is refused |
| `confirm` | Operation requires interactive confirmation before proceeding |

### Rule Matchers

Rules support three matcher types. All patterns use glob syntax (via [minimatch](https://github.com/isaacs/minimatch)).

#### HTTP Method + Path

Matches HTTP requests by method and URL path. Use this for fine-grained control over API endpoints:

```json
{ "method": "DELETE", "path": "/code_versions/*", "action": "block" }
```

`method` and `path` can be used independently or together. When both are specified, both must match.

#### Job ID

Matches OCAPI job execution by job ID. This catches both direct job commands and the underlying HTTP requests:

```json
{ "job": "sfcc-site-archive-import", "action": "block" }
{ "job": "sfcc-site-archive-*", "action": "confirm" }
```

#### CLI Command ID

Matches CLI commands by their oclif command ID. Command rules are enforced automatically for **every** command before `run()` executes -- no per-command opt-in is needed:

```json
{ "command": "sandbox:delete", "action": "confirm" }
{ "command": "sandbox:*", "action": "block" }
{ "command": "code:deploy", "action": "block" }
```

### Evaluation Order

1. **Rules** are checked in order. The first matching rule's action wins.
   - An `allow` rule overrides even the strictest safety level -- it represents a deliberate user choice.
   - A `block` rule blocks even if the level would allow.
   - A `confirm` rule requires interactive confirmation.
2. If no rule matches, the **level** determines the outcome:
   - If the level blocks the operation and `confirm: true` is set, confirmation is required instead of a hard block.
   - If the level blocks, the operation is blocked.
   - Otherwise, the operation is allowed.

## Confirmation Mode

When `confirm: true` is set, operations that would be blocked by the safety level are softened to require interactive confirmation instead of being refused outright:

```json
{
  "hostname": "staging.example.com",
  "safety": {
    "level": "NO_DELETE",
    "confirm": true
  }
}
```

You can also enable confirmation mode via the `SFCC_SAFETY_CONFIRM` environment variable:

```bash
export SFCC_SAFETY_CONFIRM=true
```

::: warning Non-Interactive Environments
In non-interactive environments (MCP server, piped stdin, CI/CD), confirmation is not possible. Operations that require confirmation will be **blocked** instead.
:::

## Per-Instance Configuration

Configure safety per instance in `dw.json` using the `safety` object. This is especially useful in multi-instance configurations where different instances have different risk profiles:

```json
{
  "configs": [
    {
      "name": "dev",
      "hostname": "dev.example.com",
      "safety": { "level": "NONE" }
    },
    {
      "name": "staging",
      "hostname": "staging.example.com",
      "safety": {
        "level": "NO_DELETE",
        "confirm": true,
        "rules": [
          { "job": "sfcc-site-archive-export", "action": "allow" }
        ]
      }
    },
    {
      "name": "production",
      "hostname": "prod.example.com",
      "safety": { "level": "READ_ONLY" }
    }
  ]
}
```

## Global Safety Config

Safety can be configured globally (across all projects and instances) using a `safety.json` file in the CLI's config directory.

| Platform | Default Location |
|----------|-----------------|
| macOS | `~/Library/Application Support/@salesforce/b2c-cli/safety.json` |
| Linux | `~/.config/b2c/safety.json` (or `$XDG_CONFIG_HOME`) |
| Windows | `%LOCALAPPDATA%\@salesforce\b2c-cli\safety.json` |

Override the file location with the `SFCC_SAFETY_CONFIG` environment variable:

```bash
export SFCC_SAFETY_CONFIG=/path/to/safety.json
```

The file has the same shape as the `safety` object in `dw.json`:

```json
{
  "level": "NO_DELETE",
  "confirm": true,
  "rules": [
    { "job": "sfcc-site-archive-import", "action": "confirm" },
    { "command": "sandbox:delete", "action": "block" }
  ]
}
```

This is useful for enforcing baseline safety policies -- for example, when providing the CLI as a tool to AI agents.

## Configuration Merge

Safety configuration is merged from three sources (all optional):

| Source | Sets |
|--------|------|
| Environment variables (`SFCC_SAFETY_LEVEL`, `SFCC_SAFETY_CONFIRM`) | Level, confirm |
| Per-instance `dw.json` `safety` object | Level, confirm, rules |
| Global `safety.json` | Level, confirm, rules |

The merge strategy:

- **Level**: most restrictive wins across all sources
- **Confirm**: enabled if **any** source enables it
- **Rules**: instance rules are checked first, then global rules. Since evaluation is first-match-wins, instance rules can override global policy.
- **Explicit `allow` rules always win.** They represent a deliberate user choice and override any level restriction.

### Example

Given this global config:

```json
{
  "level": "NO_UPDATE",
  "rules": [
    { "job": "sfcc-site-archive-*", "action": "block" }
  ]
}
```

And this instance config:

```json
{
  "safety": {
    "rules": [
      { "job": "sfcc-site-archive-export", "action": "allow" }
    ]
  }
}
```

The result:
- Level is `NO_UPDATE` (from global)
- Export jobs are **allowed** (instance rule matches first, overriding the global block)
- Import jobs are **blocked** (falls through to the global rule)
- DELETE requests are **blocked** (level `NO_UPDATE` blocks destructive operations)

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `SFCC_SAFETY_LEVEL` | Safety level: `NONE`, `NO_DELETE`, `NO_UPDATE`, `READ_ONLY` |
| `SFCC_SAFETY_CONFIRM` | Enable confirmation mode: `true` or `1` |
| `SFCC_SAFETY_CONFIG` | Path to global safety config file |

## SDK Usage

The safety system is available to SDK consumers via the `SafetyGuard` class:

```typescript
import { SafetyGuard, resolveEffectiveSafetyConfig, withSafetyConfirmation } from '@salesforce/b2c-tooling-sdk';

// Create a guard from config
const guard = new SafetyGuard({
  level: 'NO_UPDATE',
  rules: [{ job: 'sfcc-site-archive-export', action: 'allow' }],
});

// Evaluate an operation
const evaluation = guard.evaluate({ type: 'job', jobId: 'sfcc-site-archive-export' });
// evaluation.action === 'allow'

// Assert (throws SafetyBlockedError or SafetyConfirmationRequired)
guard.assert({ type: 'http', method: 'DELETE', path: '/items/1' });

// Confirmation flow with retry
const result = await withSafetyConfirmation(
  guard,
  () => doSomethingDangerous(),
  async (eval) => promptUser(`Safety: ${eval.reason}. Proceed?`),
);
```

The HTTP middleware uses `SafetyGuard` internally, so all HTTP requests through SDK clients are evaluated automatically. CLI commands and other consumers can use the guard directly for richer safety interaction.
