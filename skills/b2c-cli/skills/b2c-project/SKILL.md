---
name: b2c-project
description: Understand a B2C Commerce project's server-side code from source with the b2c CLI — which controller endpoints exist (SFRA and SiteGenesis), what middleware and handlers run for a URL and which cartridge each comes from, how overlays compose across the cartridge path (server.extend, append, prepend, replace, module.superModule), which hooks are registered for an extension point and in what order, and how Custom APIs are wired (api.json, schema.yaml, implementation). Use when the user asks "what runs for Cart-AddProduct", "which cartridge handles this route", "why doesn't my override or hook run", "is my afterPOST hook skipping basket calculation", "where is this Custom API implemented", before changing or overriding a controller, or when reviewing overlays before an SFRA upgrade.
---

# B2C Project Skill

Use `b2c project` to answer questions about a project's storefront code from its source, without an instance or credentials. It reads the cartridges under the current directory (folders with a `.project` file) and composes them in cartridge path order.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead. Add `--json` to any command for structured output.

## Get the cartridge path right first

Results depend on cartridge order. The CLI uses the `cartridges` value from `dw.json` or `SFCC_CARTRIDGES`; without it, discovery order with `app_storefront_base` and `modules` last. Check the order with:

```bash
b2c project index        # prints "Cartridge path: a:b:c"
```

If it doesn't match the site, ask the user for the site's cartridge path (or read it with `b2c sites cartridges list --site-id <site>`) and set `cartridges` in `dw.json` before drawing conclusions about overlays.

## Endpoints and what runs for them

```bash
# All controller endpoints with methods and HTTPS/login/CSRF protection
b2c project endpoints --json

# Narrow by ID, or only endpoints with issues
b2c project endpoints Cart-
b2c project endpoints --issues

# Everything that runs for one endpoint, in order, and the statements that built it
b2c project endpoint Cart-AddProduct --json
```

In `b2c project endpoint --json`:

- `endpoint.chain` is the execution order. Each entry has `id` (`csrf.validateAjaxRequest`, `server.middleware.https`, `function` for handlers), `cartridge`, `relPath`, `line`, `via` (`prepend`/`append` when another cartridge added it), and `source` (where required middleware is implemented).
- `endpoint.steps` lists the `server.get/post/use/replace/append/prepend` statements across cartridges in the order the platform applies them; a `replace` step has `replaced` (the old chain) and `dropped` (security middleware it lost).
- `issues` lists problems: POST without a CSRF check, or a `server.replace()` that dropped CSRF, login, HTTPS, or the GET/POST restriction.

Key SFRA facts when reasoning about routes:

- `server.replace()` registers the new chain with `server.use()`, so it drops **everything** from the base route, including the GET/POST method check. Repeat the security middleware or use `append`/`prepend`.
- `server.prepend()` runs before the base chain, `server.append()` after it. A CSRF check added with `append` runs after the handler, so it doesn't protect anything.
- `*/cartridge/...` requires and `module.superModule` follow the cartridge path from left to right.

## Hooks

```bash
b2c project hooks                          # every extension point, registrations in cartridge path order
b2c project hooks dw.ocapi.shop.basket     # filter by name
b2c project hooks --issues --json
```

- **System extension points** (`dw.*`, including OCAPI/SCAPI hooks): registrations run in cartridge path order. The first one that **returns a value** (such as a `Status`) skips the later registrations **and** the system implementation; returning nothing lets them run. An OCAPI/SCAPI hook that returns `Status.OK` skips the system implementation, including basket calculation. `returnsValue: "yes"` on a registration means some path returns a value.
- **Custom extension points**: every registration runs, whatever it returns. The caller picks the function (`HookMgr.callHook(name, functionName, ...)`), so registrations list `exports` instead of a fixed function.

When a hook "doesn't fire", look for an earlier registration (to its left on the cartridge path) that returns a value. Fix by returning nothing unless the intent is to stop processing.

## Custom APIs

```bash
b2c project apis --json
b2c project apis --issues
```

Each endpoint has `method`, `path`, `security`, `scopes`, and `apiType` (`shopper`/`admin`) from `schema.yaml`, `implementationFile`, `public`, and `problems` (no operation with the endpoint's `operationId`, missing script or export, missing `exports.<name>.public = true`). An API defined in more than one cartridge is flagged; check which cartridge is on the site's (or Business Manager's, for org-level Admin APIs) cartridge path. Use the `b2c-custom-api-development` skill to fix contracts and registration.

## Related

- `b2c security scan` uses the same index for its route rules; use `b2c project endpoint` to triage a route finding (see the `b2c-security` skill).
- `b2c project index --json` returns the whole index (endpoints with chains and steps, hooks, Custom APIs, job steps) in one call when you need several answers.
