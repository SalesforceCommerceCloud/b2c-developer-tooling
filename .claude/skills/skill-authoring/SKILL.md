---
name: skill-authoring
description: Guide for creating and maintaining user-facing agent skills
---

# Skill Authoring Guide

This skill guides you through creating user-facing agent skills. For the canonical reference, see [agentskills.io](https://agentskills.io/home).

## Skill Structure

A skill is a folder containing a `SKILL.md` file with metadata and instructions:

```
my-skill/
├── SKILL.md          # Required: instructions + metadata
├── scripts/          # Optional: executable code
├── references/       # Optional: additional documentation
└── assets/           # Optional: templates, resources
```

## SKILL.md Format

### Required Frontmatter

```yaml
---
name: skill-name
description: Brief description of what the skill does
---
```

- **name**: Unique identifier (lowercase, hyphens)
- **description**: One-line summary (loaded at startup for all skills)

### Instructions Body

The body contains markdown instructions that tell the agent how to perform the task.

```markdown
---
name: my-skill
description: Does something useful
---

# Skill Title

Brief overview of what this skill helps accomplish.

## When to Use

Describe scenarios when this skill applies.

## How to Use

Step-by-step instructions or patterns.

## Examples

Concrete examples demonstrating usage.

## Reference

- [Detailed Reference](references/REFERENCE.md) - Link to additional docs
```

## Progressive Disclosure

Structure skills for efficient context usage:

| Layer | Token Budget | When Loaded |
|-------|--------------|-------------|
| Metadata | ~100 tokens | At startup (all skills) |
| Instructions | < 5000 tokens | When skill activated |
| References | As needed | On demand |

### Guidelines

1. **Keep SKILL.md under 500 lines** - Move detailed content to references
2. **Front-load key information** - Put most important patterns first
3. **Use tables for quick reference** - Easy to scan
4. **Link to references** - Don't inline everything

## Optional Directories

### scripts/

Executable code that agents can run:

```
scripts/
├── validate.sh       # Validation script
├── generate.py       # Code generator
└── setup.js          # Setup helper
```

Scripts should:
- Be self-contained or document dependencies
- Include helpful error messages
- Handle edge cases gracefully

### references/

Additional documentation loaded on demand:

```
references/
├── PATTERNS.md       # Common patterns
├── API.md            # API reference
└── EXAMPLES.md       # Extended examples
```

Keep individual reference files focused. Smaller files = less context usage.

### assets/

Static resources:

```
assets/
├── template.xml      # File templates
├── schema.json       # Schemas
└── diagram.png       # Visual aids
```

## File References

Use relative paths from the skill root:

```markdown
See [the reference guide](references/REFERENCE.md) for details.

Run the setup script:
scripts/setup.sh
```

Keep references one level deep. Avoid deeply nested chains.

## Skill Categories

### Developer Skills (`.claude/skills/`)

Skills for contributors working on this codebase:

- Command development patterns
- Testing approaches
- API client patterns
- Documentation standards

### User-Facing Skills (`plugins/*/skills/`)

Skills for users of the tool:

- CLI command usage
- Platform-specific patterns (B2C Commerce)
- Integration guides

## Writing Effective Skills

### 1. Start with the User's Goal

```markdown
## Overview

This skill helps you [accomplish X] by [doing Y].
```

### 2. Provide Quick Reference Tables

```markdown
| Command | Description |
|---------|-------------|
| `cmd1`  | Does X      |
| `cmd2`  | Does Y      |
```

### 3. Show Concrete Examples

```markdown
## Examples

### Basic Usage

\`\`\`bash
b2c command --flag value
\`\`\`

### Advanced Usage

\`\`\`bash
b2c command --complex-flag
\`\`\`
```

### 4. Explain When NOT to Use

```markdown
## When NOT to Use

- Scenario A (use skill-x instead)
- Scenario B (manual approach better)
```

### 5. Link to Authoritative Sources

Reference official documentation rather than duplicating it:

```markdown
## Reference

For complete API documentation, see [Official Docs](https://example.com/docs).
```

## Validation Checklist

Before publishing a skill:

- [ ] Frontmatter has `name` and `description`
- [ ] SKILL.md under 500 lines
- [ ] Key information appears early
- [ ] Examples are concrete and runnable
- [ ] Reference links are valid
- [ ] No deeply nested reference chains
- [ ] Tested with target agent

## Detailed Reference

- [Patterns and Examples](references/PATTERNS.md) - Patterns from B2C skills
