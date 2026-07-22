# b2c-operator

Operator/Admin runbooks for Salesforce B2C Commerce — higher-level operational procedures for people who **run** instances rather than author feature code.

Part of the [B2C Developer Tooling](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) marketplace.

## Installation

```bash
# Claude Code
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-operator@b2c-developer-tooling

# GitHub Copilot CLI
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install b2c-operator@b2c-developer-tooling
```

**VS Code (GitHub Copilot):** Command Palette → **Chat: Install Plugin From Source** → enter the repo `SalesforceCommerceCloud/b2c-developer-tooling`.

**Codex:** open the repo as a workspace, restart Codex, then install from the **B2C Developer Tooling** marketplace in the plugin directory.

For file-copy install to any supported IDE, use `b2c setup skills b2c-operator`. See the [install guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/install-skills) for details.

## What's included

Operator-focused **workflow** skills that orchestrate the underlying b2c CLI commands:

- **`b2c-production-release`** — deploy → activate → verify → roll back, with the real code-version and rollback rules baked in as guardrails.
- **`b2c-incident-triage`** — quantify a production error spike, read the right log files, isolate the cause, and package a Support handoff.

These compose the lower-level `b2c-cli` skills (`b2c-code`, `b2c-logs`, `b2c-debug`, `b2c-cip`). Install the **`b2c-cli`** plugin (or those individual skills) alongside this one so your agent has the underlying commands available.

## License

Apache-2.0. See the [repo LICENSE](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/LICENSE.txt).
