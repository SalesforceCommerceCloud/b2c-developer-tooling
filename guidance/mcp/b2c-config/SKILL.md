---
name: b2c-config
description: MCP configuration sources, project and instance selection, and masked inspection. Use for setup or unresolved configuration issues; routine config_inspect needs no skill read.
---

# MCP Configuration

For MCP installation or tool selection, see [server setup](skill://mcp/server/SKILL.md).

## Inspect resolved values

Call `config_inspect` directly with the task's absolute `projectDirectory`.
No prior skill read is required. Secrets are masked by default (`unmask: false`).
The result includes effective values, contributing sources, warnings, and
`resolution` identifying the selected project, configuration file, and instance.

Use the returned hostname, site, tenant, and other configured values. Report
missing values rather than inventing them. Inspection does not verify remote
credentials or connectivity.

Reading `dw.json` manually is usually unnecessary: it may not be the selected
file or contain the effective values. Avoid dumping configuration files or the
environment to discover credentials. Inspect source files only for a requested
edit or a specific issue the resolved output cannot explain. Set `unmask: true`
only when the user explicitly requests secret values.

## Where configuration comes from

MCP tools use the same resolver as the CLI. Value precedence, highest first:
launch overrides/environment (including project `.env`), high-priority config
plugins, `dw.json`, `~/.mobify` (MRT key), low-priority config plugins, then
`package.json` under `b2c` for non-sensitive defaults.

- Project: per-call `projectDirectory`, then server `--project-directory` /
  `SFCC_PROJECT_DIRECTORY`, then server working directory. The agent's project
  may differ from the server's working directory; pass it explicitly.
- Primary file: per-call `configPath`, startup `--config` / `SFCC_CONFIG`,
  project `.env` `SFCC_CONFIG`, project `dw.json`, then shared global default.
  Relative `configPath` resolves from `projectDirectory`.
- Instance: `instanceName` selects a named instance from the primary/shared
  catalog; otherwise configured active/default selection applies. Override only
  to select another target; use `resolution` to confirm it.
- Configuration files are reloaded for each configuration-dependent tool call.
  Restart MCP after changing launch flags or its process environment. Existing
  debugger sessions retain their selected target.

## CLI, when requested

From the same project, `b2c setup inspect --json` uses the same resolver and
default masking. Match the environment, `--config`, and `--instance` selections
when comparing results. For CLI setup or configuration commands, consult
[b2c-cli/b2c-config](skill://b2c-cli/b2c-config/SKILL.md) when the broader skill
collections are enabled, or the shared configuration documentation below.

## Further reading

Read only for the configuration issue at hand:

- [MCP configuration](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration)
- [Shared configuration and precedence](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration)
- [Authentication setup](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication)
