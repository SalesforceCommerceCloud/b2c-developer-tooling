---
description: Add B2C Commerce to Codex, Claude Code, or GitHub Copilot with the recommended agent plugin. Direct MCP setup is also available.
---

<script setup>
import {ref} from 'vue';
import McpInstall from '../.vitepress/theme/McpInstall.vue';

// Page updates let VitePress refresh the outline when the selected client changes.
const selectedClient = ref('codex');
</script>

# Installation

**Install the B2C MCP plugin** in a compatible client. It registers the server
for you and includes access to B2C Commerce tools, documentation, and workflow skills.
No B2C Commerce credentials are needed to start with documentation and skills.

The MCP includes the B2C Commerce, B2C CLI, and Storefront Next skills from our
[agent skills plugins](../guide/agent-skills). **No need to install those skills
plugins separately.**

Choose your client for plugin or manual setup. Manual installation includes the
same tools, documentation, and skills. When editing an existing configuration,
merge the B2C entry with your other servers.

<McpInstall v-model="selectedClient">
<template #codex>

## Codex

### Install the plugin

Run these commands in your terminal:

<!--@include: ../_partials/mcp-plugin-codex.md-->

Start a new Codex session in your project. Use `/mcp` to check the B2C server.

The Codex IDE extension shares MCP configuration with Codex CLI. Configure the
server once through the CLI, then start a new IDE session to use it there.

### Manual MCP setup

::: details Commands and configuration

Run:

```bash
codex mcp add b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest
```

Alternatively, add this to `~/.codex/config.toml` (or `$CODEX_HOME/config.toml`
if customized):

```toml
[mcp_servers.b2c-dx-mcp]
command = "npx"
args = ["-y", "@salesforce/b2c-dx-mcp@latest"]
```

Start a new session after registering the server.
See [Codex MCP configuration](https://developers.openai.com/codex/mcp/).

:::

</template>
<template #claude>

## Claude Code

### Install the plugin

From your project directory:

<!--@include: ../_partials/mcp-plugin-claude.md-->

Restart Claude Code and use `/mcp` to check the B2C server. Choose `--scope user`
instead if you want the plugin available across projects.

### Manual MCP setup

::: details Commands and configuration

From your project directory:

```bash
claude mcp add --transport stdio --scope project b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest
```

Restart Claude Code after registration. See
[Claude Code MCP setup](https://code.claude.com/docs/en/mcp) for client controls.

:::

</template>
<template #copilot>

## GitHub Copilot in VS Code

### Install the plugin

1. Open the Command Palette (`Cmd/Ctrl+Shift+P`) and run **Chat: Install Plugin from Source**.
2. Enter `SalesforceCommerceCloud/b2c-developer-tooling`.
3. Select **b2c-dx-mcp** and follow the installation prompts.
4. Start a new chat and enable the B2C tools when prompted.

See [VS Code agent plugins](https://code.visualstudio.com/docs/copilot/customization/agent-plugins)
for plugin availability and organization settings.

### Manual MCP setup

::: details Commands and configuration

[Install in VS Code](https://vscode.dev/redirect/mcp/install?name=b2c-dx-mcp&config=%7B%22type%22%3A%22stdio%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40salesforce%2Fb2c-dx-mcp%40latest%22%5D%7D), or add this server to `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "b2c-dx-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest"]
    }
  }
}
```

See [VS Code MCP setup](https://code.visualstudio.com/docs/copilot/customization/mcp-servers).

:::

</template>
<template #copilot-cli>

## GitHub Copilot CLI

### Install the plugin

<!--@include: ../_partials/mcp-plugin-copilot-cli.md-->

Start a new Copilot session in your project. Use `/mcp` to check the B2C server.

### Manual MCP setup

::: details Commands and configuration

Register the server directly:

```bash
copilot mcp add b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest
```

Restart the session after registration. See
[Copilot CLI MCP setup](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers).

:::

</template>
<template #cursor>

## Cursor

### Connect the MCP server

[Install in Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=b2c-dx-mcp&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBzYWxlc2ZvcmNlL2IyYy1keC1tY3BAbGF0ZXN0Il19), or add this server to `.cursor/mcp.json` in your project:

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

Reload the MCP server in Cursor. For a user-level installation, use
`~/.cursor/mcp.json` instead.
See [Cursor MCP setup](https://cursor.com/docs/context/mcp).

</template>
<template #claude-desktop>

## Claude Desktop

Open **Settings > Developer > Edit Config** and add:

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

Save, then fully quit and reopen Claude Desktop. The configuration file is at:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

See [Claude Desktop local server setup](https://modelcontextprotocol.io/docs/develop/connect-local-servers).

</template>
<template #windsurf>

## Windsurf

Add this to `~/.codeium/windsurf/mcp_config.json`:

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

Refresh the servers in Cascade's MCP settings.
See [Windsurf MCP setup](https://docs.windsurf.com/windsurf/cascade/mcp).

</template>
<template #gemini>

## Gemini CLI

From your project directory, run:

```bash
gemini mcp add --scope project b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest
```

Use `--scope user` for an installation across projects. Alternatively, add this
to `.gemini/settings.json` in your project or `~/.gemini/settings.json`:

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

Start a new session and use `/mcp` to check the connection.
See [Gemini CLI MCP setup](https://geminicli.com/docs/tools/mcp-server/).

</template>
<template #opencode>

## OpenCode

Add this to `opencode.json` in your project:

```json
{
  "mcp": {
    "b2c-dx-mcp": {
      "type": "local",
      "command": ["npx", "-y", "@salesforce/b2c-dx-mcp@latest"],
      "enabled": true
    }
  }
}
```

Restart OpenCode. For a user-level installation, add the same entry to
`~/.config/opencode/opencode.json`. See [OpenCode MCP setup](https://opencode.ai/docs/mcp-servers/).

</template>
<template #cline>

## Cline

Open **MCP Servers > Configure > Configure MCP Servers** in Cline and add:

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

Save the configuration and check the server's connection status in Cline.
See [Cline MCP setup](https://docs.cline.bot/mcp/mcp-overview).

</template>
<template #amp>

## Amp

Add this to `~/.config/amp/settings.json` (on Windows,
`%USERPROFILE%\.config\amp\settings.json`):

```json
{
  "amp.mcpServers": {
    "b2c-dx-mcp": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest"]
    }
  }
}
```

Restart Amp after saving. See [Amp documentation](https://ampcode.com/manual).

</template>
<template #warp>

## Warp

Open **Settings > Agents > MCP servers**, choose **+ Add**, then
**CLI Server (Command)**. Paste:

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

Save and start the server. See [Warp MCP setup](https://docs.warp.dev/knowledge-and-collaboration/mcp).

</template>
<template #zed>

## Zed

Run **zed: open settings file** from the Command Palette and add:

```json
{
  "context_servers": {
    "b2c-dx-mcp": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest"]
    }
  }
}
```

Check the connection under **Settings > AI > MCP Servers**.
See [Zed MCP setup](https://zed.dev/docs/ai/mcp).

</template>
<template #jetbrains>

## JetBrains AI Assistant

Open **Settings > Tools > AI Assistant > Model Context Protocol (MCP)**.
Choose **Add** and paste this JSON configuration for a local server:

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

Choose whether it is available globally or in the current project, then select
**OK** and **Apply**. See [JetBrains MCP setup](https://www.jetbrains.com/help/ai-assistant/mcp.html).

</template>
<template #fx>

## fx

Run:

```bash
fx mcp add b2c-dx-mcp npx -y @salesforce/b2c-dx-mcp@latest
```

Use `/mcp reload` in an active session to load the server. Use `fx mcp path` to
locate your profile for manual configuration.

</template>
<template #other>

## Other MCP clients

### Connect a local server

Use your client's MCP settings to add a **local / stdio** server:

| Setting   | Value                              |
| --------- | ---------------------------------- |
| Name      | `b2c-dx-mcp`                       |
| Command   | `npx`                              |
| Arguments | `-y @salesforce/b2c-dx-mcp@latest` |

If your client takes a JSON configuration with `mcpServers`, use:

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

Restart the connection. The server runs on your machine;
it does not require a hosted MCP endpoint. Clients that only accept a remote
server URL, such as ChatGPT web, cannot connect directly to this local server.

</template>
</McpInstall>

## Windows manual setup

If your client cannot launch `npx` on Windows, use `cmd` with these arguments
in its manual server configuration:

```json
"command": "cmd",
"args": ["/c", "npx", "-y", "@salesforce/b2c-dx-mcp@latest"]
```

For clients with a command array, such as OpenCode, use
`["cmd", "/c", "npx", "-y", "@salesforce/b2c-dx-mcp@latest"]`.

## Try it out

Open your project and ask a development question:

> Explain how this cartridge handles basket calculation and where I should add
> a custom promotion rule.

Documentation and skills need no B2C Commerce credentials. For debugging, deployment,
and live data, see [credentials and configuration](./configuration).

## Updates and customization

Use your client's plugin update controls to update a plugin installation, then
start a new session. For direct installations, `@latest` follows the current npm
release; use a specific version when your team needs a fixed version.

The default installation includes all toolsets. If you want a smaller selection
or a fixed configuration, see [advanced manual configuration](./configuration#advanced-manual-configuration).
Choose one installation method per client to avoid duplicate B2C servers.

## Troubleshooting

| Problem                   | What to check                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Server does not start     | Run `node --version` and `npx --version` in the environment launching your client.                                                           |
| `spawn npx ENOENT`        | The client cannot find Node.js. Launch the editor from your terminal or configure the absolute path to `npx` in a direct installation.       |
| Plugin is unavailable     | Update the client and check whether your organization permits the marketplace. Direct setup is available if plugins are not supported.       |
| Wrong project or instance | Specify the intended project or named instance in your request. Check [configuration defaults](./configuration#project-directory) if needed. |
| Authentication fails      | Check the access needed for the [capability](./toolsets), then follow [authentication setup](../guide/authentication).                       |
