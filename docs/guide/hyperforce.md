---
description: Deploy code to B2C Commerce on Hyperforce — what changes for staging code upload, migrating from cert.staging, and setting up two-factor (mTLS) code upload certificates with the CLI.
---

# Deploying to Hyperforce

Most deployment workflows work the same on Hyperforce. The main difference is two-factor (mTLS) code upload to **staging** instances, which uses client certificates signed by a certificate authority (CA) that you register with eCDN.

## What Changes on Hyperforce

- Code upload uses the standard staging hostname (`staging-<realm>-<customer>.demandware.net`). The separate `cert.staging.<realm>.<customer>.demandware.net` hostname is deactivated.
- You provide the CA for client certificates and register it with eCDN yourself. Salesforce no longer provides a CA bundle.
- Only code upload needs a client certificate. Regular Business Manager use doesn't.
- The CA certificate has a maximum expiry of 1 year and must be renewed before it expires.

## Migrating from cert.staging

You can set up your CA ahead of the migration. Until your realm is migrated, keep using your existing client certificates with the `cert.staging` hostname. After the migration, switch to the new client certificates and the staging hostname in `dw.json` and CI.

## Code Upload Certificates

The CLI generates your CA, uploads it to eCDN, and issues a client certificate (`.p12`) for each user or CI pipeline. The CA only signs client certificates and is never used to connect.

| Command | What it does |
|---------|--------------|
| [`b2c ecdn mtls setup`](/cli/ecdn#b2c-ecdn-mtls-setup) | Interactive wizard: generate and upload a CA, issue your client certificate, and update `dw.json` |
| [`b2c ecdn mtls create --generate`](/cli/ecdn#b2c-ecdn-mtls-create) | The same, non-interactively |
| [`b2c ecdn mtls issue`](/cli/ecdn#b2c-ecdn-mtls-issue) | Issue another client certificate from an existing CA (runs locally) |
| [`b2c ecdn mtls list`](/cli/ecdn#b2c-ecdn-mtls-list) / [`get`](/cli/ecdn#b2c-ecdn-mtls-get) / [`delete`](/cli/ecdn#b2c-ecdn-mtls-delete) | Inspect and remove uploaded CAs |

### Prerequisites

- A staging tenant (tenant ID ending in `_stg`, for example `zzxy_stg`).
- An API client with the `sfcc.cdn-zones.rw` scope, and the SCAPI short code and tenant ID configured. See [SCAPI Authentication](/guide/authentication#scapi-authentication).
- Your staging hostname (starting with `staging-`) in the staging Business Manager eCDN zone.

### Quick Start

Run the wizard from your project directory (where `dw.json` lives):

```bash
b2c ecdn mtls setup --tenant-id zzxy_stg
```

The wizard asks for a certificate name, your client certificate name (default: your Business Manager username), and an output directory (default: `./mtls-certs`). It then:

1. Generates a CA valid for 1 year and uploads it.
2. Issues your client certificate (`<name>.p12`) with a random passphrase.
3. Offers to update `dw.json` with the client certificate path and passphrase.

Then deploy as usual:

```bash
b2c code deploy
```

#### Non-Interactive

For scripts, use `create --generate`. It performs the same steps and prints the `dw.json` settings instead of editing the file. Add `--json` for machine-readable output.

```bash
b2c ecdn mtls create --tenant-id zzxy_stg --name code-upload --generate \
  --out-dir ./mtls-certs --client-name jsmith
```

#### Generated Files

| File | Purpose |
|------|---------|
| `ca.pem` | CA certificate (uploaded to eCDN) |
| `ca.key` | CA private key, used to issue client certificates |
| `<client>.p12` | Client certificate used for code upload |
| `.gitignore` | Keeps the directory out of source control |

Files are written with owner-only permissions. Existing files are only overwritten if you pass `--force`.

### Protect the CA Private Key

::: danger Treat the CA private key like a password
Anyone with `ca.key` can issue client certificates that your staging instance trusts for code upload.

- Move `ca.key` and `ca.pem` to a secure location, such as a password manager or secrets vault. You only need them to issue new client certificates.
- Never commit the CA key, `.p12` files, or passphrases to a source repository.
- Don't share the CA. Give each user or pipeline its own client certificate instead.
:::

### Issue Client Certificates

Issue a certificate for another developer or a CI pipeline from the existing CA:

```bash
b2c ecdn mtls issue --ca-cert-file ./mtls-certs/ca.pem --ca-key-file ./mtls-certs/ca.key --name jsmith
```

Name the certificate after the Business Manager username or API client ID that will use it. The `.p12` is written next to the CA unless you set `--output`. A random passphrase is generated unless you set `--p12-passphrase`. Client certificates are valid for 365 days (`--days`), and never past the CA's expiry.

Send the `.p12` and its passphrase to the user separately.

### Configure the CLI

Point the CLI at your `.p12` and its passphrase. Code upload uses the same staging hostname as everything else, so no separate `webdav-hostname` is needed. Use whichever option fits:

::: code-group

```json [dw.json]
{
  "hostname": "staging-abcd-acme.demandware.net",
  "client-id": "your-client-id",
  "client-secret": "your-client-secret",
  "certificate": "/Users/jsmith/projects/acme/mtls-certs/jsmith.p12",
  "certificate-passphrase": "the-generated-passphrase"
}
```

```bash [Flags]
b2c code deploy --server staging-abcd-acme.demandware.net \
  --certificate ./mtls-certs/jsmith.p12 \
  --passphrase 'the-generated-passphrase'
```

```bash [Environment variables]
export SFCC_SERVER=staging-abcd-acme.demandware.net
export SFCC_CERTIFICATE=./mtls-certs/jsmith.p12
export SFCC_CERTIFICATE_PASSPHRASE='the-generated-passphrase'

b2c code deploy
```

:::

Use an absolute path in `dw.json`; relative paths are resolved from the directory you run the CLI in. `setup` updates `dw.json` for you; `create --generate` and `issue` print the settings to add. Flags and environment variables override `dw.json`. See [Two-Factor Authentication (mTLS)](/guide/configuration#two-factor-authentication-mtls) for details.

::: warning
If `dw.json` holds the passphrase, make sure `dw.json` is not committed to your repository.
:::

To check the certificate works, list the cartridges directory over WebDAV:

```bash
b2c webdav ls --root cartridges
```

The `.p12` files also work with UX Studio, the VS Code extension, and WebDAV clients such as Cyberduck.

### Renew Before Expiry

The CA certificate is valid for at most 1 year. Renew it before it expires to avoid disruption with code uploads. Follow the same steps if the CA key or a client certificate is compromised:

1. Create a new CA with `b2c ecdn mtls setup` or `b2c ecdn mtls create --generate`. Several CAs can be active at once, so existing client certificates keep working.
2. Re-issue each user's and pipeline's `.p12` from the new CA with `b2c ecdn mtls issue`.
3. After confirming uploads work, delete the old CA:

   ```bash
   b2c ecdn mtls list --tenant-id zzxy_stg
   b2c ecdn mtls delete --tenant-id zzxy_stg --certificate-id <old-certificate-id>
   ```

### Bring Your Own CA

To use a CA from your organization, upload it with `--certificate-file` and `--private-key-file` instead of `--generate`:

```bash
b2c ecdn mtls create --tenant-id zzxy_stg --name code-upload \
  --certificate-file ./ca.pem --private-key-file ./ca.key
```

The certificate must be a CA certificate valid for at most 1 year. You can issue client certificates from it with `b2c ecdn mtls issue`.

For manual OpenSSL instructions, see the Salesforce Help article [B2C Commerce Hyperforce Code Upload Instructions for Staging](https://help.salesforce.com/s/articleView?id=002772125&type=1).

Uploaded CAs are also listed in the staging Business Manager under **Administration > Site Development > Development Setup > Code Upload Certificate**.

## CI/CD on Hyperforce Staging

Give each pipeline its own client certificate rather than sharing a user's:

```bash
b2c ecdn mtls issue --ca-cert-file ca.pem --ca-key-file ca.key --name github-actions --output ./ci.p12
```

Store the `.p12` (base64-encoded) and its passphrase as separate secrets:

```bash
base64 -i ci.p12 | tr -d '\n'
```

No separate WebDAV server or `selfsigned` setting is needed.

### GitHub Actions

Pass the base64 secret to `certificate-base64` (Actions v2.2.0 and later). The action decodes it to an owner-only temporary file for you:

```yaml
- uses: SalesforceCommerceCloud/b2c-developer-tooling/actions/code-deploy@v2
  with:
    client-id: ${{ secrets.SFCC_CLIENT_ID }}
    client-secret: ${{ secrets.SFCC_CLIENT_SECRET }}
    server: staging-abcd-acme.demandware.net
    certificate-base64: ${{ secrets.STAGING_CERTIFICATE_P12_BASE64 }}
    certificate-passphrase: ${{ secrets.SFCC_CERTIFICATE_PASSPHRASE }}
    code-version: staging-${{ github.run_number }}
    activate: true
```

The `setup`, `data-import`, `job-run`, and `webdav-upload` actions accept the same inputs.

### Other CI Systems

Decode the certificate to a temporary file and set the environment variables:

```bash
export SFCC_CERTIFICATE=$(mktemp)
chmod 600 "$SFCC_CERTIFICATE"
echo "$STAGING_CERTIFICATE_P12_BASE64" | base64 --decode > "$SFCC_CERTIFICATE"

export SFCC_SERVER=staging-abcd-acme.demandware.net
# SFCC_CERTIFICATE_PASSPHRASE, SFCC_CLIENT_ID and SFCC_CLIENT_SECRET come from secrets

b2c code deploy --activate
```

See [Staging Environments (Two-Factor mTLS)](/guide/ci-cd#staging-environments-two-factor-mtls) for a complete workflow.

## Troubleshooting

| Symptom | What to check |
|---------|---------------|
| `Code upload custom hostname is missing in staging BM zone` | The staging Business Manager eCDN zone needs a custom hostname starting with `staging-`. |
| 401/403 from the API | The API client needs the `sfcc.cdn-zones.rw` scope, and the tenant must be a staging (`_stg`) tenant. |
| `maximum CA expiry of 1 year` | Use a CA valid for 365 days or less. |
| `not a CA certificate` | Upload the CA that signs client certificates, not a client certificate. |
| `CA private key does not match the CA certificate` | `issue` was given a key from a different CA. |
| Uploads fail with a TLS handshake error | Check that `hostname` is the staging hostname and no legacy `webdav-hostname` is set, the `.p12` was issued by a CA that is still uploaded, and neither certificate has expired. |
| `Invalid passphrase for certificate` | `certificate-passphrase` doesn't match the `.p12`. |
