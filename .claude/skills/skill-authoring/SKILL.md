---
name: skill-authoring
description: Guide for creating and maintaining user-facing agent skills
metadata:
  internal: true
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
- **description**: Rich description for skill discovery (1-1024 characters)

### Writing Effective Descriptions

The description field is **critical for skill discovery** by coding agents. It should include:

1. **What the skill does** - Core functionality
2. **When to use it** - Trigger scenarios
3. **Keywords** - Task-oriented phrases that help agents connect questions to skills

**Format:**
```yaml
description: "[What it does]. Use when [scenarios]. Keywords/phrases."
```

**Good examples:**
```yaml
# Task-oriented phrases help agents connect "how do I" questions
description: Search and read B2C Commerce Script API documentation and XSD schemas. Use when writing B2C scripts, looking up classes like URLUtils/ProductMgr/CustomerMgr, or answering "how do I" questions about generating URLs, querying products, processing orders, or any dw.* API task.

# Include common error scenarios
description: View and debug B2C CLI configuration. Use when authentication fails, connection errors occur, wrong instance is used, or you need to verify dw.json settings, environment variables, or OAuth credentials.

# Disambiguation helps agents choose the right skill
description: Run and monitor existing jobs, import/export site archives. Use when executing batch jobs, importing site data, or checking job status. For creating new job code, use b2c-custom-job-steps instead.
```

**Bad examples:**
```yaml
# Too brief - no discovery keywords
description: Using the b2c CLI for documentation

# Action-oriented instead of problem-oriented
description: Using the b2c CLI to search and read Script API documentation
```

**Key insight:** Include **task-oriented phrases** ("generating URLs", "querying products") not just class names, since users ask about tasks they want to accomplish.

### Instructions Body

The body contains markdown instructions that tell the agent how to perform the task.

```markdown
---
name: my-skill
description: Does something useful. Use when [scenarios]. Keywords: [task phrases].
---

# Skill Title

Brief overview of what this skill helps accomplish.

## Examples

Concrete examples demonstrating usage.

## Reference

- [Detailed Reference](references/REFERENCE.md) - Link to additional docs
```

Note: The description frontmatter is the **only** discovery mechanism. "When to Use" sections in the body are not used for discovery. Put all discovery-relevant information in the description.

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
