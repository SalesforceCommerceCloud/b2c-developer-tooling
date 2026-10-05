---
name: b2c-mcp-server
description: Index and setup for the B2C Commerce MCP server, covering toolset selection, tool choice by task, and the skill catalog. Use to enable tools, pick the right tool, or find the skill that covers a B2C task.
---

# B2C MCP Server

## Skill index

Read only the skill that matches the task; each links its own references.

| Task | Skill |
| --- | --- |
| Commerce API reads/writes (required before `scapi_search` / `scapi_execute`) | `skill://mcp/b2c-mcp-scapi/SKILL.md` |
| Warehouse reports and SQL (required before `cip_query`) | `skill://mcp/b2c-mcp-cip/SKILL.md` |
| Configuration, credentials, access grants, wrong target | `skill://mcp/b2c-mcp-config/SKILL.md` |
| Server-side script debugging | `skill://mcp/b2c-mcp-debugger/SKILL.md` |
| Instance files and selected cartridge uploads | [files](references/files.md) |
| Production incident or unknown operational signal | `skill://b2c-ops/b2c-production-triage/SKILL.md` |
| Failed or late jobs | `skill://b2c-ops/b2c-job-health/SKILL.md` |
| Checkout or order failures | `skill://b2c-ops/b2c-checkout-triage/SKILL.md`, `skill://b2c-ops/b2c-order-failure-triage/SKILL.md` |
| Anything else | `skill://index` |

Every skill and reference file is readable as an MCP resource
(`skill://<collection>/<skill>/<file>`) or with `skills_read({uri})`.
Collections: `b2c` (platform/cartridges), `b2c-cli` (CLI), `b2c-ops`
(operator/admin runbooks), `storefront-next` (storefronts), `mcp` (server/tool
workflows). Search with `skills_read({query, collection})` or browse `skill://index`.

## Server configuration and tool availability

Use the client's tool discovery before concluding a tool is unavailable.
Reuse discovered names; do not repeat searches for each call.
All toolsets are enabled by default;
project/storefront detection does not select tools. Installation settings or
client filters can restrict availability. A skill's presence does not enable
its tools. `config_inspect` reports B2C configuration, not enabled MCP toolsets.

When a task needs a tool outside the current selection:

1. Check this server's client registration: command/version, launch arguments,
   environment, and client tool filters. Inspect only relevant settings; redact
   secrets. Plugin installs may supply their own launch options.
2. Check `--toolsets` / `SFCC_TOOLSETS` and `--tools` / `SFCC_TOOLS`.
   Explicit selection replaces the default; combining them includes both.
   Add the required toolset to the existing selection, or the exact tool to
   `--tools`. Example: change `--toolsets MRT` to `--toolsets MRT,DIAGNOSTICS`
   for configuration inspection and debugging. Preserve intentional restrictions.
3. To enable all tools, set `--toolsets all`, or remove both selections
   from arguments and launch environment.
4. Apply the requested change to the existing registration; restart/reconnect
   MCP and refresh the client tool catalog (a new session may be needed).
   Verify the expected tools appear. Check the installed version if still absent;
   removed tools cannot be re-enabled. Avoid duplicate server registrations.

Toolsets: `CARTRIDGES`, `DIAGNOSTICS`, `MRT`, `PWAV3`, `SCAPI`, `STOREFRONTNEXT`, `CIP`.
MCP skill resources are always available. Every toolset includes `skills_read`
and docs. With only `--tools`, select `skills_read` to include the broader skill
collections, and desired `docs_*` tools explicitly. `--docs-topics` restricts docs, not skills.
Use launch arguments/environment for server settings, not project `.env` or `dw.json`.

## Tool choice and project configuration

- Call `config_inspect` directly with the task's `projectDirectory`; secrets are
  masked. For resolution issues: [B2C config](skill://mcp/b2c-mcp-config/SKILL.md).
  CLI equivalent, when requested: `b2c setup inspect`.
- Deploy cartridges: `cartridge_deploy`; CLI scripts/extra flags: `b2c code deploy`.
  Confirm instance/version and preserve returned `resolution`. Use `files` for
  selected local files, `codeVersion` for an explicit target; omit `files` for
  whole cartridges. Reload may activate the target.
- Instance files: `webdav_list` gives directory entries/sizes; `webdav_get` reads
  exact text by HTTP byte range or downloads to `outputPath`; `webdav_put` uploads
  `content` or `sourcePath`. Prefer these over a terminal for supported transfers.
  [File choices and limits](references/files.md).
- Debug: [MCP debugger](skill://mcp/b2c-mcp-debugger/SKILL.md). CLI/IDE only when requested.
- Prefer dedicated tools for their workflows. For other Commerce API tasks,
  use `scapi_search` / `scapi_execute`: products, campaigns, promotions, jobs,
  code versions, site cartridge paths, and more. Read [the SCAPI skill](skill://mcp/b2c-mcp-scapi/SKILL.md)
  first; its task map and built-in snippets cover recurring operations.
- Custom API scaffold: `b2c scaffold generate custom-api`; no MCP equivalent.
- API/product documentation: `docs_search` / `docs_read`.
- Warehouse analytics: `cip_discover` for reports/metadata, `cip_query` for report
  or SQL execution. Read [CIP analytics](skill://mcp/b2c-mcp-cip/SKILL.md) before execution.
  Prefer CIP for sales/merchandising/technical trends; SCAPI for current records.
- Operations or incidents: start with the matching `b2c-ops` runbook from the
  [skill index](#skill-index), or `skills_read` with `collection: "b2c-ops"` and
  the task query. Read only relevant references. Runbooks guide evidence and handoff, not authorization
  to rerun jobs or change data. CLI fallback is appropriate for an uncovered
  signal when terminal access is available; a skill does not supply that access.

Do not infer tool names from CLI commands. Check a mutation's outcome before
retrying after missing output.

## Loading skills

If the client lists this server's skills, load them through it. Otherwise read
`skill://` URIs as MCP resources, or with `skills_read({uri})`.
Use a skill's listed name or URI; do not derive names from the server name.
Relative links resolve against the linking skill's directory.
Skills cite documentation IDs as `b2c docs read <id>` or `docs_read({query: "<id>"})`;
read them with `docs_read({query: "<id>"})` (no terminal needed). Online links
point to the same pages as Markdown. Doc IDs are lookup keys: when citing
sources to the user, link the doc's `url` from `docs_read`, unless they ask for
IDs or Markdown links (`sourceUrl`).
Result `skillReferences` point to optional detail for observed conditions:
read the URI, or pass its URI and `section` to `skills_read`. Skills are
directory-agnostic.

Tools needing a skill name it in their description; no universal read is
required. Resource and tool reads are equivalent; do not read both.
Acknowledgment does not approve mutations.

When scripting tool calls, emit `structuredContent` when present, otherwise
`content`; emitting both repeats the payload.

## Setup references

Documentation IDs below are read with `docs_read({query: ID})`.

- Credentials, external grants, or access failures: [MCP configuration](skill://mcp/b2c-mcp-config/SKILL.md),
  `skills_read({id: "mcp/b2c-mcp-config", section: "setup-and-access"})`.
  It maps setup issues to exact documentation IDs; no universal setup read is needed.
- [Client installation](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/installation.md)
- Launch configuration: `mcp-configuration` ([online](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration.md))
- Capabilities and toolsets: `mcp-toolsets` ([online](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets.md))
