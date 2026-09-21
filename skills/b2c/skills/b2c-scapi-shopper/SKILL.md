---
name: b2c-scapi-shopper
description: Call Shopper Commerce APIs (SCAPI) from headless storefronts and composable commerce apps. Use this skill whenever the user is building with PWA Kit, Storefront Next (SFNext), or a headless frontend and needs to search products, manage baskets, submit orders, access customer data, or set shopper context. Also use when they ask about Shopper API authentication, checkout flows from a frontend app, or performance optimization for API calls — even if they just say "search products from my PWA" or "build a headless checkout".
---

# Shopper Commerce APIs

Build storefront product, basket, checkout, customer, and context flows with SCAPI.
For backend management use [Admin APIs](../b2c-scapi-admin/SKILL.md).

## Tool choice

When B2C MCP is available:
- Read `skill://mcp/scapi/SKILL.md` once through resources or `skills_read` before
  code-mode tools; pass `skillRead: true`.
- `scapi_search` with `authType: "shopper"` discovers bundled contracts offline.
  Find method/path/operationId first, then selected inputs, response fields, and
  security. Mixed Admin/Shopper operations can appear in either filter.
- Shopper execution is unsupported in `scapi_execute`; adding a SLAS client
  cannot enable it. Execute storefront flows through the application's Shopper
  SDK/client with the appropriate SLAS token flow. Prefer dedicated tools where available.
- `scapi_schemas_list` retrieves live tenant contracts and custom attributes;
  `scapi_custom_apis_get_status` checks custom registration. Code mode does not
  execute custom APIs.
- `config_inspect` reports configured values with masking. `docs_search`/`docs_read`
  answer platform semantics, authentication, and limits; avoid duplicate contract reads.

CLI alternatives: `b2c scapi schemas list`,
`b2c scapi schemas get <family> <name> <version>`, and `b2c setup inspect`.
These schema commands use live Schemas API access; MCP discovery is offline.

## Integration essentials

- Reuse configured shortCode, organizationId, and siteId; do not invent identifiers.
- Shopper authentication uses SLAS guest/registered flows and client scopes;
  Account Manager credentials are not a substitute. Keep private-client secrets
  and token exchange on the backend.
- Discover the contract for the selected API version. Examples are illustrative;
  verify version-specific behavior and limits in official docs.
- Preserve basket/order state and handle errors explicitly. Page/filter responses
  and return only fields needed by the next operation.
- For headless payment authorization, inspect
  [order-PI hooks](../b2c-hooks/SKILL.md#headless-order-payment-use-the-order-pi-authorization-seam)
  and [order lifecycle](../b2c-ordering/SKILL.md) before choosing a placement flow.

## Conditional references

- [Client examples](references/CLIENT-EXAMPLES.md): implementing auth and API calls.
- [Checkout](references/CHECKOUT-FLOW.md): basket-to-order workflow.
- [Common patterns](references/COMMON-PATTERNS.md): errors, pagination, field selection.
- [Scopes](references/SCOPES.md): Shopper grants by family.
- [SLAS](../../../b2c-cli/skills/b2c-slas/SKILL.md): CLI client management.
- [Advanced auth](../b2c-slas-auth-patterns/SKILL.md): OTP, passkeys, session bridge.
- Official docs: `commerce-api/use-shopper-api`, `commerce-api/slas`,
  `commerce-api/work-with-baskets-orders`, `commerce-api/shopper-context-best-practices`,
  `commerce-api/auth-z-scope-catalog`, `commerce-api/performance`.
