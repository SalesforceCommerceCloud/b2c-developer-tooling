---
description: Review job health, investigate checkout and failed orders, and prepare actionable handoffs with your AI assistant.
---

# Operations

Use your AI assistant to review scheduled work, investigate checkout failures,
and assemble evidence for the right team. The toolkit's operations runbooks
support administrators, operators, and developers working together. You do not
need application source code to start an investigation.

## Get started

[Set up the B2C MCP](../mcp/#setup) and connect your
[B2C Commerce configuration](./configuration). The MCP includes the `b2c-ops`
runbooks; no separate skills installation is needed. You can also
[install the skills directly](./agent-skills#available-plugins) for use with your
existing tools and CLI.

Tell your assistant which instance and site to inspect, the period you care
about, and what should have happened. It uses your configured access. Some
investigations also need the [B2C CLI](./installation), Business Manager access,
or information from an integration provider. See [authentication](./authentication)
and [Safety Mode](./safety) for access and operation controls.

## Review job health

Check whether scheduled work completed its intended updates, including jobs
that finished successfully but left data incomplete. Get a review of failed,
late, or missing runs with the affected data and a recommended next action.

<ExamplePrompt>

> Review last night's catalog and inventory jobs for my configured site. Flag failed or missing runs and check whether the expected updates arrived. Explain anything that needs attention before rerunning a job or changing data.

</ExamplePrompt>

Share the expected jobs and schedule when they are not already available.
A successful execution status alone does not establish that the data is correct.

## Investigate checkout and failed orders

Bring together payment-integration errors, affected inputs, and recent changes
to narrow the cause. Find orders marked FAILED, understand how many are affected,
and identify patterns among products or inputs. Your assistant can prepare a
handoff even when it cannot access the application source or every diagnostic
surface.

<ExamplePrompt>

> Customers have reported checkout failures over the last two hours on my configured site. Investigate failed orders and payment errors, estimate the impact, and identify any affected products. Explain what we could not verify and who should act next. Don't change orders or retry payments.

</ExamplePrompt>

Order-search access may be needed to quantify failed orders. If that evidence
is unavailable, the investigation can continue with logs; the report should
state the gap. Failed-order counts are not the same as checkout conversion.
[Metrics](./metrics) and [analytics reports](./analytics-reports-cip-ccac) can add
context where enabled.

## Escalate with useful evidence

A useful handoff identifies the affected instance/site, business impact and time
window, representative errors, changes already checked, actions taken, and the
next owner. It separates confirmed observations from suspected causes.

| Finding                                         | Typical next step                                     |
| ----------------------------------------------- | ----------------------------------------------------- |
| Access, configuration, or a custom job schedule | Work with your administrator.                         |
| Custom cartridge or integration logic           | Hand off to your developer or implementation partner. |
| Payment or other external service failure       | Involve the integration owner or provider.            |
| Suspected B2C Commerce platform issue           | Contact Salesforce Support through a support case.    |

<ExamplePrompt>

> Prepare a Salesforce Support case draft from this investigation. Include business impact, the affected instance and time window, reproduction steps, and relevant redacted evidence. Clearly label what is still uncertain.

</ExamplePrompt>

For product issues, follow Salesforce's
[Reporting to B2C Commerce Support](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/b2c-reporting-to-support.html)
guidance. Custom solutions generally go to your implementation partner unless
your Solution Support agreement applies. Check
[B2C Commerce Trust status](https://status.salesforce.com/products/B2C_Commerce_Cloud)
for a related service incident. Review case drafts and attachments before sharing.

## Verify recovery

Investigation and intervention are separate decisions. Review the impact of a
rerun, deployment, or data change before approving it. Afterward, check the
business result as well as execution status and errors. If work remains, keep
the outstanding action, owner, and next update clear.
