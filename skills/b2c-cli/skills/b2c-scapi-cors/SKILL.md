---
name: b2c-scapi-cors
description: Manage CORS (Cross-Origin Resource Sharing) preferences for B2C Commerce sites using the b2c CLI. Use when getting, setting, or deleting CORS configurations, managing allowed origins for API clients, or configuring cross-domain access for SCAPI.
---

# B2C SCAPI CORS Skill

Use the `b2c` CLI to manage CORS preferences for B2C Commerce sites via the SCAPI CORS Preferences API.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead.

## Required Configuration

All SCAPI CORS commands require:

- `--tenant-id` — your B2C Commerce tenant ID (e.g., `zzxy_prd`)
- `--site-id` — the site to manage CORS for (e.g., `RefArch`)
- `--client-id` — (for `set`) the Account Manager client ID to configure origins for; also used as the OAuth credential

These can be provided via flags or environment variables:

```bash
export SFCC_TENANT_ID=zzxy_prd
export SFCC_SHORTCODE=kv7kzm78
export SFCC_CLIENT_ID=my-client-id
export SFCC_CLIENT_SECRET=my-secret
export SFCC_SITE_ID=RefArch
```

## Examples

### Get CORS Preferences

```bash
# get CORS preferences for a site
b2c scapi cors get --tenant-id zzxy_prd --site-id RefArch

# output as JSON
b2c scapi cors get --tenant-id zzxy_prd --site-id RefArch --json
```

### Set CORS Preferences

```bash
# set allowed origins for a client
b2c scapi cors set --tenant-id zzxy_prd --site-id RefArch --client-id my-client-id \
  --origins http://foo.com,https://bar.com

# enable CORS for known domains only (no custom origins)
b2c scapi cors set --tenant-id zzxy_prd --site-id RefArch --client-id my-client-id --origins ""

# output result as JSON
b2c scapi cors set --tenant-id zzxy_prd --site-id RefArch --client-id my-client-id \
  --origins http://foo.com --json
```

### Delete CORS Preferences

```bash
# delete all CORS preferences for a site
b2c scapi cors delete --tenant-id zzxy_prd --site-id RefArch

# output as JSON
b2c scapi cors delete --tenant-id zzxy_prd --site-id RefArch --json
```

## Origin Format

Origins must follow `<scheme>://<domain>.<tld>` — no ports or paths:

- ✅ `http://foo.com`
- ✅ `https://bar.baz.com`
- ✅ `myapp://example.com`
- ❌ `http://foo.com:8080` (port not allowed)
- ❌ `http://foo.com/path` (path not allowed)

## Notes

- `scapi cors set` is a **full replacement** — all existing preferences for the site are overwritten.
- An empty `--origins ""` enables CORS without custom origins; all known domain aliases for the site are still included automatically.
- The client ID passed to `--client-id` must match the OAuth credential used to authenticate (same client).
- `site-id` must be between 1 and 32 characters.

## More Commands

See `b2c scapi cors --help` for a full list of commands and options.
