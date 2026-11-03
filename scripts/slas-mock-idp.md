# SLAS mock identity provider

`scripts/slas-mock-idp.mts` is a local OpenID Connect identity provider for trying SLAS third-party (IDP) login end to end. Use it to check `b2c slas idp` changes, to debug SLAS IDP flows, or to sign in to a storefront through social login without setting up a real provider. It is a developer tool and does not run in CI.

The mock has no dependencies. It keeps everything in memory, so a restart resets it. It logs every request it receives, with secrets masked, so you can see what SLAS sends to an IDP.

## Requirements

- B2C CLI configuration for the instance: tenant ID, short code, and Account Manager access to SLAS administration (see the [SLAS guide](../docs/guide/slas.md)).
- [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) on `PATH`, for `--tunnel`. Quick tunnels need no Cloudflare account. SLAS calls the IDP's token and user info endpoints from Salesforce servers, so the mock needs a public HTTPS URL. You can also expose it yourself and pass `--public-url`.
- A SLAS client allowed on the site. `login` uses a public client; a storefront can use a private one.

## Start the mock and register it with SLAS

```bash
pnpm slas:mock-idp --tunnel --register
```

This starts the mock on port 8787 and opens a Cloudflare quick tunnel. It then registers the SLAS identity provider `default-mock` through `b2c slas idp set` in this checkout. The provider uses the generic `default` origin with the documented claim mapping.

Pass CLI configuration with `--tenant-id` and repeatable `--cli-arg` options, for example:

```bash
pnpm slas:mock-idp --tunnel --register --tenant-id abcd_123 \
  --cli-arg=-i --cli-arg=my-sandbox --cli-arg=--short-code --cli-arg=kv7kzm78
```

Without `--register`, the mock prints the `b2c slas idp set` command for you to run.

The tunnel URL changes on every run. Restart with `--register` to update the provider. Run `pnpm slas:mock-idp --help` for every option.

## Sign in

**Programmatically.** In a second terminal:

```bash
pnpm slas:mock-idp login --slas-client-id <public-client-id> --site-id RefArch
```

The command starts a SLAS authorization with `hint=default-mock`. It follows the redirects through the mock and SLAS's callback, signs in without a browser, and exchanges the code for shopper tokens. It prints the customer ID, the `usid`, and an access token you can use with the Shopper APIs. Add `--json` for the full token response.

**Interactively.** `login` also prints a SLAS authorize URL. Open it in a browser and sign in on the mock's page with any email. The same email always maps to the same shopper. With `--auto-approve`, the mock signs in the default shopper without showing the page.

### Shopper emails

The default shopper is `shopper@sink.salesforce.com`. Pass `--user` to sign in as someone else.

SLAS rejects shoppers on reserved test domains such as `example.com`, `example.org`, `*.test`, or `*.invalid`. The IDP callback fails with `400 "The shopper is invalid"`. `login` refuses these addresses, and the mock logs a warning when one is used. No mail is sent to the address.

Each new email creates a registered customer on the instance.

## Use it with a storefront

Any storefront that starts SLAS IDP login with `hint=default-mock` works. For Storefront Next:

1. Set the provider in the project's `.env`:

   ```bash
   PUBLIC__app__features__socialLogin__enabled=true
   PUBLIC__app__features__socialLogin__providers=["default-mock"]
   ```

2. Add the storefront's social callback to the SLAS client's redirect URIs. Storefront Next includes the site and locale in the path:

   ```bash
   b2c slas client update <client-id> \
     --redirect-uri http://localhost:5173/RefArch/en-US/social-callback
   ```

   If the callback is missing, SLAS answers `redirect_uri doesn't match the registered redirects`.

3. Start the storefront, open the login page, and choose **Continue with default-mock**.

Watch the mock's output and the storefront's `SocialLogin:` log lines to follow each step.

## How the flow works

```text
storefront ──▶ SLAS /oauth2/authorize?hint=default-mock
           ◀── 303 to mock /authorize
mock /authorize (sign in) ──▶ 302 to SLAS /idp/callback/default-mock
                               SLAS ──▶ mock /token     (Basic client credentials)
                               SLAS ──▶ mock /userinfo  (Bearer access token)
           ◀── 303 to the client's redirect URI with code and usid
storefront ──▶ SLAS /oauth2/token (authorization_code_pkce)
```

The mock implements discovery, `/authorize`, `/token` (authorization code with PKCE, and refresh token), `/userinfo`, `/tokeninfo`, `/introspect`, and `/jwks`. It signs access and ID tokens with an RS256 key generated for each run.

## Clean up

Stop the mock with Ctrl+C; this also stops the tunnel. Then remove what you created on the instance:

```bash
b2c slas idp delete default-mock --force
b2c slas shopper delete <customer-id> --email shopper@sink.salesforce.com --force
```

`shopper delete` removes the SLAS records only. The customer profile stays in B2C Commerce.

The mock records the public URL and IDP name in `~/.config/b2c/slas-mock-idp.json`, so `login` can run in another terminal. The file contains no secrets.
