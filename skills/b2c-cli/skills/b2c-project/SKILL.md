---
name: b2c-project
description: Understand a B2C Commerce project's server-side code from source with the b2c CLI — which controller endpoints exist (SFRA and SiteGenesis), what middleware and handlers run for a URL and which cartridge each comes from, how overlays compose across the cartridge path (server.extend, append, prepend, replace, module.superModule), which hooks are registered for an extension point and in what order, how Custom APIs are wired (api.json, schema.yaml, implementation), and which custom job steps exist (steptypes.json). Use when the user asks "what runs for Cart-AddProduct", "which cartridge handles this route", "why doesn't my override or hook run", "is my afterPOST hook skipping basket calculation", "where is this Custom API implemented", before changing or overriding a controller, or when reviewing overlays before an SFRA upgrade.
---

# B2C Project Skill

Use `b2c project` (preview) to answer questions about a project's storefront code from its source, without an instance or credentials. It reads the cartridges under the project directory (`--project-directory`, or the current directory; folders with a `.project` file) and composes them in cartridge path order.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead. Add `--json` to any command for structured output.

> **MCP parity:** If the `b2c-dx-mcp` server is connected, `project_inspect` covers these commands: `aspect: "summary"` (`b2c project index`, plus what each aspect returns), `"endpoints"` (with `filter`, `cartridge`, `uses`), `"endpoint"` with `id`, `"hooks"`, `"customApis"`, and `"jobSteps"`. Unlike the CLI, it can read the cartridge path live from the instance: pass `siteId` for a specific site. Every result has `cartridgePathSource` (`instance`, `configured`, `site-file`, or `discovery`); when it isn't `instance` or `configured`, follow `cartridgePathHint` and say where the order came from. Only cartridges on the path are indexed (others are in `notOnPath`); pass `allCartridges: true` to include them.

## Get the cartridge path right first

Results depend on cartridge order. The CLI uses the `cartridges` value from `dw.json` or `SFCC_CARTRIDGES`; without it, a site's `<custom-cartridges>` from a `sites/<site-id>/site.xml` in the project (the latest migration or import set by timestamp prefix; `siteId`/`SFCC_SITE_ID` picks the site); then discovery order with `app_storefront_base` and `modules` last. Check the order and its source with:

```bash
b2c project index        # prints "Cartridge path: a:b:c" and "Order: from site X in <file>"
```

With `--json`, `cartridgeOrder.source` is `configured`, `site-file`, or `discovery`. If the order is a guess or doesn't match the site, ask the user for the site's cartridge path (or read it with `b2c sites cartridges list --site-id <site>`) and set `cartridges` in `dw.json` before drawing conclusions about overlays. Cartridges not on the path are left out of endpoints and hooks (the site doesn't run them); `b2c project index` lists them, and `--all-cartridges` includes them after the path.

## Endpoints and what runs for them

List to find endpoints, then get one for the detail:

```bash
# Compact list: id, methods, cartridge that serves it, cartridges that change it, middleware as written
b2c project endpoints list --json

# Narrow by ID, by a cartridge that defines or changes the route, or by middleware
b2c project endpoints list Cart-
b2c project endpoints list --cartridge int_paypal
b2c project endpoints list --uses userLoggedIn

# Everything that runs for one endpoint, in order, the statements that built it, and its issues
b2c project endpoints get Cart-AddProduct --json
```

In `b2c project endpoints get --json`:

- `endpoint.chain` is the execution order. Each entry has `id` (`csrf.validateAjaxRequest`, `server.middleware.https`, `function` for handlers), `expression` (as written, such as `csrfProtection.validateAjaxRequest`), `cartridge`, `relPath`, `line`, `via` (`prepend`/`append` when another cartridge added it), and `source` (where required middleware is implemented, with the function's line).
- `endpoint.steps` lists the `server.get/post/use/replace/append/prepend` statements across cartridges in the order the platform applies them; a `replace` step has `replaced` (the old chain) and `dropped` (security middleware it lost).
- `endpoint.events` lists route event listeners registered by chain entries with `this.on('route:BeforeComplete' | 'route:Complete' | 'route:Redirect', fn)`, in the order they run. Each has `event`, `cartridge`, `relPath`, `line`, `step` (index into `chain` of the middleware that registers it), `via`, and `conditional` (registered inside a condition). `route:BeforeComplete` listeners run after the last chain step and before rendering, so code that saves data or changes the response often lives there, not in the chain itself.
- `issues` lists problems: POST without a CSRF check, or a `server.replace()` that dropped CSRF, login, HTTPS, or the GET/POST restriction.

Key SFRA facts when reasoning about routes:

- `server.replace()` registers the new chain with `server.use()`, so it drops **everything** from the base route, including the GET/POST method check. Repeat the security middleware or use `append`/`prepend`.
- `server.prepend()` runs before the base chain, `server.append()` after it. A CSRF check added with `append` runs after the handler, so it doesn't protect anything.
- `*/cartridge/...` requires and `module.superModule` follow the cartridge path from left to right.

## Hooks

```bash
b2c project hooks list                          # every extension point, registrations in cartridge path order
b2c project hooks list dw.ocapi.shop.basket     # filter by name
b2c project hooks list --issues --json
```

- **System extension points** (`dw.*`, including OCAPI/SCAPI hooks): registrations run in cartridge path order. The first one that **returns a value** (such as a `Status`) skips the later registrations **and** the system implementation; returning nothing lets them run. An OCAPI/SCAPI hook that returns `Status.OK` skips the system implementation, including basket calculation. `returnsValue: "yes"` on a registration means some path returns a value.
- **Custom extension points**: every registration runs, whatever it returns. The caller picks the function (`HookMgr.callHook(name, functionName, ...)`), so registrations list `exports` and `calledFunctions` (each function the project calls, with its line and `callers`, the call sites) instead of a fixed function. `registeredIn` is the `hooks.json` file and line.

When a hook "doesn't fire", look for an earlier registration (to its left on the cartridge path) that returns a value. Fix by returning nothing unless the intent is to stop processing.

## Custom APIs

```bash
b2c project apis list --json
b2c project apis list --issues
```

Each endpoint has `method`, `path`, `security`, `scopes`, and `apiType` (`shopper`/`admin`) from `schema.yaml`, `implementationFile`, `public`, and `problems` (no operation with the endpoint's `operationId`, missing script or export, missing `exports.<name>.public = true`). An API defined in more than one cartridge is flagged; check which cartridge is on the site's (or Business Manager's, for org-level Admin APIs) cartridge path. Use the `b2c-custom-api-development` skill to fix contracts and registration.

## Custom job steps

```bash
b2c project job-steps list --json
b2c project job-steps list --cartridge int_jobs
```

Each step has `typeId`, `kind` (`script-module-step` or `chunk-script-module-step`), `cartridge`, `module`, `function` (`execute` by default for task steps), `parameters`, `registeredIn` (the `steptypes.json` file and line), `implementationFile` (with the function's line), and `problems` (module not found, function not exported). Use the `b2c-job` skill to run or define jobs that use them.

## Related

- `b2c security scan` uses the same index for its route rules; use `b2c project endpoints get` to triage a route finding (see the `b2c-security` skill).
- `b2c project index --json` returns the whole index (endpoints with chains and steps, hooks, Custom APIs, job steps) in one call when you need several answers.
