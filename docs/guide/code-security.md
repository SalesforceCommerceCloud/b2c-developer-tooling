---
description: Find and fix security problems in B2C Commerce storefront code (SFRA, SiteGenesis, and custom cartridges) with b2c security scan, in the terminal, in CI with SARIF, and with your AI assistant.
---

# Code Security

::: warning Preview
Code security scanning is a preview. Rules, output fields, and flags may change before they are stable.
:::

Code security scanning is static analysis built for B2C Commerce. It reads your project's cartridges and site data and reports patterns that commonly lead to vulnerabilities on the platform, each with a severity, a confidence, and a recommended fix. Run it from your AI assistant through the MCP server, from the terminal with `b2c security scan`, or in CI.

It understands how a storefront runs, not just the syntax of each file. It knows the Script API, SFRA and SiteGenesis routing, and how cartridges overlay each other on the cartridge path, so it can judge a route by everything that runs for it across your cartridges.

It checks two kinds of input:

- **Cartridge code:** the server-side JavaScript in your controllers, scripts, and models. Rules cover request handling and route protection (such as CSRF), injection, unsafe redirects, secrets in code, cryptography, cookies, and logging of personal data.
- **Site data:** the configuration you import into an instance, such as service definitions, site preferences, attribute definitions, OCAPI settings, and Business Manager CSRF exemptions. Rules cover credentials stored in plain text, insecure endpoints, and overly broad access.

The scan runs locally against your working tree, needs no instance or credentials, and takes well under a second for a typical storefront. See [Security Rules](./security-rules.md) for every rule, what it finds, and how to fix it.

This page is about the security of your storefront code. For how the toolkit itself is built and published securely, see [Security](./security.md).

## Run a scan

From the root of your project:

```bash
b2c security scan
```

The scanner finds the cartridges under the project directory (`--project-directory`, or the current directory; folders with a `.project` file) and checks their server-side `.js` and `.ds` scripts, and checks site import/export data it finds (such as a `site_template` folder). Browser code under `cartridge/client/` and `cartridge/static/` is skipped. Findings are grouped by file:

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

Read the code around a finding before changing it, then follow the fix in the [rule reference](./security-rules.md). For route findings, `b2c project endpoints get <Controller-Action>` shows everything that runs for the endpoint and which cartridge each piece comes from (see [`b2c project`](../cli/project.md)). Re-run `b2c security scan --rule <rule-id> <file>` to confirm it's gone.

## Routes, overlays, and the cartridge path

Route rules understand SFRA controllers (`server.get`, `post`, and `use`, and `server.extend(module.superModule)` with `append`, `prepend`, and `replace`) and SiteGenesis controllers (`guard.ensure` filters). They look at each route the way your storefront serves it, across all your cartridges, so they can tell that an overlay cartridge adds a CSRF check to a base route, or that a `server.replace()` removed one.

That depends on cartridge order. Set `cartridges` in `dw.json` (or `SFCC_CARTRIDGES`) to your site's cartridge path so overlays combine the way your storefront runs them; see [cartridge order](../cli/project.md#cartridge-order) for what's used when it isn't set. Through the MCP server, your assistant can also read the path live from the instance (see [Project code and security](../mcp/toolsets.md#project)):

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

`b2c security scan` picks up `.b2c-security-baseline.json` from the project directory automatically, which is also where `b2c security baseline` writes it. Baseline entries match on the rule, the file, and the text of the line, so they survive code moving up or down; changing the line makes the finding new again. Regenerate the baseline as you fix findings.

## Suppress findings

When you've reviewed a finding and decided the code is safe, accept it so it stops being reported. There are three ways:

- **Inline comment**, for a single finding you want to explain where it happens. The decision lives next to the code and shows up in code review.
- **Baseline**, for findings you accept in bulk (see [above](#adopt-scanning-on-an-existing-codebase)), and for files that can't hold comments, such as OCAPI settings JSON.
- **Project settings** (`.b2c-security.json`, or a `security` key in `dw.json`), for whole rules or paths: turn a rule off, lower its severity, or leave out a cartridge, such as a Business Manager tools cartridge where a rule doesn't apply. See [Project settings](../cli/security.md#project-settings). For a single run, use `--exclude-rule` and `--ignore`.

An inline comment must name the rule it suppresses. There's no way to turn off every rule for a line, so a suppression can't hide a different problem later. Use `b2c-dx-disable-next-line` on the line before the finding, or `b2c-dx-disable-line` at the end of the line:

```js
// b2c-dx-disable-next-line open-redirect -- target checked by isAllowedRedirect()
res.redirect(target);

res.redirect(target); // b2c-dx-disable-line open-redirect
```

- Name several rules separated by commas or spaces: `// b2c-dx-disable-next-line open-redirect, dynamic-code`.
- The reason after `--` is optional. When present, it appears in JSON output (`suppression.reason`) and in SARIF as the suppression's justification, so reviewers and GitHub code scanning can see why.

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

The [B2C DX MCP server](../mcp/) gives your assistant a `security_scan` tool (in the `CARTRIDGES` and `STOREFRONTNEXT` toolsets) that runs the same scan and returns structured findings. Paired with `project_inspect`, which shows everything that runs for a route across the cartridge path, the assistant can triage each finding against your code and apply the fix. See [Project code and security](../mcp/toolsets.md#project). Ask, for example:

> Check my cartridges for security issues and fix the high-severity ones.

The MCP server also serves the `b2c-security` skill, which guides the assistant through triaging findings by confidence and applying each rule's fix. If your assistant uses the CLI without the MCP server, install it as an [agent skill](./agent-skills.md).

## Use it from Node.js

The scanner is also available to Node.js programs as `@salesforce/b2c-tooling-sdk/security`. See the [API reference](../api/).

## Limitations

- Scripts that use legacy syntax, type annotations (`function f(a : String)`, common in `.ds` files) or E4X XML literals, can't be parsed and are skipped; the summary reports how many of each.
- Rules see one file at a time plus the project index. A check made in another module, such as a redirect allowlist in a helper, isn't visible to the rule; suppress the finding with a reason.
- ISML templates aren't scanned yet. Review `<isprint encoding="off">` and values printed into `<script>` blocks by hand; the VS Code extension warns about `encoding="off"`.
