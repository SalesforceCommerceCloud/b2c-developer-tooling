# eCDN Security Reference

WAF, firewall rules, rate limiting, and Page Shield commands for B2C eCDN.

## WAF (Web Application Firewall)

```bash
# list WAF v1 groups
b2c ecdn waf groups list --tenant-id zzxy_prd --zone my-zone

# update WAF v1 group mode
b2c ecdn waf groups update --tenant-id zzxy_prd --zone my-zone --group-id abc123 --mode on

# list WAF v1 rules in a group
b2c ecdn waf rules list --tenant-id zzxy_prd --zone my-zone --group-id abc123

# list WAF v2 rulesets
b2c ecdn waf rulesets list --tenant-id zzxy_prd --zone my-zone

# update WAF v2 ruleset
b2c ecdn waf rulesets update --tenant-id zzxy_prd --zone my-zone --ruleset-id abc123 --action block

# migrate zone to WAF v2
b2c ecdn waf migrate --tenant-id zzxy_prd --zone my-zone
```

## Firewall Rules

```bash
# list custom firewall rules
b2c ecdn firewall list --tenant-id zzxy_prd --zone my-zone

# create a firewall rule
b2c ecdn firewall create --tenant-id zzxy_prd --zone my-zone --description "Block bad bots" --action block --filter '(cf.client.bot)'

# update a firewall rule
b2c ecdn firewall update --tenant-id zzxy_prd --zone my-zone --rule-id abc123 --action challenge

# reorder firewall rules
b2c ecdn firewall reorder --tenant-id zzxy_prd --zone my-zone --rule-ids id1,id2,id3
```

## Rate Limiting

```bash
# list rate limiting rules
b2c ecdn rate-limit list --tenant-id zzxy_prd --zone my-zone

# create a rate limiting rule
b2c ecdn rate-limit create --tenant-id zzxy_prd --zone my-zone --description "API rate limit" --threshold 100 --period 60 --action block --match-url '/api/*'

# delete a rate limiting rule
b2c ecdn rate-limit delete --tenant-id zzxy_prd --zone my-zone --rule-id abc123
```

## Page Shield

```bash
# list Page Shield notification webhooks (organization level)
b2c ecdn page-shield notifications list --tenant-id zzxy_prd

# create a notification webhook
b2c ecdn page-shield notifications create --tenant-id zzxy_prd --url https://example.com/webhook --secret my-secret --zones zone1,zone2

# list Page Shield policies (zone level)
b2c ecdn page-shield policies list --tenant-id zzxy_prd --zone my-zone

# create a CSP policy
b2c ecdn page-shield policies create --tenant-id zzxy_prd --zone my-zone --action allow --value script-src

# list detected scripts
b2c ecdn page-shield scripts list --tenant-id zzxy_prd --zone my-zone
```
