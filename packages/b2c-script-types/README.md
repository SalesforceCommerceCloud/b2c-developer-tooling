# @salesforce/b2c-script-types

TypeScript definitions for the **B2C Commerce Script API** (`dw/*`) plus a
**TypeScript Language Service plugin** that resolves cartridge `require()` calls
to those definitions.

This package powers IntelliSense for cartridge JavaScript in the
[B2C DX VS Code extension](../b2c-vs-extension). It is also the bundle used by
`b2c setup ide vscode-types` for non-extension users.

> **Status:** private workspace package. Not published to npm yet — the bundle
> is vendored from the Script API documentation generator. See
> [VENDORED.md](./VENDORED.md) for the upstream version and re-vendoring steps.

## What's included

```
types/         # 493 .d.ts files (modular, class-per-file)
  global.d.ts  # ambient module declarations covering require('dw/...')
  dw/...       # dw/catalog, dw/system, dw/order, etc.
  TopLevel/... # XML, errors, Module, etc.
plugin/        # TypeScript Language Service plugin
jsconfig.template.json  # copy-paste config for non-extension setups
```

## Use via the VS Code extension (recommended)

Install the **B2C DX VS Code extension**. The extension registers this plugin
automatically through `contributes.typescriptServerPlugins`. Open any cartridge
JavaScript file and you get:

- Module completion on `require('dw/`<kbd>Ctrl-Space</kbd>`)`.
- Class member completion (`product.getName(`).
- Hover with JSDoc.
- Signature help / parameter hints.

No files are written to your workspace.

## Use without the extension (jsconfig.json)

For plain VS Code, JetBrains IDEs, or LSP clients like coc-tsserver, run:

```bash
b2c setup ide vscode-types --copy
```

That copies this bundle into `./.b2c-script-types/` and writes a `jsconfig.json`.
You can also do it by hand — see [jsconfig.template.json](./jsconfig.template.json).

## How the plugin works

The plugin wraps the TypeScript Language Service's
`resolveModuleNameLiterals` and intercepts `require()` calls **only inside
files that live under a known cartridge root**. The cartridge list is pushed
in by the host extension via `tsApi.configurePlugin(...)`. Files outside the
cartridge layout fall straight through to the unwrapped service — non-cartridge
JavaScript and TypeScript in the same workspace see no behavior change.

See [src/index.ts](./src/index.ts) for the implementation.

### Usage-based type inference (experimental, opt-in)

An undocumented helper function (no JSDoc) gets its parameters and return
value widened to `any` by plain TypeScript inference, and that `any`
propagates to every caller. Passing `inferUsage: true` in the plugin config
(off by default) makes the plugin infer a plausible type for these cases the
way IntelliJ does: from call-site arguments (including `new`, `.call`/`.apply`
and callbacks), the callback types of the declared APIs a function, or a
factory's result, is handed to (`server.get('Show', cache.applyDefaultCache)`),
return values, the typed Script API calls a value is passed to, and the members
and `instanceof`/`typeof` checks in the helper's own body.
Values are followed where they go — into object members, `this.x`, pushed
arrays, factory returns and `module.exports` — and a generic helper such as
`collections.find(basket.shipments, ...)` is inferred again for the call at
hand, together with the callback it is passed
(`collections.map(basket.shipments, fn)` is an array of what `fn` returns,
and `fn`'s parameter is what `collections.map` calls it with: a `Shipment`).
Hook scripts registered in a cartridge's `hooks.json` take the arguments of
the `HookMgr.callHook(...)` calls that reach them, literal or prefixed
(`'app.payment.processor.' + id`), and those calls return what the hooks return
([src/resolver/hook-registry.ts](./src/resolver/hook-registry.ts) reads the
registrations, as JSON only).
The result is surfaced as an "Inferred from usage" hover note plus synthesized
member completions; call sites that disagree show a union of up to three
types, not counting object literals that only stand in for one of them (a
unit test's `{httpHeaders: ...}` passed where production code passes a
`Request`). It only kicks in where the checker has already given up (`any`, or a
placeholder SFRA JSDoc such as `@param {Object}`), never overriding a real
type from TypeScript or JSDoc.

The engine gathers evidence ([src/inference/core.ts](./src/inference/core.ts))
and applies one decision policy ([src/inference/policy.ts](./src/inference/policy.ts))
everywhere, so parameter, member and chain hovers and completions always
agree. [src/usage-inference.ts](./src/usage-inference.ts) is the barrel and
lists the modules in reading order.

A request reads only the files that can name the value it follows
([src/inference/reference-search.ts](./src/inference/reference-search.ts)):
the declaring file for a file-local helper, and the module plus the files that
`require()` it for an export. It runs a bounded number of searches and stops
when the editor cancels it.
