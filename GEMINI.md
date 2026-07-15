# Salesforce B2C Commerce — Project Context

This context is provided by the **B2C Developer Tooling** Gemini CLI extension. It
helps Gemini assist with Salesforce B2C Commerce development: SFRA storefronts,
cartridge code, SCAPI/OCAPI, jobs, On-Demand Sandboxes, and headless (PWA Kit / MRT)
projects.

## Available capabilities

- **`b2c-dx-mcp` MCP server** (bundled by this extension) — exposes B2C tools:
  deploy cartridges, run and monitor jobs, manage On-Demand Sandboxes, stream logs,
  and search B2C Commerce documentation. Prefer these tools over ad-hoc shell
  commands when performing B2C operations.
- **B2C CLI (`b2c`)** — the `@salesforce/b2c-cli` command-line tool. Use it for
  `b2c setup` (configuration), `b2c code deploy`, `b2c sandbox`, `b2c job`,
  `b2c logs`, and WebDAV operations. Run `b2c --help` to discover commands.
- **Agent skills** — install detailed, task-specific B2C skills with:

  ```bash
  b2c setup skills b2c --ide gemini-cli        # development patterns
  b2c setup skills b2c-cli --ide gemini-cli    # CLI operations
  ```

  These install to `~/.gemini/skills/` (global) or `.gemini/skills/` (project),
  where Gemini CLI discovers them automatically.

## Working conventions

- **Never create or delete an On-Demand Sandbox without explicit user confirmation** —
  sandbox creation may be a billable action.
- **Never overwrite an existing `dw.json`** without confirmation — it holds instance
  credentials and configuration.
- B2C Commerce has **no self-service signup**; the user must already have Account
  Manager access and a target instance (sandbox or PIG) provisioned by their org's
  B2C Commerce admin.
- If a `b2c` command is not found, use `npx @salesforce/b2c-cli <command>` or install
  it with `npm install -g @salesforce/b2c-cli`.

## References

- CLI reference: https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/
- Agent skills guide: https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/agent-skills
- MCP installation: https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/installation
