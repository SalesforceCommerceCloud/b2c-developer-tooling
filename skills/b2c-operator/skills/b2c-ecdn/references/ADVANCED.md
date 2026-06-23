# eCDN Advanced Reference

Logpush, MRT rules, mTLS, cipher suites, and origin header commands for B2C eCDN.

> `tenantId` resolves from `dw.json` / `SFCC_TENANT_ID`. Add `--tenant-id` only to override the active config.

## Logpush

```bash
# create ownership challenge for S3 destination
b2c ecdn logpush ownership --zone my-zone --destination-path 's3://my-bucket/logs?region=us-east-1'

# list logpush jobs
b2c ecdn logpush jobs list --zone my-zone

# create a logpush job
b2c ecdn logpush jobs create --zone my-zone --name "HTTP logs" --destination-path 's3://my-bucket/logs?region=us-east-1' --log-type http_requests

# update a logpush job (enable/disable)
b2c ecdn logpush jobs update --zone my-zone --job-id 123456 --enabled

# delete a logpush job
b2c ecdn logpush jobs delete --zone my-zone --job-id 123456
```

## MRT Rules

```bash
# get MRT ruleset for a zone
b2c ecdn mrt-rules get --zone my-zone

# create MRT rules to route to a Managed Runtime environment
b2c ecdn mrt-rules create --zone my-zone --mrt-hostname customer-pwa.mobify-storefront.com --expressions '(http.host eq "example.com")'

# update MRT ruleset hostname
b2c ecdn mrt-rules update --zone my-zone --mrt-hostname new-customer-pwa.mobify-storefront.com

# delete MRT ruleset
b2c ecdn mrt-rules delete --zone my-zone
```

## mTLS Certificates

```bash
# list mTLS certificates (organization level)
b2c ecdn mtls list

# create mTLS certificate for code upload authentication
b2c ecdn mtls create --name "Build Server" --ca-certificate-file ./ca.pem --leaf-certificate-file ./leaf.pem

# get mTLS certificate details
b2c ecdn mtls get --certificate-id abc123

# delete mTLS certificate
b2c ecdn mtls delete --certificate-id abc123
```

## Cipher Suites

```bash
# get cipher suites configuration
b2c ecdn cipher-suites get --zone my-zone

# update to Modern cipher suite
b2c ecdn cipher-suites update --zone my-zone --suite-type Modern

# update to Custom cipher suite with specific ciphers
b2c ecdn cipher-suites update --zone my-zone --suite-type Custom --ciphers "ECDHE-ECDSA-AES128-GCM-SHA256,ECDHE-RSA-AES128-GCM-SHA256"
```

## Origin Headers

```bash
# get origin header modification
b2c ecdn origin-headers get --zone my-zone

# set origin header modification (for MRT)
b2c ecdn origin-headers set --zone my-zone --header-value my-secret-value

# delete origin header modification
b2c ecdn origin-headers delete --zone my-zone
```
