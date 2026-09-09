# b2c-python-sdk

Agent skills for **consuming** the [`salesforce-b2c-tooling-sdk`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/python/python/b2c-tooling-sdk) Python SDK — authenticate to a Salesforce B2C Commerce instance, resolve config from `dw.json`, and call the OCAPI/SCAPI/WebDAV clients and higher-level operations from Python scripts and Jupyter notebooks.

> This plugin is for developers **writing Python code against the SDK**. To *develop the SDK itself*, see the SDK's own `python/b2c-tooling-sdk/CLAUDE.md`. To drive the B2C **CLI**, use the `b2c-cli` plugin instead.

Part of the [B2C Developer Tooling](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) marketplace.

## Installation

```bash
# Claude Code
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-python-sdk@b2c-developer-tooling

# GitHub Copilot CLI
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install b2c-python-sdk@b2c-developer-tooling
```

**VS Code (GitHub Copilot):** Command Palette → **Chat: Install Plugin From Source** → enter the repo `SalesforceCommerceCloud/b2c-developer-tooling`.

**Codex:** open the repo as a workspace, restart Codex, then install from the **B2C Developer Tooling** marketplace in the plugin directory.

For file-copy install to any supported IDE, use `b2c setup skills b2c-python-sdk`. See the [install guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/agent-skills) for details.

## What's included

- **`using-b2c-tooling-sdk`** — installing and importing the SDK, choosing between the async and sync facades, picking an authentication mechanism, resolving config from `dw.json`, the operations-vs-clients error contract, and minting SLAS shopper tokens. Includes a full symbol catalog in [`references/api-catalog.md`](./skills/using-b2c-tooling-sdk/references/api-catalog.md).

See [`skills/`](./skills/) for the full list.

## License

Apache-2.0. See the [repo LICENSE](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/LICENSE.txt).
