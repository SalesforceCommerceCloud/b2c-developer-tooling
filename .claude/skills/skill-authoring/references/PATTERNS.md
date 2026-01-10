# Skill Authoring Patterns

Patterns and lessons learned from creating B2C Commerce skills.

## Content Organization

### Main SKILL.md Structure

Effective skills follow this structure:

```markdown
---
name: skill-name
description: One-line description
---

# Skill Title

Brief overview (2-3 sentences).

## Overview / Quick Reference

Tables or bullet points for quick scanning.

## Core Concepts

Key information the user needs to understand.

## Patterns / How To

Step-by-step instructions with examples.

## Examples

Complete, runnable examples.

## Detailed References

Links to reference files for deep dives.

## Script API Classes (if applicable)

Table of relevant classes/methods.
```

### Reference File Structure

Reference files should be focused on one topic:

```markdown
# Topic Reference

Brief intro.

## Subtopic A

Details with examples.

## Subtopic B

Details with examples.

## Complete Example

Full working example if applicable.
```

## Effective Tables

Tables provide quick reference without consuming much context:

### Command Reference Table

```markdown
| Command | Description |
|---------|-------------|
| `b2c cmd1` | Does X |
| `b2c cmd2` | Does Y |
```

### Parameter Table

```markdown
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | The item name |
| `count` | int | No | Number of items |
```

### Feature Matrix Table

```markdown
| Feature | Supported | Notes |
|---------|-----------|-------|
| Feature A | Yes | Full support |
| Feature B | Partial | Only in v2+ |
| Feature C | No | Use workaround |
```

## Code Examples

### Inline Code

For short snippets, use inline code:

```markdown
Use `Logger.getLogger('category')` to get a logger instance.
```

### Code Blocks

For complete examples, use fenced code blocks with language:

````markdown
```javascript
var Logger = require('dw/system/Logger');
var log = Logger.getLogger('checkout');
log.info('Order {0} placed', orderNo);
```
````

### Multi-file Examples

When showing related files, use headers:

````markdown
**package.json:**
```json
{ "name": "my-package" }
```

**index.js:**
```javascript
module.exports = function() {};
```
````

## XML Examples

When documenting XML formats:

1. **Always validate against XSD schemas** if available
2. **Show namespace declarations** in first example
3. **Use realistic but simple data**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<root xmlns="http://example.com/schema/2024">
    <element attribute="value">content</element>
</root>
```

## Referencing Official Documentation

### When to Reference

- API details that may change
- Complete specification documents
- Platform-specific configurations

### How to Reference

```markdown
For complete API documentation, see the [Official Guide](https://docs.example.com).

The `Logger` class is documented in the [Script API Reference](https://docs.example.com/api/Logger).
```

### When to Inline

- Frequently used patterns
- Information not easily found in docs
- Synthesized knowledge from multiple sources

## Progressive Complexity

Structure content from simple to complex:

### Basic Pattern First

```markdown
## Basic Usage

```javascript
Logger.info('Simple message');
```
```

### Then Add Complexity

```markdown
## With Parameters

```javascript
Logger.info('Order {0} for customer {1}', orderNo, customerId);
```
```

### Finally Show Advanced Cases

```markdown
## Custom Log Files

```javascript
var log = Logger.getLogger('prefix', 'category');
log.info('Goes to custom-prefix-*.log');
```
```

## Common Skill Patterns

### CLI Command Skill

```markdown
---
name: tool-command
description: Guide for using the tool command
---

# Tool Command

Brief description of what the command does.

## Quick Reference

| Command | Description |
|---------|-------------|
| `tool cmd1` | Does X |
| `tool cmd2` | Does Y |

## Examples

### Basic Usage

\`\`\`bash
tool command --flag value
\`\`\`

### Common Workflows

\`\`\`bash
# Workflow description
tool step1
tool step2
\`\`\`
```

### API/Framework Skill

```markdown
---
name: framework-feature
description: Guide for implementing feature with framework
---

# Feature Name

Overview of the feature and when to use it.

## Core Concepts

| Concept | Description |
|---------|-------------|
| Concept A | What it is |
| Concept B | What it is |

## Basic Pattern

\`\`\`javascript
// Basic implementation
\`\`\`

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| setting1 | value | What it does |

## Detailed References

- [Advanced Patterns](references/ADVANCED.md)
- [Configuration Options](references/CONFIG.md)
```

### XML/Configuration Skill

```markdown
---
name: config-format
description: Guide for XML/config file format
---

# Configuration Format

Overview of the configuration file.

## File Structure

\`\`\`
project/
├── config/
│   └── settings.xml
└── data/
    └── values.xml
\`\`\`

## XML Schema

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<root xmlns="http://example.com/schema">
    <!-- elements -->
</root>
\`\`\`

## Element Reference

| Element | Required | Description |
|---------|----------|-------------|
| `<elem1>` | Yes | Purpose |
| `<elem2>` | No | Purpose |

## Complete Example

[Full example with realistic data]
```

## Skill Maintenance

### Version Control

- Keep skills in version control with the codebase
- Update skills when features change
- Review skills during code reviews

### Testing Skills

- Manually test instructions work as documented
- Validate XML examples against schemas
- Verify links to references work

### Updating Skills

When updating:
1. Check if existing content is still accurate
2. Add new content in appropriate section
3. Update examples if APIs changed
4. Verify reference links still work

## Anti-Patterns to Avoid

### Too Much Content in SKILL.md

**Bad:** 2000+ line SKILL.md with everything inlined

**Good:** < 500 line SKILL.md with references for details

### Missing Context

**Bad:**
```markdown
Use `cmd --flag` to do the thing.
```

**Good:**
```markdown
Use `cmd --flag` to enable feature X, which allows Y:

\`\`\`bash
cmd --flag value
\`\`\`
```

### Outdated Examples

**Bad:** Examples using deprecated APIs or old syntax

**Good:** Examples validated against current documentation/schemas

### Deeply Nested References

**Bad:** SKILL.md → ref1.md → ref2.md → ref3.md

**Good:** SKILL.md → ref1.md (one level deep)
