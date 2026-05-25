---
description: Commands for managing eCDN (embedded Content Delivery Network) zones, certificates, security, WAF, and more.
---

# eCDN Commands

Commands for managing eCDN (embedded Content Delivery Network) for B2C Commerce storefronts.

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

For complete setup instructions, see the [Authentication Guide](/guide/authentication#scapi-authentication).

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

Create a new storefront CDN zone.

```bash
b2c ecdn zones create --tenant-id zzxy_prd --domain-name example.com
b2c ecdn zones create --tenant-id zzxy_prd --domain-name store.example.com --json
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--domain-name`, `-d` | Domain name for the storefront zone | Yes |

---

## Cache Management

### b2c ecdn cache purge

Purge cached content from the CDN by path or cache tag. At least one of `--path` or `--tag` must be supplied.

```bash
# Purge a single path (format: hostname/path)
b2c ecdn cache purge --zone my-zone --path "www.example.com/products"

# Purge by cache tag (repeatable)
b2c ecdn cache purge --zone my-zone --tag product-123 --tag category-456

# Wildcard path purge
b2c ecdn cache purge --zone my-zone --path "www.example.com/dw/image/v2/realm_instance/*" --json
```

#### Flags

| Flag | Description |
|------|-------------|
| `--path`, `-p` | Path to purge in `hostname/path` format |
| `--tag`, `-t` | Cache tag to purge (repeatable) |

---

## Rate Limiting

### b2c ecdn rate-limit list

List rate limiting rules for a zone.

```bash
b2c ecdn rate-limit list --zone my-zone
b2c ecdn rate-limit list --zone my-zone --extended
b2c ecdn rate-limit list --zone my-zone --json
```

---

### b2c ecdn rate-limit get

Get a single rate limiting rule by ID.

```bash
b2c ecdn rate-limit get --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e
b2c ecdn rate-limit get --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --json
```

---

### b2c ecdn rate-limit create

Create a rate limiting rule.

```bash
b2c ecdn rate-limit create --zone my-zone --description "Rate limit /checkout" --expression '(http.request.uri.path matches "^/checkout")' --characteristics cf.unique_visitor_id --action block --period 60 --requests-per-period 50 --mitigation-timeout 600
b2c ecdn rate-limit create --zone my-zone --description "Rate limit /checkout" --expression '(http.request.uri.path matches "^/checkout")' --characteristics cf.unique_visitor_id --action block --period 60 --requests-per-period 50 --mitigation-timeout 600 --json
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--description` | Rule description | Yes |
| `--expression` | Expression defining when to evaluate the rule | Yes |
| `--characteristics` | Comma-separated request grouping keys | Yes |
| `--action` | Mitigation action | Yes |
| `--period` | Rate window in seconds (`10`, `60`, `120`, `300`, `600`) | Yes |
| `--requests-per-period` | Max requests allowed within the period | Yes |
| `--mitigation-timeout` | Action duration in seconds (`0`, `60`, `120`, `300`, `600`, `3600`, `86400`) | Yes |
| `--counting-expression` | Optional expression for what requests to count | No |
| `--enabled` / `--no-enabled` | Enable/disable rule | No |
| `--position-before` | Insert before another rule ID | No |
| `--position-after` | Insert after another rule ID | No |

---

### b2c ecdn rate-limit update

Update fields of an existing rate limiting rule.

```bash
b2c ecdn rate-limit update --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --requests-per-period 100 --mitigation-timeout 120
b2c ecdn rate-limit update --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --action managed_challenge --no-enabled
b2c ecdn rate-limit update --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --requests-per-period 100 --mitigation-timeout 120 --json
```

---

### b2c ecdn rate-limit delete

Delete a rate limiting rule.

```bash
b2c ecdn rate-limit delete --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --force
b2c ecdn rate-limit delete --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --force --json
```

---

## Custom Firewall Rules

Manage custom firewall rules for a zone. Custom rules let you block,
challenge, log, or otherwise act on requests that match a Cloudflare-style
expression. Rules are evaluated in order and the order can be updated as a
whole through `reorder`.

### b2c ecdn firewall list

List custom firewall rules for a zone.

```bash
b2c ecdn firewall list --zone my-zone
b2c ecdn firewall list --zone my-zone --extended
b2c ecdn firewall list --zone my-zone --limit 50
b2c ecdn firewall list --zone my-zone --json
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--limit` | Maximum records per request (1–50) | No |
| `--offset` | Result offset for pagination | No |
| `--extended` | Include `Expression` and `Last Updated` columns (`Rule ID` is shown by default) | No |
| `--columns` | Comma-separated column names | No |

---

### b2c ecdn firewall get

Get a single custom firewall rule by ID.

```bash
b2c ecdn firewall get --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e
b2c ecdn firewall get --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --json
```

---

### b2c ecdn firewall create

Create a custom firewall rule.

```bash
b2c ecdn firewall create --zone my-zone --description "Block /admin" \
  --expression '(http.request.uri.path matches "^/admin")' --actions block

b2c ecdn firewall create --zone my-zone --description "Challenge bots" \
  --expression 'cf.threat_score gt 30' --actions managed_challenge --no-enabled

b2c ecdn firewall create --zone my-zone --description "Insert before existing" \
  --expression '(http.host eq "old.example.com")' --actions block \
  --before 2c0fc9fa937b11eaa1b71c4d701ab86e
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--description` | Rule description | Yes |
| `--expression` | Expression that determines when the rule applies | Yes |
| `--actions` | Comma-separated list of actions applied by the rule | Yes |
| `--enabled` / `--no-enabled` | Enable/disable rule (default `true`) | No |
| `--before` | Insert before another rule ID (mutually exclusive with `--after`) | No |
| `--after` | Insert after another rule ID (mutually exclusive with `--before`) | No |

---

### b2c ecdn firewall update

Update fields of an existing custom firewall rule. Provide at least one
update field; the command rejects empty patches so accidental no-op runs do
not look like successes.

```bash
b2c ecdn firewall update --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e \
  --description "Updated copy"

b2c ecdn firewall update --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e \
  --actions managed_challenge --no-enabled
```

---

### b2c ecdn firewall delete

Delete a custom firewall rule. Requires `--force` outside of `--json` mode.
Routes through the destructive-action safety guard so an in-flight policy
or confirmation prompt has the chance to intercept before any HTTP call.

```bash
b2c ecdn firewall delete --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --force
b2c ecdn firewall delete --zone my-zone --rule-id 2c0fc9fa937b11eaa1b71c4d701ab86e --force --json
```

---

### b2c ecdn firewall reorder

Update the evaluation order of all custom firewall rules. Provide either
`--rule-ids` (comma-separated, in the desired order) or `--rule-ids-file`
(path to a JSON file containing a string array). Reordering is treated as a
destructive action and so requires `--force` outside of `--json` mode.

```bash
b2c ecdn firewall reorder --zone my-zone \
  --rule-ids ffffe61cf25e4ec49c34b029ff3060f7,2c0fc9fa937b11eaa1b71c4d701ab86e --force

b2c ecdn firewall reorder --zone my-zone --rule-ids-file ./order.json --force
```

`order.json` example:

```json
["ffffe61cf25e4ec49c34b029ff3060f7", "2c0fc9fa937b11eaa1b71c4d701ab86e"]
```

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
- Security level
- Always-use-HTTPS state
- TLS 1.3 state
- WAF (OWASP) state
- HSTS configuration (enabled, include subdomains, max age, preload)

---

### b2c ecdn security update

Update security settings for a zone. Provide only the flags you want to change.

```bash
b2c ecdn security update --zone my-zone --security-level medium
b2c ecdn security update --zone my-zone --always-use-https
b2c ecdn security update --zone my-zone --tls13 --waf
```

#### Flags

| Flag | Description | Options |
|------|-------------|---------|
| `--security-level` | Zone security level | `off`, `essentially_off`, `low`, `medium`, `high`, `under_attack` |
| `--always-use-https` / `--no-always-use-https` | Redirect all HTTP requests to HTTPS | — |
| `--tls13` / `--no-tls13` | Enable TLS 1.3 | — |
| `--waf` / `--no-waf` | Enable WAF (OWASP) protection | — |
| `--hsts-enabled` / `--no-hsts-enabled` | Enable HSTS | — |
| `--hsts-include-subdomains` / `--no-hsts-include-subdomains` | Include subdomains in HSTS | — |
| `--hsts-max-age` | HSTS max age in seconds | integer |
| `--hsts-preload` / `--no-hsts-preload` | Enable HSTS preload | — |

---

## Speed Settings

### b2c ecdn speed get

Get speed optimization settings.

```bash
b2c ecdn speed get --zone my-zone
```

---

### b2c ecdn speed update

Update speed optimization settings. Each flag accepts a string value (typically `on`/`off`); omitted flags default to `off` in the request body.

```bash
b2c ecdn speed update --zone my-zone --brotli on
b2c ecdn speed update --zone my-zone --http3 on --early-hints on
b2c ecdn speed update --zone my-zone --polish lossy --webp on
```

#### Flags

| Flag | Description | Options |
|------|-------------|---------|
| `--brotli` | Brotli compression | `on`, `off` |
| `--http2-prioritization` | HTTP/2 prioritization | `on`, `off` |
| `--http2-to-origin` | HTTP/2 to origin | `on`, `off` |
| `--http3` | HTTP/3 | `on`, `off` |
| `--early-hints` | Early hints | `on`, `off` |
| `--webp` | WebP image format support | `on`, `off` |
| `--polish` | Image polish level | `off`, `lossless`, `lossy` |

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
b2c ecdn logpush jobs create --zone my-zone \
  --name "HTTP logs" \
  --destination-path 's3://my-bucket/logs/{DATE}?region=us-east-1' \
  --log-type http_requests \
  --log-fields ClientRequestHost,ClientRequestMethod
```

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--name` | Job name (immutable after creation) | Yes |
| `--destination-path` | Destination path, e.g. `s3://bucket/path/{DATE}?region=us-east-1` | Yes |
| `--log-type` | Type of logs: `http_requests`, `firewall_events`, `page_shield_events` | Yes |
| `--log-fields` | Comma-separated list of log fields to include | Yes |
| `--filter` | JSON filter expression for log selection | No |
| `--ownership-token` | Ownership challenge token for destination verification | No |

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
