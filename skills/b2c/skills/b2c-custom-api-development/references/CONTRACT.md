# API Contract Reference (schema.yaml)

## Full Schema Example

```yaml
openapi: 3.0.0
info:
  version: 1.0.0                      # API version (1.0.0 becomes v1 in URL)
  title: My Custom API
components:
  securitySchemes:
    ShopperToken:                     # For Shopper APIs — always site-scoped (requires siteId)
      type: oauth2
      flows:
        clientCredentials:
          tokenUrl: https://{shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/{organizationId}/oauth2/token
          scopes:
            c_my_scope: Description of my scope
    AmOAuth2:                         # For Admin APIs — siteId optional (site or org context)
      type: oauth2
      flows:
        clientCredentials:
          tokenUrl: https://account.demandware.com/dwsso/oauth2/access_token
          scopes:
            c_my_admin_scope: Description of my admin scope
  parameters:
    siteId:
      name: siteId
      in: query
      required: true
      schema:
        type: string
        minLength: 1
    locale:
      name: locale
      in: query
      required: false
      schema:
        type: string
        minLength: 1
paths:
  /my-endpoint:
    get:
      summary: Get something
      operationId: getMyData         # Must match function name in script
      parameters:
        - $ref: '#/components/parameters/siteId'
        - in: query
          name: c_my_param           # Custom params must start with c_
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
security:
  - ShopperToken: ['c_my_scope']     # Global security (or per-operation)
```

## Contract Requirements

- **Version:** Defined in `info.version`, transformed to URL version (e.g., `1.0.1` becomes `v1`)
- **Security Scheme:** Use `ShopperToken` for Shopper APIs or `AmOAuth2` for Admin APIs
- **Custom Scopes:** Must start with `c_`, contain only alphanumeric/hyphen/period/underscore, max 25 chars
- **Parameters:** All request parameters must be defined; custom params must have `c_` prefix
- **System Parameters:** `siteId` and `locale` must have `type: string` and `minLength: 1`
- **No additionalProperties:** The `additionalProperties` attribute is not allowed in request body schemas

## Shopper vs Admin APIs

| Aspect | Shopper API | Admin API |
|--------|-------------|-----------|
| Security Scheme | `ShopperToken` | `AmOAuth2` |
| `siteId` Parameter | Required (always site-scoped) | Optional — see "Admin API call contexts" below |
| Max Runtime | 10 seconds | 60 seconds |
| Max Request Body | 5 MiB | 20 MB |
| Activity Type | STOREFRONT | BUSINESS_MANAGER |

### Admin API call contexts

Unlike Shopper APIs, Admin APIs (`AmOAuth2`) can be invoked in either a storefront site context or the Business Manager / organization context. The `siteId` parameter selects which:

| Context | `siteId` value | Cartridge path used to resolve `rest-apis/` |
|---|---|---|
| Storefront site context | A real site ID (e.g. `RefArch`) | That **site's** cartridge path |
| Organization / Business Manager context | The literal value `Sites-Site` | The **Business Manager** cartridge path |
| Organization / Business Manager context | `siteId` omitted | The **Business Manager** cartridge path |

`Sites-Site` is not a real storefront — it's the system-defined site identifier the platform uses for BM / org-level operations. Passing `siteId=Sites-Site` is the explicit way to invoke an Admin Custom API against the BM context; omitting `siteId` resolves the same way.

If you want the same Admin API to work in both contexts, declare `siteId` as an *optional* parameter (drop `required: true`). The cartridge containing your `rest-apis/` folder must be on whichever cartridge path corresponds to how the caller invokes it — the storefront site's path for storefront-`siteId` calls, and the BM cartridge path for `Sites-Site` / omitted-`siteId` calls.

## Path Parameter Example

```yaml
paths:
  /items/{itemId}:
    get:
      operationId: getItem
      parameters:
        - $ref: '#/components/parameters/siteId'
        - in: path
          name: itemId
          required: true
          schema:
            type: string
```

## Request Body Example (POST/PUT/PATCH)

```yaml
paths:
  /items:
    post:
      operationId: createItem
      parameters:
        - $ref: '#/components/parameters/siteId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - name
              properties:
                name:
                  type: string
                c_customField:
                  type: string
      responses:
        '201':
          description: Created
```
