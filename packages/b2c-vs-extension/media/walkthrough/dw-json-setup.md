# Configure your instance

The B2C tooling reads config from layered sources. **Different fields belong in different places.** The walkthrough's *Run setup wizard* asks you, pair by pair, where each value should live.

## What goes where

| Field | Sensitive? | Recommended home |
|---|---|---|
| `hostname` | No | `dw.json` |
| `code-version` | No | `dw.json` |
| `short-code`, `tenant-id`, `oauth-scopes` | No | `dw.json` (when SCAPI is enabled) |
| `mrtProject`, `mrtEnvironment` | No | `dw.json` |
| `client-id` | Identifier (not sensitive) | Same source as `client-secret` (Credential Grouping) |
| `client-secret` | **Yes** | Keychain / Password Store / `SFCC_CLIENT_SECRET` |
| `username` | Identifier | Same source as `password` |
| `password` | **Yes** (WebDAV access key) | Keychain / Password Store / `SFCC_PASSWORD` |
| MRT API key | **Yes** | `b2c mrt save-credentials` (writes `~/.mobify`) or `MRT_API_KEY` env var |
| `certificate`, `certificate-passphrase` | **Yes** (mTLS) | Env vars only |

> **Credential Grouping.** If one half of an OAuth or Basic-auth pair comes from a higher-priority source, the matching half from a lower source is **ignored**. The wizard enforces this by asking pair-by-pair.

## Auth flows you can mix and match

Different jobs need different fields. The wizard lets you enable any combination:

- **OAuth** — `client-id` + `client-secret`. Required for Sandbox Explorer, OCAPI / SCAPI, and CI jobs.
- **Basic** — `username` + `password`. Required for WebDAV and cartridge deploys.
- **SCAPI extras** — `short-code` + `tenant-id` + optional `oauth-scopes`. Required by the API Browser.
- **MRT (Managed Runtime)** — `mrtProject` + `mrtEnvironment` (in `dw.json`) + `MRT_API_KEY` (in `~/.mobify` or env var).

## Resolution precedence

Highest first — the first source that supplies a value wins for that field:

1. CLI flags & environment variables
2. Plugin sources at high priority (Keychain, Password Store, IntelliJ Config)
3. `dw.json`
4. `~/.mobify`
5. Plugin sources at low priority
6. `package.json`

So **environment variables always override `dw.json`** for the same field — useful for CI overrides without touching the file.

## Inspecting what actually resolved

Run **B2C DX - Getting Started: Inspect Resolved Config (b2c setup inspect)** any time. It prints every resolved field with its source: `dw.json`, `env (SFCC_CLIENT_SECRET)`, `keychain (b2c-cli/dev)`, etc. Add `--unmask` to show secret values too.

## Single vs. multi-instance dw.json

The wizard always writes a `configs[]` array, even for a single instance — that lets you add a second entry later without reshaping the file:

```json
{
  "configs": [
    {
      "name": "dev",
      "active": true,
      "hostname": "abcd-123.dx.commercecloud.salesforce.com",
      "code-version": "version1",
      "short-code": "kv7kzm78",
      "tenant-id": "zzrf_001"
    }
  ]
}
```

Switch the active instance from the status bar (click the `$(cloud)` item) or via `b2c setup instance set-active <name>`.

## .gitignore

The wizard appends `dw.json` to your workspace `.gitignore` automatically. Even if every secret lives outside the file, `dw.json` can still expose hostnames and tenant IDs.

[Full configuration reference](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html) · [Third-party plugins](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/third-party-plugins.html) · [`b2c setup inspect`](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/setup.html)
