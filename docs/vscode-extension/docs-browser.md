---
description: B2C DX Docs Browser — search SFCC Script API, ISML tags, and Business Manager topics from inside VS Code without losing flow.
---

# Docs Browser

The Docs Browser is an in-editor reference for the **SFCC Script API**, **ISML
tags**, and curated **Business Manager** topics. It is offline-first — the
index ships with the extension, so it keeps working without network access.

## Why

You write cartridge code with `dw.*` calls, ISML tags, and references to BM
configuration all day. The Docs Browser lets you look any of them up without
switching to a browser, navigating the official documentation, and losing your
place. Pair it with the bundled [Script API
IntelliSense](./index#script-api-intellisense) and you have completion,
parameter info, and reference in one editor.

## Getting started

1. Open the **B2C-DX** activity bar.
2. Expand the **Docs** view.
3. Click an entry to open the themed reader panel beside your code.

[![Docs Browser sidebar](./images/docs-browser-tree.png)](./images/docs-browser-tree.png)

The reader panel shows the signature, parameters, return type, throws, examples,
and prose. Code blocks and tables follow your VS Code theme.

## Searching

- **Sidebar title bar** → click the **Search Docs** ($(search)) icon for a
  ranked quick-pick across all sources. The picker is keyboard-only friendly:
  type, arrow-keys, Enter.
- **Inside the panel** → use the search box at the top of the panel for the
  same ranked search, with a result list that updates as you type.

The picker boosts exact matches (`dw.order.BasketMgr`) over substring matches
(`getCurrent`) and treats dot/slash forms (`dw.order.BasketMgr` vs
`dw/order/BasketMgr`) as the same target.

## Right-click → View B2C Docs

Place the cursor on a `dw.*` symbol or an ISML tag and:

- **Editor right-click → View B2C Docs** opens the matching entry directly.
- **Command Palette → B2C DX - Docs: View B2C Docs** does the same.
- **ISML hover** includes an **Open in B2C Docs Browser** link below the
  syntax/tips.

If the symbol can't be resolved exactly (e.g. a renamed or shortened qualifier
in hover output), the Docs Browser falls back to opening the search picker
prefilled with the best candidate so you're one keystroke away from the right
entry.

## What is indexed

| Source | Items | Source of truth |
| --- | --- | --- |
| SFCC Script API (`dw.*`) | ~8.6k entries — every class, interface, enum, method, property, constant. | `@salesforce/b2c-script-types` `.d.ts` JSDoc |
| ISML Tags | The standard ISML tag set with attribute tables and tips. | Curated dataset in the extension repo |
| Business Manager Topics | High-traffic Merchant Tools topics: Site Preferences, Code Deployment, Jobs, Service Framework, Hooks, Custom Attributes, Replication, SCAPI/OCAPI Shopper Roles. | Curated Markdown in the extension repo |

The header shows the version of each index — **Script API v26.7.0**, the ISML
dataset version, and a content-derived hash for the Business Manager topics.

## Recently viewed

The Docs Browser remembers the last 10 entries you opened. They appear:

- In the panel's empty state when no entry is selected.
- At the top of the search picker before you type a query.

History is stored in VS Code global state — it survives restarts and follows
your VS Code profile across workspaces.

## Settings

| Setting | Default | What it does |
| --- | --- | --- |
| `b2c-dx.features.docsBrowser` | `true` | Enable or disable the Docs Browser entirely. Disabling hides the sidebar, commands, and editor menu entry. |

## Offline behavior

The index is bundled with the extension's VSIX. The Docs Browser performs no
network requests. After install you can keep using it on a plane, in air-gapped
environments, or while the documentation site is unreachable.
