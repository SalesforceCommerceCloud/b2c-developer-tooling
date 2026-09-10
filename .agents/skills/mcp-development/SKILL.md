---
name: mcp-development
description: Develop B2C MCP tools, resources, workflow skills, and runbooks. Use when changing MCP contracts, context usage, configuration, or agent-facing guidance in this repository.
---

# B2C MCP Development

## Scope and owners

- `packages/b2c-dx-mcp`: tool registration, adapters, resources, and session lifecycles.
- SDK `guidance`: shared offline catalog, search, section reads, and exposure filters.
- `guidance/mcp`: shipped MCP skills. Native collections live under `skills/`.
- `docs/mcp`: user capabilities, installation, configuration, and security.
  Tool references use capability/tool-name tables with shared access requirements.
  Keep parameters and agent choreography in schemas and skills.

For skill/runbook content, read [workflow authoring](references/workflows.md).
For packaging and protocol details, read [the catalog contract](../../../guidance/README.md).

Native skill changes use an agent-plugin changeset; the MCP's bundled
`workspace:*` dependency automatically triggers an MCP patch release. Keep it in
`dependencies` and `bundledDependencies`, not `devDependencies`. MCP-specific
skills and collection changes need an MCP changeset.

## Tools and context

Keep tool descriptions useful without a skill read: purpose, significant effects,
blocking behavior, prerequisites, and critical input interactions. Attribute
descriptions own defaults and constraints; avoid repeating them in the tool text.
Omit attribute prose when the name and type suffice. Combine operations with
shared inputs and effects; validate action-specific inputs before loading config.
Move extended examples, decision tables, and procedures into a focused skill.
Use one exact skill URI on complex workflow entry tools. Small self-explanatory
tools need no pointer or prerequisite read; `config_inspect` stays direct.

Use `createToolAdapter` and the SDK resolver. Accept per-call project/configuration
context where relevant; preserve `attachResolution` and validate output after
enrichment. Sessions retain their original target. Skills never resolve a project.
All tools are enabled by default; explicit selection customizes availability.
Do not gate tool or skill availability behind release-maturity launch flags.
Client tool discovery may be deferred: discover before recommending reconfiguration.

MCP skill resources and their index/template access remain available independently
of `skills_read`. That tool's selection enables the broader native collections.
Apply the same exposure filter to indexing, listing, and direct URI reads.
Return whole skill files or explicit sections by default. Optional read paging
uses character offset/maxLength and totalLength/nextOffset, like docs_read.
No content cursors or hashes. Split files over 64 KiB into authored references.
Instructions and links must account for unavailable tools/collections.

## Tool effects

Every tool requires `effect`, `idempotent`, and `openWorld`. Registration derives
all four MCP annotations; do not maintain separate hints in factories. Classify
advertised operations: reads, non-destructive state changes, or explicit deletion/
overwriting of user data or deployed code. Use destructive sparingly: deleting a
REST resource or overwriting deployed files qualifies; publishing a new MRT bundle
does not. Debugger control/capture is a write,
not destructive merely because application code could have side effects. Read
delivery may maintain watches, drain buffers, or update caches/activity timestamps.
Read [annotation semantics](references/tool-effects.md) when adding or changing
operations. Verify emitted `tools/list` hints, including optional tools. Hints
inform client approvals; they neither authorize calls nor enforce server policy.

## Conditional result guidance

Add guidance when an observed condition changes the next action: source warnings,
unmapped breakpoints, capture timeouts. Preserve the outcome and a concise actionable
warning; add optional `skillReferences: [{uri, section}]` for detail. Declare targets
in `src/skill-references.ts`; verify each resolves to nonempty MCP skill content.
Resources read the file URI; `skills_read` can narrow with `section` when available.
Do not invent URI fragment support or require the fallback tool.

Avoid boilerplate guidance on normal results. A successful write with a warning
remains successful; a failed call remains an MCP error. Before retrying a write,
determine whether it took effect. Keep typed output schemas consistent with added
fields and preserve provenance. Do not embed entire skills in responses.

## Lifecycle and validation

Use SDK v2 `serveStdio` with a fresh server/state factory. It serves current and
earlier clients; direct `connect(new StdioServerTransport())` only serves the
earlier protocol. Use Zod 4 schema objects at SDK registration, including output
schemas. Await instance cleanup before shutdown. Cache only stable discovery and
skill resources, privately; never cache live tool results. `input_required` is
available for future workflows but is not currently used. Test both protocol paths.

Bound waits and returned data. A tool must not await work that requires another
tool call to release it: debugger capture returns while its trigger is halted.
Explain pending work, retained breakpoints, cleanup, and resume behavior precisely.
Skill acknowledgment is separate from mutation authorization. Code-mode tools
require `skillRead: true` after reading `skill://mcp/scapi/SKILL.md` by resource or
`skills_read`. Check before configuration loading or execution. Put the URI once
in each tool description; the flag refers to it. Use self-attestation, no dynamic
receipt or tool-only read tracking. Keep simple inspection ungated. Add further
gates only for justified complex workflows. Request permissions remain enforced
at execution time.

Test observable contracts: restricted tool selection with readable MCP resources,
excluded collections rejecting direct reads, source/resource/tool parity, emitted
section destinations, clean output without unnecessary pointers, and lifecycle
failures. Use the [testing guide](../../../guidance/TESTING.md) for build/packaged
stdio checks. Regenerate skills before source-parity tests. Keep authoring checks
focused; do not test prose by matching whole descriptions.

## SCAPI code mode

Follow Cloudflare's discovery/execution convention: JavaScript async functions,
`spec.paths` for offline discovery, and an authenticated `scapi.request` helper.
Tool descriptions include concise object types and runnable discovery/execution
examples; Commerce procedures belong in the required skill. Expose local refs
expanded in the discovery view, retaining recursive/deep refs; keep source schemas
intact. Code-mode results use text-only JSON without an output schema because
programs choose their result shape. Preserve resolution and error skill references
in compact JSON, including after resolution enrichment; do not duplicate arbitrary
payloads in `structuredContent`. Measure final serialized size, not an intermediate
representation. Teach discovery of operation IDs before selected schema fields;
filter/page/aggregate live data in code and retain errors and partial-list counts.
Warn about large schemas/results in tool descriptions. Introduce code mode in
server instructions as the Commerce API fallback; prefer dedicated tools.
Use native Node execution; no custom language parser or evaluator. A disposable
child bounds runtime and cleans up work, but is not a security sandbox. Keep
credentials in the host and apply SDK safety rules for the resolved target at
each helper request. Preserve cancellation and resolution. Never replay a whole
program automatically after writes; let SCAPI validate request payloads.
Disable ambient fetch/WebSocket to discourage unmanaged requests; do not claim
network isolation. Enable Node permissions only on the disposable child, without
filesystem, subprocess, worker, or addon grants. Launch the current executable
directly; keep configuration, package loading, and snippet storage in the parent.
These guardrails keep code mode focused on APIs and result processing. Route local
development work to terminal/file tools; do not pursue a hostile-code sandbox or
expand API blacklists. Test managed calls and denials on supported Node/platforms.
Token-export helpers serve explicit external-client needs;
managed requests authenticate automatically. Resolve prerequisites lazily by
helper, honor configured auth methods, and propagate cancellation through grants.
Never expose configured secrets to the worker or persist tokens in snippet source.
Forward request context through registration; test cancellation through both
stdio protocols and verify execution stops. Resolve project safety environment
without mutating process.env; launch values win over project .env. Evaluate the
same URL pathname/job ID before auth and in middleware. Test ordered exceptions,
request/concurrency/response limits, and redirects. Keep discovery support flags
aligned with execution; reject unsupported transfers before auth. Safety follows
HTTP methods, including POST searches; document narrow rule exceptions, not bypasses.

Classify authentication per operation from schema security, including mixed
Admin/Shopper alternatives. Expose runtime support separately from configured
access. Resolve credentials only after choosing a supported flow. Distinguish
missing config, rejected credentials/scopes, and unsupported execution; never
advertise configuring a SLAS client as enabling an unimplemented flow. Keep
operation/tenant scopes in actionable auth failures; preserve upstream HTTP
status/body and avoid treating every 403 as proof of missing scopes. Apply this
in the code-mode request wrapper around existing SDK middleware.

Standard OpenAPI JSON belongs in the private `schemas/` workspace, bundled by the
SDK through a regular dependency. Builds/CI use checked-in contracts; live Schemas
API access is optional enrichment. Refreshes need a schema-package changeset so
native Changesets dependency propagation releases the SDK and MCP. Keep the
manifest portable for consumers in other languages.
Refresh without tenant custom-property expansion; test the bundle contains no
tenant `c_*` definitions. Live schema tools default to `custom_properties` expansion
for the selected instance; keep this separate from output collapsing. Standard
Admin bodies pass custom fields to SCAPI for validation without requiring discovery.
Only successful managed Schemas API reads register custom contracts, per execution.
Preserve the host copy and ignore schema server origins. Match endpoint-relative
custom paths under the resolved organization; use declared AmOAuth2 scopes and
the usual safety/auth/transfer checks. Do not enable unsupported Shopper flows.
