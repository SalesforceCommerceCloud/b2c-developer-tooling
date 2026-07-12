---
'b2c-vs-extension': minor
---

Consolidate the B2C Operations (Jobs) experience into the primary **B2C-DX** sidebar based on review feedback:

- **Single Job History view** under the existing `b2c-dx` container (collapsed by default). The standalone "B2C-DX Operations" sidebar and the React-based Job History table webview have been removed — all controls now live in the tree's title bar.
- **No fetch on activation.** The view shows a load hint until you press **Refresh** (or enable the new **Auto-Refresh** toggle). A new `b2c-dx.jobs.autoRefresh` setting (off by default) and a title-bar toggle control opt-in polling.
- **Chronological-first root view.** Job History now defaults to a BM-style flat timeline of recent executions, with a title-bar toggle to switch to the previous "group by job" view. New `b2c-dx.jobs.defaultGrouping` setting controls the default.
- **Default status filter is `all`**, fixing the empty-view-on-first-load defect (previously required clicking the filter before anything appeared).
- **Inline name filter** in the title bar (BM-style job-name search).
- **Open in Business Manager** deep-links directly to *Administration › Operations › Jobs* instead of the BM landing page.
- **Job Definitions view removed.** Its useful action — **Create Job Scaffold** — moves to a right-click on a cartridge in the **Cartridges** explorer.
- **Cartridges explorer broadened** to expand each cartridge into **Hooks** and **Job Steps** child nodes (parsed from `hooks.json` and `cartridge/scripts/jobsteps/`). Click a file to open it.
