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
(off by default) makes the plugin infer a plausible type for these cases from
how the value is actually used elsewhere in the project — see
[src/usage-inference.ts](./src/usage-inference.ts) (barrel) and the engine
modules under [src/inference/](./src/inference/) — and surface it as an
"Inferred from usage" hover note plus synthesized member completions. It's
heuristic and intentionally conservative: it only kicks in where the checker
has already given up with `any`, never overriding a type TypeScript or JSDoc
already resolved.
