# Testing Custom APIs

## Prerequisites for Testing

Before testing a Shopper API with custom scopes, ensure you have a SLAS client configured with those scopes:

```bash
# Create a test client with your custom scope (replace c_my_scope with your scope)
b2c slas client create \
  --tenant-id zzpq_013 \
  --channels RefArch \
  --default-scopes \
  --scopes "c_my_scope" \
  --redirect-uri http://localhost:3000/callback \
  --json

# Save the client_id and client_secret from the output
```

**Warning:** Use `--scopes` (plural) for client scopes, NOT `--scope` (singular).

See `b2c-cli:b2c-slas` skill for more options.

## Get a Shopper Token (Private Client)

> Illustrative SLAS token endpoint and grant flow; confirm current SLAS endpoint URLs, grant types, and parameter requirements with `b2c docs read commerce-api/custom-api-authentication`.

Using a private SLAS client with client credentials grant:

```bash
# Set your credentials
SHORTCODE="your-short-code" # see b2c-cli:b2c-config skill to find this value
ORG="f_ecom_xxxx_xxx"
SLAS_CLIENT_ID="your-client-id"
SLAS_CLIENT_SECRET="your-client-secret"
SITE="RefArch" # b2c-cli:b2c-sites skill to find site IDs

# Get access token
TOKEN=$(curl -s "https://$SHORTCODE.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/$ORG/oauth2/token" \
    -u "$SLAS_CLIENT_ID:$SLAS_CLIENT_SECRET" \
    -d "grant_type=client_credentials&channel_id=$SITE" | jq -r '.access_token')

echo $TOKEN
```

## Call Your Custom API

```bash
# Call the Custom API endpoint
curl -s "https://$SHORTCODE.api.commercecloud.salesforce.com/custom/my-api/v1/organizations/$ORG/my-endpoint?siteId=$SITE" \
    -H "Authorization: Bearer $TOKEN" | jq
```

## Testing Admin APIs

> Illustrative Account Manager OAuth scope requirements; confirm current Admin API authorization model, tenant scope format, and scope combination rules with `b2c docs read commerce-api/custom-api-authentication`.

For Admin APIs (`AmOAuth2`), obtain a token from Account Manager with the **two required scope types**:

1. The **tenant scope** `SALESFORCE_COMMERCE_API:<tenant_id>` (grants access to the tenant), and
2. Your **custom Admin scope(s)** `c_my_admin_scope` (as declared in `schema.yaml`).

> **Important:** Unlike the SCAPI subcommands (`b2c scapi custom status`, `b2c scapi schemas list`), which inject the `SALESFORCE_COMMERCE_API:<tenant_id>` scope for you, a raw token request (`b2c auth token` or curl) sends **only** the scopes you pass. Omitting the tenant scope yields a token that 403s against the Admin API.

### Get an Admin Token via the CLI (recommended)

`b2c auth token` accepts multiple scopes — repeat `--auth-scope` or pass a comma-separated list. List the tenant scope **and** your custom scope(s):

```bash
TENANT_ID="zzpq_013"

# Repeatable flag form
TOKEN=$(b2c auth token \
    --auth-scope "SALESFORCE_COMMERCE_API:$TENANT_ID" \
    --auth-scope c_my_admin_scope)

# Comma-separated form (equivalent)
TOKEN=$(b2c auth token --auth-scope "SALESFORCE_COMMERCE_API:$TENANT_ID,c_my_admin_scope")

# Call Admin API (no siteId for org context)
curl -s "https://$SHORTCODE.api.commercecloud.salesforce.com/custom/my-admin-api/v1/organizations/$ORG/my-endpoint" \
    -H "Authorization: Bearer $TOKEN" | jq
```

### Get an Admin Token via curl

```bash
AM_CLIENT_ID="your-am-client-id"
AM_CLIENT_SECRET="your-am-client-secret"
TENANT_ID="zzpq_013"

# The scope MUST include the tenant scope plus your custom Admin scope(s)
TOKEN=$(curl -s "https://account.demandware.com/dwsso/oauth2/access_token" \
    -u "$AM_CLIENT_ID:$AM_CLIENT_SECRET" \
    -d "grant_type=client_credentials" \
    --data-urlencode "scope=SALESFORCE_COMMERCE_API:$TENANT_ID c_my_admin_scope" | jq -r '.access_token')

# Call Admin API (no siteId)
curl -s "https://$SHORTCODE.api.commercecloud.salesforce.com/custom/my-admin-api/v1/organizations/$ORG/my-endpoint" \
    -H "Authorization: Bearer $TOKEN" | jq
```

## Testing Tips

- Use `b2c slas client list` to find existing SLAS clients
- Use `b2c slas client create --default-scopes --scopes "c_my_scope"` to create a test client
- Check logs with `b2c logs get` if requests fail
- Verify endpoint registration with `b2c scapi custom status --tenant-id <tenant>`

## Common Test Failures

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Missing or invalid parameter | Check schema.yaml parameter definitions |
| 401 Unauthorized | Invalid/expired token | Get a fresh token |
| 403 Forbidden | Missing scope | Verify scope in token matches contract. For Admin APIs, confirm the token includes **both** `SALESFORCE_COMMERCE_API:<tenant_id>` and your custom scope(s) |
| 404 Not Found | Endpoint not registered | Run `b2c scapi custom status` |
| 500 Internal Error | Script error | Check `b2c logs get --level ERROR` |
