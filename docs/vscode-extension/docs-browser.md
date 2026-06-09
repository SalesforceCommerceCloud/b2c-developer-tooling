---
description: B2C DX Docs Browser — search the SFCC Script API reference from inside VS Code without losing flow.
---

# Docs Browser

The Docs Browser is an in-editor reference for the **SFCC Script API**
(`dw.*`). It is offline-first — the index ships with the extension, so it
keeps working without network access.

## Why

You write cartridge code with `dw.*` calls all day. The Docs Browser lets you
look any of them up without switching to a browser, navigating the official
documentation, and losing your place. Pair it with the bundled [Script API
IntelliSense](./index#script-api-intellisense) and you have completion,
parameter info, and full reference docs in one editor.

## Getting started

1. Open the **B2C-DX** activity bar.
2. Expand the **Docs** view.
3. Click an entry to open the themed reader panel beside your code.

The reader panel shows the signature, parameters, return type, throws, and
prose description. Class pages also include inline tables of constants,
properties, and methods so you can navigate without going back to the tree.
Code blocks and tables follow your VS Code theme.

## Searching

- **Keyboard shortcut** → `Cmd+Alt+D` (Mac) / `Ctrl+Alt+D` (Windows / Linux)
  opens the search picker from anywhere.
- **Sidebar title bar** → click the **Search Docs** ($(search)) icon for the
  same ranked quick-pick. The picker is keyboard-friendly: type, arrow-keys,
  Enter.
- **Inside the panel** → use the search box at the top of the panel for the
  same ranked search, with a result list that updates as you type.

The picker boosts exact matches (`dw.order.BasketMgr`) over substring matches
(`getCurrent`) and treats dot/slash forms (`dw.order.BasketMgr` vs
`dw/order/BasketMgr`) as the same target.

## Right-click → View B2C Docs

Place the cursor on a `dw.*` symbol in a JavaScript or TypeScript cartridge
file and:

- **Keyboard shortcut** → `Shift+F1` opens the matching entry directly.
- **Editor right-click → View B2C Docs** does the same.
- **Command Palette → B2C DX - Docs: View B2C Docs** does the same.

The resolver uses VS Code's Go-to-Definition under the hood: it asks "where
is this symbol declared?", and because every `dw.*` class lives in its own
file in the `b2c-script-types` package, the answer maps cleanly to a single
docs entry. If the symbol can't be resolved exactly (e.g. you point at a
local helper), the Docs Browser falls back to opening the search picker
prefilled with the best candidate so you're one keystroke away from the
right entry.

## What is indexed

| Source | Items | Source of truth |
| --- | --- | --- |
| SFCC Script API (`dw.*`) | ~8.6k entries — every class, interface, enum, method, property, constant. | JSDoc inside `@salesforce/b2c-script-types` `.d.ts` files, vendored from the official Salesforce platform documentation build. |

The header shows the version of the index — currently **Script API v26.7.0**.

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
network requests. After install you can keep using it on a plane, in
air-gapped environments, or while the documentation site is unreachable.

## Roadmap

ISML tag and Business Manager topic browsing are tracked as follow-up work.
They were intentionally left out of the first release because they require
authoritative upstream sources (the official ISML grammar; Salesforce-owned
Business Manager content) before any data is shipped — hand-curated content
was deliberately not pursued.
