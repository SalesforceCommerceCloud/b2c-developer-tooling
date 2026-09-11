---
description: Agentic B2C Developer Toolkit — AI agent skills and plugins that teach Agentforce Vibes, Claude Code, Codex, Cursor, and GitHub Copilot the full B2C Commerce stack.
---

<script setup>
import {ref} from 'vue';
import AssistantInstall from '../.vitepress/theme/AssistantInstall.vue';

const selectedClient = ref('claude');
</script>

# Agent Skills

B2C skills give your AI assistant guidance for B2C Commerce development, CLI
workflows, and Storefront Next projects.

**The [B2C MCP](../mcp/) gives your assistant access to guidance from the `b2c`,
`b2c-cli`, and `storefront-next` collections** through its
[`skills_read` tool](../mcp/toolsets#documentation). Your assistant can find and read
that guidance as needed, without a separate skills installation. You can also
install these collections directly in your assistant, alongside the MCP or on their own.
The Figma plugins are optional additions and require the Figma MCP server.

## Skill Collections {#available-plugins}

| Collection                                                                                                                                              | What it covers                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [`b2c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/b2c/skills)                                                   | B2C Commerce development: controllers, ISML, logging, services, jobs, Page Designer, and Custom APIs.      |
| [`b2c-cli`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/b2c-cli/skills)                                           | CLI workflows for deployment, jobs, site archives, WebDAV, and sandboxes.                                  |
| [`storefront-next`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/storefront-next/skills)                           | Storefront development: routing, data, components, Page Designer, authentication, testing, and deployment. |
| [`storefront-next-figma`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/storefront-next-figma/skills)               | Customize Storefront Next Figma design kits and apply your brand. Requires the Figma MCP server.           |
| [`figma-to-sfnext-pagedesigner`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/figma-to-sfnext-pagedesigner/skills) | Turn Figma frames into Storefront Next Page Designer components. Requires the Figma MCP server.            |

## Install skills {#quick-start}

To install skills directly, choose your assistant. These examples
install both `b2c` and `b2c-cli`. Add optional collections such as `storefront-next`
for your project; see [Skill Collections](#available-plugins).
Our plugins use the open [Agent Plugins standard](https://agent-plugins.org/).

<AssistantInstall v-model="selectedClient" sync-url>
<template #codex-title>

### Codex

</template>
<template #codex>

#### Install the plugin <span class="recommended VPBadge">Recommended</span>

```bash
codex plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
codex plugin add b2c@b2c-developer-tooling
codex plugin add b2c-cli@b2c-developer-tooling
# Optional: codex plugin add storefront-next@b2c-developer-tooling
```

Alternatively, run `/plugins` and select the **B2C Developer Tooling** marketplace.
Start a new session after installation. This setup also works with the Codex
IDE extension and the ChatGPT Work desktop app.
For ChatGPT online, see the [B2C MCP connection setup](../mcp/#chatgpt).

::: details Update or remove

```bash
codex plugin marketplace upgrade
codex plugin marketplace remove b2c-developer-tooling
```

:::

</template>
<template #claude-title>

### Claude Code

</template>
<template #claude>

#### Install the plugin <span class="recommended VPBadge">Recommended</span>

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c@b2c-developer-tooling --scope project
claude plugin install b2c-cli@b2c-developer-tooling --scope project
# Optional: claude plugin install storefront-next@b2c-developer-tooling --scope project
```

Start a new session after installation. Use `--scope user` instead for all projects.

::: details Update or remove

```bash
claude plugin list
claude plugin marketplace update
claude plugin update b2c@b2c-developer-tooling
claude plugin update b2c-cli@b2c-developer-tooling
claude plugin uninstall b2c@b2c-developer-tooling
claude plugin uninstall b2c-cli@b2c-developer-tooling
claude plugin marketplace remove b2c-developer-tooling
```

:::

</template>
<template #copilot-title>

### GitHub Copilot in VS Code {#copilot-vs-code}

</template>
<template #copilot>

#### Install the plugin <span class="recommended VPBadge">Recommended</span>

1. Open the Command Palette (`Cmd/Ctrl+Shift+P`) and run **Chat: Install Plugin from Source**.
2. Enter `SalesforceCommerceCloud/b2c-developer-tooling`.
3. Install **b2c** and **b2c-cli**, repeating the steps as needed. Optionally add **storefront-next** for Storefront Next projects.
4. Start a new chat after installation.

To update, open the **Extensions** view, select **`···`**, then **Check for Extension Updates**.

</template>
<template #cursor-title>

### Cursor

</template>
<template #cursor>

Install both collections in your project:

```bash
npx @salesforce/b2c-cli setup skills b2c --ide cursor
npx @salesforce/b2c-cli setup skills b2c-cli --ide cursor
# Optional: npx @salesforce/b2c-cli setup skills storefront-next --ide cursor
```

Add `--global` for all projects. See [Cursor skills](https://cursor.com/docs/skills)
for client settings.

::: warning Manually installed skills don't auto-update
Run the same commands with `--update` to refresh your installed skills.
:::

</template>
<template #opencode-title>

### OpenCode

</template>
<template #opencode>

Install both collections in your project:

```bash
npx @salesforce/b2c-cli setup skills b2c --ide opencode
npx @salesforce/b2c-cli setup skills b2c-cli --ide opencode
# Optional: npx @salesforce/b2c-cli setup skills storefront-next --ide opencode
```

Add `--global` for all projects. Start a new session after installation.
See [OpenCode skills](https://opencode.ai/docs/skills/).

::: warning Manually installed skills don't auto-update
Run the same commands with `--update` to refresh your installed skills.
:::

</template>
<template #gemini-title>

### Gemini CLI

</template>
<template #gemini>

Install both collections in your project's `.agents/skills/` directory:

```bash
npx @salesforce/b2c-cli setup skills b2c --ide manual
npx @salesforce/b2c-cli setup skills b2c-cli --ide manual
# Optional: npx @salesforce/b2c-cli setup skills storefront-next --ide manual
```

Gemini CLI discovers this shared skills directory. Start a new session after
installation. See [Gemini CLI skills](https://geminicli.com/docs/cli/skills/).

::: warning Manually installed skills don't auto-update
Run the same commands with `--update` to refresh your installed skills.
:::

</template>
</AssistantInstall>

For [Copilot CLI](#copilot-cli), [Agentforce Vibes](#agentforce-vibes),
and other clients, see [Other Agent Harnesses](#other-ides).

### Other Agent Harnesses {#other-ides}

<details class="details custom-block" id="copilot-cli">
<summary>GitHub Copilot CLI</summary>

```bash
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install b2c@b2c-developer-tooling
copilot plugin install b2c-cli@b2c-developer-tooling
# Optional: copilot plugin install storefront-next@b2c-developer-tooling
```

Start a new session. Use your client's plugin controls for updates.

</details>

<details class="details custom-block" id="agentforce-vibes">
<summary>Agentforce Vibes</summary>

```bash
npx @salesforce/b2c-cli setup skills b2c --ide agentforce-vibes
npx @salesforce/b2c-cli setup skills b2c-cli --ide agentforce-vibes
# Optional: npx @salesforce/b2c-cli setup skills storefront-next --ide agentforce-vibes
```

Add `--global` for all projects and `--update` to refresh an existing installation.
See [Skills in Agentforce Vibes](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/skills.html).

</details>

### Manual installation {#manual-installation}

For other assistants, install skills in the directory your client supports.
Many clients discover skills in `.agents/skills/` within your project.

::: warning Manually installed skills don't auto-update
Refresh skills installed with `b2c setup skills` by running the same command with
`--update`. For skills copied by hand, replace them with the latest source files.
:::

<details class="details custom-block" id="b2c-cli">
<summary>Install or update with the B2C CLI</summary>

Choose collections and clients interactively:

```bash
b2c setup skills
```

Or install both collections to `.agents/skills/`:

```bash
b2c setup skills b2c --ide manual
b2c setup skills b2c-cli --ide manual
# Optional: b2c setup skills storefront-next --ide manual
```

Use `--directory ./my-skills` for a custom directory, or change `--ide` for your editor.
Add `--global` for a user-level installation or `--update` to refresh installed
skills. Use `--list` to list available skills and `--skill <name>` to select
individual skills. See [Setup Commands](/cli/setup) for all options.

</details>

## Skills in action

### Add useful logging

<ExamplePrompt>

> Add logging to this checkout controller so I can diagnose failures without logging customer data or credentials.

</ExamplePrompt>

![Screenshot placeholder: an assistant applying B2C Commerce logging guidance to a checkout controller.](/placeholders/skills-checkout-logging.svg)

The **B2C Commerce** collection covers cartridge development, including logging patterns.

### Build an editable component

<ExamplePrompt>

> Create a Page Designer component for my Storefront Next project with an editable heading, image, and link.

</ExamplePrompt>

![Screenshot placeholder: a Storefront Next Page Designer component with editable content, alongside the assistant's completion summary.](/placeholders/skills-page-designer.svg)

The **Storefront Next** collection covers components and Page Designer integration.

## Usage Examples

Example requests for the installed collections:

<ExamplePrompt>

> Help me create a Custom API for loyalty information.

</ExamplePrompt>

<ExamplePrompt>

> Add a new route with a loader to my Storefront Next app.

</ExamplePrompt>

<ExamplePrompt>

> Convert this Figma frame into Page Designer components for my Storefront Next project.

</ExamplePrompt>

Live operations such as deployment also require the relevant
[tools and credentials](./authentication). Skills provide guidance; installing
skills alone does not connect your B2C Commerce environment.
