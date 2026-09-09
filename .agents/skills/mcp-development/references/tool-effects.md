# Tool Effects and MCP Annotations

Use the spec supported by the installed SDK. SDK v2 serves `2026-07-28` and
earlier clients through `serveStdio`. The [ToolAnnotations definition](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2026-07-28/schema.ts)
is unchanged from `2025-11-25`; hints work on both protocol paths.

## Classification

`McpToolConfig` and `ToolAdapterOptions` require `ToolEffects`. The registry uses
`toToolAnnotations` so protocol hints cannot contradict internal effects.

| Metadata              | Meaning                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `effect: read`        | Observes without modifying the tool's environment. Sets `readOnlyHint: true`.                                       |
| `effect: write`       | Changes state without an advertised destructive operation. Sets both read-only and destructive hints false.         |
| `effect: destructive` | Advertised operations delete or overwrite user data or deployed code. Sets `destructiveHint: true`.                 |
| `idempotent`          | Repeating identical arguments has no additional effects. Results may differ, including an already-gone error.       |
| `openWorld`           | May interact with external entities. A bounded local catalog or registry is closed; remote Commerce reads are open. |

Destructive/idempotent hints are meaningful to the protocol only for non-read-only
tools. We explicitly emit all four; reads use destructive=false, idempotent=true.
Omitted protocol hints default to readOnly=false, destructive=true,
idempotent=false, openWorld=true. Do not rely on those defaults.

## Concrete choices

- Config inspection, packaged skills, bundled search/schema content, and session
  listing: read, idempotent, closed-world. Returning URLs or masking secrets does
  not determine effects. `config_inspect(unmask: true)` is still a read.
- Remote document/log/API reads and live debugger inspection/waiting: read,
  idempotent, open-world. Token refresh, caches, and activity timestamps are
  incidental bookkeeping, not reasons to advertise a domain write.
- Debugger lifecycle and breakpoint management are non-read-only, non-destructive
  workflow operations. Starting can replace the remote client: disclose that in
  the description. Ending and setting breakpoints are idempotent; starting is not.
- Replacing a breakpoint set is idempotent in intended state;
  regenerated breakpoint IDs do not make repeated identical sets non-idempotent.
- Continue/step, evaluation, and capture are non-read-only, non-destructive,
  non-idempotent, open-world. They affect execution, but their primary purpose is
  debugging. Possible application side effects do not justify a destructive hint.
  Explain evaluation/trigger effects and enforce authorization independently.
- Cartridge deployment overwrites existing deployed files: destructive,
  non-idempotent, open-world.
- `scapi_search` searches bundled contracts: read, idempotent, closed-world.
  `scapi_execute` advertises create/update/delete API operations: destructive,
  non-idempotent, open-world. These hints describe purpose, not a Node sandbox.
- MRT push creates a new bundle and optionally activates it without deleting the
  previous bundle: write, non-idempotent, open-world. Activation is not deletion.
- In this local stdio server, log watches are read-only observers. Start/stop
  manage the reader, not remote logging or user files. Their combined tool is
  read-only and open-world; polling its local buffer is read-only and closed-world.
  Keep buffer consumption and stop/discard behavior in descriptions. A second
  read need not return the same entries; do not use destructive annotations to
  express delivery semantics. The idempotent hint is immaterial for reads.

Distinguish internal read-delivery state from user-managed state. Caches, cursors,
subscription handles, and ephemeral buffers do not turn an observational tool
into a write. Deleting a user's saved log file or altering remote log settings
would. A shared durable queue with acknowledgments needs its own classification;
do not generalize this local watcher decision to every buffer or subscription.

Classify the advertised purpose and explicit operations, not the HTTP verb or
hypothetical misuse. An explicit delete/overwrite option counts even if disabled
by default. Destructive is not a synonym for non-read-only or potentially risky.
A REST operation deleting user data is a clear destructive case; protocol cleanup
using DELETE is not automatically equivalent. Prefer a non-destructive write when
the primary operation changes state without deleting or overwriting user data.
The spec describes destructive=false as additive updates; apply that distinction
to user data/code, not ephemeral delivery state or ordinary debugger control.
For code mode, separate offline discovery from API execution and enforce permissions
at execution. Neither a non-destructive hint nor a benign example expression
authorizes arbitrary code or establishes read-only behavior.

## Verification

Keep descriptions clear about material effects without repeating annotation
booleans. Verify actual `tools/list` through stdio, including wrapper tools and
non-GA tools. Test new destructive options and retry behavior where those can
invalidate a classification. Annotations are advisory, not an authorization
boundary or a promise that a client will suppress approval prompts.
