---
description: Find and fix security problems in B2C Commerce storefront code (SFRA, SiteGenesis, and custom cartridges) with b2c security scan, in the terminal, in CI with SARIF, and with your AI assistant.
---

# Code Security

::: warning Preview
Code security scanning is a preview. Rules, output fields, and flags may change before they are stable.
:::

`b2c security scan` checks your storefront's server-side code for security problems specific to B2C Commerce and the Script API:

- **CSRF:** SFRA and SiteGenesis POST routes without a CSRF token check, GET routes that change data, and `server.replace()` overrides that drop the CSRF, login, HTTPS, or method checks of the route they replace.
- **Injection:** object query strings built by concatenation, file paths and upload names chosen by the client, request fields copied into persistent objects by key, and code built from strings at runtime.
- **Site data and settings:** OCAPI settings that use the demo client ID `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` or grant every resource, plaintext service passwords and `http://` service URLs, credentials in preferences, secret attributes that aren't the password type, and Business Manager CSRF exemptions.
- **Redirects, secrets, and data handling:** open redirects, hardcoded credentials, weak `dw.crypto` usage, cookies without Secure and HttpOnly, and personal data in logs.

The scan runs locally against your working tree, needs no instance or credentials, and takes well under a second for a typical storefront. See [Security Rules](./security-rules.md) for what each rule finds and how to fix it.

This page is about the security of your storefront code. For how the toolkit itself is built and published securely, see [Security](./security.md).

## Run a scan

From the root of your project:

```bash
b2c security scan
```

The scanner finds the cartridges under the current directory (folders with a `.project` file) and checks their server-side `.js` and `.ds` scripts, and checks site import/export data it finds (such as a `site_template` folder). Browser code under `cartridge/client/` and `cartridge/static/` is skipped. Findings are grouped by file:

```text
cartridges/app_custom/cartridge/controllers/Account.js
  42:1    high    sfra-replace-drops-middleware  server.replace() of "Account-SaveProfile" drops the POST-only restriction (server.middleware.post), CSRF check (csrf.validateAjaxRequest) that the replaced route had.

cartridges/app_custom/cartridge/scripts/helpers/subscription.js
  17:60   high    object-query-injection   The query string passed to queryCustomObject() is built by concatenation; pass values as {0}-style query arguments instead.
```

Scan one cartridge or file by passing paths, and list the rules with `b2c security rules`. See [`b2c security scan`](../cli/security.md#b2c-security-scan) for every flag.

## Triage findings

Each finding has a **severity** (how bad the problem is if it's real) and a **confidence** (how sure the rule is that it's real):

- `high` confidence findings, such as `eval()` or a replaced route that lost its CSRF check, are almost always real.
- `medium` confidence findings usually are, but the rule may not see a check made elsewhere, such as a redirect target validated in a helper module.
- `low` confidence findings need judgment, such as whether a logged value is personal data.

Read the code around a finding before changing it, then follow the fix in the [rule reference](./security-rules.md). For route findings, `b2c project endpoint <Controller-Action>` shows everything that runs for the endpoint and which cartridge each piece comes from (see [`b2c project`](../cli/project.md)). Re-run `b2c security scan --rule <rule-id> <file>` to confirm it's gone.

## Routes, overlays, and the cartridge path

Route rules understand SFRA controllers (`server.get`, `post`, and `use`, and `server.extend(module.superModule)` with `append`, `prepend`, and `replace`) and SiteGenesis controllers (`guard.ensure` filters). Before running rules, the scanner builds an index of every cartridge under the current directory and composes each route along the cartridge path, so it can tell that an overlay cartridge prepends a CSRF check to a base route, or that a `server.replace()` dropped one.

Cartridges are ordered by the `cartridges` value from your configuration (`dw.json` or `SFCC_CARTRIDGES`). Set it to your site's cartridge path so overlays are composed the way your storefront runs them:

```json
{
  "cartridges": "app_custom:plugin_wishlists:app_storefront_base:modules"
}
```

## SFRA and SiteGenesis base cartridges

Findings in the cartridges that ship with SFRA (`app_storefront_base`, `bm_app_storefront_base`, `modules`) and SiteGenesis (`app_storefront_controllers`, `app_storefront_core`, `app_storefront_pipelines`) are reported too, marked `[reference cartridge]`. You usually don't edit those cartridges, but your storefront runs their code, so their weaknesses are yours.

Fix them from your own cartridge rather than editing the base. For example, to add a CSRF check to a base route:

```js
var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.extend(module.superModule);
server.prepend('AddProduct', csrfProtection.validateAjaxRequest);

module.exports = server.exports();
```

Remember to send the token from the page that calls the route. Findings you decide to accept can go in the baseline (below). Use `--exclude-reference-cartridges` to leave base cartridge findings out of a scan.

## Adopt scanning on an existing codebase

A first scan of a mature codebase can report findings you can't fix right away. Record them in a baseline, commit it, and later scans report only new findings:

```bash
b2c security baseline
git add .b2c-security-baseline.json
b2c security scan
```

`b2c security scan` picks up `.b2c-security-baseline.json` from the current directory automatically. Baseline entries match on the rule, the file, and the text of the line, so they survive code moving up or down; changing the line makes the finding new again. Regenerate the baseline as you fix findings.

## Suppress findings

When you've reviewed a finding and decided the code is safe, accept it so it stops being reported. There are two ways:

- **Inline comment**, for a single finding you want to explain where it happens. The decision lives next to the code and shows up in code review.
- **Baseline**, for findings you accept in bulk (see [above](#adopt-scanning-on-an-existing-codebase)), and for files that can't hold comments, such as OCAPI settings JSON.

An inline comment must name the rule it suppresses. There's no way to turn off every rule for a line, so a suppression can't hide a different problem later. Use `b2c-dx-disable-next-line` on the line before the finding, or `b2c-dx-disable-line` at the end of the line:

```js
// b2c-dx-disable-next-line open-redirect -- target checked by isAllowedRedirect()
res.redirect(target);

res.redirect(target); // b2c-dx-disable-line open-redirect
```

- Name several rules separated by commas or spaces: `// b2c-dx-disable-next-line open-redirect, dynamic-code`.
- The reason after `--` is optional. When present, it appears in JSON output (`suppression.reason`) and in SARIF as the suppression's justification, so reviewers and GitHub code scanning can see why.
- Rule IDs may carry the `b2c-security/` prefix, matching how the rules are named in ESLint and oxlint.

In XML site data (`services.xml`, `preferences.xml`, and so on), use an XML comment. XML comments can't contain `--`, so separate the reason with a single hyphen:

```xml
<!-- b2c-dx-disable-next-line service-insecure-url - mock endpoint on the sandbox network -->
<url>http://erp-mock.internal.example.com/orders</url>
```

Suppressed findings are still recorded: `b2c security scan --show-suppressed` lists them, and they appear in JSON and SARIF marked as suppressed. For findings in [SFRA or SiteGenesis base cartridges](#sfra-and-sitegenesis-base-cartridges), which you don't edit, use the baseline or fix them from your own cartridge rather than adding comments to the base code.

## Run it in CI

Fail the build on new high-severity findings, and publish results to GitHub code scanning with SARIF:

```yaml
permissions:
  contents: read
  security-events: write # for the SARIF upload

steps:
  - uses: actions/checkout@v4
  - uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/setup@v2
  - run: b2c security scan --fail-on high --format sarif --output security.sarif
  - uses: github/codeql-action/upload-sarif@v4
    if: always()
    with:
      sarif_file: security.sarif
```

`--fail-on` sets the severity that fails the command (default `low`; `none` never fails). The scan needs no instance configuration or credentials. See [CI/CD with GitHub Actions](./ci-cd.md) for the setup action.

## Use it with your AI assistant

The `b2c-security` [agent skill](./agent-skills.md) teaches assistants to run the scan, triage findings by confidence, explain the impact, and apply the fixes from the rule reference. Install the `b2c-cli` skills and ask, for example, "check my cartridges for security issues".

## How it works

Rules are [ESLint](https://eslint.org/) rules over the JavaScript syntax tree; the CLI runs them without needing ESLint installed. They know Script API and storefront idioms: `require('dw/...')` modules, `req.querystring`, `req.form`, and `request.httpParameterMap` as request input, SFRA middleware such as `csrfProtection.validateAjaxRequest`, and SiteGenesis guard filters. Within a file, rules follow values through local variables; across files, they use the project index described above.

The scanner is also available to Node.js programs as `@salesforce/b2c-tooling-sdk/security`, and the project index as `@salesforce/b2c-tooling-sdk/project-index`. See the [API reference](../api/).

## Limitations

- Legacy `.ds` scripts that use type annotations (`function f(a : String)`) can't be parsed yet and are skipped; the summary reports how many.
- Rules see one file at a time plus the project index. A check made in another module, such as a redirect allowlist in a helper, isn't visible to the rule; suppress the finding with a reason.
- ISML templates aren't scanned yet. Review `<isprint encoding="off">` and values printed into `<script>` blocks by hand; the VS Code extension warns about `encoding="off"`.
