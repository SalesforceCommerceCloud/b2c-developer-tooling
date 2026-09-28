---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Detect AI coding agents (Claude Code, Cursor, Codex, Gemini CLI, GitHub Copilot, OpenCode, and others). Under an agent, `b2c --help` adds guidance for finding commands and docs, and interactive confirmations fail fast with a hint to pass `--force`/`--yes` instead of waiting for input. The same fail-fast behavior applies whenever no interactive terminal is available, so confirmations can no longer be answered by piping input (use `--force`/`--yes`). Set `SFCC_AGENT=0` to opt out of detection, or `SFCC_AGENT=1` to opt in.
