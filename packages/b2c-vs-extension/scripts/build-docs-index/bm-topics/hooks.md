---
id: hooks
title: Hooks
category: integration
tags: [hook, extension-point, ocapi, scapi, payment]
---

Hooks are extension points that let cartridge scripts react to platform events
or customize OCAPI/SCAPI behavior without modifying base controllers.

## Declaring a hook

```json
// cartridge/package.json
{ "hooks": "./hooks.json" }

// cartridge/hooks.json
{
  "hooks": [
    { "name": "dw.order.calculate", "script": "./scripts/hooks/calculate" },
    { "name": "app.payment.processor.basic_credit.Authorize", "script": "./scripts/payment/basicCredit" }
  ]
}
```

The `script` path is relative to `hooks.json`. The exported function is named
to match the convention of the hook (often `function execute()` or
`function modifyResponse()`).

## Common hook namespaces

- `dw.order.*` — basket calculation, validation, post-checkout side effects.
- `dw.ocapi.shop.*` and `dw.scapi.shopper.*` — customize storefront APIs.
- `dw.ocapi.data.*` — admin API customizations.
- `app.payment.processor.<id>.*` — payment processor implementations.

## Tips

- Cartridge hook order follows the **cartridge path** — the first cartridge
  with a matching hook wins for `intercept` style hooks; `*.modify*` hooks
  chain in path order.
- Hooks declared in cartridges that aren't on the active path silently do
  nothing — verify the cartridge path on the relevant site.
- Avoid heavy work in `dw.order.calculate` — it runs on every basket
  modification.
