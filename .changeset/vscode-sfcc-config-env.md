---
'b2c-vs-extension': patch
---

Honor the `SFCC_CONFIG` environment variable when resolving instance configuration. Previously the extension only looked for a `dw.json` in the workspace folder and ignored a global `dw.json` referenced by `SFCC_CONFIG`, so projects that relied on that env var (e.g. alongside a project `.env`) resolved to "No B2C Commerce instance configured". The extension now threads `SFCC_CONFIG` through as the explicit config path, matching the CLI's `--config` flag.
