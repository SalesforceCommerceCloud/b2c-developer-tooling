# Agent Skills & Claude Code Plugin

The B2C CLI provides agent skills that enhance the AI-assisted development experience when working with Salesforce B2C Commerce projects.

These skills follow the [Agent Skills](https://agentskills.io/home) standard and can be used with multiple agentic IDEs including [Claude Code](https://claude.ai/code), Cursor, GitHub Copilot, and OpenAI Codex.

## Overview

When installed, the skills teach AI assistants about B2C Commerce CLI commands and best practices, enabling them to help you with:

- Deploying cartridges and managing code versions
- Running jobs and importing/exporting site archives
- Managing On-Demand Sandboxes and Managed Runtime environments
- WebDAV file operations
- SLAS client configuration

## Installation

### Prerequisites

- [Claude Code](https://claude.ai/code) installed and configured

### Add the Marketplace

First, add the B2C Developer Tooling marketplace:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
```

### Install the Plugin

Install the `b2c-cli` plugin at your preferred scope:

::: code-group

```bash [Project Scope]
# Available only in the current project
claude plugin install b2c-cli --scope project
```

```bash [User Scope]
# Available in all your projects
claude plugin install b2c-cli --scope user
```

:::

### Verify Installation

```bash
claude plugin list
```

You should see `b2c-cli@b2c-developer-tooling` in the list.

## Available Skills

The plugin includes skills for each major CLI topic:

| Skill | Description |
|-------|-------------|
| `b2c-code` | Code version deployment and management |
| `b2c-job` | Job execution and site archive import/export (IMPEX) |
| `b2c-sites` | Storefront sites listing and inspection |
| `b2c-webdav` | WebDAV file operations (ls, get, put, rm, zip, unzip) |
| `b2c-ods` | On-Demand Sandbox management |
| `b2c-mrt` | Managed Runtime project and deployment management |
| `b2c-slas` | SLAS client management |

## Usage Examples

Once installed, you can ask Claude to help with B2C Commerce tasks:

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

Claude will use the appropriate `b2c` CLI commands based on your request and the skills it has learned.

## Updating the Plugin

To get the latest plugin updates:

```bash
claude plugin marketplace update
claude plugin update b2c-cli@b2c-developer-tooling
```

## Uninstalling

To remove the plugin:

```bash
claude plugin uninstall b2c-cli@b2c-developer-tooling
```

To remove the marketplace:

```bash
claude plugin marketplace remove b2c-developer-tooling
```

## Using Skills with Other IDEs

The B2C CLI skills follow the [Agent Skills](https://agentskills.io/home) standard and can be used with other AI-powered development tools.

### CLI Setup Command

::: warning Coming Soon
The `b2c setup skills` command is not yet available. Use the manual method below for now.
:::

```bash
# Configure skills for your IDE (coming soon)
b2c setup skills --ide cursor
b2c setup skills --ide copilot
```

### Manual Setup

You can manually copy skill files from the [plugins/b2c-cli/skills/](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/plugins/b2c-cli/skills) directory to your IDE's configuration:

#### Cursor

Copy the skill SKILL.md files to `.cursor/rules/` in your project or configure globally in Cursor settings.

#### GitHub Copilot

Append the skill content to `.github/copilot-instructions.md` in your repository.

#### OpenAI Codex

Configure per the OpenAI Codex documentation for custom instructions.

### Skill Files

Each skill is a Markdown file containing instructions and examples:

| Skill | File |
|-------|------|
| Code Deployment | `b2c-code/SKILL.md` |
| Job Execution | `b2c-job/SKILL.md` |
| Site Management | `b2c-sites/SKILL.md` |
| WebDAV Operations | `b2c-webdav/SKILL.md` |
| Sandbox Management | `b2c-ods/SKILL.md` |
| MRT Management | `b2c-mrt/SKILL.md` |
| SLAS Configuration | `b2c-slas/SKILL.md` |
