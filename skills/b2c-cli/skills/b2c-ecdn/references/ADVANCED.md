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

Code upload certificates enable two-factor (mTLS) code upload to staging instances (`_stg` tenants only). Upload a CA certificate to eCDN, then issue client certificates (`.p12`) signed by that CA for each user or pipeline. The CA private key must be kept secret (treat like a password); the CA certificate bundle must have a maximum validity of 1 year and be renewed before expiry. On Hyperforce, use the `staging-<realm>-<customer>.demandware.net` code upload hostname (not legacy `cert.staging.*`).

For the complete workflow, security guidance, and renewal instructions, see [Deploying to Hyperforce: Code Upload Certificates](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/hyperforce#code-upload-certificates).

```bash
# interactive wizard: generate CA, upload, issue your client cert, update dw.json
b2c ecdn mtls setup

# non-interactive: generate CA + upload + issue first client cert
b2c ecdn mtls create --name code-upload --generate
b2c ecdn mtls create --name code-upload --generate --out-dir ./certs --client-name jsmith

# upload an existing CA
b2c ecdn mtls create --name code-upload --certificate-file ./ca.pem --private-key-file ./ca.key

# issue additional client certificates (local-only, no API call)
b2c ecdn mtls issue --ca-cert-file ./certs/ca.pem --ca-key-file ./certs/ca.key --name jane.doe
b2c ecdn mtls issue --ca-cert-file ca.pem --ca-key-file ca.key --name ci --output ci.p12 --days 90

# list uploaded CA certificates
b2c ecdn mtls list

# get certificate details
b2c ecdn mtls get --certificate-id abc123

# delete a CA certificate (uploaded CA stops accepting client certs)
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
