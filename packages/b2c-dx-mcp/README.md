# Salesforce B2C Commerce MCP Server

[![npm](https://img.shields.io/npm/v/@salesforce/b2c-dx-mcp.svg)](https://www.npmjs.com/package/@salesforce/b2c-dx-mcp)
[![License](https://img.shields.io/npm/l/@salesforce/b2c-dx-mcp.svg)](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/license.txt)

Connect your AI assistant to Salesforce B2C Commerce tools, documentation, and workflow skills.
Build and debug storefronts, deploy code, and manage your sites through requests in your assistant.

**[Documentation](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/)** ·
**[Tools](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/toolsets)** ·
**[Configuration](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/configuration)**

![Claude Code using the B2C MCP debugger to investigate why a loyalty controller returns before calling its service.](https://salesforcecommercecloud.github.io/b2c-developer-tooling/terminal/mcp-claude-debugging.png)

## Set up your assistant

Requires Node.js 22.16 or later.

**Claude Code**

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-dx-mcp@b2c-developer-tooling
```

**Codex**

```bash
codex plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
codex plugin add b2c-dx-mcp@b2c-developer-tooling
```

**VS Code and Cursor**

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install-0098FF?logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=b2c-dx-mcp&config=%7B%22type%22%3A%22stdio%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40salesforce%2Fb2c-dx-mcp%40latest%22%5D%7D)
[![Install in Cursor](https://img.shields.io/badge/Cursor-Install-000000?logo=cursor&logoColor=white)](https://cursor.com/install-mcp?name=b2c-dx-mcp&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBzYWxlc2ZvcmNlL2IyYy1keC1tY3BAbGF0ZXN0Il19)

**Other MCP clients**

```json
{
  "mcpServers": {
    "b2c-dx-mcp": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest"]
    }
  }
}
```

See [setup](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/#setup) for
GitHub Copilot, Gemini CLI, Claude Desktop, ChatGPT, and more.

## What you can do

- **Find answers** in B2C Commerce documentation, with links to the sources
- **Debug** cartridges with live breakpoints, variables, and logs
- **Deploy** cartridges and Managed Runtime storefronts
- **Manage your sites** with nearly 600 Commerce API operations
- **Analyze** sales, search, and promotion performance

> Were there any problems with last night's jobs on my site? Let me know what needs attention.

Documentation and skills work without B2C Commerce credentials. Connected tasks use your existing
[B2C configuration](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration),
shared with the [B2C CLI](https://www.npmjs.com/package/@salesforce/b2c-cli).

Usage telemetry is enabled by default; set `SFCC_DISABLE_TELEMETRY=true` to turn it off.

## License

Apache License 2.0. See [license.txt](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/license.txt).
