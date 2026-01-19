---
description: Commands for managing eCDN (Enhanced Content Delivery Network) zones, certificates, security, WAF, and more.
---

# eCDN Commands

Commands for managing eCDN (Enhanced Content Delivery Network) for B2C Commerce storefronts.

## Global Flags

All eCDN commands support these flags:

| Flag | Description | Environment Variable |
|------|-------------|---------------------|
| `--tenant-id` | B2C Commerce tenant ID | `SFCC_TENANT_ID` |
| `--short-code` | API short code | `SFCC_SHORT_CODE` |
| `--json` | Output as JSON | - |

### Zone Selection

Commands that operate on a specific zone use the `--zone` / `-z` flag:

| Flag | Description |
|------|-------------|
| `--zone`, `-z` | Zone ID (32-char hex) or zone name |

Zone names are resolved to IDs automatically via case-insensitive lookup.

### Authentication

eCDN commands require OAuth authentication with these scopes:

| Operation Type | Required Scope |
|----------------|---------------|
| Read operations | `sfcc.cdn-zones` |
| Write operations | `sfcc.cdn-zones.rw` |

---

## Zone Management

### b2c ecdn zones list

List all CDN zones for a tenant.

```bash
b2c ecdn zones list --tenant-id zzxy_prd
```

#### Output

| Column | Description |
|--------|-------------|
| Name | Zone name |
| ID | Zone ID |
| Status | Zone status |
| Type | Zone type (storefront) |

---

### b2c ecdn zones create

Create a new storefront zone.

```bash
b2c ecdn zones create --tenant-id zzxy_prd --storefront-hostname www.example.com --origin-hostname origin.example.com
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--storefront-hostname` | Customer-facing hostname | Yes |
| `--origin-hostname` | Origin server hostname | Yes |

---

## Cache Management

### b2c ecdn cache purge

Purge cached content from the CDN.

```bash
# Purge by path
b2c ecdn cache purge --zone my-zone --path /products --path /categories

# Purge by cache tag
b2c ecdn cache purge --zone my-zone --tag product-123

# Purge everything
b2c ecdn cache purge --zone my-zone --purge-everything
```

#### Flags

| Flag | Description |
|------|-------------|
| `--path` | Path to purge (can be repeated) |
| `--tag` | Cache tag to purge (can be repeated) |
| `--host` | Host for path purging |
| `--purge-everything` | Purge all cached content |

At least one purge method must be specified.

---

### b2c ecdn cache ocapi-toggle

Toggle OCAPI caching page rule.

```bash
b2c ecdn cache ocapi-toggle --zone my-zone --enabled
b2c ecdn cache ocapi-toggle --zone my-zone --no-enabled
```

#### Flags

| Flag | Description |
|------|-------------|
| `--enabled` | Enable or disable OCAPI caching |

---

## Certificate Management

### b2c ecdn certificates list

List certificates for a zone.

```bash
b2c ecdn certificates list --zone my-zone
```

---

### b2c ecdn certificates add

Add a certificate to a zone.

```bash
b2c ecdn certificates add --zone my-zone --hostname www.example.com --certificate-file ./cert.pem --private-key-file ./key.pem
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--hostname` | Custom hostname | Yes |
| `--certificate-file` | Path to certificate PEM file | Yes |
| `--private-key-file` | Path to private key PEM file | Yes |

---

### b2c ecdn certificates get

Get certificate details.

```bash
b2c ecdn certificates get --zone my-zone --certificate-id abc123
```

---

### b2c ecdn certificates update

Update a certificate.

```bash
b2c ecdn certificates update --zone my-zone --certificate-id abc123 --certificate-file ./new-cert.pem --private-key-file ./new-key.pem
```

---

### b2c ecdn certificates delete

Delete a certificate.

```bash
b2c ecdn certificates delete --zone my-zone --certificate-id abc123
```

---

### b2c ecdn certificates validate

Validate a custom hostname certificate.

```bash
b2c ecdn certificates validate --zone my-zone --certificate-id abc123
```

---

## Security Settings

### b2c ecdn security get

Get security settings for a zone.

```bash
b2c ecdn security get --zone my-zone
```

#### Output

Displays settings including:
- SSL mode
- Always use HTTPS
- Minimum TLS version
- TLS 1.3 status
- Automatic HTTPS rewrites
- Opportunistic encryption

---

### b2c ecdn security update

Update security settings.

```bash
b2c ecdn security update --zone my-zone --ssl-mode full --min-tls-version 1.2 --always-use-https
```

#### Flags

| Flag | Description | Options |
|------|-------------|---------|
| `--ssl-mode` | SSL/TLS mode | `off`, `flexible`, `full`, `strict` |
| `--min-tls-version` | Minimum TLS version | `1.0`, `1.1`, `1.2`, `1.3` |
| `--always-use-https` / `--no-always-use-https` | Force HTTPS | - |
| `--tls-1-3` / `--no-tls-1-3` | Enable TLS 1.3 | - |
| `--automatic-https-rewrites` / `--no-automatic-https-rewrites` | Rewrite HTTP links | - |
| `--opportunistic-encryption` / `--no-opportunistic-encryption` | Enable opportunistic encryption | - |

---

## Speed Settings

### b2c ecdn speed get

Get speed optimization settings.

```bash
b2c ecdn speed get --zone my-zone
```

---

### b2c ecdn speed update

Update speed optimization settings.

```bash
b2c ecdn speed update --zone my-zone --browser-cache-ttl 14400 --auto-minify-html --auto-minify-css --auto-minify-js
```

#### Flags

| Flag | Description |
|------|-------------|
| `--browser-cache-ttl` | Browser cache TTL in seconds |
| `--auto-minify-html` / `--no-auto-minify-html` | Auto-minify HTML |
| `--auto-minify-css` / `--no-auto-minify-css` | Auto-minify CSS |
| `--auto-minify-js` / `--no-auto-minify-js` | Auto-minify JavaScript |
| `--brotli` / `--no-brotli` | Enable Brotli compression |
| `--early-hints` / `--no-early-hints` | Enable Early Hints |
| `--h2-prioritization` / `--no-h2-prioritization` | HTTP/2 prioritization |
| `--image-resizing` / `--no-image-resizing` | Enable image resizing |
| `--mirage` / `--no-mirage` | Enable Mirage |
| `--polish` | Polish mode (`off`, `lossless`, `lossy`) |
| `--prefetch-preload` / `--no-prefetch-preload` | Prefetch preload |
| `--rocket-loader` / `--no-rocket-loader` | Rocket Loader |

---

## WAF (Web Application Firewall)

### WAF v1 Commands

#### b2c ecdn waf groups list

List WAF v1 rule groups.

```bash
b2c ecdn waf groups list --zone my-zone
```

---

#### b2c ecdn waf groups update

Update a WAF v1 group.

```bash
b2c ecdn waf groups update --zone my-zone --group-id abc123 --mode on
```

| Flag | Description | Options |
|------|-------------|---------|
| `--mode` | Group mode | `on`, `off` |

---

#### b2c ecdn waf rules list

List WAF v1 rules in a group.

```bash
b2c ecdn waf rules list --zone my-zone --group-id abc123
```

---

#### b2c ecdn waf rules get

Get details of a WAF v1 rule.

```bash
b2c ecdn waf rules get --zone my-zone --rule-id abc123
```

---

#### b2c ecdn waf rules update

Update a WAF v1 rule.

```bash
b2c ecdn waf rules update --zone my-zone --rule-id abc123 --mode on
```

---

### WAF v2 Commands

#### b2c ecdn waf rulesets list

List WAF v2 rulesets.

```bash
b2c ecdn waf rulesets list --zone my-zone
```

---

#### b2c ecdn waf rulesets update

Update a WAF v2 ruleset.

```bash
b2c ecdn waf rulesets update --zone my-zone --ruleset-id abc123 --action block
```

---

#### b2c ecdn waf managed-rules list

List WAF v2 managed rules.

```bash
b2c ecdn waf managed-rules list --zone my-zone
```

---

#### b2c ecdn waf managed-rules update

Update a WAF v2 managed rule.

```bash
b2c ecdn waf managed-rules update --zone my-zone --rule-id abc123 --action block
```

---

### OWASP Settings

#### b2c ecdn waf owasp get

Get OWASP ModSecurity package settings.

```bash
b2c ecdn waf owasp get --zone my-zone
```

---

#### b2c ecdn waf owasp update

Update OWASP package settings.

```bash
b2c ecdn waf owasp update --zone my-zone --sensitivity high
```

---

### WAF Migration

#### b2c ecdn waf migrate

Migrate a zone from WAF v1 to WAF v2.

```bash
b2c ecdn waf migrate --zone my-zone
```

---

## Custom Firewall Rules

### b2c ecdn firewall list

List custom firewall rules.

```bash
b2c ecdn firewall list --zone my-zone
```

---

### b2c ecdn firewall create

Create a custom firewall rule.

```bash
b2c ecdn firewall create --zone my-zone --description "Block bad bots" --action block --filter '(cf.client.bot)'
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--description` | Rule description | Yes |
| `--action` | Rule action (`block`, `challenge`, `js_challenge`, `managed_challenge`, `allow`, `log`, `bypass`) | Yes |
| `--filter` | Firewall filter expression | Yes |
| `--paused` | Create rule in paused state | No |
| `--priority` | Rule priority | No |

---

### b2c ecdn firewall get

Get a firewall rule.

```bash
b2c ecdn firewall get --zone my-zone --rule-id abc123
```

---

### b2c ecdn firewall update

Update a firewall rule.

```bash
b2c ecdn firewall update --zone my-zone --rule-id abc123 --action challenge
```

---

### b2c ecdn firewall delete

Delete a firewall rule.

```bash
b2c ecdn firewall delete --zone my-zone --rule-id abc123
```

---

### b2c ecdn firewall reorder

Reorder firewall rules.

```bash
b2c ecdn firewall reorder --zone my-zone --rule-ids id1,id2,id3
```

---

## Rate Limiting

### b2c ecdn rate-limit list

List rate limiting rules.

```bash
b2c ecdn rate-limit list --zone my-zone
```

---

### b2c ecdn rate-limit create

Create a rate limiting rule.

```bash
b2c ecdn rate-limit create --zone my-zone --description "API rate limit" --threshold 100 --period 60 --action block --match-url '/api/*'
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--description` | Rule description | Yes |
| `--threshold` | Request threshold | Yes |
| `--period` | Period in seconds | Yes |
| `--action` | Action (`block`, `challenge`, `js_challenge`, `managed_challenge`, `log`, `simulate`) | Yes |
| `--match-url` | URL pattern to match | Yes |
| `--match-methods` | HTTP methods (comma-separated) | No |
| `--timeout` | Block timeout in seconds | No |

---

### b2c ecdn rate-limit get

Get a rate limiting rule.

```bash
b2c ecdn rate-limit get --zone my-zone --rule-id abc123
```

---

### b2c ecdn rate-limit update

Update a rate limiting rule.

```bash
b2c ecdn rate-limit update --zone my-zone --rule-id abc123 --threshold 200
```

---

### b2c ecdn rate-limit delete

Delete a rate limiting rule.

```bash
b2c ecdn rate-limit delete --zone my-zone --rule-id abc123
```

---

## Logpush

### b2c ecdn logpush ownership

Create a Logpush ownership challenge token for destination verification.

```bash
b2c ecdn logpush ownership --zone my-zone --destination-path 's3://my-bucket/logs?region=us-east-1'
```

---

### b2c ecdn logpush jobs list

List Logpush jobs.

```bash
b2c ecdn logpush jobs list --zone my-zone
```

---

### b2c ecdn logpush jobs create

Create a Logpush job.

```bash
b2c ecdn logpush jobs create --zone my-zone --name "HTTP logs" --destination-path 's3://my-bucket/logs?region=us-east-1' --log-type http_requests --log-fields ClientRequestHost,ClientRequestMethod
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--name` | Job name | Yes |
| `--destination-path` | Log destination path | Yes |
| `--log-type` | Type of logs (`http_requests`, `firewall_events`, `nel_reports`, `dns_logs`) | Yes |
| `--log-fields` | Comma-separated log fields | No |
| `--filter` | JSON filter expression | No |
| `--enabled` | Enable job on creation | No |

---

### b2c ecdn logpush jobs get

Get Logpush job details.

```bash
b2c ecdn logpush jobs get --zone my-zone --job-id 123456
```

---

### b2c ecdn logpush jobs update

Update a Logpush job.

```bash
b2c ecdn logpush jobs update --zone my-zone --job-id 123456 --enabled
b2c ecdn logpush jobs update --zone my-zone --job-id 123456 --no-enabled
```

---

### b2c ecdn logpush jobs delete

Delete a Logpush job.

```bash
b2c ecdn logpush jobs delete --zone my-zone --job-id 123456
```

---

## Page Shield

### Notifications (Organization Level)

#### b2c ecdn page-shield notifications list

List Page Shield notification webhooks.

```bash
b2c ecdn page-shield notifications list --tenant-id zzxy_prd
```

---

#### b2c ecdn page-shield notifications create

Create a notification webhook.

```bash
b2c ecdn page-shield notifications create --tenant-id zzxy_prd --url https://example.com/webhook --secret my-secret --zones zone1,zone2
```

---

#### b2c ecdn page-shield notifications delete

Delete a notification webhook.

```bash
b2c ecdn page-shield notifications delete --tenant-id zzxy_prd --webhook-id abc123
```

---

### Policies (Zone Level)

#### b2c ecdn page-shield policies list

List Page Shield policies.

```bash
b2c ecdn page-shield policies list --zone my-zone
```

---

#### b2c ecdn page-shield policies create

Create a Page Shield policy.

```bash
b2c ecdn page-shield policies create --zone my-zone --action allow --value script-src --expression 'http.request.uri.path contains "/trusted/"'
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--action` | Policy action (`allow`, `log`) | Yes |
| `--value` | Policy value (e.g., `script-src`) | Yes |
| `--expression` | Policy expression | No |
| `--description` | Policy description | No |
| `--enabled` | Enable policy | No |

---

#### b2c ecdn page-shield policies get

Get a Page Shield policy.

```bash
b2c ecdn page-shield policies get --zone my-zone --policy-id abc123
```

---

#### b2c ecdn page-shield policies update

Update a Page Shield policy.

```bash
b2c ecdn page-shield policies update --zone my-zone --policy-id abc123 --enabled
```

---

#### b2c ecdn page-shield policies delete

Delete a Page Shield policy.

```bash
b2c ecdn page-shield policies delete --zone my-zone --policy-id abc123
```

---

### Scripts (Zone Level)

#### b2c ecdn page-shield scripts list

List detected scripts.

```bash
b2c ecdn page-shield scripts list --zone my-zone
```

---

#### b2c ecdn page-shield scripts get

Get script details.

```bash
b2c ecdn page-shield scripts get --zone my-zone --script-id abc123
```

---

## MRT Rules

### b2c ecdn mrt-rules get

Get MRT ruleset for a zone.

```bash
b2c ecdn mrt-rules get --zone my-zone
```

---

### b2c ecdn mrt-rules create

Create MRT rules to route requests to a Managed Runtime environment.

```bash
b2c ecdn mrt-rules create --zone my-zone --mrt-hostname customer-pwa.mobify-storefront.com --expressions '(http.host eq "example.com")' --descriptions "Route to PWA"
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--mrt-hostname` | Managed Runtime instance hostname | Yes |
| `--expressions` | Comma-separated rule expressions | Yes |
| `--descriptions` | Comma-separated rule descriptions | No |

---

### b2c ecdn mrt-rules update

Update MRT ruleset hostname or add new rules.

```bash
b2c ecdn mrt-rules update --zone my-zone --mrt-hostname new-customer-pwa.mobify-storefront.com
```

---

### b2c ecdn mrt-rules delete

Delete an MRT ruleset and all rules.

```bash
b2c ecdn mrt-rules delete --zone my-zone
```

---

### Individual MRT Rules

#### b2c ecdn mrt-rules rules update

Update an individual MRT rule.

```bash
b2c ecdn mrt-rules rules update --zone my-zone --ruleset-id abc123 --rule-id def456 --enabled
```

---

#### b2c ecdn mrt-rules rules delete

Delete an individual MRT rule.

```bash
b2c ecdn mrt-rules rules delete --zone my-zone --ruleset-id abc123 --rule-id def456
```

---

## mTLS Certificates (Organization Level)

### b2c ecdn mtls list

List mTLS certificates.

```bash
b2c ecdn mtls list --tenant-id zzxy_prd
```

---

### b2c ecdn mtls create

Create an mTLS certificate for code upload authentication.

```bash
b2c ecdn mtls create --tenant-id zzxy_prd --name "Build Server" --ca-certificate-file ./ca.pem --leaf-certificate-file ./leaf.pem
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--name` | Certificate name | Yes |
| `--ca-certificate-file` | Path to CA certificate PEM | Yes |
| `--leaf-certificate-file` | Path to leaf certificate PEM | Yes |

---

### b2c ecdn mtls get

Get mTLS certificate details.

```bash
b2c ecdn mtls get --tenant-id zzxy_prd --certificate-id abc123
```

---

### b2c ecdn mtls delete

Delete an mTLS certificate.

```bash
b2c ecdn mtls delete --tenant-id zzxy_prd --certificate-id abc123
```

---

## Cipher Suites

### b2c ecdn cipher-suites get

Get cipher suites configuration.

```bash
b2c ecdn cipher-suites get --zone my-zone
```

---

### b2c ecdn cipher-suites update

Update cipher suites settings.

```bash
# Use a preset suite type
b2c ecdn cipher-suites update --zone my-zone --suite-type Modern

# Use custom ciphers
b2c ecdn cipher-suites update --zone my-zone --suite-type Custom --ciphers "ECDHE-ECDSA-AES128-GCM-SHA256,ECDHE-RSA-AES128-GCM-SHA256"
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--suite-type` | Cipher suite type (`Compatible`, `Modern`, `Custom`, `Legacy`) | Yes |
| `--ciphers` | Comma-separated cipher list (required for Custom) | Conditional |

---

## Origin Headers

### b2c ecdn origin-headers get

Get origin header modification settings (MRT type).

```bash
b2c ecdn origin-headers get --zone my-zone
```

---

### b2c ecdn origin-headers set

Set or update origin header modification.

```bash
b2c ecdn origin-headers set --zone my-zone --header-value my-secret-value
b2c ecdn origin-headers set --zone my-zone --header-value my-secret-value --header-name x-custom-header
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--header-value` | Value of the header to forward to origin | Yes |
| `--header-name` | Name of the header (cannot be changed for MRT origin) | No |

---

### b2c ecdn origin-headers delete

Delete origin header modification.

```bash
b2c ecdn origin-headers delete --zone my-zone
```
