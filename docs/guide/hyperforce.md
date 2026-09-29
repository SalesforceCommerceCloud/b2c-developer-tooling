---
description: Deploy code to B2C Commerce on Hyperforce — what two-factor (mTLS) code upload to staging is, and step-by-step setup of client certificates for CI/CD pipelines and local development with the CLI.
---

# Deploying to Hyperforce

Most deployment workflows work the same on Hyperforce. The one thing you must set up is **two-factor code upload** to your **staging** instance. Every code upload to staging needs a client certificate as well as your usual credentials. On Hyperforce, you create and manage these certificates yourself. This page shows you how to do it with the CLI, starting with your CI/CD pipeline.

## What Is Two-Factor Code Upload?

Staging uploads need a second factor. As well as the usual credentials (an API client, or a WebDAV username and access key), the CLI sends a **client certificate** (a `.p12` file) when it connects to upload code. This is called mutual TLS (mTLS). Staging only accepts the upload if the certificate was signed by a **certificate authority (CA)** that you registered for your staging tenant.

So there are two parts:

| Part | What it is | Typically | Where it's kept |
|------|------------|----------|-----------------|
| **CA** (`ca.pem` + `ca.key`) | Signs client certificates. Its certificate is registered with eCDN for your staging tenant. | One per staging tenant. You can register several, for example while you renew. | A password manager or secrets vault |
| **Client certificate** (`.p12` + passphrase) | Sent by the CLI on each code upload | One per CI pipeline and one per developer who uploads to staging. You can issue as many as you need. | CI secrets, or the developer's machine |

Only code upload (WebDAV) to staging needs a client certificate. Business Manager, API calls, and sandboxes don't.

### What Changes from cert.staging

Before Hyperforce, Salesforce provided the CA, and code upload used a separate `cert.staging.<realm>.<customer>.demandware.net` hostname. On Hyperforce:

- **You provide the CA** and register it for your staging tenant. Salesforce no longer provides a CA bundle for Hyperforce realms.
- **Code upload uses the regular staging hostname** (`staging-<realm>-<customer>.demandware.net`). The `cert.staging` hostname is deactivated. You no longer need a separate WebDAV hostname (`webdav-hostname` / `webdav-server`) or the `selfsigned` setting.
- **The CA expires after at most 1 year.** You must [renew it](#renew-the-ca) before then.

You can create your CA before your realm is migrated. Until the migration, keep using your existing certificates with `cert.staging`. After it, switch your pipelines and `dw.json` to the new client certificates and the staging hostname.

## Who Needs a Client Certificate?

- **CI/CD pipelines that deploy to staging**, for example GitHub Actions or Bitbucket Pipelines. This is the most common case and the focus of the steps below.
- **Developers who upload code straight to staging** from their own machine, using the CLI, the VS Code extension, UX Studio, or a WebDAV client. Many teams only deploy to staging from CI, so this is optional. See [Step 6](#step-6-optional-set-up-local-code-upload).

## Set Up Two-Factor Code Upload

1. [Check the prerequisites](#step-1-check-the-prerequisites)
2. [Create your CA and a CI client certificate](#step-2-create-your-ca-and-a-ci-client-certificate) (usually once per staging tenant)
3. [Add the certificate to your CI secrets](#step-3-add-the-certificate-to-your-ci-secrets)
4. [Configure your pipeline](#step-4-configure-your-pipeline)
5. [Store the CA securely](#step-5-store-the-ca-securely)
6. [(Optional) Set up local code upload](#step-6-optional-set-up-local-code-upload)

The person who manages the staging tenant does Steps 1–5. Developers only need Step 6, and only if they upload to staging directly.

### Step 1: Check the Prerequisites

- **A staging tenant on Hyperforce.** Its tenant ID ends in `_stg`, for example `zzxy_stg`.
- **An API client with the `sfcc.cdn-zones.rw` scope**, plus the SCAPI short code and tenant ID in your configuration. See [SCAPI Authentication](/guide/authentication#scapi-authentication).

### Step 2: Create Your CA and a CI Client Certificate

You usually need only one CA per staging tenant, so this is typically a **one-time step**. Create the CA and a first client certificate with one command:

```bash
b2c ecdn mtls create --tenant-id zzxy_stg --generate \
  --name code-upload --client-name github-actions
```

This creates **two separate certificates**. Each has its own name:

1. **The CA** (`--name`). The command generates a CA valid for 1 year and registers its certificate with eCDN. The name is only a label. It appears in `b2c ecdn mtls list` and in Business Manager.
2. **A client certificate, signed by that CA** (`--client-name`). This `<client-name>.p12`, with a random passphrase, is what actually gets sent on code upload. Name it after the pipeline that will use it, for example `github-actions`.

Files go to `./mtls-certs` unless you set `--out-dir`. At the end, the command prints the certificate path and passphrase, a `base64` command for CI, and the equivalent `dw.json` settings.

::: tip Prefer to be guided? Use `setup`
`b2c ecdn mtls setup --tenant-id zzxy_stg` does the same thing interactively, with defaults for each value:

- It lists any CAs already registered for the tenant.
- It prompts for the CA name, client certificate name, and output directory.
- It offers to write the client certificate to `dw.json`. Only say yes if you also want to upload from this machine (see [Step 6](#step-6-optional-set-up-local-code-upload)).
:::

If a CA is already registered for the tenant (check with `b2c ecdn mtls list`) and hasn't expired, you probably don't need a new one. Instead, issue a client certificate from it with [`b2c ecdn mtls issue`](#add-a-pipeline-or-developer).

The command writes `ca.pem` and `ca.key` (the CA) and `<client-name>.p12` (the client certificate) to the output directory.

### Step 3: Add the Certificate to Your CI Secrets

The `.p12` is a binary file. Base64-encode it so you can store it as a CI secret. The [GitHub Actions](#github-actions) decode it for you. On other CI systems, you decode it with one line in the pipeline (see [Step 4](#step-4-configure-your-pipeline)).

```bash
base64 -i ./mtls-certs/github-actions.p12 | tr -d '\n'
```

Add these secrets to your CI system. They go alongside the `SFCC_CLIENT_ID` and `SFCC_CLIENT_SECRET` your pipeline already uses:

| Secret | Value |
|--------|-------|
| `STAGING_CERTIFICATE_P12_BASE64` | The base64 output above |
| `SFCC_CERTIFICATE_PASSPHRASE` | The passphrase printed by `create` |

Once they're stored, delete the `.p12` from your machine.

Give each pipeline its own client certificate. For a second pipeline, issue another certificate from the same CA:

```bash
b2c ecdn mtls issue \
  --ca-cert-file ./mtls-certs/ca.pem --ca-key-file ./mtls-certs/ca.key \
  --name bitbucket-pipelines
```

### Step 4: Configure Your Pipeline

Set the server to your staging hostname (`staging-<realm>-<customer>.demandware.net`) and pass in the certificate. Remove any `webdav-server` or `selfsigned` settings left over from `cert.staging`.

#### GitHub Actions

Pass the base64 secret to `certificate-base64` (Actions v2.2.0 and later). The action decodes it for you:

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

The `setup`, `data-import`, `job-run`, and `webdav-upload` actions accept the same inputs. For a complete workflow, see [Staging Environments (Two-Factor mTLS)](/guide/ci-cd#staging-environments-two-factor-mtls).

#### Bitbucket Pipelines

Add `SFCC_SERVER`, `SFCC_CLIENT_ID`, `SFCC_CLIENT_SECRET`, `SFCC_CERTIFICATE_PASSPHRASE`, and `STAGING_CERTIFICATE_P12_BASE64` as repository or deployment variables. Mark all of them except `SFCC_SERVER` as **Secured**. Then decode the certificate in the step:

```yaml
image: node:22

pipelines:
  branches:
    main:
      - step:
          name: Deploy to staging
          deployment: staging
          script:
            - npm install -g @salesforce/b2c-cli
            - export SFCC_CERTIFICATE=$(mktemp)
            - echo "$STAGING_CERTIFICATE_P12_BASE64" | base64 --decode > "$SFCC_CERTIFICATE"
            - b2c code deploy --activate
```

#### Other CI Systems

Use the same approach in any CI system. Decode the certificate to a temporary file and set the environment variables:

```bash
export SFCC_CERTIFICATE=$(mktemp)
echo "$STAGING_CERTIFICATE_P12_BASE64" | base64 --decode > "$SFCC_CERTIFICATE"

export SFCC_SERVER=staging-abcd-acme.demandware.net
# SFCC_CERTIFICATE_PASSPHRASE, SFCC_CLIENT_ID and SFCC_CLIENT_SECRET come from secrets

b2c code deploy --activate
```

### Step 5: Store the CA Securely

::: danger Treat the CA private key like a password
Anyone with `ca.key` can issue client certificates that your staging instance trusts for code upload.

- Move `ca.key` and `ca.pem` out of your project to a password manager or secrets vault. You only need them to issue new client certificates.
- Never commit the CA key, `.p12` files, or passphrases to a source repository.
- Don't share the CA. Give each user or pipeline its own client certificate instead.
:::

### Step 6 (Optional): Set Up Local Code Upload

Follow this step only if developers upload code to staging from their own machines. For example, they might test a build on staging before merging, or use `b2c code watch`.

Each developer needs their own client certificate. Don't reuse the CI certificate. Issue one from the CA for each developer, named after their Business Manager username:

```bash
b2c ecdn mtls issue --ca-cert-file ./mtls-certs/ca.pem --ca-key-file ./mtls-certs/ca.key --name jsmith
```

Send the `.p12` and its passphrase to the developer separately. Then the developer points the CLI at the certificate using `dw.json`, flags, or environment variables:

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

Use an absolute path in `dw.json`. Relative paths are resolved from the directory where you run the CLI. Flags and environment variables override `dw.json`. See [Two-Factor Authentication (mTLS)](/guide/configuration#two-factor-authentication-mtls) for details.

::: warning
If `dw.json` holds the passphrase, make sure `dw.json` isn't committed to your repository.
:::

To check that the certificate works, list the cartridges directory over WebDAV:

```bash
b2c webdav ls --root cartridges
```

The same `.p12` also works with UX Studio, the VS Code extension, and WebDAV clients such as Cyberduck.

## Over Time: Keeping Code Upload Working

Certificates expire, and teams change. This table shows when you need to act after the initial setup:

| When | What to do | Commands |
|------|------------|----------|
| Once, at the start | [Set up two-factor code upload](#set-up-two-factor-code-upload) (Steps 1–5) | `create` (or `setup`) |
| You add a pipeline or a developer | [Issue them a client certificate](#add-a-pipeline-or-developer) from the existing CA | `issue` |
| A client certificate is about to expire | [Replace that client certificate](#replace-an-expiring-client-certificate) | `issue` |
| The CA is about to expire (at least once a year) | [Renew the CA](#renew-the-ca) and re-issue every client certificate | `create`, `issue`, `delete` |
| A key leaks, or someone with a certificate leaves | [Rotate the CA](#rotate-after-a-leak-or-offboarding) right away | `create`, `issue`, `delete` |

::: tip Set reminders
Nothing warns you before a certificate expires. Uploads just start failing. When you create the CA and each client certificate, add calendar reminders a few weeks before their expiry dates. To see the expiry date of each registered CA, run `b2c ecdn mtls list --tenant-id zzxy_stg`.
:::

### Add a Pipeline or Developer

Issue a new client certificate from the existing CA, as in [Step 3](#step-3-add-the-certificate-to-your-ci-secrets) (pipelines) or [Step 6](#step-6-optional-set-up-local-code-upload) (developers). You don't need to change the CA or any other certificates.

### Replace an Expiring Client Certificate

Issue a replacement from the same CA with the same name, then update the pipeline's secrets or the developer's `dw.json`. If the CA itself is also close to expiring, [renew the CA](#renew-the-ca) instead.

```bash
b2c ecdn mtls issue --ca-cert-file ca.pem --ca-key-file ca.key --name github-actions --output ./ci.p12 --force
```

### Renew the CA

The CA is valid for at most 1 year. When it expires, every client certificate it signed stops working. Renew it a few weeks early:

1. Create a new CA with `b2c ecdn mtls create --generate` (or `setup`). Several CAs can be active at once, so existing client certificates keep working while you switch.
2. Re-issue a `.p12` from the new CA for each pipeline and developer with `b2c ecdn mtls issue`, and update your CI secrets.
3. Once uploads work with the new certificates, delete the old CA:

   ```bash
   b2c ecdn mtls list --tenant-id zzxy_stg
   b2c ecdn mtls delete --tenant-id zzxy_stg --certificate-id <old-certificate-id>
   ```

Client certificates issued by a deleted CA stop working immediately.

### Rotate After a Leak or Offboarding

You can't revoke a single client certificate. Staging trusts every certificate signed by a registered CA until that certificate expires. If the CA key or a `.p12` and its passphrase leak, or someone who holds a certificate leaves, follow the [renewal steps](#renew-the-ca) straight away. Delete the old CA as soon as your pipelines are switched over.

## Reference

### Bring Your Own CA

To use a CA from your organization, register it with `create`, passing your files instead of `--generate`:

```bash
b2c ecdn mtls create --tenant-id zzxy_stg --name code-upload \
  --certificate-file ./ca.pem --private-key-file ./ca.key
```

It must be a CA certificate that is valid for 1 year or less. You can issue client certificates from it with `b2c ecdn mtls issue`.

For manual OpenSSL instructions, see the Salesforce Help article [B2C Commerce Hyperforce Code Upload Instructions for Staging](https://help.salesforce.com/s/articleView?id=002772125&type=1).

Registered CAs are also listed in the staging Business Manager under **Administration > Site Development > Development Setup > Code Upload Certificate**.

### Command Reference

| Command | Use it to |
|---------|-----------|
| [`b2c ecdn mtls create`](/cli/ecdn#b2c-ecdn-mtls-create) | Create and register a CA and issue a first client certificate (`--generate`), or register your own CA |
| [`b2c ecdn mtls setup`](/cli/ecdn#b2c-ecdn-mtls-setup) | Guided version of `create --generate`, with prompts, defaults, and an optional `dw.json` update |
| [`b2c ecdn mtls issue`](/cli/ecdn#b2c-ecdn-mtls-issue) | Issue a client certificate for a pipeline or developer from an existing CA (runs locally) |
| [`b2c ecdn mtls list`](/cli/ecdn#b2c-ecdn-mtls-list) / [`get`](/cli/ecdn#b2c-ecdn-mtls-get) / [`delete`](/cli/ecdn#b2c-ecdn-mtls-delete) | View and remove registered CAs |

## Troubleshooting

| Symptom | What to check |
|---------|---------------|
| `Code upload custom hostname is missing in staging BM zone` | Your staging tenant isn't set up for two-factor code upload on Hyperforce yet. Check that your realm has been migrated, and contact Salesforce Support if the error persists. |
| 401/403 from the API | The API client needs the `sfcc.cdn-zones.rw` scope, and the tenant must be a staging (`_stg`) tenant. |
| `maximum CA expiry of 1 year` | Use a CA valid for 365 days or less. |
| `not a CA certificate` | Register the CA that signs client certificates, not a client certificate. |
| `CA private key does not match the CA certificate` | `issue` was given a key from a different CA. |
| Uploads fail with a TLS handshake error | Check that the server is the staging hostname and that no `webdav-hostname` from `cert.staging` is set. Check that the `.p12` was issued by a CA that's still registered, and that neither certificate has expired. |
| `Invalid passphrase for certificate` | The passphrase doesn't match the `.p12`. |
