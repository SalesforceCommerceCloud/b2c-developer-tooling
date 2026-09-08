---
description: Install the B2C DX MCP Server in Codex, Claude Code, Cursor, or GitHub Copilot.
---

# Installation

You need **Node.js 22.16 or later** and an MCP-compatible coding assistant.
The commands below download and run the MCP server with `npx`. Commerce
credentials are needed only for [capabilities that access your environment](./toolsets).

## Codex

Register the server, replacing the project path with your own:

```bash
codex mcp add b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest --project-directory /absolute/path/to/project
```

Start a new session in that project. Use `/mcp` to check that the server is available.

## Claude Code

From your project directory:

```bash
claude mcp add --transport stdio --scope project b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest --project-directory /absolute/path/to/project
```

Restart Claude Code after registration. Use `--scope user` instead if the
configuration should be available across projects; update the project path when
switching projects.

## Cursor

Add this to `.cursor/mcp.json` in your project, then reload the MCP server:

```json
{
  "mcpServers": {
    "b2c-dx-mcp": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--project-directory", "${workspaceFolder}"]
    }
  }
}
```

For user-level installation, place the same configuration in `~/.cursor/mcp.json`.
The workspace variable keeps the server pointed at your open project.

## GitHub Copilot

Add this to `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "b2c-dx-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--project-directory", "${workspaceFolder}"]
    }
  }
}
```

Start the server from VS Code's MCP controls. Copilot uses `servers` as the
configuration key; Cursor uses `mcpServers`.

## Plugin installation

If you prefer a marketplace-managed installation, the repository also provides
an MCP plugin. Use this instead of registering the same server twice:

::: code-group

```bash [Codex]
codex plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
codex plugin add b2c-dx-mcp@b2c-developer-tooling
```

```bash [Claude Code]
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-dx-mcp --scope project
```

:::

Restart your client after installation. The plugin manages the server version
and launch options, including preview-tool availability. Use direct registration
when you need to control those options yourself.

## Configure and verify

Choose the [tools and credentials](./configuration) you need, then ask your
assistant to inspect the B2C MCP configuration before accessing an instance.
Check that it reports the intended project and target.

`@latest` follows the current release. Replace it with a specific published
version if your team needs a fixed version; restart the MCP after updates.

## Troubleshooting

| Problem                                | What to check                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Server does not start                  | Run `node --version` and `npx --version` in the environment launching your client.                                                         |
| `spawn npx ENOENT`                     | The client cannot find Node.js on its PATH. Launch the editor from your terminal or configure the absolute path to `npx`.                  |
| Wrong project or missing configuration | Set `--project-directory` to the intended project. Check the target with `config_inspect`.                                                 |
| Missing tools                          | Check [tool selection](./configuration#toolset-selection) and whether the capability requires preview access.                              |
| Authentication fails                   | Check the credentials and scopes for the [requested capability](./toolsets), then consult [authentication setup](../guide/authentication). |

For client-specific controls, see the documentation for
[Codex](https://developers.openai.com/codex/mcp/),
[Claude Code](https://docs.claude.com/en/docs/claude-code/mcp),
[Cursor](https://cursor.com/docs/context/mcp), or
[GitHub Copilot](https://code.visualstudio.com/docs/copilot/customization/mcp-servers).
