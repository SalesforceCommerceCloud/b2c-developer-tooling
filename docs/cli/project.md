---
description: Inspect a B2C Commerce project's storefront code with b2c project — controller endpoints composed across the cartridge path, the middleware that runs for each, hooks in cartridge path order, and Custom APIs.
---

# Project Commands

Inspect the server-side entry points of a project from its source: which controller endpoints exist, what runs for each request and which cartridge it comes from, which hooks are registered and in what order, and how Custom APIs are wired. The commands read the cartridges under the current directory (folders with a `.project` file), need no instance or credentials, and support `--json` for scripts and AI assistants.

Cartridges are ordered by the `cartridges` value in your configuration (`dw.json` or `SFCC_CARTRIDGES`), the same order the platform uses for `*/cartridge/...` lookups and `module.superModule`. Without it, cartridges are ordered by discovery with `app_storefront_base` and `modules` last; set `cartridges` to your site's cartridge path to see overlays composed the way your storefront runs them.

## b2c project endpoints

List storefront controller endpoints (SFRA routes and SiteGenesis guard actions) with the methods they accept and whether they require HTTPS, a logged-in customer, and a CSRF token. SFRA routes are composed across cartridges (`server.extend(module.superModule)` with `append`, `prepend`, and `replace`), so each row shows the endpoint as it is served.

### Usage

```bash
b2c project endpoints [filter]
```

### Arguments

| Argument | Description                                                   | Required |
| -------- | ------------------------------------------------------------- | -------- |
| `filter` | Only endpoints whose ID contains this text (case-insensitive) | No       |

### Flags

| Flag               | Description                                                                         | Default |
| ------------------ | ----------------------------------------------------------------------------------- | ------- |
| `--issues`         | Only endpoints with issues (POST without a CSRF check, dropped security middleware) | `false` |
| `--extended`, `-x` | Show the file and line that defines each endpoint                                   | `false` |

The `csrf` column is `middleware` (a CSRF middleware check), `in-handler` (`CSRFProtection.validateRequest()` in the handler), `none`, or `not-applicable` (GET-only routes and remote includes). With `--json`, each endpoint has `id`, `controller`, `action`, `kind`, `cartridge`, `file`, `methods`, `https`, `loginRequired`, `csrf`, and `issues`.

### Examples

```bash
b2c project endpoints
b2c project endpoints Cart-
b2c project endpoints --issues
b2c project endpoints --json
```

## b2c project endpoint

Show what runs for one endpoint: the middleware and handlers in execution order, with the cartridge each comes from, whether it was added by `server.prepend` or `server.append`, and the file that implements each required middleware; then the statements across cartridges that built the route, including what a `server.replace()` dropped.

### Usage

```bash
b2c project endpoint <id>
```

### Example

```text
$ b2c project endpoint Cart-AddCoupon
Cart-AddCoupon (SFRA)
  Served by:  cartridges/app_storefront_base/cartridge/controllers/Cart.js:535
  Accepts:    GET · HTTPS required · login not required · CSRF middleware

Runs (in order):
   1. GET only (server.middleware.get)               app_storefront_base   .../Cart.js:535
   2. HTTPS required (server.middleware.https)       app_storefront_base   .../Cart.js:537
   3. CSRF check (AJAX) (csrf.validateAjaxRequest)   app_storefront_base   .../Cart.js:538  → .../scripts/middleware/csrf.js
   4. Handler                                        app_storefront_base   .../Cart.js:539

Defined by:
  server.get      app_storefront_base   .../Cart.js:535
```

IDs are matched case-insensitively. With `--json`, the result has the full `endpoint` (with `chain` and `steps`) and its `issues`.

## b2c project hooks

List hook registrations by extension point, in cartridge path order.

- **System extension points** (`dw.*`, including OCAPI/SCAPI hooks such as `dw.ocapi.shop.basket.afterPOST`): registrations run in cartridge path order, and the first one that returns a value (such as a `Status`) skips the later registrations and the system implementation. The command flags OCAPI/SCAPI hooks that can return a value, and any system hook that would skip later registrations. When the last registration of another system hook (such as `dw.order.calculate`) returns a value, it is noted as replacing the system implementation.
- **Custom extension points**: every registration runs, whatever it returns. The caller chooses the function (`HookMgr.callHook(name, functionName, ...)`), so the command lists each script's exported functions.

### Usage

```bash
b2c project hooks [filter]
```

| Flag       | Description                                        | Default |
| ---------- | -------------------------------------------------- | ------- |
| `--issues` | Only extension points or registrations with issues | `false` |

### Examples

```bash
b2c project hooks
b2c project hooks dw.ocapi.shop.basket
b2c project hooks --issues --json
```

## b2c project apis

List Custom API endpoints from each cartridge's `rest-apis/<api>/api.json`, joined with the operation in `schema.yaml` (method, path, security scheme, and scopes) and the implementing function. Problems are reported: no operation with the endpoint's `operationId`, a missing implementation script or export, a missing `.public = true`, and APIs defined in more than one cartridge.

### Usage

```bash
b2c project apis [filter]
```

| Flag               | Description                           | Default |
| ------------------ | ------------------------------------- | ------- |
| `--issues`         | Only APIs or endpoints with problems  | `false` |
| `--extended`, `-x` | Show the implementation file and line | `false` |

## b2c project index

Build the whole project index and print a summary, or write it as JSON. The index lists controller endpoints with their composed middleware chains and the statements that built them, hooks, Custom APIs, and custom job step types. The same index drives the route rules in [`b2c security scan`](./security.md) and the VS Code [Endpoints view](../vscode-extension/index.md#endpoints), and is available to Node.js programs as `@salesforce/b2c-tooling-sdk/project-index`.

### Usage

```bash
b2c project index [paths...]
```

| Argument | Description                                                                       |
| -------- | --------------------------------------------------------------------------------- |
| `paths`  | Additional directories to search for cartridges (the current directory always is) |

| Flag       | Description                       |
| ---------- | --------------------------------- |
| `--output` | Write the index JSON to this file |

### Examples

```bash
b2c project index
b2c project index --json
b2c project index --output project-index.json
```
