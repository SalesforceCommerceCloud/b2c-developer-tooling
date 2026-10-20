---
description: Install the B2C Commerce MCP server and skills in Claude Desktop (Cowork) and the ChatGPT desktop app (ChatGPT Work) to run B2C tasks from desktop AI assistants.
---

# Desktop Assistants

Claude Desktop (Cowork) and ChatGPT (Work) run B2C Commerce tasks from the desktop, outside a
code editor or terminal. Each app installs plugins from its own source, so a plugin
installed in one Claude or ChatGPT surface is not always available in another.

The **b2c-dx-mcp** plugin includes the [B2C MCP](../mcp/) tools, documentation,
and [skill collections](./agent-skills). No separate skills installation is needed.

| Surface                     | Where plugins come from              | Setup                                     |
| --------------------------- | ------------------------------------ | ----------------------------------------- |
| Claude Desktop (Cowork)     | Marketplaces added in Claude Desktop | [Claude Desktop (Cowork)](#claude-cowork) |
| Claude Desktop **Code** tab | Claude Code plugins                  | [Claude Code setup](../mcp/#setup)        |
| ChatGPT (Work)              | Codex plugins                        | [ChatGPT (Work)](#chatgpt-work)           |
| ChatGPT online              | Secure MCP Tunnel                    | [ChatGPT online](../mcp/#chatgpt)         |

## Before you start

Install [Node.js](https://nodejs.org/) 22.16.0 or higher. The plugin starts the
MCP server on your computer with `npx`. Connected tasks use your existing
[B2C Commerce configuration](./configuration).

## Claude Desktop (Cowork) {#claude-cowork}

Claude Desktop runs tasks from **Home**; this was previously the separate Cowork
mode. It installs plugins separately from Claude Code. Plugins installed with
`claude plugin install` are available in the **Code** tab, not on **Home**.

1. Add a marketplace with the URL `SalesforceCommerceCloud/b2c-developer-tooling`.
   Keep **Sync automatically** on to receive updates.

   [![Claude Add marketplace dialog with SalesforceCommerceCloud/b2c-developer-tooling entered as the URL and Sync automatically turned on.](/screenshots/claude-cowork-add-marketplace.png)](/screenshots/claude-cowork-add-marketplace.png)

2. Install **b2c-dx-mcp**. Claude warns that the plugin runs a local MCP server
   with access to everything available to Cowork. Select **Continue**.

   [![Cowork dialog warning that the B2C DX MCP plugin includes the local b2c-dx-mcp server, with Disable plugin and Continue buttons.](/screenshots/claude-cowork-install-mcp.png)](/screenshots/claude-cowork-install-mcp.png)

3. Optionally install skill collections such as **b2c**, **b2c-cli**, or **b2c-ops**
   to load their guidance directly. The MCP already provides them through
   [`skills_read`](../mcp/toolsets#documentation).
4. Start a new task from **Home**. If your message box still shows **Chat** and
   **Cowork** options, choose **Cowork**.

<ExamplePrompt>

> Were there any failing jobs recently on my site?

</ExamplePrompt>

[![A Claude Desktop task answering "Were there any failing jobs recently on bdpx-prd?" after using 6 B2C MCP tools, with a table of two failing system jobs, their failure counts, and failure patterns.](/screenshots/claude-cowork-b2c-task.png)](/screenshots/claude-cowork-b2c-task.png)

## ChatGPT (Work) {#chatgpt-work}

The ChatGPT desktop app runs Codex plugins. Codex shares its plugins between
ChatGPT and the Codex CLI, so installing in either place makes the plugin
available in both. To install in ChatGPT:

1. Open **Settings > Plugins** and select **Add > Add marketplace**. Enter
   `SalesforceCommerceCloud/b2c-developer-tooling` as the source, leave the
   other fields empty, and select **Add marketplace**.

   [![ChatGPT Add plugin marketplace dialog with SalesforceCommerceCloud/b2c-developer-tooling entered as the source.](/screenshots/chatgpt-add-marketplace.png)](/screenshots/chatgpt-add-marketplace.png)

2. Open **Plugins**, select the **Personal** tab, choose **B2C DX MCP**, and
   select **Install plugin**.

   [![ChatGPT plugin page for B2C DX MCP from the B2C Developer Tooling marketplace, showing the Install plugin button and the b2c-dx-mcp server.](/screenshots/chatgpt-install-mcp.png)](/screenshots/chatgpt-install-mcp.png)

To install with the Codex CLI instead:

<!--@include: ../_partials/mcp-plugin-codex.md-->

Start a new ChatGPT Work task. To update or remove the plugin, use the
[Codex CLI commands](./agent-skills#codex).

<ExamplePrompt>

> Summarize the current promotions and campaigns on my site. Any schedule conflicts?

</ExamplePrompt>

[![ChatGPT listing schedule overlaps across a site's campaigns: open-ended seasonal offers, overlapping order, shipping, and product discounts, and a test campaign still active.](/screenshots/chatgpt-work-campaign.png)](/screenshots/chatgpt-work-campaign.png)

ChatGPT online in a browser does not use Codex plugins. To connect it, see
[ChatGPT online](../mcp/#chatgpt).

## Troubleshooting

| Problem                   | What to check                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugin is missing         | Check that you installed it for this surface. Claude Desktop (Cowork) and Claude Code install separately; ChatGPT and the Codex CLI share Codex plugins. |
| Server does not start     | Run `node --version` and confirm Node.js 22.16.0 or higher. Restart the app after installing Node.js.                                                    |
| Wrong project or instance | Specify the intended project or named instance in your request.                                                                                          |
| Old tools or skills       | Update the marketplace or plugin, then start a new task.                                                                                                 |
| Artifact shows no data    | Cowork artifacts cannot call local MCP tools. Embed the data and refresh it with a scheduled task.                                                       |

See [MCP troubleshooting](../mcp/#troubleshooting) for authentication and
configuration issues.
