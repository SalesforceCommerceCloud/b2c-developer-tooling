---
name: server
description: B2C MCP setup, toolset customization, available capabilities, tool choice, and skill discovery.
---

# B2C MCP Server

## Server configuration and tool availability

Use the client's tool discovery before concluding a tool is unavailable.
Reuse discovered names; do not repeat searches for each call.
All GA toolsets are enabled by default;
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
3. To enable all GA tools, set `--toolsets all`, or remove both selections
   from arguments and launch environment. Preview tools separately require
   `--allow-non-ga-tools` / `SFCC_ALLOW_NON_GA_TOOLS`.
4. Apply the requested change to the existing registration; restart/reconnect
   MCP and refresh the client tool catalog (a new session may be needed).
   Verify the expected tools appear. Check the installed version if still absent;
   removed tools cannot be re-enabled. Avoid duplicate server registrations.

Toolsets: `CARTRIDGES`, `DIAGNOSTICS`, `MRT`, `PWAV3`, `SCAPI`, `STOREFRONTNEXT`.
MCP skill resources are always available. Every toolset includes `skills_read`
and docs. With only `--tools`, select `skills_read` to include the broader skill
collections, and desired `docs_*` tools explicitly. `--docs-topics` restricts docs, not skills.
Use launch arguments/environment for server settings, not project `.env` or `dw.json`.

## Tool choice and project configuration

- Call `config_inspect` directly with the task's `projectDirectory`; secrets are
  masked. For resolution issues: [B2C config](skill://mcp/b2c-config/SKILL.md).
  CLI equivalent, when requested: `b2c setup inspect`.
- Deploy cartridges: `cartridge_deploy`; CLI scripts/extra flags: `b2c code deploy`.
  Confirm instance/version and preserve returned `resolution`.
- Debug: [MCP debugger](skill://mcp/debugger/SKILL.md). CLI/IDE only when requested.
- SCAPI code mode: read [the skill](skill://mcp/scapi/SKILL.md) before `scapi_search` or `scapi_execute`.
- Custom API scaffold: `b2c scaffold generate custom-api`; no MCP equivalent.
- API/product documentation: `docs_search` / `docs_read`.

Do not infer tool names from CLI commands. Check a mutation's outcome before
retrying after missing output.

## Skills

Browse `skill://index` or, when enabled, search `skills_read`: `b2c` (platform/cartridges),
`b2c-cli` (CLI), `storefront-next` (storefronts), `mcp` (server/tool workflows).
Read the relevant URI or returned ID. Result `skillReferences` point to optional
detail for observed conditions: read the URI, or pass its URI and `section` to
`skills_read`. Skills are directory-agnostic.

Tools needing a skill name it in their description; no universal read is
required. Resource and tool reads are equivalent; do not read both.
Acknowledgment does not approve mutations.

When scripting tool calls, emit `structuredContent` when present, otherwise
`content`; emitting both repeats the payload.

## Setup references

- [Client installation](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/installation)
- [Launch configuration](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration)
- [Capabilities and toolsets](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets)
