---
description: Control MCP tool access, protect Commerce credentials, and understand deployment, debugging, and data access.
---

# Security and Access

The MCP server runs locally with the permissions of the process that starts it.
Connected tools use your configured Commerce or Managed Runtime credentials.
Choose the tools and environment access appropriate to the work you want your
assistant to perform.

## Limit available tools

All toolsets are enabled by default. Use `--tools` for a small selection or
`--toolsets` for a workflow group. For skills and documentation only:

```bash
npx -y @salesforce/b2c-dx-mcp@latest --tools skills_read,docs_search,docs_read,docs_list
```

This configuration exposes no deployment or debugger tools and needs no
Commerce credentials. Some documentation is retrieved online. Check your
client's active tool list after changing configuration. See
[tool selection](./configuration#toolset-selection) for all options.

Use your client's tool approval controls for operations you want to review.
Tools identify read-only operations and possible state changes to compatible
clients. Configuration inspection and debugger session listing are read-only;
debugger control can affect running requests. Your client decides when to ask
for approval; these labels do not restrict credentials or enforce access.
Selecting a tool enables all of its operations; for example, `debug_control`
includes both stepping and continuing execution.
These controls apply within that client; your assistant may also have access to
other MCP servers or a terminal.

## Protect credentials and data

Use sandbox credentials for development and grant only the scopes needed by
the selected tools. Keep credential-bearing `dw.json` and `.env` files out of
version control and avoid placing secrets directly in shared MCP launch arguments.

Logs, debugger variables, and API responses can contain customer data, session
identifiers, or secrets. Once returned to your assistant, that data is subject
to the assistant provider's storage and data-use settings. Review those settings
before connecting sensitive environments. Do not enable unredacted configuration
inspection when sharing results.

See [authentication setup](../guide/authentication) for API scopes and account
permissions.

## Deployments {#deployments}

Cartridge deployment writes to the selected code version. MRT publishing uploads
a bundle and can activate it in an environment. Confirm the project, instance, code version, and
MRT environment before requesting these operations.

Use `config_inspect` to check the current target. Tools that support per-task
project or instance selection can use a different target from the launch default.
A launch-time project path is a default, not a filesystem access restriction.

## Debugger access {#debugger}

Debugging requires a Business Manager username/password or access key with
`WebDAV_Manage_Customization` permission. OAuth is not supported. Prefer a
development sandbox: breakpoints can pause application requests, and expression
evaluation can change application state.

End debugger sessions when finished. If a request remains paused or a session
is lost, ask your assistant to list and end active sessions. If it cannot recover
them, restart the MCP server. An orphaned remote session may need to time out
on the instance before reconnecting. See [script debugging](../guide/script-debugger) for the available
CLI and IDE alternatives.

## Safety settings

The shared [Safety Mode settings](../guide/safety) can restrict supported HTTP
operations. Review the complete policy: explicit allow rules can override a
safety level. These settings do not provide a universal restriction on local
file writes or every debugger action.

For a skills-only or documentation-only assistant, select those tools
explicitly. Do not treat `READ_ONLY` as a complete MCP sandbox. SCAPI code mode
stops confirmation-required requests; interactive confirmation is not supported.
Changing the prompt does not bypass the restriction.

For SCAPI code mode, the selected project's `.env` can set `SFCC_SAFETY_LEVEL`, `SFCC_SAFETY_CONFIRM`,
and `SFCC_SAFETY_CONFIG`. Launch environment values take precedence over `.env`.
Relative safety-file paths resolve from the selected project. The effective level
is the most restrictive of environment, global file, and instance settings;
explicit rules still take precedence over the level.

`READ_ONLY` uses HTTP methods, so it also blocks searches that use POST. To permit
a specific search, add a narrow allow rule to your safety configuration. For example:

```json
{
  "level": "READ_ONLY",
  "rules": [
    {
      "method": "POST",
      "path": "/operation/jobs/v1/organizations/*/job-execution-search",
      "action": "allow"
    }
  ]
}
```

This allows job execution searches while keeping other POST requests restricted.

## SCAPI code mode

The preview `scapi_search` and `scapi_execute` tools run JavaScript locally with
Node.js. Enable them for assistants you trust with local code execution; they
are not sandboxed from your filesystem or network.

SCAPI execution uses the selected project's Account Manager credentials and
API scopes. It can create, update, or delete Commerce records. The configured
[Safety Mode policy](../guide/safety) applies to requests made through the SCAPI
helper; it does not restrict arbitrary local JavaScript. Confirmation-required
requests stop in this preview. Review any completed changes before retrying a
failed or interrupted operation.

Admin and Shopper credentials serve different purposes. Admin operations use an
Account Manager client and its granted scopes. Shopper flows use SLAS; configuring
a SLAS client does not enable Shopper execution in this preview. Authentication
errors identify the relevant credentials or grants to check. A 403 can also mean
missing instance access, rather than a missing API scope.

Saved workflows execute local JavaScript with the same access as other code-mode
programs. Save or install only source you trust. Saving retains source and metadata;
it does not separately store execution inputs, responses, or credentials. Values
written directly into the source remain in the saved file, so keep secrets out of
workflow code. A workflow's read/write label describes its purpose; the selected
project's safety policy still governs each SCAPI request, including POST searches.

## Telemetry {#telemetry}

Telemetry is enabled by default. It records usage and diagnostic information,
including tool names, timing, lifecycle events, client/version information, and
error messages. To disable it, set either `SFCC_DISABLE_TELEMETRY=true` or
`SF_DISABLE_TELEMETRY=true` in the environment that launches the MCP server.

For a directly configured server, add this alongside `command` and `args`:

```json
"env": {
  "SFCC_DISABLE_TELEMETRY": "true"
}
```

MCP diagnostic logs are separate from telemetry. Use debug logging temporarily
and review logs before sharing them.
