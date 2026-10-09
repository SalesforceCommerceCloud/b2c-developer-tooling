---
description: Configure IDE tooling like the IntelliJ SFCC plugin to consume resolved B2C CLI configuration, plus enable Script API IntelliSense via TypeScript definitions.
---

# IDE Integration

This guide explains how to connect third-party IDE tooling (such as the IntelliJ SFCC plugin) to your B2C CLI configuration, and how to enable Script API IntelliSense in any IDE.

> Looking for the **Salesforce B2C Commerce VS Code Extension**? See the dedicated [VS Code Extension](../vscode-extension/) section — it consumes `dw.json` and the active instance directly, no bridge script required.

## Script API IntelliSense

Get autocomplete and inline documentation on `require('dw/catalog/ProductMgr')`, hover docs from JSDoc, signature help, and member completion in cartridge JavaScript files. The B2C tooling ships TypeScript definitions for the Script API (currently version 26.9) covering all `dw/*` modules, top-level globals (`request`, `customer`, `session`), and the `ICustomAttributes` extension hook.

There are three setup paths depending on your IDE:

### Salesforce B2C Commerce VS Code Extension (recommended)

If you have the Salesforce B2C Commerce VS Code extension installed, IntelliSense is automatic:

- No configuration files are written into your repository.
- The extension registers a TypeScript Server plugin that resolves `dw/*` modules transparently for any file inside a detected cartridge (folders containing a `.project` file alongside a `cartridge/` directory).
- Files outside your cartridges are unaffected.

You can disable the feature with the `b2c-dx.features.scriptTypes` setting (default: `true`).

The plugin also resolves SFCC cartridge-style requires, matching runtime semantics:

- `require('~/cartridge/scripts/foo')` — resolves only within the cartridge that contains the current file (the SFCC `~` shortcut for "current cartridge"). If `foo` doesn't exist there, IntelliSense reports it unresolved — same as runtime.
- `require('*/cartridge/scripts/foo')` — walks the cartridge path with owner-first override priority (SFRA-style override).
- `require('app_storefront_base/cartridge/scripts/foo')` — resolves only within the named cartridge.
- `require('server')`, `require('server/middleware')`, etc. — bare requires resolve against the SFRA `modules` cartridge if present (its tree is exposed at the root, not under `cartridge/scripts/`). When a `modules` cartridge is detected, the plugin also injects ambient type declarations for the SFRA `server` API (Server, Route, Request, Response, middleware, forms, querystring) so cartridge code type-checks under `checkJs: true` despite the dynamic property assignments in `modules/server.js` that TypeScript can't infer on its own.

Cartridge resolution order matches your runtime cartridge path: the `cartridges` field from your resolved configuration (`dw.json`, `SFCC_CARTRIDGES`, `.env`, etc.) wins. When that's not set, cartridges fall back to discovery order with known base cartridges (`app_storefront_base`, `modules`) sorted last. The same ordering also drives the extension's **Cartridges** tree view.

#### Legacy `.ds` scripts

The extension associates `**/cartridge/scripts/**/*.ds` with the JavaScript language mode, so legacy pipeline-era scripts get the same syntax highlighting, completions, hover docs, and debugger breakpoints as their `.js` siblings. Requires that land on a `.ds` file resolve as well — `.js` still wins when both exist, matching the platform. Override the association in your own settings if you use `.ds` files for something else:

```json
{
  "files.associations": {
    "**/cartridge/scripts/**/*.ds": "plaintext"
  }
}
```

### Standalone VS Code, WebStorm, or IntelliJ Ultimate

For IDEs without the extension, run the following from your project root to vendor the type bundle and a `jsconfig.json`:

```bash
b2c setup ide vscode-types
```

This creates two artifacts at the repo root:

- `./.b2c-script-types/types/` — vendored copy of the Script API definitions.
- `./jsconfig.json` — TypeScript Language Service configuration mapping `dw/*` to the vendored types.

You can commit both into your repository if you want everyone on the team to share the same setup. To re-vendor after upgrading the CLI, re-run the command with `--force` to overwrite the existing files. The vendored types are refreshed automatically because the `--copy` flag defaults to true. The `jsconfig.json` lives at the repo root by design — the `paths` mappings inside it are repo-root-relative and will not resolve correctly from a subdirectory.

The generated `jsconfig.json` looks like this — feel free to author it yourself if you prefer:

```json
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "moduleResolution": "node",
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "dw/*": ["./.b2c-script-types/types/dw/*"]
    },
    "types": []
  },
  "include": [".b2c-script-types/types/global.d.ts", "**/cartridge/**/*.js"],
  "exclude": ["**/cartridge/static/**", "**/node_modules/**"]
}
```

### Neovim, Helix, Zed, Sublime, or other LSP-based editors

Modern editors that drive `tsserver` through the Language Server Protocol have two ways to wire up Script API IntelliSense:

**Option A — vendored `jsconfig.json` (dw/\* only).** Run `b2c setup ide vscode-types` at the repo root and your LSP picks it up on next start. Provides only `dw/*` resolution; cartridge-relative requires (`~/cartridge/...`, `*/cartridge/...`) are not handled because TypeScript `paths` mappings can't express multi-cartridge lookups.

**Option B — load the bundled TS Server plugin (full feature parity with the VS Code extension).** Configure your LSP client to load `@salesforce/b2c-script-types` as a TypeScript Server plugin via `init_options`. The plugin auto-discovers cartridges by walking the project for `.project` files, and honors `dw.json`'s `cartridges` field for ordering — no separate vendoring step.

Resolve the plugin location via the CLI:

```bash
b2c setup ide tsserver-plugin --json
# {"pluginName":"@salesforce/b2c-script-types","pluginPath":"/usr/lib/.../dist/script-types","typesPath":"...","version":"26.9.0"}
```

The recommended language servers and what to install:

- **Neovim** with [`nvim-lspconfig`](https://github.com/neovim/nvim-lspconfig) — use the `ts_ls` server (formerly `tsserver`), backed by the `typescript-language-server` npm package. Older `coc-tsserver` setups also work. The [nvim-sfcc](https://github.com/clavery/nvim-sfcc) plugin wraps the wiring below.
- **Helix** — bundles `typescript-language-server`; nothing to wire up beyond installing the package globally (`npm i -g typescript-language-server typescript`).
- **Zed** — ships TypeScript support out of the box; no extra configuration.
- **Sublime Text** — install `LSP` and `LSP-typescript` from Package Control.

A minimal Neovim 0.10+ snippet using `nvim-lspconfig` and the TS Server plugin:

```lua
local function b2c_plugin_path()
  local out = vim.fn.system({ 'b2c', 'setup', 'ide', 'tsserver-plugin', '--json' })
  return (vim.fn.json_decode(out) or {}).pluginPath
end

require('lspconfig').ts_ls.setup({
  root_dir = require('lspconfig.util').root_pattern('jsconfig.json', 'tsconfig.json', '.project', '.git'),
  filetypes = { 'javascript', 'javascriptreact', 'typescript', 'typescriptreact' },
  init_options = {
    plugins = {
      { name = '@salesforce/b2c-script-types', location = b2c_plugin_path() },
    },
  },
})
```

If your editor's LSP client is launched outside the repo root (for example, opening a single cartridge subdirectory), point it at the project root so the plugin's auto-discovery walks the right tree.

### Inferring types for undocumented helpers (experimental)

JSDoc-documented functions get full hover/completion support when the annotation names a real Script API type (`@param {dw.customer.Customer}` / `@param {Customer}`), because TypeScript reads those directly — the same happy path the IntelliJ SFCC plugin relies on. Plain, undocumented helpers don't, and neither do the placeholder SFRA annotations that show up constantly in real cartridges (`@param {Object}`, `{obj}`, `{*}`, `{}`, and arrays of those such as `{Array}`): those widen to an uninformative type and silence completion for everything downstream.

Enable the `b2c-dx.features.scriptTypesInferUsage` setting (default: `false`) or pass `inferUsage: true` in the plugin config (`init_options.plugins` for other LSP hosts) to have the plugin infer a plausible type for these cases the way IntelliJ does: from how the value is actually used across the project, not from what it is called. Deliberate `@param {any}` / `: any` annotations are still respected and never second-guessed; real `dw.*` JSDoc is left alone too.

The evidence it weighs:

- **Call sites** — the arguments a helper receives anywhere in the project: plain calls, `new Model(x)` (constructor functions and ES6 classes alike), SFRA model inheritance through `BaseModel.call(this, x)` and `helper.apply(this, arguments)`, calls through export maps and aliases (`module.exports = {helper: helper}`, `var run = helper`), and named functions passed as callbacks (`collections.forEach(items, handleItem)`). A function handed to a documented API rather than to a project helper takes the parameter types of the callback that API declares: `basket.getProductLineItems().toArray().forEach(keep)` types `keep`'s parameter as a `ProductLineItem`.
- **Return values and chains** — return statements, followed through undocumented call chains (a helper calling a helper calling a helper), multi-hop method chains (`product.getPriceModel().getPrice()`) and intermediate local variables (`var priceModel = product.getPriceModel();`), including variables assigned in several branches and `lineItemContainer || {}` fallbacks.
- **Values and the members they are stored in** — a member is what was put into it: `{apiProduct: apiProduct}`, `this.productSearch = productSearch`, `result.matchingProducts = ...`. Arrays are what was pushed into them (`var items = []; items.push(lineItem)`), a union when unrelated values were (`(Product | Basket)[]`), and element access, `filter`/`find`/`[0]` and native `forEach`/`map`/`reduce` callbacks read their elements. A constructor or model function is followed wherever its value goes — `module.exports = Model`, a factory that returns it (`var Model = getModel(definition)`), or an argument it is passed as (`createModel(..., Model)` → `new Model(...)`) — and a constructor's prototype methods count as usage of what it stores on `this`.
- **Call-specific results** — when a generic helper returns nothing in particular across all of its callers, it is inferred again for the call at hand: `collections.find(basket.shipments, ...)` is a `Shipment`, `collections.find(basket.productLineItems, ...)` a `ProductLineItem`. A callback passed to such a helper is part of the call: `collections.map(basket.shipments, function (shipment) { return new ShippingModel(shipment); })` is a `ShippingModel[]`. Generic Script API calls such as `Transaction.wrap(function () { return order; })` return what their callback returns. IntelliJ does neither.
- **Hooks** — nothing calls a hook script's exports by name; the platform dispatches `HookMgr.callHook('dw.order.calculate', 'calculate', basket)` to the scripts a cartridge's `hooks.json` (named by the `hooks` entry of its `package.json`) registers for that extension point. The plugin reads those registrations, so a hook function's parameters take the arguments of the `callHook` calls that reach it (from the third argument on), and a `callHook` call returns what the matching hook functions return. Extension points built at runtime (`'app.payment.processor.' + processor.ID.toLowerCase()` or a template literal, inline or in a local variable) reach every registered extension point their literal prefix starts. IntelliJ follows hooks in neither direction.
- **Typed Script API uses** — a value handed to a documented API takes that API's parameter type, even when the helper is never called: `ShippingMgr.applyShippingCost(basket)` makes `basket` a `LineItemCtnr`, and `ProductMgr.getProduct(pid)` makes `pid` a `string`.
- **The helper's own body** — the members it reads (`shipment.shippingAddress`), its `'member' in value` checks, and its `instanceof` / `typeof` tests. A call-site type that lacks a member the body relies on is dropped, so a duck-typed view model can't pass for the Script API class the body needs; with no call site at all, the members are matched against every Script API class.

`module.superModule` is understood too: in an overlay cartridge that extends a base module (`var base = module.superModule;`), hover and completions on `base` and on values derived from it resolve against the same-path module in the next cartridge down the cartridge path — including recursing into the base module's own undocumented helpers, and across multi-cartridge plugin stacks where intermediate levels re-export the base and add members (`module.exports = base; module.exports.extra = extra;`).

Two more SFRA idioms are covered:

- **Iteration callbacks** — a callback's parameters are what the helper it is passed to calls it with, for that call's arguments: `collections.forEach(product.getVariants(), function (variant) {...})` types `variant` as a `Variant`, and `collections.reduce(basket.productLineItems, function (total, lineItem) {...}, 0)` types `lineItem`, the second parameter, as a `ProductLineItem`. This reads the helper's own `callback(item)` / `callback.call(scope, item)` calls, so a project's own helpers (`eachShipment(basket, function (shipment) {...})`) and wrappers that hand the callback on to another helper work the same way; an accumulator the callback's result is fed back into stays unknown, as with a native `reduce`. A helper whose source isn't available falls back to its name: `collections.forEach` / `map` / `filter` / `every` / `some` / `find` / `first` take an element of the collection travelling alongside the callback (anything with `iterator()`/`next()`, i.e. `dw.util.Collection` and friends). Manual iterator loops (`var iter = coll.iterator(); while (iter.hasNext()) { var item = iter.next(); }`) and ternary returns like stock `collections.first` (`return it.hasNext() ? it.next() : null`) resolve through the same chain machinery.
- **Controller middleware** — `server.append('Show', function (req, res, next) {...})` needs no inference at all: when a `modules` cartridge is present, the plugin injects its bundled SFRA ambient declarations and TypeScript types `req`/`res`/`next` contextually from the typed `append` signature, and `this` as the route, so the `req`/`res` of a `this.on('route:BeforeComplete', function (req, res) {...})` listener are typed as well. Inference deliberately stays out of the way there. A named middleware function that lives in its own module (`server.get('Show', cache.applyDefaultCache, ...)`, `consentTracking.consent`) has no contextual type of its own; with inference on, it takes `req`/`res`/`next` from the routes it is handed to.

Cross-file inference (call sites in other files, `module.superModule`) needs those files in the same TypeScript project. A `jsconfig.json` that includes all cartridge sources — like the one `b2c setup ide vscode-types` generates — provides that; without one, each open file gets its own inferred project and only same-file usage is visible.

Inference stays cheap on large cartridge stacks. A request reads only the files that can name the value it follows: a helper local to one file is looked up in that file, and a module's exports in that module and the files that `require()` it. Each hover or completion runs a bounded number of such searches, and is dropped as soon as the editor cancels it (for example, when you keep typing).

Inferred results are heuristic and clearly labeled:

- Hover text gets an appended `Inferred from usage: <type>` line.
- Member completions synthesized this way are still offered alongside (not instead of) whatever TypeScript already resolved.
- Call sites that pass different types show their union, as IntelliJ does (`Product | Category`), up to three types. Different element types of one collection class read as that class (`Collection<Shipment>` and `Collection<ProductLineItem>` show `Collection`). An object literal with only members of a class another call site passes, such as a unit test's `{httpHeaders: {get: ...}}` stand-in for a `Request`, isn't counted as a type of its own. Wider evidence collapses to the closest shared superclass that still fits the body, or the hover stays silent.
- Usage that a JavaScript built-in fits as well (`value.replace(...)` could be a `String`) and the TopLevel classes describing `module` and `arguments` never produce a Script API guess on their own.
- Names never add a type of their own; they only break a tie when the usage fits several classes equally well. A `profile` parameter picks `dw.customer.Profile` over `ProductListRegistrant`, `lineItem` / `pli` pick `ProductLineItem`, and qualified names such as `apiProduct`, `currentBasket` or `resettingCustomer` resolve to the class they end in.

This won't recover types TypeScript genuinely can't infer — for example, values that are never called with a consistent, well-typed argument anywhere in the project — and it's off by default because it's new and heuristic.

**Known limitations** — intentionally deferred patterns:

- Destructured function parameters (`function f({a, b})`)
- Destructured return values (`var {a, b} = undocumentedFn()`)
- Constructor inheritance via `Foo.prototype = Base.prototype`
- Hooks the platform itself invokes (OCAPI/SCAPI `dw.ocapi.*` hooks, system extension points such as `dw.order.calculate` when no cartridge calls it): with no `HookMgr.callHook` call there is no call site, so only the hook's own body is evidence. Extension points without a literal prefix (`HookMgr.callHook(hookName, ...)` where `hookName` is a parameter or a variable assigned more than once) aren't matched either
- Typed Script API uses through a value that is itself inferred (`paymentInstrument.paymentTransaction.setPaymentProcessor(processor)` where `paymentInstrument` is undocumented) don't count as usage of the argument
- Values ISML templates read from `pdict`
- Guessing individual custom attribute names on `.custom` (only `.custom` itself is usage evidence)

### Notes

- The bundle is version-locked to a Script API release (currently 26.9). Re-run `b2c setup ide vscode-types` after upgrading the CLI to refresh the vendored copy; use `--force` to overwrite existing files if they were previously created. The plugin path returned by `b2c setup ide tsserver-plugin` always points at the bundle shipped with your installed CLI.
- The vendored `jsconfig.json` only configures `dw/*` IntelliSense. Cartridge-relative requires (`~/cartridge/...`, `*/cartridge/...`, `cartridgeName/cartridge/...`) cannot be expressed in standalone TypeScript `paths` mappings (TypeScript allows at most one `*` per pattern), so they will appear unresolved without the Salesforce B2C Commerce VS Code extension or another host that loads `@salesforce/b2c-script-types/plugin` via LSP.

## IntelliJ SFCC Plugin

The [IntelliJ SFCC plugin](https://plugins.jetbrains.com/plugin/13668-salesforce-b2c-commerce-sfcc-) manages its own connection settings in `.idea/misc.xml`. A community B2C CLI plugin lets you share that configuration with the CLI so both tools stay in sync.

### Setup

Install the [b2c-plugin-intellij-sfcc-config](https://github.com/sfcc-solutions-share/b2c-plugin-intellij-sfcc-config) plugin:

```bash
b2c plugins install sfcc-solutions-share/b2c-plugin-intellij-sfcc-config
```

Once installed, run CLI commands from your IntelliJ project directory and the plugin will automatically load connection settings from `.idea/misc.xml`.

See the [3rd Party Plugins](./third-party-plugins#intellij-sfcc-config-plugin) guide for full details on environment variables, credential decryption, and instance selection.
