---
description: Commands for installing AI agent skills for Claude Code, Cursor, Windsurf, and other agentic IDEs.
---

# Setup Commands

Commands for setting up the development environment with AI agent skills.

## b2c setup skills

Install agent skills from the B2C Developer Tooling project to AI-powered IDEs.

This command downloads skills from GitHub releases and installs them to the configuration directories of supported IDEs. Skills teach AI assistants about B2C Commerce development, CLI commands, and best practices.

### Usage

```bash
b2c setup skills [SKILLSET]
```

### Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `SKILLSET` | Skill set to install: `b2c`, `b2c-cli`, or `all` | `all` |

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--list`, `-l` | List available skills without installing | `false` |
| `--skill` | Install specific skill(s) (can be repeated) | |
| `--ide` | Target IDE(s) (can be repeated) | Auto-detect |
| `--global`, `-g` | Install to user home directory (global scope) | `false` |
| `--update`, `-u` | Update existing skills (overwrite) | `false` |
| `--version` | Specific release version | `latest` |
| `--force` | Skip confirmation prompts (non-interactive) | `false` |
| `--json` | Output results as JSON | `false` |

### Supported IDEs

| IDE Value | IDE Name | Project Path | Global Path |
|-----------|----------|--------------|-------------|
| `claude-code` | Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| `cursor` | Cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| `windsurf` | Windsurf | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| `github-copilot` | GitHub Copilot | `.github/skills/` | `~/.copilot/skills/` |
| `codex` | Codex CLI | `.codex/skills/` | `~/.codex/skills/` |
| `opencode` | OpenCode | `.opencode/skills/` | `~/.config/opencode/skills/` |
| `manual` | Manual | `.claude/skills/` | `~/.claude/skills/` |

Use `manual` when you want to install to the Claude Code paths without marketplace recommendations.

### Examples

```bash
# List all available skills
b2c setup skills --list

# Interactive installation (auto-detects IDEs)
b2c setup skills

# Install to Cursor (project scope)
b2c setup skills --ide cursor

# Install to Cursor (global/user scope)
b2c setup skills --ide cursor --global

# Install to multiple IDEs
b2c setup skills --ide cursor --ide windsurf

# Install only b2c-cli skills
b2c setup skills b2c-cli --ide cursor

# Install specific skills only
b2c setup skills --skill b2c-code --skill b2c-webdav --ide cursor

# Update existing skills
b2c setup skills --ide cursor --update

# Non-interactive mode (for CI/CD)
b2c setup skills --ide cursor --global --force

# Install a specific version
b2c setup skills --version v0.1.0 --ide cursor

# Output as JSON
b2c setup skills --list --json
```

### Interactive Mode

When run without `--force`, the command provides an interactive experience:

1. Downloads skills from the latest release (or specified version)
2. Auto-detects installed IDEs
3. Prompts you to select target IDEs
4. Shows installation preview
5. Confirms before installing
6. Reports results

### Claude Code Recommendation

For Claude Code users, we recommend using the plugin marketplace for automatic updates:

```bash
claude plugin marketplace add SalesforceCommerceCloud/b2c-developer-tooling
claude plugin install b2c-cli
claude plugin install b2c
```

The marketplace provides:
- Automatic updates when new versions are released
- Centralized plugin management
- Version tracking

Use `--ide manual` if you prefer manual installation to the same paths.

### Skill Sets

| Skill Set | Description |
|-----------|-------------|
| `b2c` | B2C Commerce development patterns and practices |
| `b2c-cli` | B2C CLI commands and operations |
| `all` | Both skill sets (default) |

### Output

When installing, the command reports:
- Successfully installed skills with paths
- Skipped skills (already exist, use `--update` to overwrite)
- Errors encountered during installation

Example output:

```
Downloading skills from release latest...
Detecting installed IDEs...
Installing 24 skills to Cursor (project)

Successfully installed 24 skill(s):
  - b2c-code → .cursor/skills/b2c-code/
  - b2c-webdav → .cursor/skills/b2c-webdav/
  ...
```

### Environment

Skills are downloaded from the GitHub releases of the [b2c-developer-tooling](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) repository:

| Artifact | Contents |
|----------|----------|
| `b2c-cli-skills.zip` | Skills for B2C CLI commands and operations |
| `b2c-skills.zip` | Skills for B2C Commerce development patterns |

Downloaded artifacts are cached locally at: `~/.cache/b2c-cli/skills/{version}/{skillset}/`

### See Also

- [Agent Skills & Plugins Guide](/guide/agent-skills) - Overview of available skills
- [Claude Code Skills Documentation](https://claude.ai/code) - Claude Code skill format
- [Cursor Skills Documentation](https://cursor.com/docs/context/skills) - Cursor skill format
