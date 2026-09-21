# B2C Operations Runbooks

Agent skills for administrators, operators, and developers investigating B2C
Commerce health and incidents. Available as the `b2c-ops` plugin and bundled in
the B2C MCP. No demo workspace or application source is required.

| Skill                      | Outcome                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `b2c-production-triage`    | Scope an incident, correlate evidence, and prepare a handoff.                             |
| `b2c-job-health`           | Review scheduled work and investigate failed or incomplete updates.                       |
| `b2c-checkout-triage`      | Investigate broader checkout/payment symptoms and select relevant evidence.               |
| `b2c-order-failure-triage` | Enumerate FAILED orders, quantify impact, and correlate failed inputs with logs and jobs. |

See the [Operations guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/operations)
for setup and example requests. Direct plugin installation adds guidance; it
does not grant access or install the MCP/CLI. MCP users need no separate install.

## Adding a runbook

Follow the repository's MCP development skill and workflow authoring reference.
Create `skills/<task>/SKILL.md` with a descriptive trigger, observable outcome,
MCP/CLI choices, bounded investigation, intervention checkpoint, and recovery or
handoff. Put conditional detail in `references/`; keep each entry independently
discoverable. Use installed skill names for native assistants and exact skill
URIs for MCP. Verify capabilities against code and current contracts.

Each addition needs an agent-plugin changeset and acceptance scenarios that
include missing access and partial evidence. Update the Operations guide when
it adds a capability worth highlighting; do not mirror the skill inventory there.
Record tooling gaps separately; do not make a new tool just to mirror a runbook.
Never include demo answers, tenant defaults, or customer data.
