---
name: sfnext-extensions
description: >-
  Add or remove modular features in a Storefront Next project with the extension system: src/extensions/<name>/ folders, target-config.json (UITarget components, contextProviders, actionHooks), sfcc.-prefixed UITarget ids, extension routes, per-extension config.ts and locales, SFDC_EXT_ integration markers, the `sfnext extensions create|install|remove|list` commands, and the agent-driven instructions/*.mdc install flow. Use when inserting a component into a UITarget slot (for example sfcc.header.before.cart or sfcc.pdp.bnpl.message), adding a checkout action hook, installing or removing store locator, BOPIS, multiship or a demo extension, listing extension points with pnpm extensions:list, or deciding whether to extend, restyle, or edit the base at all. Do not use for styling or brand changes (use `storefront-next:sfnext-theming`), for new merchant-editable Page Designer blocks (use `storefront-next:sfnext-page-designer`), or for analytics/engagement adapters (use `storefront-next:sfnext-analytics-consent`).
---

# Storefront Next Extensions

An extension is a self-contained folder under `src/extensions/<name>/` that adds UI, routes, providers, translations, config and server hooks to the storefront without rewriting base files. The base declares named slots (`<UITarget targetId="..." />`); an extension's `target-config.json` says which of its components fill which slot.

Your project ships with several extensions already (store locator, BOPIS, multiship, and demo extensions such as BNPL and ratings and reviews). Look at them before building: they are the reference implementations. See [Extension Examples](references/EXTENSION-EXAMPLES.md).

## Decision gate: should this be an extension?

Run this before writing code; the full walkthrough is in [Base Audit](references/BASE-AUDIT.md).

1. Trace the route in `src/routes/` down to the place you want to change. Does the base already render equivalent content there?
2. Already rendered: restyle it (tokens or a component variant, see `storefront-next:sfnext-theming`) or fill an existing slot; do not add a parallel copy.
3. Not rendered and a slot exists: write an extension.
4. Not rendered and no slot fits: edit the base route or component directly (you own the whole project) and, if it is a reusable seam, add a `<UITarget>` there so later extensions can plug in.

Discover what already exists:

```bash
pnpm extensions:list          # all UITarget ids and server action hook ids (add --json for tooling)
sfnext extensions list        # installed extensions
rg "UITarget" src/            # where a slot is rendered
```

## Structure

```
src/extensions/my-extension/
├── target-config.json     # which components/providers/hooks plug in where
├── components/            # UI, including the components named in target-config.json
├── routes/                # auto-registered routes (flat-route file naming)
├── providers/             # context providers (listed in target-config.json)
├── hooks/  context/  middlewares/  stores/   # as needed
├── locales/<lang>/translations.json
├── config.ts              # optional client-side defaults
├── server-config.ts       # optional server-only defaults
└── README.md
```

Create the scaffold with `sfnext extensions create -n "My Extension" -d "What it does"` (adds the folder, a README and an entry in `src/extensions/config.json`). Import across the project with the normal alias: `@/extensions/my-extension/...`. There is no `@extensions` alias.

## target-config.json

```json
{
  "components": [
    { "targetId": "sfcc.header.before.cart", "path": "extensions/my-extension/components/header/badge.tsx", "order": 0 }
  ],
  "contextProviders": [
    { "path": "extensions/my-extension/providers/my-provider.tsx", "order": 0 }
  ],
  "actionHooks": [
    { "hookId": "sfcc.checkout.payments.afterSubmitPayment", "handler": "extensions/my-extension/hooks/after-payment.ts", "order": 0 }
  ]
}
```

- `path` is relative to `src/` and points at a module whose default export is the component (no required props; read context or hooks inside). Multiple components on one slot render in ascending `order`; duplicate orders warn because their order is not deterministic.
- A slot without children is a replacement slot. A slot that wraps base content (`<UITarget targetId="..."><Base /></UITarget>`) is a wrapper slot: the extension component receives the base content as children.
- Optional per component: `"enabled": false` to switch it off, and `"hint"` as a label for the dev-mode overlay. A top-level `"devOnly": true` skips the whole file in production builds.
- Extension components only inject when a `target-config.json` exists in `src/extensions/<name>/`.
- Every `targetId` must exist as a `<UITarget>` in the source; otherwise the build fails and names the orphan. Ids are namespaced: use the exact `sfcc.`-prefixed ids reported by `pnpm extensions:list` (for example `sfcc.header.before.cart`, `sfcc.pdp.bnpl.message`, `sfcc.pdp.reviews.section`, `sfcc.cart.orderSummary.before`).
- In `pnpm dev`, UITarget dev mode shows markers so you can see which slots exist and what fills them.

Server-side hooks (`actionHooks`, checkout steps) have their own semantics: [Action Hooks](references/ACTION-HOOKS.md).

## Routes, translations, config

- **Routes**: any file in `routes/` is merged into the route tree with React Router flat-route naming: `_app.store-locator.tsx` (inside the app layout), `action.set-selected-store.ts` (action), `resource.stores.ts` (resource route). See `src/extensions/store-locator/routes/`.
- **Translations**: `locales/<lang>/translations.json` is namespaced `ext` + PascalCase folder name (`my-extension` -> `extMyExtension`): `useTranslation('extMyExtension')`. `pnpm dev` and `pnpm build` run `pnpm locales:aggregate-extensions` for you and write `src/extensions/locales/`; that folder is generated, do not edit it.
- **Client config**: `config.ts` default-exports a plain, JSON-serializable object. It is merged into `config.app.extension.<camelName>` (read with `useConfig()` in components or `getConfig()` on the server) and can be overridden per environment with `PUBLIC__app__extension__<camelName>__<key>`. It is exposed to the browser: never put secrets there.
- **Server-only config**: `server-config.ts` lands at `config.app.serverExtension.<camelName>`, has no `PUBLIC__` override, is unreachable from client code (the build fails if a client chunk imports it), and is read with `getConfig(context)` in loaders, actions and middleware.
- `pnpm config:aggregate-extensions` (also run by dev and build) writes `src/extensions/config/`; generated, do not edit. Folder names must be letters, digits and hyphens starting with a letter. See `docs/README-CONFIG.md`.

## Integration markers

Extensions that modify base files mark their edits with comments so they can be installed and removed cleanly:

```typescript
selectedStoreMiddleware /** @sfdc-extension-line SFDC_EXT_STORE_LOCATOR */,

// @sfdc-extension-block-start SFDC_EXT_STORE_LOCATOR
import { StoreLocatorProvider } from '@/extensions/store-locator/providers/store-locator';
// @sfdc-extension-block-end SFDC_EXT_STORE_LOCATOR

/** @sfdc-extension-file SFDC_EXT_STORE_LOCATOR */   // marks an entire file as belonging to the extension
```

Use them when the extension needs edits outside its folder (middleware registration, a nav link, a loader) and you want `sfnext extensions remove` to be able to undo them. Each marker name (`SFDC_EXT_*`) is a key in `src/extensions/config.json`. Install, remove and marker details: [CLI and Install](references/CLI-AND-INSTALL.md).

## Removing or replacing a demo extension

BNPL, customer preferences, ratings and reviews, and product content ship with mock fixtures. To integrate a real provider, replace the bodies of their API functions (for example `src/extensions/bnpl/lib/api/bnpl.server.ts`). To drop one, use `sfnext extensions remove -e SFDC_EXT_BNPL`, then run `pnpm locales:aggregate-extensions`. `docs/README-FEATURE-STUBS.md` describes finding stubs with `grep -r "@feature-stub" src/`.

## Best practices

1. Keep the extension self-contained; reach into the base only through slots, hooks and markers.
2. Prefer a slot over editing a base file; add a slot when you keep editing the same spot.
3. Use `order` deliberately and give each slot entry a distinct value.
4. Import via `@/extensions/...` and keep translations in the extension's own namespace.
5. After adding a slot, extension or locale, run `pnpm dev` once so the aggregation and registries regenerate, and commit nothing from `src/extensions/locales/` or `src/extensions/config/` by hand.

## Related Skills

- `storefront-next:sfnext-overview` - project map and where things live
- `storefront-next:sfnext-components` - component conventions used inside extensions
- `storefront-next:sfnext-routing` - how extension routes join the route tree
- `storefront-next:sfnext-i18n` - translation namespaces and locale files
- `storefront-next:sfnext-configuration` - `config.ts` layering and `PUBLIC__` overrides
- `storefront-next:sfnext-theming` - token and brand changes that do not need an extension
- `storefront-next:sfnext-commerce-features` - checkout, multiship, BOPIS flows
- `storefront-next:sfnext-page-designer` - merchant-editable blocks
- `b2c:b2c-hooks` - B2C platform-side hooks (different from Storefront Next action hooks)
