---
'@salesforce/b2c-tooling-sdk': minor
---

The SLAS Admin client types now include identity provider, password action template, batch logout, and shopper delete operations. The `NO_UPDATE` safety level now blocks SLAS batch logout.

Fixed SLAS Admin types that did not match the live service: the `*PwdlessTemplate` operations are now `*PwdActionTemplate` and GET returns the template list, `PWD_FORGOT_ACTION` is removed from the action types, and `IdentityProvider.preferenceValue` and `PasswordActionTemplate.clientId` are removed. Code that used these fields never received them from the service; use `isPreferred` for identity providers.
