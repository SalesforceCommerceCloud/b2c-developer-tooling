---
'@salesforce/b2c-cli': minor
---

Add `b2c mrt env var push` command. Reads a local `.env` file, computes a diff against the current remote MRT environment variables, and pushes new or changed variables in a single batch request (with per-variable fallback). Supports `--file`, `--exclude-prefix`, and `--yes` flags.
