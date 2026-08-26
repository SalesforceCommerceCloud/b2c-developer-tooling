---
description: Set up the B2C CLI for non-interactive OAuth client-credentials authentication using a Confidential Account Manager API client (internal Salesforce developers).
---

# Client Credentials Setup (Internal)

::: info For internal Salesforce developers
This guide targets **internal Salesforce developers** and points at the **pod5 pre-production** Account Manager (`account-pod5.demandware.net`) and pre-production ODS (`admin.dx.unified.demandware.net`). Customers should use the production hosts instead — the CLI's shipped default Account Manager host is `account.demandware.com`.
:::

Non-interactive OAuth for CI/CD, automation, and headless use. The CLI authenticates as the **API client itself** (not a user), so roles attach to the client rather than to you. For interactive use as yourself, use [user authentication](/guide/authentication#authentication-methods) instead.

## At a glance

| Requirement                | Value                                                       |
| -------------------------- | ----------------------------------------------------------- |
| Client type                | **Confidential** (has a secret)                             |
| Grant                      | `client_credentials`                                        |
| Token Endpoint Auth Method | `client_secret_basic`                                       |
| Roles                      | On the **API client** (not a user), scoped by tenant filter |

## Account Manager setup

Create or edit an API client in [Account Manager](/guide/account-manager), then set:

| Setting                    | Value                                            | Why                                                                                    |
| -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Client Authentication Type | Confidential                                     | Enables a client secret; public clients cannot use client-credentials                  |
| Password                   | your secret                                      | Provided to the CLI as `SFCC_CLIENT_SECRET`                                            |
| Token Endpoint Auth Method | `client_secret_basic`                            | The CLI sends the secret via HTTP Basic; `private_key_jwt` / `client_secret_post` fail |
| Roles                      | `Salesforce Commerce API`, `Sandbox API User`, … | Authorize the client; scope each with a tenant filter to your realm(s)                 |
| Redirect URIs              | not required                                     | Only interactive (browser) flows use redirects                                         |

::: tip Public → Confidential in place
An existing **public** client can be switched to **Confidential** without creating a new one — edit the client and change **Client Authentication Type**. Roles and scopes are preserved.
:::

## Roles

Roles for client-credentials attach to the **API client**, not to a user account. A client with no roles authenticates successfully but is authorized for nothing.

| Command area          | Required role             | Scope               |
| --------------------- | ------------------------- | ------------------- |
| `b2c sandbox …` (ODS) | `Sandbox API User`        | tenant/realm filter |
| SCAPI / platform      | `Salesforce Commerce API` | tenant filter       |

See [Assigning Roles](/guide/authentication#assigning-roles) for the full list and tenant-filter syntax.

## Environment variables

| Variable                    | Value                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `SFCC_CLIENT_ID`            | API client ID                                                                            |
| `SFCC_CLIENT_SECRET`        | client password                                                                          |
| `SFCC_ACCOUNT_MANAGER_HOST` | `account-pod5.demandware.net` (internal; overrides the shipped `account.demandware.com`) |
| `SFCC_SANDBOX_API_HOST`     | `admin.dx.unified.demandware.net` (pre-production ODS)                                   |

With a secret configured, the CLI's default auth chain selects client-credentials automatically — no `--auth-methods` flag needed.

::: warning Keep secrets out of dotfiles
Do not commit the secret to `~/.zshrc` in plaintext. Store it in a secret manager and export it at shell startup — for example, macOS Keychain:

```sh
# seed once (prompts for the secret; nothing lands in shell history)
security add-generic-password -a <client-id> -s b2c-cli-secret -w

# in ~/.zshrc
export SFCC_CLIENT_SECRET=$(security find-generic-password -w -s b2c-cli-secret 2>/dev/null)
```

:::

## Verify

```sh
b2c sandbox list
```

A successful listing — with no `--user-auth` and no `--client-secret` flags — confirms client-credentials is working.

## Troubleshooting

| Symptom                                              | Likely cause                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `unauthorized_client` / `invalid_client`             | Token Endpoint Auth Method isn't `client_secret_basic`, or wrong secret           |
| `Client not allowed to use Client Credentials grant` | Client is Public, not Confidential                                                |
| `No valid auth method available`                     | No `SFCC_CLIENT_SECRET` set, or `SFCC_AUTH_METHODS` excludes `client-credentials` |
| Auth succeeds but `403` / empty results              | Required role missing, or not scoped to your realm via tenant filter              |
