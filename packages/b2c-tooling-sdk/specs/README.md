# OAS Schemas

This directory contains OpenAPI Specification (OAS) schemas used for defining and documenting APIs in the B2C tooling ecosystem. These are retrieved from public sources

## OCAPI

Note that the OCAPI DATA schema in ./data-api.json is a modified version adapted from the original Swagger 2.0 to OAS 3.0 and postprocessed to improve compatibility with openapi-fetch tooling. See ../scripts/fix-ocapi-spec.js

## SLAS Admin

`slas-admin-v1.yaml` is converted from the bundled SCAPI schema (`schemas/scapi/shopper/auth-admin/v1.json`) and corrected where the live service differs from the published contract:

- `Tenant` includes `merchantName`.
- `IdentityProvider` requests use `isPreferred` (the service rejects `preferenceValue`) and accept `clientAuthType`, which updates require.
- `IdentityProviderResponse` includes the service-populated fields `id`, `tenantId`, `idpOrigin`, `clientAuthType`, `privateJwtKeyAlgorithm` and `privateJwtKeyPair`.
- Password action template responses are snake_case groups (`PasswordActionTemplateGroup`); GET returns an array of them.
- The `actionType` query parameter accepts `WEBAUTHN_AUTHORIZE_USER`.

The corrections are recorded in the spec's `info.x-b2c-tooling-notes`. Re-apply them when refreshing the spec.

