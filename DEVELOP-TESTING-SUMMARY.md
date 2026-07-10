# `develop` — Features to Test (not yet in `main`)

Snapshot: `develop` fast-forwarded to `origin/develop` on 2026-07-09.
Merge base with `main`: `cab53af8`. **14 feature commits**, mostly VS Code extension work plus one CLI/SDK feature and docs/security housekeeping.

---

## VS Code Extension (the bulk of it)

### 1. Jobs / B2C Operations — built up then consolidated (#404-adjacent, #506, #541)
Went through two rounds; test the **final consolidated state**:
- Single **Job History** view under the existing **B2C-DX** sidebar (standalone "B2C-DX Operations" sidebar and the React table webview were removed).
- **No fetch on activation** — shows a load hint until you hit **Refresh**, or enable **Auto-Refresh** (`b2c-dx.jobs.autoRefresh`, off by default).
- Defaults to a **chronological flat timeline** (BM-style); title-bar toggle switches to "group by job" (`b2c-dx.jobs.defaultGrouping`).
- Default status filter is now **`all`** (fixes empty-view-on-first-load).
- **Inline name filter** in the title bar; **Open in Business Manager** deep-links straight to *Administration › Operations › Jobs*.
- **Run / Re-run** a job (with params, polls to completion, auto-opens log), export runs to CSV/JSON.
- **Create Job Scaffold** moved to right-click on a cartridge in the **Cartridges** explorer.

### 2. Cartridges explorer expansion (#541, #547)
- Each cartridge expands into **Hooks**, **Job Steps**, and now **Custom Step Types** child nodes (parsed from `hooks.json`, `cartridge/scripts/jobsteps/`, and `steptypes.json`).
- Clicking a custom step type opens its `module` `.js` (resolving across sibling cartridges); right-click → **Show Step Type Definition** jumps to the `@type-id` in `steptypes.json`.

### 3. Interactive Impex Export view (#521) — *newest, just pulled in*
- New **Export** tree: check data units (sites w/ per-site flags, global data, catalogs, inventory lists, libraries, customer lists, price books) → **Export** downloads & extracts the archive locally.
- Sites/catalogs/inventory lists auto-discovered; libraries/customer lists/price books added by ID.
- SDK side: new `discoverExportableUnits` helper.

### 4. CIP / B2C-DX Analytics in the extension (#404, #496)
- Three webview panels: **Query Builder** (visual SQL composer + raw toggle + per-tenant Saved Queries), **Tables Browser** (schema explorer), **Curated Reports** (forms for every `cip report` command, date pickers, sortable grid, CSV/JSON export).
- Multi-realm management (group/add/edit/switch/remove tenants) in one workspace.

### 5. ISML language support (#460, #488)
- `.isml` association, grammar/snippets, auto-close + linked editing, diagnostics/quick fixes, symbols/folding/hover, semantic completions (`Resource.msg`, `URLUtils`, `res.render`, `require`), template path links/defs/refs across cartridges.
- #488 is a critical fix: the scanner used runtime `require()` that esbuild left unbundled, so enabling ISML **crashed activation silently**. Verify activation is clean with ISML on.

### 6. XSD metadata validation (#463)
- 48 bundled schemas → inline diagnostics, autocomplete, hover for B2C metadata XML. Covers both site-archive layout and exploded `metadata/` workspaces.
- ⚠️ **New install requirement:** declares `redhat.vscode-xml` as an extension dependency (auto-installs on first activation). Can be disabled via `b2c-dx.features.xmlValidation`.

### 7. Offline / unreachable-instance resilience (#483)
- Malformed `dw.json` no longer blocks activation — local code browsing keeps working with no connection.
- Connection-dependent views collapse repeated "instance unreachable" errors into a single notification; Sandbox view explains missing AM OAuth creds.

### 8. Onboarding walkthrough (#466)
- First-run walkthrough.

---

## CLI + SDK

### 9. Preferences API support (#476)
- New `b2c preferences` CLI topic: `global list/get/update`, `site list/get/update/search`, `site preference get/update`.
- SDK: `createPreferencesClient`. Read scope `sfcc.preferences`, write scope `sfcc.preferences.rw`.

---

## Docs / infra / security (lower testing priority)

- **Per-PR docs-site preview** (#540) — CI/infra.
- Docs SEO meta descriptions; SCAPI Schemas + CI/CD guide pages.
- `mrt-utilities`: bumped `qs`/`picomatch` for CVE-2026-2391 / CVE-2026-33671.

---

## Commit reference

```
8a5ad740 @W-22453547 supporting interactive export of impex data units (#521)
0c095db1 @W-23195592 surface custom step types in cartridge view (#547)
fd645e9f @W-23195590 consolidate jobs interface (#541)
21d676af @W-23058007 feat(docs): add per-PR docs-site preview (#540)
8aa39d45 @W-22597613: Added cli support for Preferences API (#476)
cd8a91bb @W-22653699 job monitoring enhancements in vs extension (#506)
17dd57e7 @W-22961131 cip analytics fixes vs extension (#496)
7a95bc55 @W-22919546 fix(vs-extension): bundle vscode-html-languageservice in ISML scanner (#488)
14dcc844 @W-22899577 fix(vs-extension): resilient offline & unreachable-instance behavior (#483)
e9fe63fe @W-22799934: Onboarding walkthrough (#466)
2132d935 @W-22653726 adding XSD valiation in vs extension (#463)
0bcc1dfd @W-22619604 ISML support in vs extension (#460)
3e84a774 @W-22210602 cip analytics VS extension (#404)
```
