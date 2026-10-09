# Workflow Skills and Runbooks

Use this pattern for developer workflows and future administrator/merchant runbooks.
Adapt the sections to the task; omit empty structure. Keep frontmatter descriptive
and terse. Around 500 words is a useful entrypoint guideline, not a cap. Complex
skills such as SCAPI can grow to preserve decision-relevant guidance; move long
examples and conditional procedures into references.

## Decisions before procedures

State the intended outcome and when the workflow applies. Describe choices as
concrete triggers with a preferred action and meaningful exceptions. Avoid generic
"best practice" claims that do not change a decision.

Example from the debugger:

| Situation                                | Action                                                          | Exception or consequence                         |
| ---------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| Need a snapshot at one line              | Capture with `auto_continue: true`; capture arms its breakpoint | No separate set-breakpoints call needed          |
| Need custom headers or a non-GET trigger | Trigger externally while capture waits                          | Waiting for capture first prevents the trigger   |
| Need to inspect a halted request         | Keep execution halted, then resume explicitly                   | The trigger can remain pending; do not resend it |

Keep essential effects in the tool description too. Skills add the decision
sequence, details, and examples; they cannot compensate for misleading contracts.

## Suggested shape

```markdown
---
name: task-name
description: Concrete task and conditions that distinguish this workflow.
---

# Intended Outcome

## Scope and prerequisites

Target, required access, inputs, and observable completion condition.

## Choose an approach

Situation -> preferred action -> exception. Include actual MCP tools and CLI
equivalents, differences, and known tie-breaks. State when no equivalent exists.

## Procedure

Inspect relevant state, resolve identifiers, perform the authorized action,
verify its effect, and clean up. Put checkpoints before materially different
effects. Specify limits for batches, waits, or retries where needed.

## Recovery

Distinguish failure, partial completion, pending work, and success with warnings.
Check the outcome before retrying a mutation. Name an actual inverse where one
exists; otherwise state the recovery limit.

## References

Task/condition -> exact reference file or returned section ID. Read only the
matching detail. Optional links are not additional prerequisites.
```

For administrators and merchants, use business outcomes and configured site,
catalog, locale, or environment identifiers. Include business validation, such
as confirming the affected records and effective state; technical acceptance
alone may not establish completion. Do not fabricate capabilities or imply
permissions for bulk changes, publication, or deletion from permission to inspect.

## Operational runbook structure

Runbooks must teach toolkit-specific decisions, not restate general incident
advice. For each check, name the shipped tool/snippet/CLI command, the returned
evidence that drives the next action, known coverage limits, and the preferred
fallback. Verify names/fields against code and contracts. Reuse existing snippets
and skills; do not duplicate their full schemas or executable source. Keep generic
process short and use it to organize concrete evidence paths. A runbook whose
procedure would be unchanged without this toolkit needs more grounding.

Give a recurring operational task its own discoverable runbook when it has a
distinct outcome, access requirements, and evidence path. For example, finding
FAILED order records differs from investigating broad checkout symptoms. Route
between these conditionally; do not bury the targeted procedure in a broad
incident skill or require reading both entrypoints.

Use the same headings across `b2c-ops` entrypoints: **Scope and impact**, **Access
and tools**, **Checks and decisions**, **Mitigation and recovery**, **Escalation
and handoff**. Scale detail to the workflow. Routine health checks need not become
declared incidents. Impact/severity and update cadence follow the customer's
process; never invent severity definitions, SLAs, or a mandatory support contract.

Checks name evidence, expected result, and the next branch. Preserve fixed time
windows, sample/coverage limits, and failed stages. Hypotheses are not diagnoses;
restore service under authorization without requiring a completed root-cause
analysis. Separate mitigation from permanent remediation and follow-up prevention.
Do not use a green job or missing recent log entries as proof of business health.

Escalation is first-class: administrator, developer/implementation partner,
integration provider, or Salesforce Support. Reuse the triage escalation reference
for a sanitized case draft, business impact, target/window, reproduction, evidence,
actions taken, unknowns, and next owner/update. Do not submit cases or messages
without explicit authorization. Support may be the correct outcome, not a failure
to finish. No source checkout or demo setup should be needed for operator work.

Grounding: Google's [incident response](https://sre.google/workbook/incident-response/)
and [troubleshooting](https://sre.google/sre-book/effective-troubleshooting/)
patterns (impact, ownership, working record, hypothesis testing, recovery), plus
[Reporting to B2C Commerce Support](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/b2c-reporting-to-support.html)
for platform-versus-solution ownership, reproduction, logs, and cases.

CLI-focused references apply when CLI work is requested or the chosen fallback
requires them. Make MCP workflows self-contained. If a linked native collection
can be disabled, offer an applicable public documentation link or conditional
access instruction. Author shared facts once and check configuration/authentication
claims against the resolver and shared skills.

Route setup failures to exact skill IDs/sections or `docs_read` IDs; use
`docs_search` for unknown topics. Distinguish local settings from external client,
role, scope, or access-key setup. Keep public URL alternatives for excluded tools
or collections. References are conditional; do not gate routine inspection or
send MCP users through CLI authentication procedures unless that workflow applies.

Use ATX headings for section reads and verify exact IDs through the catalog.
Missing-section errors should return available headings for an exact retry,
without requiring a full file read. Keep examples selective: required and
task-relevant schema fields, concise verification results, and file-backed CLI
output when execution records are large. Preserve errors and diagnostics in
projections. Move conditional procedures into linked references rather than
making one workflow load an entire neighboring skill.
Examples must use real tools and supported fields. Do not create scripts/assets
as if the Markdown resource template executes or installs them.

For code-mode recipes, start from demonstrated tasks, remove session-specific
identifiers, and teach reusable sequences and result shapes. Keep long examples
in conditional references. Compose known dependent calls; pause for unresolved
intent or contracts. Preserve failed stages, completed writes, error messages,
and continuation inputs. Test executable mutation examples against mocks,
including existing records and uncertain verification. Recipes are examples to
adapt, not transaction guarantees. Promote stable examples into parameterized
SCAPI snippets when reuse is useful. Author executable source once under SDK
`data/scapi-snippets`; the manifest supplies names, descriptions, effects, and
input schemas. MCP guidance generation derives the built-in reference catalog.
Use `builtin/` for released snippets, `user/` for explicit saves of completed
executions. User storage follows injected oclif dataDir, with SDK fallback; never
write into package files or infer a project from startup cwd. Named calls share
request budgets, cancellation, authentication, and safety with the enclosing run.
Saving source does not imply successful business verification or authorize reuse.
