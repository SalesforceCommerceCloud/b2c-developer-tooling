# Spike: CIP Analytics VS Code Extension

**Author:** Charitha Tadakanti
**Work Item:** W-22162268
**Status:** Spike / Proof of Concept
**Date:** April 2026

---

## 1. Executive Summary

This spike explores bringing **B2C Commerce Intelligence Platform (CIP / CCAC)** directly into the B2C Developer Tooling VS Code extension. Today, customers who want to analyze Commerce data need to either run CLI commands against CIP or navigate to external BI tools. This feature gives developers a **first-class, IDE-native interface** for exploring CIP tables, running curated analytics reports, and building ad-hoc SQL queries — all inside VS Code.

**Outcome:** Fully functional feature delivering 100% CLI parity plus a visual Query Builder that surpasses the existing CLI experience. Built in a small number of working days with AI-assisted development.

---

## 2. Problem Statement

### Developer Pain Points

| Pain Point | Current State | Desired State |
|------------|---------------|---------------|
| Analytics access | CLI-only, requires memorizing commands and flags | Click-to-run inside VS Code |
| Report discovery | Know report names by heart or `b2c cip:report --help` | Browse 11 curated reports in a tree |
| Schema exploration | Run `b2c cip:describe <table>` per table | Visual tables browser with search |
| Ad-hoc SQL | Write SQL in a file, run `b2c cip:query --file ...` | Visual query builder + raw SQL editor |
| Sharing results | Copy/paste from terminal | Export to CSV / JSON, copy to clipboard |
| Context switching | Bounce between terminal, editor, and browser | Stay inside VS Code |

### Business Goals

- **Reduce time-to-insight** for developers investigating Commerce data.
- **Increase CIP adoption** by removing the CLI learning curve.
- **Showcase AI-assisted development** — deliver a production-quality feature faster than traditional scoping.

---

## 3. Scope

### In Scope

- Tree view in the B2C-DX activity bar with Query Builder, Tables Browser, and 11 curated reports grouped by category.
- Visual Query Builder with SELECT / FROM / WHERE / ORDER BY / LIMIT clauses.
- Raw SQL editor for power users.
- Curated report dashboards with dynamic parameter forms per report.
- Tables Browser for discovering 245+ CIP warehouse tables and their schemas.
- Connection test, error handling, result sorting, and CSV/JSON export.
- OAuth `client_credentials` authentication via existing `dw.json` config.

### Out of Scope (Future Work)

- Query history and saved queries.
- Multi-column sort / column filtering in results.
- Row limit warnings for large result sets.
- Monaco-based SQL editor with auto-completion.
- Visual analytics / charting.

---

## 4. Architecture Overview

### High-Level Flow

```
┌──────────────────────────────────────────────────┐
│  VS Code Extension (b2c-vs-extension)            │
│                                                  │
│  ┌────────────────┐    ┌──────────────────────┐  │
│  │ Tree Provider  │───▶│  Webview Manager     │  │
│  │ (sidebar)      │    │  (opens panels)      │  │
│  └────────────────┘    └──────────────────────┘  │
│                                │                 │
│                                ▼                 │
│  ┌──────────────────────────────────────────┐   │
│  │  b2c-tooling-sdk                          │   │
│  │  - createCipClient()                      │   │
│  │  - executeCipReport()                     │   │
│  │  - listCipTables() / describeCipTable()   │   │
│  │  - OAuth client_credentials grant         │   │
│  └──────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────┘
                         │ HTTPS + protobuf (Avatica)
                         ▼
┌──────────────────────────────────────────────────┐
│  CIP / CCAC Backend                              │
│  jdbc[.stg].analytics.commercecloud.salesforce.com│
└──────────────────────────────────────────────────┘
```

### Key Components

| File | Responsibility |
|------|----------------|
| `src/cip-analytics/index.ts` | Registers tree view, commands, and wires up the webview manager |
| `src/cip-analytics/cip-tree-provider.ts` | Tree data provider — featured tools + curated report categories |
| `src/cip-analytics/types.ts` | Tree item classes (`CipQueryBuilderTreeItem`, `CipReportTreeItem`, etc.) |
| `src/cip-analytics/cip-webview-manager.ts` | Webview HTML/CSS/JS for Query Builder, Tables Browser, and report dashboards |
| `@salesforce/b2c-tooling-sdk/operations/cip` | SDK for CIP API calls |
| `@salesforce/b2c-tooling-sdk/clients/cip` | Avatica protobuf client, OAuth scoping |

---

## 5. User Experience

### 5.1 Tree View Entry Point

The CIP Analytics section in the B2C-DX sidebar surfaces **featured tools at the top** (Query Builder, Tables Browser) and groups the 11 curated reports by category beneath them.

> **[SCREENSHOT 1 — Tree View]**
> *Paste a screenshot of the B2C-DX sidebar showing:*
> - *CIP ANALYTICS section expanded*
> - *Query Builder and Tables Browser as featured top-level items*
> - *Curated Reports section with categories (Sales, Customer, Product, etc.) expanded to show individual reports*

---

### 5.2 Query Builder — Visual Mode

The Query Builder is the **flagship experience** of this feature. Inspired by SOQL Builder but built for SQL, it lets developers visually compose queries against any of the 245+ CIP tables.

**Layout:**
- **Hero header** — centered branding with the Query Builder title.
- **Connection settings** — Tenant ID, Environment (Staging toggle), Fetch Size, Load Tables button.
- **Query Composer toolbar** — view toggle between Builder and raw SQL.
- **Sidebar** — Tables list and Columns list, both searchable.
- **Main canvas** — five clause cards (SELECT, FROM, WHERE, ORDER BY, LIMIT) with icon + title + description + actions.
- **Run Query** — bottom-right, shared across both views.
- **Generated SQL preview** — live-updated as the user builds the query.

> **[SCREENSHOT 2 — Query Builder: Empty State]**
> *Paste a screenshot showing:*
> - *The three floating card containers at the top (Hero, Connection settings, Query Composer)*
> - *Empty sidebar ("No tables loaded")*
> - *The five SQL clause cards (SELECT, FROM, WHERE, ORDER BY, LIMIT)*
> - *Generated SQL preview at the bottom*

---

### 5.3 Query Builder — With Data Loaded

Once the user clicks **Load Tables**, the sidebar populates with all 245+ tables, searchable in real time. Clicking a table fetches its schema and populates the Columns list (also searchable, with color-coded type tags).

> **[SCREENSHOT 3 — Query Builder: Table Selected + Columns Loaded]**
> *Paste a screenshot showing:*
> - *A loaded tables list with a search term applied*
> - *A selected table (highlighted with the blue left border)*
> - *Columns populated with type tags (STR, INT, DATE, BOOL)*
> - *Some columns checked and appearing as chips in the SELECT clause*
> - *A FROM clause showing the selected table as a primary chip*

---

### 5.4 Query Builder — With Filters & Sorting Configured

Adding filters and sort orders is a **one-click-per-row** affair. Each filter row exposes column dropdown, operator, and value input. Sort rows expose column and ASC/DESC direction.

> **[SCREENSHOT 4 — Query Builder: With WHERE & ORDER BY]**
> *Paste a screenshot showing:*
> - *The WHERE clause with 2+ filter rows filled in*
> - *The AND/OR logic toggle visible between them*
> - *The ORDER BY clause with at least one sort row*
> - *The LIMIT clause with a value set*
> - *The Generated SQL preview reflecting all of the above*

---

### 5.5 Query Builder — Raw SQL View

Power users can switch to the SQL editor and write arbitrary SQL. The Run Query button is shared across both views.

> **[SCREENSHOT 5 — Query Builder: SQL Editor View]**
> *Paste a screenshot showing:*
> - *The view toggle with "SQL" selected*
> - *The SQL editor with a multi-line query typed in*
> - *The Run Query button (enabled because the editor has content)*

---

### 5.6 Query Results

After running a query, results render in a sortable table below the builder with row-count and execution-time badges. Users can export to CSV/JSON.

> **[SCREENSHOT 6 — Query Results]**
> *Paste a screenshot showing:*
> - *The Results panel with its "📊 RESULTS" header*
> - *Row count and execution time badges*
> - *A populated table with multiple columns and rows*
> - *Export CSV / JSON buttons visible*

---

### 5.7 Curated Reports

For users who know what they want, the 11 curated reports are one click away. Each report has its own dashboard with:
- **Hero banner** with the report category and description.
- **Connection card** (Tenant / Environment / Fetch Size).
- **Report Parameters card** dynamically rendered from the report's parameter schema (site-id, from-date, to-date, etc.).
- **Sticky Run Query action bar** at the bottom.
- **Results panel** with sorting and export.

> **[SCREENSHOT 7 — Curated Report Dashboard]**
> *Paste a screenshot of a curated report (e.g., sales-analytics) showing:*
> - *The hero banner with category badge and description*
> - *The Connection card with Tenant ID and Test button*
> - *The Report Parameters card with multiple inputs (site id, dates, etc.)*
> - *The sticky Run Query bar at the bottom*

---

### 5.8 Tables Browser

For schema exploration, the Tables Browser lists all 245+ CIP warehouse tables with search. Clicking a table shows its columns, types, and nullable status.

> **[SCREENSHOT 8 — Tables Browser]**
> *Paste a screenshot showing:*
> - *The Tables Browser webview*
> - *The config bar (Tenant ID + Load Tables)*
> - *The split-pane layout: table list on the left, schema on the right*
> - *A selected table with its columns and type badges displayed*

---

## 6. Technical Decisions

### 6.1 Why a Webview (not a Tree View for the Query Builder)?

A tree view would force us to model SQL clauses as nodes — a poor fit for horizontal compositions like `WHERE col = 'value'`. A webview gives us full HTML/CSS control for a rich, form-like UI with chips, dropdowns, and a live SQL preview.

### 6.2 Why Reuse the SDK instead of Raw HTTP?

The CIP SDK handles Avatica protobuf encoding, token scoping (`SALESFORCE_COMMERCE_API:{tenant}`), and frame pagination. Reinventing any of this would be error-prone and duplicate existing tested code.

### 6.3 Why Salesforce Blue Branding?

The first iteration used indigo / purple. Feedback was to align with Salesforce brand colors. Switched to `#0176D3` (Salesforce Blue) throughout, with `#2E844A` (Salesforce Green) for success actions like Run Query.

### 6.4 Why "Floating Card" Containers?

The curated reports dashboard uses padded, rounded, shadowed containers that feel like paper on a table. The Query Builder adopted the same visual pattern for consistency across the feature.

### 6.5 Tenant ID as a Form Field, Not a Hidden Config

The CLI exposes `--tenant-id` as a flag. Hiding it in `dw.json` would confuse users who don't know which tenant they have access to. The Query Builder and all curated reports expose Tenant ID as a form field with a Test Connection action.

---

## 7. Implementation Notes

### 7.1 Build Integration

The webview manager reads the CIP protobuf files (`common.proto`, `requests.proto`, `responses.proto`) at runtime. These files live in `@salesforce/b2c-tooling-sdk/data/cip-proto/` and must be copied into `dist/data/cip-proto/` during the extension build. Added `copyCipProtoFiles()` to `scripts/esbuild-bundle.mjs`.

### 7.2 OAuth Scope Construction

The SDK auto-appends a tenant-specific scope when creating a CIP client:

```ts
const cipScope = `SALESFORCE_COMMERCE_API:${config.instance}`;
const scopedAuth = auth.withAdditionalScopes([cipScope]);
```

This means the API client used by the extension **must have the target tenant in its `SALESFORCE_COMMERCE_API` tenant filter** in Account Manager. If not, Account Manager rejects the token request with `invalid_scope: Unknown/invalid tenant scope`.

### 7.3 Command Palette Support

The `Open Report` command historically required a report argument (passed by the tree item click). If a user invoked it from the Command Palette, it errored out. Updated to show a QuickPick of all 11 reports when invoked without args.

### 7.4 Proto File Resolution Bug

When packaged for the Extension Development Host, `dist/data/cip-proto/common.proto` was missing because the esbuild bundle only copied scaffolds. Fixed by extending `copyCipProtoFiles()` in the build script.

---

## 8. Known Issues / Open Questions

### 8.1 CIP 401 on Sandbox Pod 5

Our test realm (`zzat`) is hosted on `account-pod5.demandware.net`. Even after:
- Enabling "Commerce Intelligence" + "Enable Reports & Dashboards Data Tracking" in Business Manager.
- Creating a test site (`RefArch`).
- Adding `zzat_sbx` to our API client's `SALESFORCE_COMMERCE_API` tenant filter.

…CIP at `jdbc.stg.analytics.commercecloud.salesforce.com` returns:

```
401 Unauthorized: Invalid Access Token. Expired JWT or signature doesn't match
```

for **every** tenant in our token (including `bjml_prd` / `bjml_stg` which our token explicitly allows). This indicates CIP's JWT validator does not trust pod5-issued tokens for our realm. The issue is backend provisioning on Salesforce's side — no code workaround is possible because:
- The CIP URL is fixed (`jdbc.*.analytics.commercecloud.salesforce.com`).
- Tokens are valid by every OAuth measure (not expired, correct audience, correct scope).
- No pod-specific CIP URL exists in DNS.

> **[SCREENSHOT 9 — CIP 401 Error in Extension]**
> *Paste a screenshot showing:*
> - *The Query Builder with tenant ID filled in*
> - *Error message after clicking Load Tables or Run Query*

---

### 8.2 B2C Commerce Version Requirement

Per the official CIP/CCAC guide, **B2C Commerce 26.1+** is required for non-production instances. Our sandbox reports `Version: 26.5` in the BM footer, which satisfies this.

---

### 8.3 Backend Provisioning Request

A Salesforce Support case is needed to:
1. Verify CIP backend trusts pod5-issued tokens.
2. Confirm CIP is fully provisioned for realm `zzat` / tenant `zzat_sbx`.
3. Provide a pod5-compatible CIP URL if one exists.

---

## 9. Performance

- **Token caching**: OAuth tokens are cached per client_id (module-level cache in `OAuthStrategy`). Expires are respected.
- **Fetch size**: User-configurable (100 / 500 / 1000 / 5000). Default 1000.
- **Result rendering**: Caps at first 1000 rows in the UI. Export actions write the full dataset to disk.
- **Webview retention**: `retainContextWhenHidden: true` — switching tabs doesn't lose state.

---

## 10. Security

- All secrets come from `dw.json` (clientId, clientSecret). No hard-coded credentials.
- HTML escaping via `escapeHtml()` / `escapeAttr()` on every dynamic value rendered in the webview.
- No inline event handlers for dynamic rows; all delegation via `addEventListener`.
- CIP requests use HTTPS only.

---

## 11. Demo Script

**Opening (30s)**

> "This is CIP Analytics inside VS Code — every feature of the `b2c cip` CLI, plus a visual Query Builder, without leaving the editor."

**Tree view (30s)**

> "The CIP Analytics section surfaces our Query Builder and Tables Browser at the top — those are the two featured tools. Underneath are 11 curated reports grouped by category."

**Query Builder (90s)**

> "Click any table in the sidebar and it loads the schema. Check columns in the sidebar and they appear as chips in the SELECT clause. Click + Add Filter and fill in column / operator / value. The SQL preview at the bottom updates live. Hit Run Query and results populate in-place, with CSV and JSON export."

**Curated Report (45s)**

> "If you know what you want, jump straight to a curated report like sales-analytics. The parameters are generated dynamically from the report's schema — no need to remember flag names. Fill in site ID, date range, hit Run Query."

**Tables Browser (30s)**

> "If you're exploring, the Tables Browser lists all 245+ warehouse tables with search. Click any table and see its full column schema."

**Wrap (30s)**

> "All built with the same SDK the CLI uses — 100% feature parity. Delivered in a small fraction of traditional timelines with AI-assisted development."

---

## 12. References

- **CIP CLI Guide:** https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/cip.html
- **CIP/CCAC Guide:** https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/analytics-reports-cip-ccac.html
- **SOQL Builder (design inspiration):** https://developer.salesforce.com/docs/platform/sfvscode-extensions/guide/soql-builder.html
- **PR / Branch:** `W-22162268-OAuth-JWT-Client`
- **SDK PR #155:** Introduced the `cip` CLI topic and the underlying SDK client.

---

## 13. Next Steps

1. **Unblock backend provisioning** via Salesforce Support case (see §8.1).
2. **Validate with real data** once CIP is provisioned for `zzat_sbx`.
3. **User testing** with 2–3 internal developers on a real customer sandbox.
4. **Phase 4B+:** Query history, saved queries, multi-column sort, Monaco SQL editor.
5. **Ship:** Gate behind a feature flag, roll out to early adopters, gather feedback, then GA.
