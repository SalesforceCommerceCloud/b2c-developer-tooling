# Set Up OAuth Credentials

OAuth credentials unlock features that talk to Account Manager and SCAPI: **Sandbox Explorer**, **API Browser**, **Code Versions**, and most CLI/CI flows. WebDAV and basic cartridge deploys do *not* need OAuth.

> **Optional.** Skip this step if you only need WebDAV browsing or cartridge deploys via username/password.

## What you need in `dw.json`

The wizard adds these fields to your active config — names use **kebab-case**, the same as the SDK reads:

```json
{
  "configs": [
    {
      "name": "dev",
      "active": true,
      "hostname": "your-sandbox.dx.commercecloud.salesforce.com",
      "code-version": "version1",
      "client-id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "client-secret": "<keep out of dw.json — see below>",
      "short-code": "kv7kzm78",
      "tenant-id": "zzrf_001"
    }
  ]
}
```

`client-id` is an identifier (not sensitive). `client-secret` is sensitive — pick where it should live when the wizard prompts you (Keychain, `pass`, `SFCC_CLIENT_SECRET` env var, or `dw.json`). Same source as `client-id` per the **Credential Grouping** rule.

## Getting the credentials

1. Open [Account Manager](https://account.demandware.com/) and go to **API Client**.
2. Click **Add API Client** and grant the scopes you need:
   - `sfcc.sandboxes.rw` — Sandbox Explorer
   - `sfcc.code-versions` (rw) — code-version management
   - `sfcc.shopper-*` — only if the same client is also used for SCAPI calls. Pinning these scopes will break Sandbox Explorer if the AM client is **not** registered for them, so leave `oauth-scopes` blank in the SCAPI step unless you know your client supports them.
3. Save and copy the **Client ID** and **Client Secret** immediately — the secret is shown only once.
4. Run the **Set up OAuth** action above (or **B2C DX - Getting Started: Setup · OAuth Credentials** from the Command Palette). The wizard writes `client-id` and the secret to your chosen sources, targeting the **active** config in `dw.json`.

## Verify

- Run **Inspect Resolved Config** above — it shows whether `client-id` and `client-secret` resolved, and from which source.
- Open the **Realm Explorer** (B2C-DX Sandboxes activity bar). If OAuth is wired up correctly the realm loads and lists your sandboxes.

## What OAuth unlocks

- **Sandbox Explorer** — create, start, stop, restart, extend, and delete sandboxes; open Business Manager.
- **API Browser** — browse SCAPI OpenAPI specs (also needs `short-code` + `tenant-id` from the SCAPI step).
- **Code Versions** — list, create, and activate code versions from the Cartridges view.

[Full OAuth + scopes reference](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html#oauth) · [`b2c setup inspect`](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/setup.html)
