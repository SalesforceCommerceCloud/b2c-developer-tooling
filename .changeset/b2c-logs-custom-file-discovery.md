---
'@salesforce/b2c-agent-plugins': patch
---

The b2c-logs skill now documents custom-category log file discovery. It explains that a custom logger category writes to its own `custom-<prefix>-*.log` file (distinct from `customerror`), that the prefix is the first argument to `Logger.getLogger(prefix, category)`, and how to find and read these files with `logs list --filter custom` and `logs get --filter custom-<prefix>`, plus the `webdav ls --root logs` fallback. This makes the retrieval skill self-contained for triaging integration and job logs, which almost always use a custom category.
