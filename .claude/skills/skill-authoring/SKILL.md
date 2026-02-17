---
name: skill-authoring
description: Guide for creating and maintaining user-facing agent skills. Use when creating a new skill, adding a SKILL.md file, writing skill frontmatter/descriptions, organizing skill directories, or improving an existing skill's discoverability. Covers SKILL.md format, progressive disclosure, reference files, and writing effective descriptions.
metadata:
  internal: true
---

# Skill Authoring Guide

This skill guides you through creating user-facing agent skills. For the canonical reference, see [agentskills.io](https://agentskills.io/home).

## Before You Start

Identify **2-3 concrete use cases** your skill should enable before writing anything.

Good use case definition:
```
Use Case: [Name]
Trigger: User says "[phrase 1]" or "[phrase 2]"
Steps: 1. [action] 2. [action] 3. [action]
Result: [What the user gets]
```

Ask yourself:
- What does a user want to accomplish?
- What domain knowledge or best practices should be embedded?
- What multi-step workflows does this require?

## Skill Structure

A skill is a folder containing a `SKILL.md` file with metadata and instructions:

```
my-skill/
├── SKILL.md          # Required: instructions + metadata
├── scripts/          # Optional: executable code
├── references/       # Optional: additional documentation
└── assets/           # Optional: templates, resources
```

**Critical rules:**
- File must be exactly `SKILL.md` (case-sensitive). No variations (`SKILL.MD`, `skill.md`).
- Folder names must be **kebab-case**: `my-skill-name` (no spaces, no underscores, no capitals)
- **No README.md** inside the skill folder. All documentation goes in SKILL.md or references/.

## SKILL.md Format

### Required Frontmatter

```yaml
---
name: skill-name
description: What it does. Use when user asks to [specific phrases].
---
```

- **name**: kebab-case, must match folder name. No spaces or capitals.
- **description**: 1-1024 characters. Must include BOTH what it does AND when to use it.

**Security restrictions** — forbidden in frontmatter:
- XML angle brackets (`<` or `>`) — frontmatter appears in Claude's system prompt
- Skill names containing "claude" or "anthropic" (reserved)

### Writing Effective Descriptions

The description is the **only discovery mechanism** — it determines whether Claude loads your skill. It should include:

1. **What the skill does** — Core functionality
2. **When to use it** — Trigger conditions and phrases
3. **Key capabilities** — Task-oriented phrases users might say

**Structure:** `[What it does] + [When to use it] + [Key capabilities]`

**Good examples:**
```yaml
# Task-oriented phrases help agents connect "how do I" questions
description: Search and read B2C Commerce Script API documentation and XSD schemas. Use when writing B2C scripts, looking up classes like URLUtils/ProductMgr/CustomerMgr, or answering "how do I" questions about generating URLs, querying products, processing orders, or any dw.* API task.

# Include common error scenarios
description: View and debug B2C CLI configuration. Use when authentication fails, connection errors occur, wrong instance is used, or you need to verify dw.json settings, environment variables, or OAuth credentials.

# Disambiguation with negative triggers
description: Run and monitor existing jobs, import/export site archives. Use when executing batch jobs, importing site data, or checking job status. For creating new job code, use b2c-custom-job-steps instead.

# Negative triggers prevent over-triggering
description: Advanced data analysis for CSV files. Use for statistical modeling, regression, clustering. Do NOT use for simple data exploration (use data-viz skill instead).
```

**Bad examples:**
```yaml
# Too vague - no trigger phrases
description: Helps with projects.

# Missing triggers - only says what, not when
description: Creates sophisticated multi-page documentation systems.

# Too technical, no user-oriented phrases
description: Implements the Project entity model with hierarchical relationships.
```

**Key insight:** Include **task-oriented phrases** ("generating URLs", "querying products") not just class names, since users ask about tasks they want to accomplish.

### Writing the Main Instructions

After the frontmatter, write instructions in Markdown. Recommended structure:

```markdown
# Skill Title

Brief overview (2-3 sentences).

## Instructions

### Step 1: [First Major Step]
Clear explanation of what happens.

### Step 2: [Next Step]
Continue with specifics.

## Examples

### Example 1: [Common scenario]
User says: "[trigger phrase]"
Actions: 1. [step] 2. [step]
Result: [What the user gets]

## Troubleshooting

### Error: [Common error message]
**Cause:** [Why it happens]
**Solution:** [How to fix]
```

**Be specific and actionable:**

Good:
```
Run `python scripts/validate.py --input {filename}` to check data format.
If validation fails, common issues include:
- Missing required fields (add them to the CSV)
- Invalid date formats (use YYYY-MM-DD)
```

Bad:
```
Validate the data before proceeding.
```

Note: "When to Use" sections in the body are **not** used for discovery. Put all discovery-relevant information in the description frontmatter.

## Progressive Disclosure

Skills use a three-level system to minimize token usage:

| Layer | Budget | When Loaded |
|-------|--------|-------------|
| YAML frontmatter | ~100 tokens | At startup (all skills) |
| SKILL.md body | < 5000 tokens | When skill activated |
| Linked files (references/) | As needed | On demand |

### Guidelines

1. **Keep SKILL.md under 500 lines** — Move detailed content to references
2. **Front-load key information** — Put most important patterns first
3. **Use tables for quick reference** — Easy to scan
4. **Link to references** — Don't inline everything

## Optional Directories

### scripts/
Executable code that agents can run. Scripts should be self-contained, include helpful error messages, and handle edge cases.

### references/
Additional documentation loaded on demand. Keep individual reference files focused on one topic. Smaller files = less context usage.

### assets/
Static resources: templates, fonts, icons used in output.

## File References

Use relative paths from the skill root. Keep references one level deep — avoid deeply nested chains (SKILL.md → ref1.md → ref2.md is too deep).

## Skill Categories

### Developer Skills (`.claude/skills/`)
Skills for contributors working on this codebase (command development patterns, testing approaches, API client patterns, documentation standards).

### User-Facing Skills (`skills/*/skills/`)
Skills for users of the tool (CLI command usage, platform-specific patterns, integration guides).

## Validation Checklist

### Before you start
- [ ] Identified 2-3 concrete use cases
- [ ] Planned folder structure

### During development
- [ ] Folder named in kebab-case
- [ ] `SKILL.md` file exists (exact spelling)
- [ ] No `README.md` inside the skill folder
- [ ] YAML frontmatter has `---` delimiters
- [ ] `name` field: kebab-case, matches folder name
- [ ] `description` includes WHAT and WHEN (trigger phrases)
- [ ] No XML tags (`<` or `>`) in frontmatter
- [ ] Instructions are clear and actionable
- [ ] Examples provided
- [ ] Error handling / troubleshooting included
- [ ] References clearly linked

### Testing
- [ ] Triggers on obvious task requests
- [ ] Triggers on paraphrased requests
- [ ] Does NOT trigger on unrelated topics
- [ ] Functional output is correct

### After deployment
- [ ] Test in real conversations
- [ ] Monitor for under/over-triggering
- [ ] Iterate on description and instructions

## Iteration Signals

**Undertriggering** (skill doesn't load when it should):
- Users manually enabling it or asking "when should I use this?"
- Solution: Add more trigger phrases and task-oriented keywords to description

**Overtriggering** (skill loads for unrelated queries):
- Users disabling it or confusion about purpose
- Solution: Add negative triggers ("Do NOT use for..."), be more specific, clarify scope

**Execution issues** (skill loads but results are inconsistent):
- Users correcting Claude or re-prompting
- Solution: Make instructions more specific, add error handling, use scripts for critical validations (code is deterministic; language interpretation isn't)

## Detailed Reference

- [Patterns and Examples](references/PATTERNS.md) - Patterns from B2C skills
