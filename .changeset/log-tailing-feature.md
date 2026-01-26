---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Add log tailing and listing commands for viewing B2C Commerce instance logs

New CLI commands:
- `b2c logs list` - List log files with filtering by prefix and sorting
- `b2c logs tail` - Real-time log tailing with colored output and path normalization

New SDK functions in `@salesforce/b2c-tooling-sdk/operations/logs`:
- `listLogFiles()` - List and filter log files
- `tailLogs()` - Continuous log tailing with callbacks
- `getRecentLogs()` - One-shot retrieval of recent log entries
- `createPathNormalizer()` - Convert remote paths to local for IDE click-to-open
