# Configure your instance

Pick how you want to store your B2C Commerce credentials. **Secure storage is recommended** for shared and CI machines; a workspace `dw.json` is fine for personal sandboxes when you commit it to `.gitignore`.

> Click **Choose credential storage** above to get a guided picker — or read the options below first.

## Your options

### 1 · macOS Keychain *(recommended on Mac)*

Stores credentials encrypted in the OS Keychain via the documented [`b2c-plugin-macos-keychain`](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/third-party-plugins.html#macos-keychain-plugin). Install once:

```bash
b2c plugins install sfcc-solutions-share/b2c-plugin-macos-keychain
```

Then store credentials with the standard macOS `security` tool:

```bash
# Global OAuth credentials (shared across all instances)
security add-generic-password -s 'b2c-cli' -a '*' \
  -w '{"clientId":"YOUR_CLIENT_ID","clientSecret":"YOUR_CLIENT_SECRET","defaultInstance":"dev"}' -U

# Instance-specific WebDAV credentials
security add-generic-password -s 'b2c-cli' -a 'dev' \
  -w '{"username":"you@example.com","password":"YOUR_WEBDAV_KEY"}' -U
```

Tunable via `SFCC_KEYCHAIN_SERVICE` (default `b2c-cli`) and `SFCC_KEYCHAIN_INSTANCE` (fallback instance name).

### 2 · Password Store *(cross-platform — macOS / Linux / WSL)*

GPG-encrypted via the Unix [`pass`](https://www.passwordstore.org/) tool, surfaced through [`b2c-plugin-password-store`](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/third-party-plugins.html#password-store-plugin):

```bash
b2c plugins install sfcc-solutions-share/b2c-plugin-password-store
pass init "your-gpg-key-id"   # one-time
pass insert -m b2c-cli/_default
```

Inside the multi-line entry: shared secret on the first line, then `clientId:`, `clientSecret:`, `defaultInstance:` key/value lines. Instance-specific entries live at `b2c-cli/<instance>`. Override the prefix with `SFCC_PASS_PREFIX`.

### 3 · `dw.json`

Drop a file at your workspace root. Quickest path; least secure when shared.

```json
{
  "hostname": "abcd-123.dx.commercecloud.salesforce.com",
  "code-version": "version1",
  "client-id": "your-oauth-client-id",
  "client-secret": "your-oauth-client-secret",
  "username": "your-webdav-username",
  "password": "your-access-key"
}
```

| Field | What it's for |
|---|---|
| `hostname` | Your sandbox/instance hostname (no `https://`). |
| `client-id` / `client-secret` | OAuth — required for Sandbox Explorer, API Browser, SCAPI/OCAPI. |
| `username` / `password` | Basic auth — required for WebDAV and cartridge deploy. |
| `code-version` | Default code version targeted by deploys. |

> Both kebab-case (`client-id`) and camelCase (`clientId`) are accepted. The docs site uses kebab-case; pick one and stay consistent.

#### Multiple instances

Use a `configs` array — each entry is a named instance. Set `"active": true` on your default; override per-command with `--instance`.

```json
{
  "configs": [
    {"name": "dev", "active": true, "hostname": "dev01-acme.demandware.net", "client-id": "...", "client-secret": "...", "username": "dev@acme.com", "password": "..."},
    {"name": "staging", "hostname": "staging-acme.demandware.net", "client-id": "...", "client-secret": "...", "username": "dev@acme.com", "password": "..."}
  ]
}
```

The status bar shows the active instance — click it to switch.

**Always `.gitignore` it.** The "Create dw.json" action will offer to add this for you.

```gitignore
# B2C Commerce credentials
dw.json
```

### 4 · Environment variables *(any source can be overridden)*

Useful for CI and one-off shell sessions. Env vars take precedence over `dw.json` for matching fields:

```bash
export SFCC_CLIENT_ID=...
export SFCC_CLIENT_SECRET=...
export SFCC_USERNAME=...
export SFCC_PASSWORD=...
```

Other documented variables: `SFCC_SERVER`, `SFCC_AUTH_METHODS`, `SFCC_CERTIFICATE`, `SFCC_CERTIFICATE_PASSPHRASE`, `SFCC_OAUTH_SCOPES`, `SFCC_SHORTCODE`, `SFCC_TENANT_ID`, `SFCC_ACCOUNT_MANAGER_HOST`.

## How sources merge

Resolution precedence (highest first):

1. CLI flags & environment variables
2. Plugin sources (high priority — Keychain, Password Store, IntelliJ Config)
3. `dw.json`
4. `~/.mobify`
5. Plugin sources (low priority)
6. `package.json`

**Credential Grouping.** If one half of an OAuth pair (e.g. `client-id`) comes from a higher-priority source, the matching `client-secret` from a lower source is ignored. Set both halves in the same source.

## Already have credentials?

Pick **"I already have credentials stored"** in the chooser. The walkthrough step ticks done and you move on.

[Full configuration reference](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html) · [Third-party plugins](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/third-party-plugins.html)
