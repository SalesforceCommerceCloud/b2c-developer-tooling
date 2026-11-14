---
description: Find security problems in B2C Commerce cartridge code with the b2c security scanner, in the terminal, in CI with SARIF, or through ESLint and oxlint.
---

# Security Scanning

::: warning Preview
Security scanning is a preview. Rules and output may change before they are stable.
:::

`b2c security scan` checks SFRA, SiteGenesis, and other cartridge code for security problems that are specific to B2C Commerce and the Script API, such as query strings built by concatenation, redirects to URLs taken from the request, weak `dw.crypto` usage, and credentials written into code. It runs locally against your working tree, needs no instance or credentials, and is fast enough to run on every commit.

## Run a scan

```bash
b2c security scan
```

The scanner finds the cartridges under the current directory (folders with a `.project` file) and checks their server-side scripts. Browser code under `cartridge/client/` and `cartridge/static/` is skipped. See [`b2c security scan`](../cli/security.md#b2c-security-scan) for flags and output, and [Security Rules](./security-rules.md) for what each rule looks for and how to fix it.

## Use it on an existing codebase

A first scan of a mature codebase can report findings you can't fix right away. Record them in a baseline, commit it, and scans report only findings that are new:

```bash
b2c security baseline
git add .b2c-security-baseline.json
b2c security scan
```

To accept an individual finding in code, add a comment that names the rule:

```js
// b2c-dx-disable-next-line hardcoded-credentials -- test fixture, not a real key
var key = 'test_51HxQ2eKz8Y3';
```

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

The scan needs no instance configuration or credentials. See [CI/CD with GitHub Actions](./ci-cd.md) for the setup action.

## How the rules work

Rules are written as [ESLint](https://eslint.org/) rules over the JavaScript syntax tree, and the CLI runs them without needing ESLint installed. They understand Script API and storefront idioms: `require('dw/...')` modules, `req.querystring` and `request.httpParameterMap` as request input, SFRA `res.redirect`, and SiteGenesis `response.redirect`. Each rule decides from one file at a time and follows values through local variables.

Every finding has a severity (how bad the problem is when real) and a confidence (how sure the rule is). Review `medium` and `low` confidence findings rather than treating them as definite bugs.
