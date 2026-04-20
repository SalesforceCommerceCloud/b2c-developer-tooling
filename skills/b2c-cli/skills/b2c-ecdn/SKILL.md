---
name: b2c-ecdn
description: Manage eCDN zones, security settings, and edge configuration for B2C Commerce storefronts. Use this skill whenever the user needs to purge CDN cache, provision SSL certificates, configure WAF or firewall rules, set up rate limiting, enable logpush or Page Shield, manage MRT routing, configure mTLS or cipher suites, or optimize edge performance. Also use when troubleshooting CDN-layer issues or managing zone settings -- even if they just say 'clear the cache' or 'block bot traffic on our storefront'.
---

# B2C eCDN Skill

Use the `b2c` CLI plugin to manage eCDN (embedded Content Delivery Network) zones, certificates, security settings, and more.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli ecdn zones list`).

## Configuration

Values like `tenantId` resolve from `dw.json` / `SFCC_*` env vars / the active instance. Examples below show minimal usage; add flags only to override configured values. If a required value is missing, the CLI emits an actionable error pointing at the flag, env var, and config key. See the `b2c-config` skill for precedence details.

## Prerequisites

- OAuth credentials with `sfcc.cdn-zones` scope (read operations)
- OAuth credentials with `sfcc.cdn-zones.rw` scope (write operations)
- Tenant ID for your B2C Commerce organization (from config or `--tenant-id`)

## Examples

### List CDN Zones

```bash
# list all CDN zones for the configured tenant
b2c ecdn zones list

# JSON output
b2c ecdn zones list --json

# target a different tenant than the active config
b2c ecdn zones list --tenant-id zzxy_prd
```

### Create a Storefront Zone

```bash
# create a new storefront zone
b2c ecdn zones create --domain-name example.com
```

### Purge Cache

```bash
# purge cache for specific paths
b2c ecdn cache purge --zone my-zone --path /products --path /categories

# purge by cache tags
b2c ecdn cache purge --zone my-zone --tag product-123 --tag category-456
```

### Manage Certificates

```bash
# list certificates for a zone
b2c ecdn certificates list --zone my-zone

# add a new certificate
b2c ecdn certificates add --zone my-zone --hostname www.example.com --certificate-file ./cert.pem --private-key-file ./key.pem

# validate a custom hostname
b2c ecdn certificates validate --zone my-zone --certificate-id abc123
```

### Security Settings

```bash
# get security settings
b2c ecdn security get --zone my-zone

# update security settings
b2c ecdn security update --zone my-zone --ssl-mode full --min-tls-version 1.2 --always-use-https
```

### Speed Settings

```bash
# get speed optimization settings
b2c ecdn speed get --zone my-zone

# update speed settings
b2c ecdn speed update --zone my-zone --browser-cache-ttl 14400 --auto-minify-html --auto-minify-css
```

## Additional Topics

For less commonly used eCDN features, see the reference files:

- **[SECURITY.md](references/SECURITY.md)** — WAF (v1 and v2), custom firewall rules, rate limiting, and Page Shield (CSP policies, script detection, notification webhooks)
- **[ADVANCED.md](references/ADVANCED.md)** — Logpush jobs, MRT routing rules, mTLS certificates, cipher suite configuration, and origin header modification

## Configuration Overrides

The tenant ID can be overridden via flag or environment variable:

- `--tenant-id` / `SFCC_TENANT_ID` / `tenantId` in dw.json

The `--zone` flag accepts either:

- Zone ID (32-character hex string)
- Zone name (human-readable, case-insensitive lookup)

### OAuth Scopes

| Operation | Required Scope |
|-----------|---------------|
| Read operations | `sfcc.cdn-zones` |
| Write operations | `sfcc.cdn-zones.rw` |

### More Commands

See `b2c ecdn --help` for a full list of available commands and options in the `ecdn` topic.
