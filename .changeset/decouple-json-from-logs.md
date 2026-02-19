---
'@salesforce/b2c-tooling-sdk': minor
---

`--json` no longer switches log output to JSONL. Logs are always human-readable on stderr; `--json` only controls the structured result on stdout. Use the new `--jsonl` flag (or `SFCC_JSON_LOGS` env var) to get machine-readable log lines.
