---
description: Deploy code to B2C Commerce on Hyperforce — what changes for staging code upload, migrating from cert.staging, and self-service two-factor (mTLS) code upload certificates with a 1-year maximum CA expiry.
---

# Deploying to Hyperforce

Most deployment workflows work the same on Hyperforce. The main difference is two-factor (mTLS) code upload to **staging** instances, which moves to self-service certificates managed through eCDN. This guide covers what changes and how the CLI handles it for you.

## What Changes on Hyperforce

- **Code upload uses the standard staging hostname** (`staging-<realm>-<customer>.demandware.net`). There is no separate code upload hostname; `cert.staging.<realm>.<customer>.demandware.net` is deactivated.
- **You own the certificate authority (CA).** Salesforce no longer provides a CA bundle. You generate your own CA and register it with eCDN, and you handle both the first upload and renewals yourself. Salesforce never has access to the CA key.
- **Client certificates are validated by eCDN.** Only code upload needs a client certificate. Regular Business Manager use on the same hostname doesn't.
- **The CA certificate has a maximum expiry of 1 year**, so plan to renew it every year.

## Migrating from cert.staging

You can set up your CA ahead of the migration. Until your realm is migrated, keep using your existing client certificates with the `cert.staging` hostname. After the migration, switch to the new client certificates and the standard staging hostname in `dw.json` and CI.

## Code Upload Certificates

Uploading code to a Hyperforce staging instance requires two factors: your credentials (username/access key or an OAuth client) **and** a client certificate signed by a CA you registered with eCDN.

Setting this up by hand means several OpenSSL commands, copying PEM data into Business Manager (or escaping it for a CDN API call with a separately obtained token), and more OpenSSL commands for each user. The CLI does all of it in one command:

```bash
b2c ecdn mtls setup
```

| Step | Manual | CLI |
|------|--------|-----|
| Generate the CA with the correct CA extensions | `openssl req ... -addext ...` | Automatic |
| Upload the CA to eCDN | Paste into Business Manager, or escape newlines and `curl` the CDN API with an access token | Automatic |
| Create a client key and CSR, sign it, and export a `.p12` | 3 OpenSSL commands per user | Automatic (`b2c ecdn mtls issue` for more users) |
| Choose and share the `.p12` export password | Manual | Random passphrase generated |
| Configure your tools | Manual | `dw.json` updated for you |
| Catch mistakes (leaf certificate uploaded as the CA, missing CA extensions, validity over 1 year) | After the upload fails | Before anything is uploaded |

### How It Works

1. **Create a CA.** You generate your own private certificate authority: a CA certificate and its private key.
2. **Upload the CA to eCDN.** eCDN associates it with your staging instance's code upload hostname (`staging-<realm>-<customer>.demandware.net`).
3. **Issue client certificates from the CA.** Each user (named after their Business Manager username) or CI pipeline gets its own client certificate, bundled as a password-protected `.p12` file. Tools present this `.p12` when uploading code over WebDAV.

The CA itself is never used to connect — it only signs client certificates. Salesforce never receives your client certificates, and you can issue as many as you need from one CA without contacting support.

| Command | What it does |
|---------|--------------|
| [`b2c ecdn mtls setup`](/cli/ecdn#b2c-ecdn-mtls-setup) | Interactive wizard: generate and upload a CA, issue your client certificate, and update `dw.json` |
| [`b2c ecdn mtls create --generate`](/cli/ecdn#b2c-ecdn-mtls-create) | The same, non-interactively (scripts and automation) |
| [`b2c ecdn mtls issue`](/cli/ecdn#b2c-ecdn-mtls-issue) | Issue another client certificate from an existing CA (runs locally, no API call) |
| [`b2c ecdn mtls list`](/cli/ecdn#b2c-ecdn-mtls-list) / [`get`](/cli/ecdn#b2c-ecdn-mtls-get) / [`delete`](/cli/ecdn#b2c-ecdn-mtls-delete) | Inspect and remove uploaded CAs |

### Prerequisites

- A **staging** tenant: code upload certificates are only accepted for staging organizations (tenant ID ending in `_stg`, for example `zzxy_stg`).
- An API client with the `sfcc.cdn-zones.rw` scope in its allowed scopes, and the SCAPI short code and tenant ID configured. The short code is in Business Manager under **Administration > Site Development > Salesforce Commerce API Settings**. See [SCAPI Authentication](/guide/authentication#scapi-authentication).
- A custom hostname starting with `staging-` in the staging Business Manager eCDN zone. The API rejects the upload if it's missing ("Code upload custom hostname is missing in staging BM zone").

### Quick Start

Run the wizard from your project directory (where `dw.json` lives):

```bash
b2c ecdn mtls setup --tenant-id zzxy_stg
```

The wizard:

1. Lists any code upload certificates that already exist.
2. Asks for a certificate name, your client certificate name (default: your configured Business Manager username), and an output directory (default: `./mtls-certs`).
3. Generates a CA valid for 1 year and uploads it.
4. Issues your client certificate (`<name>.p12`) with a random passphrase.
5. Offers to update `dw.json` with the code upload hostname, certificate path, and passphrase.

Then deploy as usual:

```bash
b2c code deploy
```

#### Non-Interactive

For scripts, use `create --generate`. It performs the same steps and prints the `dw.json` settings instead of editing the file:

```bash
b2c ecdn mtls create --tenant-id zzxy_stg --name code-upload --generate \
  --out-dir ./mtls-certs --client-name jsmith
```

Use `--json` to capture the certificate ID, file paths, and passphrase programmatically.

#### Generated Files

| File | Purpose | Keep it |
|------|---------|---------|
| `ca.pem` | CA certificate (uploaded to eCDN) | With the CA key |
| `ca.key` | CA private key — issues trusted client certificates | **Secret**, in a vault |
| `<client>.p12` | Client certificate bundle used for code upload | **Secret**, with its user or pipeline |
| `.gitignore` | Ignores everything in the directory | — |

All files are written with owner-only permissions (`0600`), and the CLI refuses to overwrite existing files unless you pass `--force`.

### Protect the CA Private Key

::: danger Treat the CA private key like a password
Anyone with `ca.key` can issue client certificates that your staging instance trusts for code upload.

- Move `ca.key` and `ca.pem` to a secure location, such as a password manager or secrets vault. You only need them to issue new client certificates.
- Never commit the CA key, `.p12` files, or passphrases to a source repository.
- Don't share the CA. Give each user or pipeline its own client certificate instead.
:::

The `.p12` files and their passphrases are credentials too. Store the passphrase separately from the file (for example, as separate CI secrets).

### Issue Client Certificates

Issue a certificate for another developer or a CI pipeline from the existing CA. This runs locally and makes no API calls:

```bash
b2c ecdn mtls issue --ca-cert-file ./mtls-certs/ca.pem --ca-key-file ./mtls-certs/ca.key --name jsmith
```

The `.p12` is written next to the CA by default (use `--output` to choose a path). A random passphrase is generated unless you pass `--p12-passphrase` (or set `SFCC_MTLS_P12_PASSPHRASE`). Client certificates are valid for 365 days by default (`--days`) and never outlive the CA.

Send the `.p12` and its passphrase to the user through separate secure channels.

### Configure the CLI

Add the settings printed by `setup`, `create --generate`, or `issue` to your instance in `dw.json`:

```json
{
  "hostname": "staging-abcd-acme.demandware.net",
  "webdav-hostname": "staging-abcd-acme.demandware.net",
  "client-id": "your-client-id",
  "client-secret": "your-client-secret",
  "certificate": "./mtls-certs/jsmith.p12",
  "certificate-passphrase": "the-generated-passphrase"
}
```

`webdav-hostname` is the code upload hostname eCDN associated with the CA (`Hostname` in `b2c ecdn mtls list`); it's usually the same as `hostname`. You can also pass these as flags (`--webdav-server`, `--certificate`, `--passphrase`) or environment variables (`SFCC_WEBDAV_SERVER`, `SFCC_CERTIFICATE`, `SFCC_CERTIFICATE_PASSPHRASE`). See [Two-Factor Authentication (mTLS)](/guide/configuration#two-factor-authentication-mtls).

::: warning
If `dw.json` holds the passphrase, make sure `dw.json` is not committed to your repository.
:::

The generated `.p12` files work with UX Studio, the B2C DX VS Code extension, WebDAV clients such as Cyberduck, OpenSSL, Java, and macOS Keychain.

### Renew Before Expiry

The CA certificate bundle is allowed a **maximum expiry of 1 year**. Before it expires, renew it to avoid disruption with code uploads. The CLI generates CAs valid for 365 days by default, rejects `--ca-days` values above 365, and refuses to upload an existing CA valid for more than 1 year.

To renew (or to rotate after a suspected compromise of the CA key or a client certificate):

1. Create a new CA with `b2c ecdn mtls setup` or `b2c ecdn mtls create --generate`. Several CAs can be active at once, so existing client certificates keep working.
2. Re-issue every user's and pipeline's `.p12` from the new CA with `b2c ecdn mtls issue`, and update their configuration.
3. Verify code uploads work with the new certificates.
4. Delete the old CA:

   ```bash
   b2c ecdn mtls list --tenant-id zzxy_stg
   b2c ecdn mtls delete --tenant-id zzxy_stg --certificate-id <old-certificate-id>
   ```

Check the expiry of uploaded CAs with `b2c ecdn mtls list`.

### Bring Your Own CA

If your organization issues its own CA, upload it with `--certificate-file` and `--private-key-file` instead of `--generate`:

```bash
b2c ecdn mtls create --tenant-id zzxy_stg --name code-upload \
  --certificate-file ./ca.pem --private-key-file ./ca.key
```

The certificate must be a CA certificate (not a client certificate) valid for at most 1 year, with an RSA key of at least 2048 bits. You can still issue client certificates from it with `b2c ecdn mtls issue`.

<details>
<summary>Equivalent OpenSSL commands</summary>

These are the manual steps the CLI automates, following the Salesforce [code deployment guide](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/b2c-code-deployment.html):

```bash
CERT_HOST=staging-<realm>-<customer>.demandware.net

# CA (Common Name: the value of $CERT_HOST). The -addext options are required;
# macOS's default OpenSSL configuration omits them.
openssl req -new -newkey rsa:2048 -sha256 -days 365 -x509 -nodes \
  -addext "basicConstraints=critical,CA:TRUE" \
  -addext "keyUsage=critical,keyCertSign,cRLSign" \
  -keyout ${CERT_HOST}.key -out ${CERT_HOST}.crt

# Client certificate for one user, signed by the CA
openssl req -new -sha256 -newkey rsa:2048 -nodes -out <user>.req -keyout <user>.key
openssl x509 -CA ${CERT_HOST}.crt -CAkey ${CERT_HOST}.key -CAcreateserial \
  -req -in <user>.req -out <user>.pem -days 365

# PKCS12 bundle (-legacy for macOS Keychain compatibility)
openssl pkcs12 -export -legacy -in <user>.pem -inkey <user>.key \
  -certfile ${CERT_HOST}.crt -name "<user>" -out <user>.p12
```

</details>

You can also upload and manage CAs in the staging Business Manager under **Administration > Site Development > Development Setup > Code Upload Certificate**. CAs uploaded with the CLI appear there too.

## CI/CD on Hyperforce Staging

Issue a dedicated client certificate for each pipeline from your CA, and store the `.p12` (base64-encoded) and its passphrase as separate secrets. Use the staging hostname as the WebDAV server. See [Staging Environments (Two-Factor mTLS)](/guide/ci-cd#staging-environments-two-factor-mtls) for a GitHub Actions example.

```bash
b2c ecdn mtls issue --ca-cert-file ca.pem --ca-key-file ca.key --name github-actions --output ./ci.p12
```

## Troubleshooting

| Symptom | What to check |
|---------|---------------|
| `Code upload custom hostname is missing in staging BM zone` | The staging BM eCDN zone needs a custom hostname starting with `staging-`. |
| 401/403 from the API | The API client needs `sfcc.cdn-zones` and `sfcc.cdn-zones.rw` in its allowed scopes, the credentials must be correct, and the tenant must be a staging (`_stg`) tenant. |
| `maximum CA expiry of 1 year` | Generate a CA valid for 365 days or less. |
| `not a CA certificate` | Upload the CA that signs client certificates, not a client (leaf) certificate. Business Manager and the API report this as "Failed to create mTLS certificate" or "The certificate couldn't be created". A CA generated with OpenSSL on macOS without the `-addext "basicConstraints=critical,CA:TRUE"` option has the same problem. |
| `CA private key does not match the CA certificate` | `issue` was given a key from a different CA. |
| Uploads fail with a TLS handshake error | Check that `webdav-hostname` is the code upload hostname (not the legacy `cert.staging.*`), the `.p12` was issued by a CA that is still uploaded, and neither certificate has expired. |
| `Invalid passphrase for certificate` | `certificate-passphrase` doesn't match the `.p12`. |
