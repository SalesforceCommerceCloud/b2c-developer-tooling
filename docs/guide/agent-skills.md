---
description: Agentic B2C Developer Toolkit — AI agent skills and plugins that teach Agentforce Vibes, Claude Code, Codex, Cursor, and GitHub Copilot the full B2C Commerce stack.
---

# Agent Skills

B2C skills give your AI assistant guidance for B2C Commerce development, CLI
workflows, and Storefront Next projects.

**Using the [B2C MCP](../mcp/)? No need to install the `b2c`, `b2c-cli`, or
`storefront-next` skills plugins separately.** Those collections are included.
The Figma plugins are optional additions and require the Figma MCP server.

## Quick Start

To use skills independently of the MCP, install a skills plugin for your client.
These examples install `b2c` for B2C Commerce development; replace it with another
plugin from the [catalog](#available-plugins) as needed.

::: code-group

```bash [Codex]
codex plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
codex plugin add b2c@b2c-developer-tooling
```

```bash [Claude Code]
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c@b2c-developer-tooling --scope project
```

```bash [Copilot CLI]
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install b2c@b2c-developer-tooling
```

:::

Start a new session after installation. For [Copilot in VS Code](#copilot-vs-code),
[Cursor](#cursor), and [other IDEs](#other-ides), see the client instructions below.

## Skill Collections {#available-plugins}

<table>
  <colgroup>
    <col style="width: 12rem" />
    <col />
  </colgroup>
  <thead>
    <tr><th>Plugin</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/b2c-cli/skills"><code>b2c-cli</code></a></td>
      <td>B2C CLI commands and operations — code deployment, job execution, site archives, WebDAV, On-Demand Sandbox management</td>
    </tr>
    <tr>
      <td><a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/b2c/skills"><code>b2c</code></a></td>
      <td>B2C Commerce development patterns — controllers, ISML, forms, localization, logging, metadata, web services, custom job steps, Page Designer, Business Manager extensions, Custom APIs</td>
    </tr>
    <tr>
      <td><a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/storefront-next/skills"><code>storefront-next</code></a></td>
      <td>Storefront Next development — project setup, routing, data fetching, components, Page Designer, authentication, i18n, extensions, testing, and deployment to Managed Runtime</td>
    </tr>
    <tr>
      <td><a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/storefront-next-figma/skills"><code>storefront-next-figma</code></a></td>
      <td>Customize Storefront Next Figma design kits, apply your brand, and connect designs to components. Requires the <a href="https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server">Figma MCP server</a></td>
    </tr>
    <tr>
      <td><a href="https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/figma-to-sfnext-pagedesigner/skills"><code>figma-to-sfnext-pagedesigner</code></a></td>
      <td>Build Storefront Next Page Designer components from Figma frames, with your branding and B2C Commerce product data. Requires the <a href="https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server">Figma MCP server</a></td>
    </tr>
    <tr>
      <td><a href="/mcp/"><code>b2c-dx-mcp</code></a></td>
      <td>B2C Commerce tools, documentation, and the B2C Commerce, B2C CLI, and Storefront Next skills. See <a href="/mcp/installation">MCP Installation</a></td>
    </tr>
  </tbody>
</table>

## Claude Code

Add the marketplace:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
```

Install the collection you need. This example installs `b2c`; replace it with
another plugin name from the table.

::: code-group

```bash [User Scope (default)]
claude plugin install b2c@b2c-developer-tooling
```

```bash [Project Scope]
claude plugin install b2c@b2c-developer-tooling --scope project
```

:::

Verify, update, or uninstall:

```bash
claude plugin list
claude plugin marketplace update
claude plugin update b2c-cli@b2c-developer-tooling
claude plugin update storefront-next@b2c-developer-tooling
claude plugin uninstall b2c-cli@b2c-developer-tooling
claude plugin marketplace remove b2c-developer-tooling
```

## Codex

Add the marketplace:

```bash
codex plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
```

Install the collection you need; for example:

```bash
codex plugin add b2c@b2c-developer-tooling
```

Alternatively, run `/plugins`, select the **B2C Developer Tooling** marketplace, and install plugins interactively. Start a new Codex session after installation so bundled skills and MCP tools are loaded.

Upgrade or remove the marketplace later with:

```bash
codex plugin marketplace upgrade b2c-developer-tooling
codex plugin marketplace remove b2c-developer-tooling
```

## Cursor

Install the collection you need with the B2C CLI:

::: code-group

```bash [Project Scope]
npx @salesforce/b2c-cli setup skills b2c --ide cursor
```

```bash [User Scope]
npx @salesforce/b2c-cli setup skills b2c --ide cursor --global
```

:::

Replace `b2c` with another collection from the table. See
[Cursor skills](https://cursor.com/docs/skills) for client settings.

## Copilot

GitHub Copilot supports skills in both VS Code and the Copilot CLI.

### Copilot (VS Code)

In VS Code, open the Command Palette (Cmd/Ctrl+Shift+P) and run **Chat: Install Plugin from Source**, then enter:

```
SalesforceCommerceCloud/b2c-developer-tooling
```

::: tip Updating Copilot skills in VS Code
To pull the latest skills, open the **Extensions** view, click the **`···`** menu, and select **Check for Extension Updates**.
:::

### Copilot CLI

Add the marketplace and install the collection you need; for example:

```bash
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install b2c@b2c-developer-tooling
```

## B2C CLI

Interactive — select skillsets and IDEs:

```bash
b2c setup skills
```

List available skills:

```bash
b2c setup skills b2c --list
b2c setup skills b2c-cli --list
b2c setup skills storefront-next --list
b2c setup skills storefront-next-figma --list
b2c setup skills figma-to-sfnext-pagedesigner --list
```

Install to specific IDEs:

::: code-group

```bash [Project Scope]
b2c setup skills b2c --ide cursor
b2c setup skills b2c-cli --ide windsurf
b2c setup skills b2c --ide cursor --ide windsurf
```

```bash [User Scope]
b2c setup skills b2c --ide cursor --global
b2c setup skills b2c-cli --ide vscode --global
```

:::

Install specific skills only:

```bash
b2c setup skills b2c-cli --skill b2c-code --skill b2c-webdav --ide cursor
```

Update existing skills:

```bash
b2c setup skills b2c --ide cursor --update
```

Non-interactive (CI/CD):

```bash
b2c setup skills b2c-cli --ide cursor --global --force
```

See [Setup Commands](/cli/setup) for full documentation.

## Agentforce Vibes

See [Skills in Agentforce Vibes](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/skills.html) for platform details.

```bash
b2c setup skills b2c --ide agentforce-vibes
b2c setup skills b2c-cli --ide agentforce-vibes
b2c setup skills b2c --ide agentforce-vibes --global
```

## Other IDEs

::: tip
Use [`b2c setup skills`](/cli/setup) for any supported IDE.
:::

| IDE                                                                                        | Flag             |
| ------------------------------------------------------------------------------------------ | ---------------- |
| [Cursor](https://cursor.com/docs/skills)                                                   | `--ide cursor`   |
| [Windsurf](https://docs.windsurf.com/)                                                     | `--ide windsurf` |
| [VS Code / Copilot](https://code.visualstudio.com/docs/copilot/customization/agent-skills) | `--ide vscode`   |
| [Codex CLI](https://github.com/openai/codex)                                               | `--ide codex`    |
| [OpenCode](https://opencode.ai/)                                                           | `--ide opencode` |

### Manual Installation

::: warning Manually installed skills don't auto-update
Refresh skills installed with `b2c setup skills` by running the same command with
`--update`. For skills copied by hand, replace them with the latest source files.
:::

Install to `.agents/skills/` (default) or a custom directory:

```bash
b2c setup skills b2c --ide manual
b2c setup skills b2c --ide manual --directory ./my-skills
```

## Usage Examples

Example requests for the installed collections:

> Help me create a Custom API for loyalty information.

> Add logging to my checkout controller.

> Add a new route with a loader to my Storefront Next app.

> Convert this Figma frame into Page Designer components for my Storefront Next project.

Live operations such as deployment also require the relevant
[tools and credentials](../mcp/configuration). Skills provide guidance; installing
skills alone does not connect your B2C Commerce environment.
