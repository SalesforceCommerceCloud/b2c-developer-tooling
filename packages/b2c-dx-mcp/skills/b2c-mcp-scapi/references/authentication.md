# SCAPI authentication

- `scapi.request()` and snippets using it authenticate automatically. Do not acquire
  or pass tokens first. For an explicitly requested token or external HTTP client,
  use `auth.accountManager()` / `auth.slas()` in `scapi_execute`:
  [token exports](tokens.md). These helpers are unavailable in search.
- The operation's declared security selects the credential; there is no auth option.
- Admin `AmOAuth2`: Account Manager credentials. Each request selects operation/tenant
  scopes and reuses suitable cached tokens; no upfront scope union.
- Shopper `ShopperToken`: a SLAS guest shopper (`slasClientId`, plus `slasClientSecret`
  for private clients; Storefront Next `.env` supplies both). Requests need `siteId`
  (configured or `query.siteId`). The guest session is per site and persists across
  executions for the server session, so baskets carry over. SLAS scopes are fixed on
  the client, not requested per call; 401/403 diagnostics compare the token's scopes
  with the operation's. `sfcc.shopper-standard` satisfies only operations that list it.
  Public clients must allow redirect URI `http://localhost:3000/callback`.
- Missing credentials: `config_inspect` with masking. `clientId` is Admin;
  `slasClientId` is Shopper. Configuration does not grant access.
- Scope rejection: grant reported scopes in Account Manager; check extra configured
  scopes. Read/write alternatives are alternatives. Later failures do not undo writes.
- Unsupported: registered-shopper-only operations (`RegisteredShopperToken`),
  trusted-system/agent on-behalf tokens, and SLAS itself (`shopper/auth/v1`).
  `auth.slas({flow: 'registered', ...})` exports a registered token for external clients.
  SLAS admin roles differ: `docs_read({query: "cli-slas"})` ([online](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/slas.md)).
- HTTP 401/403 retain `status`/`data` plus `diagnostic`; preserve these.
  A 403 alone does not prove missing scopes.

For missing values or wrong targets, read [MCP configuration](skill://mcp/b2c-mcp-config/SKILL.md)
(`skills_read` ID `mcp/b2c-mcp-config`). For external client/role/tenant-filter setup,
use `docs_read({query: "guide-authentication"})`; official Admin authorization:
`commerce-api/authorization-for-admin-apis`, scope definitions: `commerce-api/auth-z-scope-catalog`.
For other access questions, search `docs_search` with the specific error and API.
If docs are unavailable, use the [authentication guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication.md).
These are conditional setup references, not additional prerequisite reads.
