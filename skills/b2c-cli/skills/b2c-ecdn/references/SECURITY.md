# eCDN Security Reference

WAF, firewall rules, rate limiting, and Page Shield commands for B2C eCDN.

> `tenantId` resolves from `dw.json` / `SFCC_TENANT_ID`. Add `--tenant-id` only to override the active config.

## WAF (Web Application Firewall)

```bash
# list WAF v1 groups
b2c ecdn waf groups list --zone my-zone

# update WAF v1 group mode
b2c ecdn waf groups update --zone my-zone --group-id abc123 --mode on

# list WAF v1 rules in a group
b2c ecdn waf rules list --zone my-zone --group-id abc123

# list WAF v2 rulesets
b2c ecdn waf rulesets list --zone my-zone

# update WAF v2 ruleset
b2c ecdn waf rulesets update --zone my-zone --ruleset-id abc123 --action block

# migrate zone to WAF v2
b2c ecdn waf migrate --zone my-zone
```

## Firewall Rules

```bash
# list custom firewall rules
b2c ecdn firewall list --zone my-zone

# create a firewall rule
b2c ecdn firewall create --zone my-zone --description "Block bad bots" --expression '(cf.client.bot)' --actions block

# update a firewall rule
b2c ecdn firewall update --zone my-zone --rule-id abc123 --actions managed_challenge

# reorder firewall rules
b2c ecdn firewall reorder --zone my-zone --rule-ids id1,id2,id3
```

## Rate Limiting

```bash
# list rate limiting rules
b2c ecdn rate-limit list --zone my-zone

# create a rate limiting rule
b2c ecdn rate-limit create --zone my-zone --description "API rate limit" --expression '(http.request.uri.path matches "^/api/")' --characteristics cf.unique_visitor_id --action block --period 60 --requests-per-period 100 --mitigation-timeout 600

# delete a rate limiting rule
b2c ecdn rate-limit delete --zone my-zone --rule-id abc123
```

## Page Shield

```bash
# list Page Shield notification webhooks (organization level)
b2c ecdn page-shield notifications list

# create a notification webhook
b2c ecdn page-shield notifications create --webhook-url https://example.com/webhook --secret my-secret --zones zone1,zone2

# list Page Shield policies (zone level)
b2c ecdn page-shield policies list --zone my-zone

# create a CSP policy
b2c ecdn page-shield policies create --zone my-zone --action allow --value script-src

# list detected scripts
b2c ecdn page-shield scripts list --zone my-zone
```
