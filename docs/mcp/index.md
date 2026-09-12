---
description: Connect your AI assistant to B2C Commerce tools, documentation, skills, and APIs.
---

# MCP (Model Context Protocol)

The B2C MCP server connects your AI assistant to Salesforce B2C Commerce tools,
documentation, and workflow skills. Build and debug storefronts, deploy code,
and manage your sites through requests in your assistant.

Your assistant can find and read guidance from our B2C Commerce, B2C CLI,
operations runbooks, and Storefront Next [skill collections](../guide/agent-skills) through the
[`skills_read` tool](./toolsets#documentation). **No separate skills installation
is needed.** Documentation and skills work without B2C Commerce credentials;
connected tasks use your existing [B2C configuration](../guide/configuration).

## Set up your assistant {#setup}

Choose your assistant. **Plugin installation is recommended where supported**;
manual setup includes the same tools, documentation, and skills.
Our plugins use the open [Agent Plugins standard](https://agent-plugins.org/).

<AssistantInstall sync-url>

<!--@include: ../_partials/mcp-setup-panels.md-->

</AssistantInstall>

For [Claude Desktop](#claude-desktop), [Copilot CLI](#copilot-cli), [ChatGPT online](#chatgpt),
and other clients, see [Other clients](#other-clients).

## B2C Commerce documentation

Ask your assistant to find and explain Salesforce documentation for the task
at hand. Search spans the Script API, storefront and API guides, standard job
steps, XML schemas, and Salesforce Help for administration and merchandising.
Get help understanding code, planning a site change, or checking Business Manager
settings, with links to the relevant references. No B2C Commerce credentials are needed.

<ExamplePrompt>

> How do promotion exclusivity and rank affect which discounts a shopper receives? Explain with an example and link to the Salesforce documentation.

</ExamplePrompt>

[Explore documentation search](./toolsets#documentation). Also available through
the [B2C CLI](../cli/docs).

## Developer Tasks

- **Build:** find platform documentation and apply B2C Commerce development patterns.
- **Debug:** investigate logs and inspect live cartridge execution with breakpoints, variables, and call stacks.
- **Deploy:** publish cartridges and Managed Runtime storefront bundles.

<ExamplePrompt>

> This controller returns the wrong result in my sandbox. Set a breakpoint and inspect the variables while I reproduce the request. Explain what happened, then resume execution and disconnect. Don't change the code.

</ExamplePrompt>

[Debug with your assistant](../guide/script-debugger#debug-with-your-assistant).
Breakpoints pause requests; use a sandbox for debugging.

![Screenshot placeholder: Codex inspecting a paused sandbox request, its call stack, and live cartridge variables.](/placeholders/mcp-codex-debugging.svg)

## Administrator and Merchant Tasks

[SCAPI code mode](./toolsets#scapi-code-mode) covers nearly 600 Salesforce Commerce API operations.
Review campaigns and promotions, investigate job failures, or create products and assign catalog categories.

Included [operations runbooks](../guide/operations) help your assistant review
scheduled work, investigate checkout failures, and prepare evidence for your
administrator, developer, integration provider, or Salesforce Support.

<ExamplePrompt>

> Review last night's jobs for my configured site. Flag recurring failures or incomplete updates and prepare a handoff for anything that needs attention. Don't rerun jobs or change data.

</ExamplePrompt>

<ExamplePrompt>

> Summarize the promotions in campaign spring-sale. Flag schedule conflicts and disabled promotions.

</ExamplePrompt>

Standard and custom Admin APIs support live requests. Shopper APIs are available for reference.

![Screenshot placeholder: a planned ChatGPT Work campaign review showing promotion schedules and findings.](/placeholders/mcp-chatgpt-campaign.svg)

## Configuration and access

Connected tasks use your [B2C Commerce configuration](../guide/configuration) and account permissions.
See [authentication](../guide/authentication) for credential setup and [Security and Access](./security)
for approvals, credential handling, and Safety Mode.

The default installation includes all toolsets. [Advanced configuration](./configuration#toolset-selection)
lets you choose specific tools or toolsets for manual installations.

## Tools and skills

Browse [MCP Tools](./toolsets) for capabilities and tool names, or [Agent Skills](../guide/agent-skills)
for the included collections, optional additions, and standalone installation.

## Other clients {#other-clients}

### Claude Desktop {#claude-desktop}

Open **Settings > Developer > Edit Config** and add:

<!--@include: ../_partials/mcp-manual-json.md-->

Save, then fully quit and reopen Claude Desktop. See
[Claude Desktop local server setup](https://modelcontextprotocol.io/docs/develop/connect-local-servers).

### Copilot CLI {#copilot-cli}

Install the plugin:

<!--@include: ../_partials/mcp-plugin-copilot-cli.md-->

Start a new Copilot session in your project.

::: details Manual MCP setup

```bash
copilot mcp add b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest
```

:::

See [Copilot CLI MCP setup](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers).

### ChatGPT online {#chatgpt}

ChatGPT online uses a separate connection from the desktop apps. To connect this local MCP server,
follow OpenAI's [Secure MCP Tunnel setup](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)
and configure a stdio server with:

| Setting   | Value                              |
| --------- | ---------------------------------- |
| Command   | `npx`                              |
| Arguments | `-y @salesforce/b2c-dx-mcp@latest` |

The tunnel requires OpenAI Platform permissions and access to ChatGPT developer mode.
Follow [OpenAI's ChatGPT connection instructions](https://developers.openai.com/apps-sdk/deploy/connect-chatgpt/)
to select your tunnel. Keep the tunnel client running on the machine with your
[B2C Commerce configuration](./configuration).

### Other MCP clients {#other-mcp-clients}

Add a **local / stdio** server using your client's MCP settings:

| Setting   | Value                              |
| --------- | ---------------------------------- |
| Name      | `b2c-dx-mcp`                       |
| Command   | `npx`                              |
| Arguments | `-y @salesforce/b2c-dx-mcp@latest` |

For clients that accept an `mcpServers` configuration:

<!--@include: ../_partials/mcp-manual-json.md-->

Clients use different configuration locations and formats. Their setup guides
cover where to register the server:

| Client                 | Setup guide                                                               |
| ---------------------- | ------------------------------------------------------------------------- |
| Windsurf               | [Cascade MCP settings](https://docs.windsurf.com/windsurf/cascade/mcp)    |
| Cline                  | [MCP servers](https://docs.cline.bot/mcp/mcp-overview)                    |
| JetBrains AI Assistant | [MCP configuration](https://www.jetbrains.com/help/ai-assistant/mcp.html) |
| Zed                    | [MCP servers](https://zed.dev/docs/ai/mcp)                                |
| Amp                    | [MCP configuration](https://ampcode.com/manual)                           |
| Warp                   | [MCP servers](https://docs.warp.dev/knowledge-and-collaboration/mcp)      |

Restart the connection after configuration. Clients that accept only a remote
server URL need a compatible bridge or tunnel; this package runs locally.

<details class="details custom-block">
<summary>Windows manual setup</summary>

If your client cannot launch `npx` on Windows, use `cmd` with these arguments
in its manual server configuration:

```json
"command": "cmd",
"args": ["/c", "npx", "-y", "@salesforce/b2c-dx-mcp@latest"]
```

For clients with a command array, such as OpenCode, use
`["cmd", "/c", "npx", "-y", "@salesforce/b2c-dx-mcp@latest"]`.

</details>

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
