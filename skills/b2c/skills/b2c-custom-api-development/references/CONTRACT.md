# API Contract Reference (schema.yaml)

## Full Schema Example

```yaml
openapi: 3.0.0
info:
  version: 1.0.0                      # API version (1.0.0 becomes v1 in URL)
  title: My Custom API
components:
  securitySchemes:
    ShopperToken:                     # For Shopper APIs (requires siteId)
      type: oauth2
      flows:
        clientCredentials:
          tokenUrl: https://{shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/{organizationId}/oauth2/token
          scopes:
            c_my_scope: Description of my scope
    AmOAuth2:                         # For Admin APIs (no siteId)
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
| `siteId` Parameter | Required | Must omit |
| Max Runtime | 10 seconds | 60 seconds |
| Max Request Body | 5 MiB | 20 MB |
| Activity Type | STOREFRONT | BUSINESS_MANAGER |

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
