# Reusable workflows

Find workflows with `codemode.search(query)`; `codemode.describe(name)`
returns source/inputSchema. Inspect before first use; `codemode.run(name, input)`
composes inside execution with shared limits/auth/safety. `builtin/` ships with
the MCP; `user/` persists locally. [Catalog](snippets.md).

Reuse a snippet when its inputs and verification cover the task. Otherwise adapt
its source or compose direct requests; do not omit requested fields to fit a
snippet. Inputs are schema-validated before invocation. Pass variable values
through the tool's `input` to `async (input)` when preparing reusable code.
Discover/describe inside either code tool; run snippets only inside `scapi_execute`.
Saving requires an explicit user request and a reviewed outcome; a completed
execution may still contain HTTP errors or partial failures.

- [Products](products.md): create, optionally assign a storefront category, verify both.
- [Promotions](promotions.md): join assignments/details in bounded batches.
- [Jobs](jobs.md): review runs, inspect steps/logs, investigate failures.

For explicit save requests, see [saving](saving.md).

No CLI code-mode equivalent. For missing settings such as promotion discounts,
consider [XML archives](skill://b2c-cli/b2c-site-import-export/SKILL.md)
(`docs_read({query: "cli-jobs"})`, [online](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/jobs.md)).
[Platform reference](https://developer.salesforce.com/docs/commerce/commerce-api/references).
Configuration/access: `docs_read({query: "mcp-configuration"})` ([online](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration.md)).

Other MCP workflows and runbooks: [skill index](skill://mcp/b2c-mcp-server/SKILL.md#skill-index).
