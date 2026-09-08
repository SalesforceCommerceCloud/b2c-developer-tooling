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
  Keep agent choreography and implementation mechanics in contributor guidance.

For skill/runbook content, read [workflow authoring](references/workflows.md).
For packaging and protocol details, read [the catalog contract](../../../guidance/README.md).

## Tools and context

Keep tool descriptions useful without a skill read: purpose, significant effects,
blocking behavior, prerequisites, and critical input interactions. Attribute
descriptions own defaults and constraints; avoid repeating them in the tool text.
Move extended examples, decision tables, and procedures into a focused skill.
Use one exact skill URI on complex workflow entry tools. Small self-explanatory
tools need no pointer or prerequisite read; `config_inspect` stays direct.

Use `createToolAdapter` and the SDK resolver. Accept per-call project/configuration
context where relevant; preserve `attachResolution` and validate output after
enrichment. Sessions retain their original target. Skills never resolve a project.
Default toolsets are all GA tools; explicit selection customizes availability.
Client tool discovery may be deferred: discover before recommending reconfiguration.

MCP skill resources and their index/template access remain available independently
of `skills_read`. That tool's selection enables the broader native collections.
Apply the same exposure filter to indexing, listing, and direct URI reads.
Instructions and links must account for unavailable tools/collections.

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

Bound waits and returned data. A tool must not await work that requires another
tool call to release it: debugger capture returns while its trigger is halted.
Explain pending work, retained breakpoints, cleanup, and resume behavior precisely.
Skill acknowledgment is separate from mutation authorization; no gate is currently
active. Add a gate only for a justified complex workflow, with equivalent resource
and tool reads. Future code-mode permission enforcement belongs at execution time.

Test observable contracts: restricted tool selection with readable MCP resources,
excluded collections rejecting direct reads, source/resource/tool parity, emitted
section destinations, clean output without unnecessary pointers, and lifecycle
failures. Use the [testing guide](../../../guidance/TESTING.md) for build/packaged
stdio checks. Regenerate skills before source-parity tests. Keep authoring checks
focused; do not test prose by matching whole descriptions.
