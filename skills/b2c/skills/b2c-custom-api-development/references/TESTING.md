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

For Admin APIs (AmOAuth2), obtain a token from Account Manager:

```bash
AM_CLIENT_ID="your-am-client-id"
AM_CLIENT_SECRET="your-am-client-secret"

TOKEN=$(curl -s "https://account.demandware.com/dwsso/oauth2/access_token" \
    -u "$AM_CLIENT_ID:$AM_CLIENT_SECRET" \
    -d "grant_type=client_credentials" | jq -r '.access_token')

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
| 403 Forbidden | Missing scope | Verify scope in token matches contract |
| 404 Not Found | Endpoint not registered | Run `b2c scapi custom status` |
| 500 Internal Error | Script error | Check `b2c logs get --level ERROR` |
