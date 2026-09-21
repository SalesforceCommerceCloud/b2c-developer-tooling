# Escalation and support cases

Use the team's incident process and severity definitions. Record an owner and
next update time; keep a short UTC timeline of observations/actions. Escalation
does not require a proven root cause, and a customer-impacting incident should
not wait for complete diagnostics. Say what remains unknown.

## Select the owner

| Evidence or constraint                                                                                                              | Next owner/action                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Custom cartridge defect or regression                                                                                               | Developer/implementation partner; minimal input, stack/context, change evidence, safe reproduction target                                                                                                                     |
| Missing grant, local setup, business configuration, custom job schedule                                                             | Instance/account administrator; exact denied operation or configuration discrepancy; no blanket privilege request                                                                                                             |
| Gateway/provider timeout or documented provider rejection                                                                           | Integration owner/provider; sanitized correlation IDs, UTC window, matching error and healthy comparison                                                                                                                      |
| Platform/system errors, suspected platform regression, inaccessible infrastructure, system-job contention requiring platform action | Contact Salesforce Support through a support case; attach evidence and impact, not an unproven diagnosis                                                                                                                      |
| Broad availability/performance incident                                                                                             | Check [B2C Commerce Trust status](https://status.salesforce.com/products/B2C_Commerce_Cloud), correlate instance/window, and engage the incident owner/Support as appropriate; green status does not rule out a local problem |
| Unknown owner or insufficient access                                                                                                | Give a bounded handoff to the incident owner with the missing evidence and next check; do not keep collecting unrelated data                                                                                                  |

Salesforce Platform Support covers the product; custom solutions normally go to
the implementation partner unless the customer's Solution Support agreement
applies. Follow the customer's support entitlement and current official guidance.

## Case or handoff draft

```text
Title: [B2C Commerce] symptom and affected instance/site
Impact / urgency: affected users or business function, scope, workaround;
  severity per the customer's policy (or unassigned)
Target: realm/instance, hostname, site, environment, platform version if known
Window: first observed / last observed UTC; ongoing or intermittent
Expected / observed: business behavior, counts and denominator, sample limits
Reproduction: simplest safe steps; reference-app comparison if feasible
Evidence: execution/request IDs, exact log files/timestamps, short redacted excerpts
Changes checked: code/data/configuration changes and actual evidence
Actions taken: time, owner, operation, result; partial effects and rollback state
Assessment: confirmed observations, hypotheses, alternatives, missing access/data
Request: specific investigation/help needed; current owner and next update
```

For suspected product issues, use a minimal reproduction, preferably on the
Reference Application when safe and available. Do not deploy a reference app
or reproduce production writes merely to complete a case. Redact credentials,
customer/payment data, session cookies, and sensitive HAR content before sharing.
Keep unredacted evidence in the customer's approved store; do not put it in a
public repository. A draft is not a submitted case.

## Official platform guidance

- `docs_read` ID `b2c-commerce/b2c-reporting-to-support`, or
  [Reporting to B2C Commerce Support](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/b2c-reporting-to-support.html):
  select Platform/Solution Support, gather reproduction and logs, open a case in
  [Salesforce Help](https://help.salesforce.com/s/).
- `docs_read` ID `b2c-commerce/b2c-troubleshooting-platform-performance`, or
  [Troubleshooting B2C Commerce Performance](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/b2c-troubleshooting-platform-performance.html):
  distinguish custom code, system errors, provider timeouts, and resource locks.

Read the applicable guidance on demand; it is not a prerequisite for routine checks.
