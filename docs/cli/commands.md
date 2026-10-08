---
description: Search B2C CLI commands by task or keyword to find the right command, with examples, without browsing the help tree.
---

# Commands Commands

Find the CLI command for a task. `b2c commands search` ranks commands by name, summary, description, topic, aliases, and flags, so a task description such as "deploy cartridges" or "reset sandbox" finds the matching command.

Use `commands search` to find **which command to run**. Use [`docs search`](./docs#b2c-docs-search) to search **B2C Commerce documentation** (Script API, SCAPI/OCAPI, guides, and job steps). AI agents can use both: find the command, then read its `--help` or the related documentation.

## Authentication

None. The search runs locally over the installed CLI's commands, including commands from installed plugins.

In addition to these topic-specific options, all commands also support [global flags](./index#global-flags).

---

## b2c commands search

Search CLI commands by task or keyword. Matching is fuzzy and prefix-aware; deprecated commands rank below their replacements, and hidden commands are excluded.

### Usage

```bash
b2c commands search <query>
```

### Arguments

| Argument | Description                                                                         | Required |
| -------- | ----------------------------------------------------------------------------------- | -------- |
| `query`  | What you want to do (matches command names, summaries, descriptions, topics, flags) | Yes      |

### Flags

| Flag            | Description                                                           | Default |
| --------------- | --------------------------------------------------------------------- | ------- |
| `--limit`, `-l` | Maximum number of results to display                                  | `10`    |
| `--topic`, `-t` | Restrict results to commands under a topic (e.g. `mrt` or `mrt env`)  |         |
| `--columns`     | Columns to display: `command`, `summary`, `topic`, `example`, `score` |         |
| `--json`        | Output results as JSON                                                | `false` |

### Examples

```bash
# Find the command for a task
b2c commands search "deploy cartridges"

# Machine-readable output (for scripts and AI agents)
b2c commands search "reset sandbox" --json

# Search within a topic
b2c commands search "environment variables" --topic mrt

# Show an example invocation for each match
b2c commands search logs --columns command,summary,example
```

### JSON Output

```json
{
  "query": "reset sandbox",
  "total": 1,
  "results": [
    {
      "command": "b2c sandbox reset",
      "id": "sandbox:reset",
      "summary": "Reset a sandbox to clean state (clears all data and code but preserves configuration)",
      "topic": "sandbox",
      "score": 413.76,
      "examples": [
        "b2c sandbox reset abc12345-1234-1234-1234-abc123456789",
        "b2c sandbox reset zzzv-123",
        "b2c sandbox reset zzzv-123 --wait"
      ],
      "aliases": ["ods reset"]
    }
  ]
}
```

`examples` contains up to three rendered examples. `deprecated` and `state` (for example `beta`) appear when set.
