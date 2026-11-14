---
description: Scan B2C Commerce cartridge code for security problems with b2c security scan, list the rules, and baseline existing findings.
---

# Security Commands

::: warning Preview
The `security` commands are a preview. Rules, output fields, and flags may change before they are stable.
:::

Scan cartridge code for security problems such as open redirects, object query injection, weak cryptography, and hardcoded credentials. Scans run locally, need no credentials or instance, and finish in well under a second for a typical storefront. See [Security Scanning](../guide/security-scanning.md) for an overview and [Security Rules](../guide/security-rules.md) for what each rule finds and how to fix it.

## b2c security scan

Scan the server-side scripts in your cartridges. Directories are searched for cartridges (folders with a `.project` file); inside them, `.js` and `.ds` files are scanned except under `cartridge/client/`, `cartridge/static/`, and `node_modules/`, and except minified files. Files you name directly are always scanned.

### Usage

```bash
b2c security scan [paths...]
```

### Arguments

| Argument | Description                                    | Required                               |
| -------- | ---------------------------------------------- | -------------------------------------- |
| `paths`  | Files or directories to scan. Accepts several. | No (defaults to the current directory) |

### Flags

| Flag                | Description                                                                                              | Default                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `--format`          | Report format: `table`, `json`, or `sarif` (for GitHub code scanning)                                    | `table`                                      |
| `--output`          | Write the `json` or `sarif` report to this file instead of standard output                               |                                              |
| `--severity`        | Only report findings at or above this severity: `critical`, `high`, `medium`, `low`, or `info`           | all                                          |
| `--fail-on`         | Exit with status 1 when open findings at or above this severity remain; `none` never fails               | `low`                                        |
| `--rule`            | Run only this rule. Repeatable.                                                                          | all rules                                    |
| `--exclude-rule`    | Skip this rule. Repeatable.                                                                              |                                              |
| `--baseline`        | Baseline file of accepted findings (see [`b2c security baseline`](#b2c-security-baseline))              | `.b2c-security-baseline.json` when it exists |
| `--show-suppressed` | Also list findings that are suppressed inline or in the baseline                                         | `false`                                      |

### Examples

```bash
# Scan every cartridge under the current directory
b2c security scan

# Scan one cartridge
b2c security scan cartridges/app_custom

# Report medium and above, and fail CI only for high and critical findings
b2c security scan --severity medium --fail-on high

# Write SARIF for GitHub code scanning
b2c security scan --format sarif --output security.sarif

# Run specific rules
b2c security scan --rule open-redirect --rule object-query-injection

# Machine-readable output
b2c security scan --json
```

### Output

Findings are grouped by file, with line and column, severity, rule, and message, followed by a summary:

```text
cartridges/app_custom/cartridge/controllers/Account.js
  42:18   medium  open-redirect            Redirect destination can be chosen through the request; this allows redirects to other sites.

cartridges/app_custom/cartridge/scripts/helpers/subscription.js
  17:60   high    object-query-injection   The query string passed to queryCustomObject() is built by concatenation; pass values as {0}-style query arguments instead.

2 open finding(s) (1 high, 1 medium) in 214 file(s); 0 suppressed, 0 baselined.
```

A finding is **open** unless an inline comment suppresses it or it matches the baseline. The command exits with status 1 when open findings at or above `--fail-on` remain.

With `--json` (or `--format json`), the result has `findings` (each with `ruleId`, `severity`, `confidence`, `category`, `cwe`, `message`, `location`, `snippet`, `remediation`, `docsUrl`, `fingerprint`, and `suppression` or `baselined` when they apply), `errors` for files that could not be parsed, `rules`, `filesScanned`, and a `summary` with counts. With `--format sarif`, the report is SARIF 2.1.0, including `security-severity` scores that GitHub code scanning uses to rank alerts.

### Suppressing a finding

To accept a finding in code, add a comment that names the rule on the line before it, or at the end of the line. A reason after `--` is optional and appears in JSON and SARIF output.

```js
// b2c-dx-disable-next-line open-redirect -- target checked by isAllowedRedirect()
res.redirect(target);

res.redirect(target); // b2c-dx-disable-line open-redirect
```

A suppression must name the rule; several rules can be listed, separated by commas or spaces.

### Notes

- Legacy `.ds` scripts that use type annotations (`function f(a : String)`) can't be parsed yet and are skipped; the summary reports how many. Use `--json` to list them.
- Rules follow common SFRA and SiteGenesis patterns and report what they can decide from one file. Treat `medium` and `low` confidence findings as prompts to review the code.

## b2c security rules

List the rules that `b2c security scan` runs, with severity, category, CWE, and a description.

### Usage

```bash
b2c security rules [--json]
```

## b2c security baseline

Record the current findings in a baseline file so later scans report only new findings. Use this to adopt scanning on an existing codebase: commit the baseline, fix findings over time, and regenerate it as you go. Findings suppressed inline are not recorded.

Baseline entries match on the rule, the file, and the text of the line, so they survive code moving up or down. Editing the line makes the finding new again.

### Usage

```bash
b2c security baseline [paths...]
```

### Flags

| Flag             | Description                     | Default                       |
| ---------------- | ------------------------------- | ----------------------------- |
| `--output`       | Baseline file to write          | `.b2c-security-baseline.json` |
| `--rule`         | Include only this rule. Repeatable. | all rules                 |
| `--exclude-rule` | Skip this rule. Repeatable.     |                               |

### Examples

```bash
# Accept today's findings, then scan for new ones
b2c security baseline
b2c security scan
```
