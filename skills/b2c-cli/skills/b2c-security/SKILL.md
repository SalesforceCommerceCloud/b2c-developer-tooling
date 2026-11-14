---
name: b2c-security
description: Scan B2C Commerce cartridge code (SFRA, SiteGenesis, custom cartridges) for security problems with the b2c CLI, triage the findings, and fix them. Use when the user asks to check code for security issues, review a cartridge for vulnerabilities, audit a storefront before launch, set up security scanning in CI, or fix findings such as open redirects, object query injection, weak crypto, hardcoded credentials, insecure cookies, or eval/dynamic require.
---

# B2C Security Skill

Use `b2c security scan` (preview) to find security problems in B2C Commerce cartridge code, then triage and fix them. The scan runs locally on the working tree, needs no instance or credentials, and takes well under a second for a typical storefront.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead.

## Scan

```bash
# Scan all cartridges under the current directory (folders with a .project file)
b2c security scan

# Scan one cartridge or file
b2c security scan cartridges/app_custom

# Structured output for analysis (prefer this when you will read the results)
b2c security scan --json

# List the rules and what they find
b2c security rules
```

Findings in SFRA and SiteGenesis base cartridges (`app_storefront_base`, `modules`, `app_storefront_controllers`, ...) are reported with `referenceCartridge` set. They are real for any storefront that deploys those cartridges; fix them from the project's own cartridge (for example `server.prepend()`), not by editing the base. `--exclude-reference-cartridges` leaves them out.

Site data in the project (such as a `site_template` folder) is checked too: `services.xml`, `preferences.xml`, attribute definitions, `csrf-whitelists.xml`, and OCAPI settings JSON. Server-side `.js` and `.ds` files are scanned; `cartridge/client/`, `cartridge/static/`, `node_modules/`, and minified files are skipped. Legacy `.ds` files with type annotations can't be parsed yet and are reported under `errors`.

## Triage findings

Each finding in `--json` output has `ruleId`, `severity`, `confidence`, `message`, `location` (`file`, `startLine`, `startColumn`), `snippet`, `remediation`, and `docsUrl`.

1. Read the code around each finding before changing it. Rules decide from one file at a time.
2. Treat `confidence: high` findings as real unless the code proves otherwise.
3. For `medium` and `low` confidence, check what the rule could not see: whether a redirect target is validated in a helper, whether a "secret" is a test value, whether a query value is constant.
4. Explain each finding to the user in terms of impact (what an attacker could do) and the fix.

Rule references, with examples and fixes: `b2c docs search "security rules"` or the `docsUrl` on each finding.

## Fix patterns

| Rule                                                      | Fix                                                                                                                                                                                     |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `object-query-injection`                                  | Use `{0}` placeholders and pass values as arguments: `queryCustomObject(type, 'custom.email = {0}', email)`                                                                             |
| `file-path-from-request`                                  | Return a directory from the `processMultipart()` callback (the platform names the file), or generate the name (UUID) with an allowlisted extension; return `null` for unexpected fields |
| `open-redirect`                                           | Redirect to `URLUtils` URLs, or check the target against an allowlist before `res.redirect()`                                                                                           |
| `hardcoded-credentials`                                   | Move the value to a service credential (read via `LocalServiceRegistry`) or a password site preference; rotate it                                                                       |
| `weak-crypto`                                             | `Cipher` with `AES/GCM/NoPadding`; `MessageDigest`/`Mac` with SHA-256 or stronger; avoid the `Weak*` classes                                                                            |
| `insecure-cookie`                                         | `cookie.setSecure(true)` and `cookie.setHttpOnly(true)` before `response.addHttpCookie(cookie)`                                                                                         |
| `ocapi-demo-client-id`                                    | Replace the demo client ID `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` with a dedicated Account Manager client; remove it from OCAPI settings on every instance                                    |
| `ocapi-broad-access`                                      | Grant specific resources and methods; allow only your own HTTPS origins                                                                                                                 |
| `service-credential-password` / `preference-secret-value` | Remove the value from site data; set it per instance in Business Manager; rotate it                                                                                                     |
| `service-insecure-url`                                    | Use the service's `https://` endpoint                                                                                                                                                   |
| `service-communication-log`                               | Disable `comm-log-enabled` outside sandbox debugging; mask fields with `filterLogMessage`                                                                                               |
| `secret-attribute-not-password`                           | Change the attribute `<type>` to `password`                                                                                                                                             |
| `csrf-allowlist`                                          | Remove unneeded Business Manager CSRF exemptions; prefer single start nodes; no production user agents                                                                                  |
| `sfra-post-without-csrf`                                  | Add `csrfProtection.validateAjaxRequest`/`validateRequest`; for base routes, `server.extend(module.superModule)` then `server.prepend('Route', csrfProtection.validateAjaxRequest)`     |
| `sg-post-without-csrf`                                    | Add the `'csrf'` filter to `guard.ensure([...])` and the token field to the form                                                                                                        |
| `sfra-replace-drops-middleware`                           | Repeat `server.middleware.post`/`https`, login, and CSRF middleware in `server.replace()`, or use `server.append()`                                                                     |
| `get-mutates-state`                                       | Make the route POST with a CSRF check; don't store request input in a GET                                                                                                               |
| `mass-assignment`                                         | Assign expected fields by name, or check keys against an allowlist                                                                                                                      |
| `pii-in-logs`                                             | Log identifiers (customer or order number), not personal data                                                                                                                           |
| `dynamic-code`                                            | Replace `eval`/`new Function`; map known names to static `require()` calls                                                                                                              |

Re-run `b2c security scan --rule <rule-id> <file>` after a fix to confirm the finding is gone.

## Accept a finding

Only when the user agrees the code is safe, suppress it on the line with a comment that names the rule and gives a reason:

```js
// b2c-dx-disable-next-line open-redirect -- target checked by isAllowedRedirect()
res.redirect(target);
```

To adopt scanning on an existing codebase without fixing everything first, record current findings in a baseline (committed to the repo); later scans report only new findings:

```bash
b2c security baseline
b2c security scan
```

## CI

```bash
# Fail on high and critical findings; write SARIF for GitHub code scanning
b2c security scan --fail-on high --format sarif --output security.sarif
```

`--fail-on` (default `low`) sets the severity that makes the command exit with status 1; `--fail-on none` never fails. `--severity` hides findings below a level.
