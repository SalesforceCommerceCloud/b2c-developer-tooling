# Authoring and distributing MCP skills

The MCP skill catalog is a superset of native plugin skills. Author shared
content once in `skills/<plugin>/skills/<entry>/SKILL.md`. Author MCP-specific
workflows here in `mcp/<entry>/SKILL.md`. Both use `name` and `description` YAML
frontmatter. Supporting Markdown files stay alongside their entrypoint, normally
under `references/`.

`collections.json` selects entire plugin collections by their existing name in
`skills/plugins.json`; it does not duplicate the per-skill inventory. Collections
can instead name a repository-relative directory for MCP-only skills. `isGA`
controls release exposure; `workspaces` only influences ranking. Neither native
skill installation nor `--docs-topics` defines the skill catalog.

## MCP skills and resources

`resources/list` advertises `skill://index` and selected MCP-specific skills,
chosen by the top-level `featuredResources` IDs in `collections.json`. Featuring
an entry controls listing only. All available skills and references are readable
through the resource template and `skills_read`, grouped into `b2c`, `b2c-cli`,
`storefront-next`, and `mcp`. Every tool discovery/read result includes a URI. MCP resources are always registered.
When `skills_read` is omitted from an individual tool selection, the index and
resource template expose only the `mcp` collection; all other collections are
excluded from discovery and direct reads.

The index is generated from the filtered manifest at read time: collection,
skill ID, entrypoint URI, and a description of at most 120 code points per entry.
It includes no skill bodies or reference inventory. Current bundled index content
stays below 16 KiB; the runtime resource ceiling is 64 KiB. It is not another
authored skill and does not increase the skill count. Clients can discover files
through the index or tool search without template argument completion.
Passing the index URI to `skills_read` returns its normal paginated catalog
listing, equivalent to an empty-argument call.

Entrypoints use `skill://<collection>/<entry>/SKILL.md` (for example,
`skill://mcp/debugger/SKILL.md`); references use their relative path in place of
`SKILL.md`. URIs preserve collection, skill, and file identity. Resource
descriptions state the task covered. Server instructions point to server setup,
B2C configuration, debugging, and the index; none requires a universal read.

Use "skills" in tool descriptions, resource metadata, and public documentation.
`skills_read` and the resource template access the full catalog. Internal catalog
code remains in the SDK `guidance` module, separate
from the existing `skills` module that installs native plugin skills.

Feature an MCP skill when it teaches a non-obvious tool interaction, lifecycle,
or execution model. Do not create one per tool or duplicate its schema. Keep
resource entrypoints concise; link broader skills by exact ID.

| Candidate                        | Decision                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| MCP server                       | Optional resource: installation, toolset customization, tool choice, and discovery.                                |
| B2C configuration                | Optional resource: shared sources, project/instance selection, masked inspection, and setup troubleshooting.       |
| Debugger                         | Optional resource: bounded capture, external triggers, side effects, cleanup.                                      |
| SCAPI code mode                  | Future resource when implemented: execution model, API discovery, result limits, mutation semantics.               |
| Log watches                      | Keep existing skills; add a resource only if real use exposes lifecycle mistakes not covered by tool descriptions. |
| Configuration inspection         | Direct tool; no prerequisite skill or acknowledgment.                                                              |
| Platform development, CLI skills | Discover through the index or tool search; read through the resource template or tool.                             |

Resource featuring and required acknowledgment are independent. No gate is
active at this checkpoint. A later gate belongs to a specific tool and names
one skill; resource and tool reads satisfy the same requirement. General skills
linked for extra detail are not automatically prerequisites.

## Workflow authoring

Common tool, context, and result-guidance patterns live in the
[MCP development skill](../.agents/skills/mcp-development/SKILL.md). Its
[workflow authoring reference](../.agents/skills/mcp-development/references/workflows.md)
owns the skill/runbook template, concrete choice/exception pattern, MCP/CLI
tie-breaks, and conditional reference routing. Existing imported skills migrate
incrementally; do not fabricate tool equivalents.

Only inventoried Markdown is served; executable helpers, assets, hidden folders,
and `evals/` are not a runtime filesystem interface.

## Build and release contract

The MCP `generate:guidance` script copies source Markdown byte-for-byte and emits
a deterministic manifest with relative provenance, file sizes, and search
metadata. `build` and `prepack` both run it. Generated prose in
`packages/b2c-dx-mcp/content/guidance/` is ignored by Git but included in the npm
tarball. Source errors fail generation before replacing the previous bundle.

Run the MCP build after source changes, including before development-mode tests.
The distribution test verifies every imported source against the bundle. New
collections belong in the manifest, not the generator. Native installer APIs
remain in the SDK `skills` module; runtime catalogs use `guidance`.

A source-skill change that alters the shipped MCP bundle needs an MCP changeset
as well as the applicable agent-plugin changeset. Changes to SDK APIs/search or
the generated tooling documentation index need an SDK changeset. List directly
changed packages only; dependency bumps cascade through Changesets.

## Protocol and budgets

- `skills_read` lists, searches, or reads. Exact reads never fuzzy-substitute.
- `id` and `uri` are alternatives. `file` and `section` narrow an exact read.
  Search/list use entry `offset`; reads accept character `offset`/`maxLength`
  and return full content by default. Read results include `totalLength` and
  `offset`, plus `truncated`/`nextOffset` when more content remains. Positions
  refer to the selected file or section, matching `docs_read` conventions.
- Results have an object root with a discriminated `result.kind`. Successful
  tool responses contain identical JSON in text and `structuredContent`.
  Errors use `isError` plus `error.code`, `message`, and recovery suggestions.
- All skill resources retain the MCP resource shape and full-file semantics.
  Tool reads return the same complete file, or an explicitly selected section.
  Generation rejects files over 64 KiB; split oversized skills into references.
  Runtime reads enforce the same file limit.
- Directory/search responses stay below 16 KiB including both JSON copies;
  the 64 KiB skill limit measures file content, excluding response metadata and
  serialization. Default pages are at most 20 entries,
  default searches at most five. Descriptions are condensed for discovery.
- Reads use the same manifest/exposure rules without content hashes or cursors.
- All raw resource readers register through `B2CDxMcpServer.addResourceReader`
  after resource metadata. This preserves raw URI validation before the MCP
  SDK normalizes dot segments. Future resource families must join this dispatcher.
- New tools can publish titles, annotations, and object-root output schemas.
  The MCP SDK validates final output after `attachResolution` enrichment.
  Existing tools retain their existing output behavior.

## Implementation checkpoints

1. Contract and vertical slice: read-only catalog, native/fallback access, shared
   resolver, result metadata, representative authored skill, and packaging.
2. Releasable distribution: all selected collections, search reuse, full-file and section
   reads, exposure checks, source parity, stdio tests, and external
   tarball validation. This is the current implementation scope.
3. Content and catalog migration: consistent equivalence tables for all skills,
   validated structured mappings, concise legacy descriptions, and audited tool
   effects. Remove the dedicated PWA Kit guidelines tool and its content without
   a replacement skill. Remove the custom API scaffold tool; local scaffolding
   remains available through `b2c scaffold generate custom-api`. Review remaining tools for
   retirement and record replacement workflows and compatibility/release impact.
4. Selective acknowledgment: introduce a gate only when observed misuse or a
   complex execution contract warrants it. The debugger skill remains optional;
   SCAPI code mode is a future candidate. Use fixed `skillAcknowledged: true`, with
   the exact skill ID once in the tool description. Property description:
   `True after reading the referenced skill.` No rotating receipt or forced
   reread when the same skill has already been read.
5. Safety and confirmation: settle policy precedence, operator read-only ceilings,
   and operation-bound mutation approval independently from skill reading.
6. SCAPI handoff: introduce `mcp/scapi-code-mode` with actual code-mode tools;
   reuse ranking in an independent API index, exposure, bounded results, metadata,
   and the later acknowledgment/effect seams. No placeholder code tool ships here.

These are reviewable progress points, not automatic approval stops. See the
[isolated Codex test guide](./TESTING.md) for the packaged checkpoint.

## Public documentation scope

The 2.0 website addresses MCP users: capabilities, installation, configuration,
and security. Keep protocol internals, implementation rationale, contributor
checkpoints, and agent evaluation procedures in contributor documentation.
Embedded workflow skills address agents and may explain tool sequences;
that content is not a template for the public website.

## Tool availability and storefront detection

All GA toolsets are enabled by default; `--toolsets` and `--tools` customize
that selection. Startup workspace detection must not hide tools. Keep the SDK's
storefront detection for operations with an explicitly resolved project, such
as selecting PWA Kit or Storefront Next bundle defaults. The directory used to
launch an MCP server need not be the user's project.

The public MCP section is consolidated into overview, installation,
configuration, capabilities, skills, and security. Previous tool-reference
URLs redirect to capability sections. Exact parameter contracts remain in the
installed tool catalog; agent sequences belong in embedded skills.

Documentation search/read/list accept an absolute `projectDirectory` for
per-call storefront detection. An explicit `workspace`
overrides detection; `all` disables it. Without a supplied project, the normal
server does not infer context from its launch directory. Detection is bounded
and does not cache one task's project into another.

Skills are directory-agnostic: search terms, `collection`, and an optional
explicit `workspace` rank/filter its catalog without filesystem detection.
