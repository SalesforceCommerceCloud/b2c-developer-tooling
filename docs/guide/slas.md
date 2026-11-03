---
description: A walkthrough of common SLAS tasks with the B2C CLI and your AI assistant, including shopper tokens, SLAS clients, passwordless login templates, social login providers, and shopper logout.
---

# SLAS Guide

The Shopper Login and API Access Service (SLAS) is how shoppers, and the apps that serve them, sign in to the B2C Commerce Shopper APIs. Every headless storefront, mobile app, or integration that calls a Shopper API needs a SLAS client and a shopper access token.

This guide walks through the tasks you're most likely to need, from getting your first token to setting up social login. Each section explains what the task is for, shows the commands, and suggests a prompt you can give your AI assistant instead.

::: tip
For every flag and option, see the [SLAS command reference](/cli/slas).
:::

## Before You Start

SLAS commands need two values from your instance:

- **Tenant ID**: your organization ID with underscores, for example `abcd_123`. It appears in Business Manager under **Administration > Site Development > Salesforce Commerce API Settings**.
- **Short code**: the SCAPI short code from the same page, for example `kv7kzm78`.

Put them in `dw.json` so you don't have to repeat them:

```json
{
  "tenant-id": "abcd_123",
  "short-code": "kv7kzm78",
  "site-id": "RefArch"
}
```

You can also pass `--tenant-id` and `--short-code` on any command, or set `SFCC_TENANT_ID` and `SFCC_SHORTCODE`.

To manage SLAS clients and settings, your Account Manager user needs the **SLAS Organization Administrator** role with a tenant filter for your organization. The first command you run asks you to sign in through the browser. For automation, see [Authentication](/cli/slas#authentication) in the reference.

<ExamplePrompt>

> Check my B2C configuration and tell me whether I have everything I need to work with SLAS.

</ExamplePrompt>

## Get a Shopper Token

The quickest way to try a Shopper API is to get a guest token and call the API with it.

```bash
b2c slas token --site-id RefArch
```

The command prints only the access token, so you can use it directly:

```bash
TOKEN=$(b2c slas token --site-id RefArch)
curl -H "Authorization: Bearer $TOKEN" \
  "https://kv7kzm78.api.commercecloud.salesforce.com/product/shopper-products/v1/organizations/f_ecom_abcd_123/products/25519318M?siteId=RefArch"
```

If you don't name a client, the CLI uses the first public SLAS client it finds for your tenant. To use a specific client, pass `--slas-client-id`. Add `--slas-client-secret` for a private client.

To act as a registered customer, for example to read their order history, add their login:

```bash
b2c slas token --site-id RefArch --shopper-login shopper@example.com
```

The CLI prompts for the password. Add `--json` to see the refresh token, expiry, customer ID, and `usid` as well.

<ExamplePrompt>

> Get me a guest shopper token for RefArch and use it to search for "shirt".

</ExamplePrompt>

::: tip Use your assistant for Shopper APIs
Your AI assistant can call Shopper APIs without you handling tokens at all. See [SCAPI Code Mode](/mcp/toolsets#scapi-code-mode).
:::

## Create a SLAS Client

A SLAS client represents one app: a storefront, a mobile app, or a back-end integration. Before you create one, decide whether it is public or private.

| Client type | Use it for                                                                     | Has a secret |
| ----------- | ------------------------------------------------------------------------------ | ------------ |
| Public      | Code that runs in the shopper's browser or device, such as a PWA or mobile app | No           |
| Private     | Code that runs on a server you control, such as a BFF or an integration        | Yes          |

Create a public client for a local storefront:

```bash
b2c slas client create --name "My Storefront" \
  --channels RefArch \
  --default-scopes \
  --redirect-uri http://localhost:3000/callback \
  --public
```

Create a private client for a server-side integration:

```bash
b2c slas client create --name "Order Sync" \
  --channels RefArch \
  --scopes sfcc.shopper-baskets-orders,sfcc.shopper-customers.login \
  --redirect-uri http://localhost:3000/callback \
  --json
```

The secret of a private client is shown only once. `--json` makes it easy to capture in a script. Store it in your secret manager right away.

A few things to know:

- `--channels` lists the sites the client can be used with.
- `--default-scopes` grants the common shopper scopes. Pass `--scopes` instead to grant only what your app needs.
- If your tenant isn't registered with SLAS yet, `client create` registers it for you.

<ExamplePrompt>

> Create a public SLAS client called "PWA Kit Dev" for RefArch with the default shopper scopes and a redirect URI of http://localhost:3000/callback.

</ExamplePrompt>

## Review and Change Clients

See all clients of your tenant, then look at one in detail:

```bash
b2c slas client list
b2c slas client get my-client-id
```

`client update` changes only what you pass. List values such as scopes, channels, and redirect URIs are added to the existing ones; add `--replace` to overwrite them instead.

```bash
# Give a client access to a second site
b2c slas client update my-client-id --channels SiteGenesis

# Add a scope
b2c slas client update my-client-id --scopes sfcc.shopper-promotions

# Rotate the secret of a private client
b2c slas client update my-client-id --secret "$NEW_SECRET"
```

If you put `slas-client-id` in `dw.json`, you can leave out the client ID in `get`, `update`, `delete`, and `open`.

To review a client in the SLAS Admin UI, run `b2c slas client open my-client-id`.

<ExamplePrompt>

> Which of my SLAS clients can access the RefArch site, and which of them are private?

</ExamplePrompt>

<ExamplePrompt>

> Add the sfcc.shopper-gift-certificates scope to my storefront's SLAS client.

</ExamplePrompt>

### Tighten Client Security

Three client settings control how strictly SLAS treats logins and token requests:

| Flag                   | What it does                                                                     |
| ---------------------- | -------------------------------------------------------------------------------- |
| `--login-restricted`   | Only this client can use the shopper login endpoints of its sites                |
| `--strict-client-auth` | Private clients must send their secret on every token request, including refresh |
| `--six-digit-otp`      | Passwordless login codes have 6 digits instead of 8                              |

Each has a `--no-` form to turn it off. For example:

```bash
b2c slas client update my-client-id --login-restricted --strict-client-auth
```

You can also change a client's type. `--private` adds a secret (generated unless you pass `--secret`), and `--public` removes it:

```bash
b2c slas client update my-client-id --private
```

Switching a client's type changes how every app using it authenticates. Update the apps at the same time.

## Set Up Passwordless Login and Password Reset

For passwordless login and password reset, SLAS sends the shopper a message with a link or one-time code. **Password action templates** define that message for each client, site, and locale.

Each template has:

- an **action type**: `PWDLESS_LOGIN`, `PWD_RESET_ACTION`, `PWD_RESET_CROSS_DEVICE_ACTION`, or `WEBAUTHN_AUTHORIZE_USER`;
- a **template type**: `EMAIL` or `SMS`;
- a **locale**, such as `en-us`;
- a name, a subject, a link, and the message body.

The link can include `${token}`, which SLAS replaces with the shopper's code.

Create an email template for passwordless login:

```bash
b2c slas client template set my-client-id --site-id RefArch \
  --action-type PWDLESS_LOGIN --template-type EMAIL --locale en-us \
  --name "Login code" --subject "Your login code" \
  --link 'https://example.com/login?token=${token}' \
  --template-file login-email.html
```

Use single quotes around the link so your shell doesn't expand `${token}`.

Check what a client has, then adjust one field:

```bash
b2c slas client template list my-client-id --site-id RefArch

b2c slas client template set my-client-id --site-id RefArch \
  --action-type PWDLESS_LOGIN --template-type EMAIL --locale en-us \
  --subject "Sign in to Example Store"
```

To add another language, run `template set` again with a different `--locale`.

<ExamplePrompt>

> Set up a passwordless login email template for my storefront client on RefArch in English and German. Use a friendly subject line and link to https://example.com/login.

</ExamplePrompt>

<ExamplePrompt>

> Show me the password reset templates for my storefront client and check that every locale has a subject.

</ExamplePrompt>

## Add Social and Third-Party Login

Identity providers (IDPs) let shoppers sign in with an account they already have, such as Google, Apple, or your company's own identity service. You register the provider once per tenant, and any client can use it.

First, register an app with the provider. When it asks for a redirect or callback URL, use:

```text
https://<short-code>.api.commercecloud.salesforce.com/shopper/auth/v1/idp/callback/<name>
```

`<name>` is the name you give the IDP in SLAS, for example `google`. The provider gives you a client ID and a secret.

Then add the provider to SLAS:

```bash
b2c slas idp set google \
  --idp-client-id 1234.apps.googleusercontent.com \
  --idp-client-secret "$GOOGLE_CLIENT_SECRET" \
  --well-known-url https://accounts.google.com/.well-known/openid-configuration \
  --auth-url https://accounts.google.com/o/oauth2/v2/auth \
  --token-url https://oauth2.googleapis.com/token \
  --token-info-url https://oauth2.googleapis.com/tokeninfo \
  --user-info-url https://www.googleapis.com/oauth2/v3/userinfo \
  --scopes openid,email,profile
```

The name must start with a supported provider type, such as `google`, `apple`, `facebook`, `okta`, or `azure`. For any other OpenID Connect provider, use `default` and tell SLAS which claims hold the shopper's details with `--claim-mapper`. To register two providers of the same type, add a suffix: `google-staging`.

Review the providers of your tenant:

```bash
b2c slas idp list
b2c slas idp get google
```

Client secrets are masked in the output. Add `--show-secret` only when you need to see them.

To set up the same provider on another tenant, export it and import it there:

```bash
b2c slas idp get google --tenant-id abcd_123 --show-secret --json > google.json
b2c slas idp set google --tenant-id efgh_456 --file google.json
rm google.json
```

<ExamplePrompt>

> Help me add Sign in with Google to my SLAS tenant. Walk me through what I need from the Google Cloud console first.

</ExamplePrompt>

<ExamplePrompt>

> Copy the Okta identity provider from tenant abcd_123 to efgh_456.

</ExamplePrompt>

## Log Shoppers Out and Delete Their Data

### Log Shoppers Out Everywhere

If a shopper's account may be compromised, log them out of every session. SLAS revokes their refresh tokens and invalidates their access tokens, so they have to sign in again on every device. Their password doesn't change.

```bash
b2c slas shopper logout --site-id RefArch --login-id shopper@example.com
```

For several shoppers, put one login per line in a file:

```bash
b2c slas shopper logout --site-id RefArch --file compromised.txt
```

The command shows the result for each shopper and exits with an error if any logout failed.

### Delete a Shopper's SLAS Records

To fulfill a data deletion request, delete the shopper's SLAS records:

```bash
b2c slas shopper delete abcdKZmKZm1234567890abcd --email shopper@example.com
```

This deletes SLAS data only. Delete the customer profile in B2C Commerce as well.

Both commands ask for confirmation. Add `--force` in scripts.

<ExamplePrompt>

> Log shopper@example.com out of all sessions on RefArch.

</ExamplePrompt>

## Manage the Tenant Registration

A tenant has to be registered with SLAS before it can have clients. `client create` does this for you, so you rarely need to do it yourself. To review or update the merchant and contact details:

```bash
b2c slas tenant get
b2c slas tenant set --merchant-name "Example Store" --contact "Ops Team" --email ops@example.com
```

SLAS has no API to delete or list tenants.

## Keep SLAS Safe

SLAS changes take effect immediately on live storefronts. Deleting a client breaks every app that uses it, and a wrong identity provider setting can stop social login.

[Safety Mode](/guide/safety) protects you and your AI assistant from accidental changes:

- `NO_DELETE` blocks deleting clients, templates, identity providers, and shopper records.
- `READ_ONLY` also blocks creating and changing them, and logging shoppers out.

`READ_ONLY` is a good choice when an assistant works with your production tenant:

```bash
export SFCC_SAFETY_LEVEL=READ_ONLY
```

## Troubleshooting

**A "tenant not found" error.** Check the tenant ID. It uses underscores (`abcd_123`), not the hyphenated instance name.

**401 or 403 errors.** Your Account Manager user or API client needs the SLAS Organization Administrator role with a tenant filter for your organization. See [Required Roles](/cli/slas#required-roles).

**`slas token` fails with `invalid_client` or a redirect error.** Check that the client allows the site in `--channels` and that a public client's redirect URIs include `http://localhost:3000/callback`.

**A Shopper API returns 403 with a valid token.** The client probably lacks the scope the API needs. Add it with `b2c slas client update <client-id> --scopes <scope>` and get a new token, because existing tokens keep their old scopes.

<ExamplePrompt>

> My storefront gets a 403 when it calls Shopper Baskets. Check whether its SLAS client has the right scopes and channels.

</ExamplePrompt>

## Next Steps

- [SLAS command reference](/cli/slas) for every flag
- [Configuration](/guide/configuration) to store SLAS settings in `dw.json`
- Salesforce's [Authorization for Shopper APIs](https://developer.salesforce.com/docs/commerce/commerce-api/guide/authorization-for-shopper-apis.html) for how the login flows work
