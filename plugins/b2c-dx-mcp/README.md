# B2C Commerce MCP Plugin

Build storefronts, investigate errors, deploy changes, and work with B2C Commerce data
through the B2C DX MCP Server. Includes B2C Commerce documentation and workflow skills,
cartridge and Managed Runtime deployment, debugging, logs, and SCAPI code mode.

## Install the plugin

Requires Node.js 22.16 or later. Add the B2C marketplace and install the plugin:

**Codex CLI**

```bash
codex plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
codex plugin add b2c-dx-mcp@b2c-developer-tooling
```

**Claude Code**

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-dx-mcp@b2c-developer-tooling
```

**GitHub Copilot CLI**

```bash
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install b2c-dx-mcp@b2c-developer-tooling
```

Start a new session after installation. For **Copilot in VS Code**, other clients,
and optional direct setup, follow the
[installation guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/installation).

Documentation and skills need no B2C Commerce credentials. Connect an instance when
ready to use live tools; existing B2C CLI configuration is supported.

[Capabilities](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/) |
[Configuration](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration) |
[Security and access](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/security)

## License

Apache-2.0. See the [repo license](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/license.txt).
