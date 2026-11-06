---
'@salesforce/b2c-tooling-sdk': minor
---

Apps that embed the SDK can sign users in to Account Manager without a local redirect server (including app-scheme redirect URIs), keep sessions in their own storage, and get a typed `AuthRequiredError` when sign-in is needed instead of a browser opening. New helpers read a token's roles and tenant filter (`readAccountManagerClaims`) and create a Commerce API client for chosen tenants (`provisionCommerceApiClient`). `b2c am` permission errors now list the roles in your current token.
