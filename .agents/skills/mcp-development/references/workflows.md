# Workflow Skills and Runbooks

Use this pattern for developer workflows and future administrator/merchant runbooks.
Adapt the sections to the task; omit empty structure. Keep frontmatter descriptive
and terse. Entrypoints should normally stay below 500 words; move conditional detail into references.

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

CLI-focused references apply when CLI work is requested or the chosen fallback
requires them. Make MCP workflows self-contained. If a linked native collection
can be disabled, offer an applicable public documentation link or conditional
access instruction. Author shared facts once and check configuration/authentication
claims against the resolver and shared skills.

Use ATX headings for section reads and verify exact IDs through the catalog.
Examples must use real tools and supported fields. Do not create scripts/assets
as if the Markdown resource template executes or installs them.
