# Extension Examples

Read the shipped extensions in `src/extensions/` before writing your own; these three cover the common shapes. Confirm paths in your project, since extensions evolve.

## Simplest: BNPL (one slot, one API module)

```
src/extensions/bnpl/
├── target-config.json
├── components/            # includes components/target/bnpl-target.tsx
├── context/               # bnpl-context
├── lib/api/bnpl.server.ts # mock provider calls; replace bodies for a real provider
├── locales/
└── README.md
```

```json
{
  "components": [
    { "targetId": "sfcc.pdp.bnpl.message", "path": "extensions/bnpl/components/target/bnpl-target.tsx", "order": 0 }
  ]
}
```

The target component is a thin default-exported adapter: it reads a context (`useBnpl()`), returns `null` when there is nothing to show, and wraps streamed promises in `Suspense`/`Await`. Keep slot components small and null-safe, because the slot renders wherever the base places it.

## Several slots: Ratings and Reviews

Three entries in one `target-config.json` fill three different places:

| targetId | Component |
|----------|-----------|
| `sfcc.pdp.reviews.section` | `components/target/reviews-section-target.tsx` |
| `sfcc.pdp.reviews.rating` | `components/target/reviews-summary-target.tsx` |
| `sfcc.account.orderDetail.lineReview` | `components/target/order-line-review-target.tsx` |

It also has `context/`, `providers/`, `routes/`, `lib/` and `locales/`. Pattern: one target adapter per slot, shared logic in context and `lib`.

## Routes, provider, middleware: Store Locator

```
src/extensions/store-locator/
├── target-config.json              # sfcc.header.before.cart -> components/header/store-locator-badge.tsx
├── components/  context/  hooks/  stores/  locales/  tests/
├── middlewares/                    # wired into base files via SFDC_EXT_ markers
├── providers/store-locator.tsx     # mounted in root.tsx via @sfdc-extension-block markers
└── routes/
    ├── _app.store-locator.tsx          # page inside the app layout
    ├── action.set-selected-store.ts    # action route
    └── resource.stores.ts              # resource (JSON) route
```

This extension needs edits outside its folder (for example `root.tsx` and other base components), which is why it uses `SFDC_EXT_STORE_LOCATOR` markers; see [CLI and Install](CLI-AND-INSTALL.md). Route file names follow flat-route conventions: `_app.` prefix for routes in the app layout, `action.` and `resource.` for non-UI routes.

## Wrapper slot

A slot that has children keeps the base content and lets the extension decorate it (for example `sfcc.emailSignUp.consent.marketing`). The component receives `children`:

```tsx
import type { ReactNode } from 'react';

export default function ConsentWrapper({ children }: { children?: ReactNode }) {
    return <div className="rounded border p-2">{children}</div>;
}
```

Use `pnpm extensions:list` to see which slots are wrappers in your project.

## Server hook: fraud check

See [Action Hooks](ACTION-HOOKS.md) for a `sfcc.checkout.fraud.beforePlace` handler and the blocking rules.

## Checklist for a new extension

1. Run the [Base Audit](BASE-AUDIT.md) gate.
2. `sfnext extensions create -n "Name" -d "..."`.
3. Add components, then `target-config.json` entries with `sfcc.` target ids from `pnpm extensions:list`.
4. Add `locales/<lang>/translations.json` and use the `ext<PascalName>` namespace.
5. Run `pnpm dev`, check the slot in the browser, then `pnpm typecheck && pnpm lint`.
