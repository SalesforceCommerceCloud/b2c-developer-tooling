# API Browser Setup

Browse the APIs available to your B2C Commerce instance, including custom properties, and send requests with **Try it out**. Open this guide from the API Browser's **Setup Help** button or from any API documentation tab.

## Configure a connection

The API Browser uses the extension's selected instance and project configuration. Choose the intended instance in the status bar. An existing `dw.json`, project `.env`, global connection file, or supported credential plugin can supply the settings.

For a project `dw.json`, start with:

```json
{
  "hostname": "abcd-001.dx.commercecloud.salesforce.com",
  "short-code": "kv7kzm78",
  "tenant-id": "abcd_001",
  "client-id": "your-account-manager-client-id",
  "client-secret": "your-account-manager-client-secret",
  "site-id": "RefArch",
  "slas-client-id": "your-slas-client-id"
}
```

Replace the example values with your instance and client settings. `tenant-id` also accepts the organization ID form, such as `f_ecom_abcd_001`. Keep `dw.json` and `.env` out of version control. See [shared configuration](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html) for environment variables, multiple instances, and credential storage options.

## Load the API list

Schema discovery requires an **Account Manager** API client with the **Salesforce Commerce API** role, the tenant in its tenant filter, and the `sfcc.scapi-schemas` scope. This is needed to load schemas for both Admin and Shopper families; SLAS credentials alone do not load the API list.

Select **Load APIs** or **Refresh** in the API Browser, then choose an API. For client registration and access setup, see [Authentication](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication.html#scapi-authentication).

## Send Admin requests

The extension uses your Account Manager credentials and requests the scopes declared by the API. Grant those scopes to your client and ensure its tenant filter includes the selected instance. Loading a schema does not itself grant permission to call that API.

## Send Shopper requests

Shopper APIs use a separate **SLAS** client. Configure `slas-client-id` and `site-id`; the SLAS client's channels must allow that site and its scopes must permit the APIs you want to use.

- **Public SLAS client:** omit `slas-client-secret`. Register `http://localhost:3000/callback` as an allowed redirect URI for the configured client.
- **Private SLAS client:** also add `"slas-client-secret": "your-slas-client-secret"` to the same instance entry.

The API Browser obtains a **guest shopper token**. Requests requiring a registered customer or additional shopper context need an appropriate client application. If no SLAS client ID is configured, the extension can try to discover a public client when your Account Manager access permits it; configure the client and site explicitly when you need a particular storefront.

See [Salesforce SLAS setup](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas.html) for client types, channels, redirect URIs, and scopes.

## Refresh or troubleshoot

The token bar shows the authentication status. Use **Refresh Token** to request a token with your current credentials; authorization is managed by the extension, so there is no separate Swagger sign-in.

After changing the instance, short code, tenant, or site, close existing API tabs, refresh the API list, and reopen the API so its request defaults match the new connection.

| Problem                            | Check                                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| The API list does not load         | Account Manager credentials, short code, tenant, `sfcc.scapi-schemas` scope, and tenant filter.          |
| An Admin request returns 403       | The operation's scopes and your client's roles and tenant access.                                        |
| A Shopper token cannot be obtained | Public/private client type, secret if private, allowed channel/site, scopes, and redirect URI if public. |
| A request returns 401              | Refresh the token and check the selected instance and client.                                            |

**Try it out sends real requests.** Check the instance and request values before executing an operation that changes data.
