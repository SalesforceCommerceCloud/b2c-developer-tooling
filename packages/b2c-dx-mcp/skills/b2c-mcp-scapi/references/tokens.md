# Token exports for external clients

Only use when the task explicitly needs a shopper token or an HTTP client outside
code mode. `scapi.request()` and snippets already authenticate; `auth.slas()` neither
configures their authentication nor enables unsupported registered-shopper requests.
Run through `scapi_execute`, with the same project configuration and skill acknowledgment.

## Account Manager

Not available in code mode: Account Manager tokens carry broad Admin access and
would bypass Safety Mode in an external client. Use CLI `b2c auth token`, passing
repeated `--auth-scope` flags for operation scopes and
`SALESFORCE_COMMERCE_API:<tenantId>` when calling SCAPI directly.

## SLAS

```javascript
async () => auth.slas({flow: 'guest'});
```

Options: `flow?: 'guest' | 'registered'` (default guest), `siteId?: string`,
`redirectUri?: string`, `shopperLogin?: string`, `shopperPassword?: string`.
Registered flow requires both shopper credentials. Supply sensitive values via
tool `input`, never embed them in saved source.

`auth` is defined only when `slasClientId` is configured; otherwise `typeof auth`
is `'undefined'`. Requires configured `shortCode`, `tenantId`, `slasClientId`, and siteId (configured
or option). `slasClientSecret` selects private-client authentication; otherwise
public PKCE. Default redirect URI: `http://localhost:3000/callback`; it must be
registered on the SLAS client. No browser or callback listener is launched.
Returns SLAS fields: `access_token`, `refresh_token`, `expires_in`, `token_type`,
`usid`, `customer_id`, optional `id_token`. CLI equivalent: `b2c slas token`.

## Output and failures

Only the program's returned value reaches the tool result; return a token only
when needed. Do not log tokens or put them in saved snippets. `auth.slas()` calls count
toward execution's 20 calls/four concurrent limit and must be awaited.

`SCAPI_AUTH_*` failures identify missing configuration or grant failures. Inspect
masked configuration first; then use the main skill's setup references. Check
SLAS client type, scopes, channel/site, and registered redirect URI for rejected
flows. A token does not grant additional permissions.

Use exported tokens with an external client. Direct HTTP is outside MCP Safety
Mode; never switch to it merely to bypass a blocked managed request.
