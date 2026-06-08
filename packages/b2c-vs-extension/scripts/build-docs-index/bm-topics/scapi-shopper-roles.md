---
id: scapi-shopper-roles
title: SCAPI / OCAPI Shopper Roles
category: api
tags: [scapi, ocapi, role, permission, oauth]
---

Storefront-facing APIs (Shopper API, OCAPI Shop) require an Account Manager
client with the right shopper roles in addition to OAuth credentials. Missing
roles is the most common cause of `400 invalid_scope` and `403` errors.

## Where to manage

`Administration > Site Development > Open Commerce API Settings` (OCAPI)

`Administration > Site Development > Shopper API Settings` (SCAPI, in newer
realms)

## Common shopper roles

- `sfcc.shopper-products` — product detail pages.
- `sfcc.shopper-baskets` — basket and checkout.
- `sfcc.shopper-orders` — post-checkout retrieval.
- `sfcc.shopper-customers` — customer registration and login.
- `sfcc.shopper-search` — product search and suggestions.
- `sfcc.shopper-stores` — store locator endpoints.

## Granting roles

Roles are granted to an Account Manager **API Client** (not to a person). When
adding a client:

1. Create the client in Account Manager.
2. Assign tenant access for the realm.
3. Tick the shopper roles the storefront needs.
4. Use the client's credentials in `dw.json` — the B2C CLI commands and the
   VS Code extension will use them for SLAS / SCAPI traffic.

## Tips

- The B2C CLI's `slas client list` command surfaces the exact scopes a token
  resolves to — useful when you suspect a missing role.
- Errors that contain the literal string `invalid_scope` always trace back to
  this configuration.
- Per-site OCAPI settings cache for ~10 minutes after edit. Use the **Reset
  cache** button when the change isn't picked up.
