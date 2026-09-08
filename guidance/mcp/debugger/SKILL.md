---
name: MCP Debugger Usage
description: Bounded debugger capture, request triggering, state inspection, and reliable session cleanup.
---

# MCP Debugger Usage

Use for B2C server-side script debugging. Confirm the sandbox, deployed script,
breakpoint, and request before starting a session.

## Prerequisites

- Basic Auth for a BM user with `WebDAV_Manage_Customization`: username plus
  password or WebDAV File Access and UX Studio access key. OAuth is unsupported.
- Inspect unknown connection settings with `config_inspect` and the task's
  `projectDirectory`; keep its default masking. Use resolved values.
- Match local source and line numbers to deployed code and the site's cartridge
  path. A breakpoint's `verified` flag indicates local source mapping, not that
  matching code is deployed or active.

## Capture and cleanup

1. Call `debug_start_session` with `projectDirectory`. Use `configPath` or
   `instanceName` only to override the configured selection. Cartridge discovery
   defaults to that project; use `cartridgeDirectory` only for a different root.
   Preserve the returned session ID and `resolution`.
2. Call `debug_capture_at_breakpoint` with the file, line, a bounded timeout,
   and `auto_continue: true` for a snapshot. It arms its own breakpoint; a prior
   `debug_set_breakpoints` call is unnecessary. Use that tool for separate
   breakpoint management; it replaces the existing set.
3. Trigger the request. The capture tool's optional trigger supports GET without
   custom headers; trigger authenticated or non-GET requests externally. An
   external trigger must run while capture waits, not after awaiting its result.
   A halted capture can return `trigger_pending: true`; resume with
   `debug_continue` before expecting that request to finish. Do not retrigger it.
4. Use captured stack, variables, and expressions. For further halted inspection,
   use `debug_get_stack`, `debug_get_variables`, or `debug_evaluate`. Expressions
   can have side effects; keep evaluation within the requested scope.
5. Check halted threads with `debug_list_sessions`, resume with `debug_continue`,
   and always call `debug_end_session` with `clear_breakpoints: true`, including
   after errors or timeouts. Stop any log watches started for the investigation.

## Recovery

- No breakpoint hit: verify deployed code, cartridge path, request, and breakpoint.
  A timeout leaves the breakpoint armed. Check sessions for a late halt; end with
  `clear_breakpoints: true` when finished. Do not leave an unbounded capture waiting.
- Configuration still unexplained after `config_inspect`: consult
  [MCP configuration](skill://mcp/b2c-config/SKILL.md).
- Before repeating a failed request, check whether it already changed state.

## CLI or IDE, when requested

For terminal debugging use `b2c debug cli`; for a DAP client use `b2c debug`.
For those workflows, read [b2c-cli/b2c-debug](skill://b2c-cli/b2c-debug/SKILL.md)
when the broader skill collections are enabled, or the
[CLI debugger reference](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/debug).
