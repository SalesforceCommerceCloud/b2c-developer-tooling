---
description: AI agent skills and plugins for Agentforce Vibes, Claude Code, Codex, Cursor, GitHub Copilot that enhance B2C Commerce development.
---

# Agent Skills & Plugins

The B2C Developer Tooling project provides agent skills and plugins that enhance the AI-assisted development experience when working with Salesforce B2C Commerce projects.

Skills plugins follow the [Agent Skills](https://agentskills.io/home) standard and can be used with multiple agentic IDEs including [Claude Code](https://claude.ai/code), Cursor, GitHub Copilot, and VS Code. The marketplace also includes an MCP server plugin (`b2c-dx-mcp`).

## Overview

When installed, the skills plugins teach AI assistants about B2C Commerce development, CLI commands, and best practices, enabling them to help you with:

- **CLI Operations**: Deploying cartridges, running jobs, managing sandboxes, WebDAV operations
- **B2C Development**: Controllers, ISML templates, forms, localization, logging, metadata
- **Web Services**: HTTP/SOAP/FTP integrations using the Service Framework
- **Custom APIs**: Building SCAPI Custom APIs with contracts, implementations, and mappings

## Available Skills Plugins

| Plugin | Description |
|--------|-------------|
| `b2c-cli` | Skills for B2C CLI commands and operations |
| `b2c` | Skills for B2C Commerce development patterns |

## Available MCP Plugins

| Plugin | Description |
|--------|-------------|
| `b2c-dx-mcp` | MCP server for AI-assisted Salesforce B2C Commerce development with project-aware tooling for common workflows |

### Plugin: b2c-cli

Skills for using the B2C CLI to manage your B2C Commerce instances. Covers code deployment, job execution, site archive import/export, WebDAV file operations, On-Demand Sandbox management, and more.

Browse skills: [skills/b2c-cli/skills/](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/b2c-cli/skills)

### Plugin: b2c

Skills for B2C Commerce development patterns and practices. Covers controllers, ISML templates, forms, localization, logging, metadata, web services, custom job steps, Page Designer, Business Manager extensions, and Custom API development.

Browse skills: [skills/b2c/skills/](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/skills/b2c/skills)

### Plugin: b2c-dx-mcp

Marketplace plugin for the B2C DX MCP server, providing AI-assisted B2C Commerce development workflows across supported MCP clients.

For setup and configuration, see the installation sections below and MCP docs: [MCP Server Overview](/mcp/) and [MCP Installation](/mcp/installation).

## Installation with Claude Code

### Prerequisites

- [Claude Code](https://claude.ai/code) installed and configured

### Add the Marketplace

First, add the B2C Developer Tooling marketplace:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
```

### Install Plugins

Install the plugins at your preferred scope:

::: code-group

```bash [Project Scope]
# Available only in the current project
claude plugin install b2c-cli --scope project
claude plugin install b2c --scope project
claude plugin install b2c-dx-mcp --scope project
```

```bash [User Scope]
# Available in all your projects
claude plugin install b2c-cli --scope user
claude plugin install b2c --scope user
claude plugin install b2c-dx-mcp --scope user
```

:::

### Verify Installation

```bash
claude plugin list
```

You should see `b2c-cli@b2c-developer-tooling`, `b2c@b2c-developer-tooling`, and `b2c-dx-mcp@b2c-developer-tooling` in the list.

### Updating Plugins

To get the latest plugin updates:

```bash
claude plugin marketplace update
claude plugin update b2c-cli@b2c-developer-tooling
claude plugin update b2c@b2c-developer-tooling
claude plugin update b2c-dx-mcp@b2c-developer-tooling
```

### Uninstalling

To remove the plugins:

```bash
claude plugin uninstall b2c-cli@b2c-developer-tooling
claude plugin uninstall b2c@b2c-developer-tooling
claude plugin uninstall b2c-dx-mcp@b2c-developer-tooling
```

To remove the marketplace:

```bash
claude plugin marketplace remove b2c-developer-tooling
```

## Installation with Skills CLI

The [Skills CLI](https://github.com/vercel-labs/skills) provides a way to install agent skills to supported IDEs. Use this for the skills plugins (`b2c` and `b2c-cli`), not for the MCP server plugin (`b2c-dx-mcp`).

```bash
# Interactive mode - select skills and IDEs
npx skills add SalesforceCommerceCloud/b2c-developer-tooling

# Install to a specific agent
npx skills add SalesforceCommerceCloud/b2c-developer-tooling -a claude-code
```

## Installation with B2C CLI

The B2C CLI provides a `setup skills` command that downloads and installs agent skills to any supported IDE.

### Interactive Mode

Run without arguments to interactively select skill sets and IDEs:

```bash
b2c setup skills
```

This prompts you to select which skill sets (`b2c`, `b2c-cli`, or both) and which IDEs to install to.

### List Available Skills

```bash
b2c setup skills b2c --list
b2c setup skills b2c-cli --list
```

### Install to Specific IDEs

::: code-group

```bash [Project Scope]
# Install b2c skills to Cursor (current project only)
b2c setup skills b2c --ide cursor

# Install b2c-cli skills to Windsurf
b2c setup skills b2c-cli --ide windsurf

# Install to multiple IDEs
b2c setup skills b2c --ide cursor --ide windsurf
```

```bash [User Scope]
# Install globally (available in all projects)
b2c setup skills b2c --ide cursor --global

# Install to GitHub Copilot globally
b2c setup skills b2c-cli --ide vscode --global
```

:::

### Install Specific Skills

```bash
# Install only certain skills from a skillset
b2c setup skills b2c-cli --skill b2c-code --skill b2c-webdav --ide cursor
```

### Update Existing Skills

```bash
# Overwrite existing skills with latest versions
b2c setup skills b2c --ide cursor --update
```

### Non-Interactive Mode

For CI/CD pipelines or scripted installations, the skillset argument is required:

```bash
b2c setup skills b2c-cli --ide cursor --global --force
```

See [Setup Commands](/cli/setup) for full CLI documentation.

## Installation with Agentforce Vibes

[Skills in Agentforce Vibes](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/skills.html) automatically detects skills placed in the `.a4drules/skills/` directory.

### Using B2C CLI

```bash
# Autodetect
b2c setup skills

# Install to project .a4drules/skills/ directory
b2c setup skills b2c --ide agentforce-vibes
b2c setup skills b2c-cli --ide agentforce-vibes

# Install globally
b2c setup skills b2c --ide agentforce-vibes --global
```

### Manual Setup

Place skill directories in `.a4drules/skills/` (project) or your global storage directory:

| Location | Scope |
|----------|-------|
| `.a4drules/skills/` | Project (recommended) |
| `~/Library/Application Support/Code/User/globalStorage` | Global (macOS) |
| `~/.config/Code/User/globalStorage` | Global (Linux) |
| `%APPDATA%\Code\User\globalStorage` | Global (Windows) |

When a global skill and project skill have the same name, the global skill takes precedence. Version control your project skills by committing `.a4drules/skills/` to your source repository so your team can share, review, and improve them together.

## Installation with Other IDEs

The B2C skills follow the [Agent Skills](https://agentskills.io/home) standard and can be used with other AI-powered development tools.

::: tip Recommended
Use the [`b2c setup skills`](/cli/setup) command for easier installation to any supported IDE.
:::

### Cursor

See the [Cursor Skills documentation](https://cursor.com/docs/context/skills) for configuration instructions.

Skills are installed to:
- **Project scope**: `.cursor/skills/` in your project
- **User scope**: `~/.cursor/skills/`

### Windsurf

See the [Windsurf documentation](https://docs.windsurf.com/) for configuration instructions.

Skills are installed to:
- **Project scope**: `.windsurf/skills/` in your project
- **User scope**: `~/.codeium/windsurf/skills/`

### VS Code with GitHub Copilot

See the [VS Code Agent Skills documentation](https://code.visualstudio.com/docs/copilot/customization/agent-skills) for configuration instructions.

Skills are installed to:
- **Project scope**: `.github/skills/` in your project
- **User scope**: `~/.copilot/skills/`

You can also append skill content to `.github/copilot-instructions.md` in your repository.

### Codex CLI

See the [Codex documentation](https://github.com/openai/codex) for configuration instructions.

Skills are installed to:
- **Project scope**: `.codex/skills/` in your project
- **User scope**: `~/.codex/skills/`

### OpenCode

See the [OpenCode documentation](https://opencode.ai/) for configuration instructions.

Skills are installed to:
- **Project scope**: `.opencode/skills/` in your project
- **User scope**: `~/.config/opencode/skills/`

### Manual Installation

Use `--ide manual` to install to the default `.agents/skills/` directory, or specify a custom path with `--directory`:

```bash
# Install to .agents/skills/ (default for manual)
b2c setup skills b2c --ide manual

# Install to a custom directory
b2c setup skills b2c --ide manual --directory ./my-skills
```

You can also download the skills zip files directly from the [latest GitHub release](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/releases/latest):

| Artifact | Contents |
|----------|----------|
| `b2c-cli-skills.zip` | Skills for B2C CLI commands and operations |
| `b2c-skills.zip` | Skills for B2C Commerce development patterns |

Each zip contains a `skills/` folder with individual skill directories. Extract and copy to your IDE's custom instructions location:

```bash
# Download from latest release
curl -LO https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/releases/latest/download/b2c-cli-skills.zip
curl -LO https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/releases/latest/download/b2c-skills.zip

# Extract and copy to your IDE's skills directory
unzip b2c-cli-skills.zip -d /path/to/your/ide/skills/
unzip b2c-skills.zip -d /path/to/your/ide/skills/
```

Each skill is a directory containing a `SKILL.md` file and optionally a `references/` folder with additional documentation.

## Usage Examples

Once installed, you can ask your AI assistant to help with B2C Commerce tasks:

**Deploy code:**
> "Deploy the cartridges in ./cartridges to my sandbox"

**Check code versions:**
> "List all code versions on my instance and show which one is active"

**Run a job:**
> "Run the reindex job on my sandbox"

**Manage files:**
> "Download the latest log files from my instance"

**Create a sandbox:**
> "Create a new On-Demand Sandbox with TTL of 48 hours"

**Build a Custom API:**
> "Help me create a Custom API for loyalty information"

**Add logging:**
> "Add logging to my checkout controller"

**Create a web service:**
> "Create an HTTP service to call the payment gateway API"

The AI will use the appropriate skills and CLI commands based on your request.
