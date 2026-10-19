---
description: Install the B2C MCP server and skills in Claude Cowork and ChatGPT Work.
---

# Desktop Assistants

Claude Cowork and ChatGPT Work run B2C Commerce tasks from the desktop, outside a
code editor or terminal. Each app installs plugins from its own source, so a plugin
installed in one Claude or ChatGPT surface is not always available in another.

The **b2c-dx-mcp** plugin includes the [B2C MCP](../mcp/) tools, documentation,
and [skill collections](./agent-skills). No separate skills installation is needed.

| Surface                     | Where plugins come from      | Setup                                    |
| --------------------------- | ---------------------------- | ---------------------------------------- |
| Claude Cowork               | Marketplaces added in Cowork | [Claude Cowork](#claude-cowork)          |
| Claude Desktop **Code** tab | Claude Code plugins          | [Claude Code setup](../mcp/#setup)       |
| Claude Desktop chat         | Desktop MCP configuration    | [Claude Desktop](../mcp/#claude-desktop) |
| ChatGPT Work                | Codex plugins                | [ChatGPT Work](#chatgpt-work)            |
| ChatGPT online              | Secure MCP Tunnel            | [ChatGPT online](../mcp/#chatgpt)        |

## Before you start

Install [Node.js](https://nodejs.org/) 22.16.0 or higher. The plugin starts the
MCP server on your computer with `npx`. Connected tasks use your existing
[B2C Commerce configuration](./configuration).

## Claude Cowork {#claude-cowork}

Cowork installs plugins separately from Claude Code. Plugins installed with
`claude plugin install` are available in the Desktop **Code** tab, not in Cowork.

1. Add a marketplace with the URL `SalesforceCommerceCloud/b2c-developer-tooling`.
   Keep **Sync automatically** on to receive updates.

   [![Claude Add marketplace dialog with SalesforceCommerceCloud/b2c-developer-tooling entered as the URL and Sync automatically turned on.](/screenshots/claude-cowork-add-marketplace.png)](/screenshots/claude-cowork-add-marketplace.png)

2. Install **b2c-dx-mcp**. Cowork confirms that the plugin runs a local MCP server
   with access to everything available to Cowork.

   ![Screenshot placeholder: Cowork confirming that the b2c-dx-mcp plugin includes a local MCP server.](/placeholders/cowork-install-mcp.svg)

3. Optionally install skill collections such as **b2c**, **b2c-cli**, or **b2c-ops**
   to load their guidance directly. The MCP already provides them through
   [`skills_read`](../mcp/toolsets#documentation).
4. Start a new Cowork task.

<ExamplePrompt>

> Were there any problems with last night's jobs on my site? Let me know what needs attention.

</ExamplePrompt>

![Screenshot placeholder: a Cowork task reviewing last night's job runs with B2C MCP tools.](/placeholders/cowork-b2c-task.svg)

::: warning Artifacts and live data
Cowork artifacts, such as dashboards, cannot call the B2C MCP tools directly yet;
calls from an artifact fail with `Tool call failed: 400`. Ask Cowork to embed the
data in the artifact instead, and use a scheduled task to refresh it, for example
every weekday morning. A **Refresh now** button in the artifact can run that task
on demand. For live data, ask for a dashboard that runs on your computer instead.
:::

## ChatGPT Work {#chatgpt-work}

ChatGPT Work uses the plugins installed for Codex. If you already installed the
B2C plugin for the Codex CLI or IDE extension, it is available in ChatGPT Work.
Otherwise, install it with the Codex CLI:

<!--@include: ../_partials/mcp-plugin-codex.md-->

![Screenshot placeholder: the B2C Developer Tooling plugins available in ChatGPT Work.](/placeholders/chatgpt-work-install.svg)

Start a new ChatGPT Work task. To update or remove the plugin, use the
[Codex commands](./agent-skills#codex).

<ExamplePrompt>

> Summarize the promotions in campaign spring-sale. Flag schedule conflicts and disabled promotions.

</ExamplePrompt>

![Screenshot placeholder: ChatGPT Work reviewing campaign promotions with B2C MCP tools.](/placeholders/mcp-chatgpt-campaign.svg)

ChatGPT online in a browser does not use Codex plugins. To connect it, see
[ChatGPT online](../mcp/#chatgpt).

## Troubleshooting

| Problem                   | What to check                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Plugin is missing         | Check that you installed it for this surface. Cowork and Claude Code install separately; ChatGPT Work shares Codex plugins. |
| Server does not start     | Run `node --version` and confirm Node.js 22.16.0 or higher. Restart the app after installing Node.js.                       |
| Wrong project or instance | Specify the intended project or named instance in your request.                                                             |
| Old tools or skills       | Update the marketplace or plugin, then start a new task.                                                                    |
| Artifact shows no data    | Cowork artifacts cannot call local MCP tools. Embed the data and refresh it with a scheduled task.                          |

See [MCP troubleshooting](../mcp/#troubleshooting) for authentication and
configuration issues.
