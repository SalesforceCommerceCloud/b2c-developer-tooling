---
description: Install B2C Commerce agent plugins (skills + MCP server) into Claude Code, Codex, Cursor, GitHub Copilot, Agentforce Vibes, and other IDEs — marketplace and B2C CLI install paths, scopes, updates, and install locations.
---

# Installing Agent Plugins

Detailed, per-IDE installation for the B2C Commerce agent plugins. For a quick overview of what skills exist and how to browse them, see **[Agent Skills + MCP](/guide/agent-skills)**.

All skill plugins are published to a single Claude Code / Codex / Copilot marketplace (`SalesforceCommerceCloud/b2c-developer-tooling`) and are also installable directly with the B2C CLI (`b2c setup skills`) for any supported IDE.

::: tip Persona plugins
`b2c-operator` adds operator/admin **runbook** skills (safe production release & rollback, incident triage) that orchestrate the `b2c` CLI. Install it **alongside `b2c-cli`** so your agent has the underlying commands. See [Persona Plugins](/guide/agent-skills#persona-plugins).
:::

## Claude Code

Add the marketplace:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
```

Install plugins at your preferred scope:

::: code-group

```bash [User Scope (default)]
# Core: CLI + platform skills + MCP server
claude plugin install b2c-cli
claude plugin install b2c
claude plugin install b2c-dx-mcp

# Operator/Admin runbooks (pair with b2c-cli for the underlying commands)
claude plugin install b2c-operator

# Storefront Next (only for Storefront Next projects)
claude plugin install storefront-next
# storefront-next-figma adds Figma design-kit workflows (requires the Figma MCP server)
claude plugin install storefront-next-figma
```

```bash [Project Scope]
# Core: CLI + platform skills + MCP server
claude plugin install b2c-cli --scope project
claude plugin install b2c --scope project
claude plugin install b2c-dx-mcp --scope project

# Operator/Admin runbooks (pair with b2c-cli for the underlying commands)
claude plugin install b2c-operator --scope project

# Storefront Next (only for Storefront Next projects)
claude plugin install storefront-next --scope project
# storefront-next-figma adds Figma design-kit workflows (requires the Figma MCP server)
claude plugin install storefront-next-figma --scope project
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

Then in Codex run `/plugins`, select the **B2C Developer Tooling** marketplace, and select and install the desired plugins.

Codex does not yet support installing plugins from the command line — installs happen from the interactive `/plugins` picker. You can also point Codex at a local marketplace directory by running `codex plugin marketplace add <path-to-dir>`.

Upgrade or remove the marketplace later with:

```bash
codex plugin marketplace upgrade b2c-developer-tooling
codex plugin marketplace remove b2c-developer-tooling
```

> **Note:** The `b2c-dx-mcp` plugin is available only for Claude Code. For other clients, install the MCP server directly — see [MCP Installation](/mcp/installation).

> **Note:** The `storefront-next-figma` plugin requires the [Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) to be configured in your AI tool — its skills drive the Figma design kit (duplicating the kit, syncing brand variables, and publishing Code Connect) through Figma's MCP tools. Install it alongside `storefront-next` when you also manage the design system in Figma.

## Cursor

Cursor follows the open [Agent Skills](https://cursor.com/docs/skills) standard. Each skill is a folder containing a `SKILL.md` file with YAML frontmatter (`name`, `description`, optional `paths` for glob scoping, and optional `disable-model-invocation`). Optional `scripts/`, `references/`, and `assets/` subdirectories live alongside `SKILL.md`.

### Skill Discovery Locations

Cursor automatically loads skills from these locations:

| Path                | Scope   | Source                    |
| ------------------- | ------- | ------------------------- |
| `.cursor/skills/`   | Project | Native Cursor             |
| `.agents/skills/`   | Project | Native Cursor             |
| `~/.cursor/skills/` | User    | Native Cursor             |
| `~/.agents/skills/` | User    | Native Cursor             |
| `.claude/skills/`   | Project | Claude Code compatibility |
| `~/.claude/skills/` | User    | Claude Code compatibility |
| `.codex/skills/`    | Project | Codex compatibility       |
| `~/.codex/skills/`  | User    | Codex compatibility       |

Because Cursor reads from Claude Code and Codex paths too, **any plugin you've already installed via `claude plugin install` or `codex plugin install` is automatically picked up by Cursor** — no separate install needed.

### Install with the B2C CLI

::: code-group

```bash [Project Scope]
b2c setup skills b2c --ide cursor
b2c setup skills b2c-cli --ide cursor
b2c setup skills storefront-next --ide cursor
```

```bash [User Scope]
b2c setup skills b2c --ide cursor --global
b2c setup skills b2c-cli --ide cursor --global
b2c setup skills storefront-next --ide cursor --global
```

:::

This writes skills to `.cursor/skills/` (project) or `~/.cursor/skills/` (user). For monorepos, a `.cursor/skills/` folder placed in a nested project directory is auto-scoped to files within that directory — no `paths` field required in `SKILL.md`.

### Reuse Claude Code Plugin Installs

If you also use Claude Code, install once and Cursor will see the same skills:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-cli
claude plugin install b2c
claude plugin install storefront-next
# Add storefront-next-figma for Figma design-kit workflows (requires the Figma MCP server)
claude plugin install storefront-next-figma
```

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

```bash
copilot plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
copilot plugin install b2c-cli@b2c-developer-tooling
copilot plugin install b2c@b2c-developer-tooling
copilot plugin install storefront-next@b2c-developer-tooling
copilot plugin install storefront-next-figma@b2c-developer-tooling
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

Install to `.agents/skills/` (default) or a custom directory:

```bash
b2c setup skills b2c --ide manual
b2c setup skills b2c --ide manual --directory ./my-skills
```

For reference, the install locations each `--ide` flag writes to:

| IDE               | Project             | User                          |
| ----------------- | ------------------- | ----------------------------- |
| Cursor            | `.cursor/skills/`   | `~/.cursor/skills/`           |
| Windsurf          | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| VS Code / Copilot | `.github/skills/`   | `~/.copilot/skills/`          |
| Codex CLI         | `.codex/skills/`    | `~/.codex/skills/`            |
| OpenCode          | `.opencode/skills/` | `~/.config/opencode/skills/`  |
| Agentforce Vibes  | `.a4drules/skills/` | IDE's global storage          |

## Fetch Without Installing

Every skill is also hosted as raw markdown your agent can fetch on demand — for agents, CI, and ephemeral environments that don't install plugins. See [Use Skills Without Installing](/guide/agent-skills#use-skills-without-installing) on the catalog page.
