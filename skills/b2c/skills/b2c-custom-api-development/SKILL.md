---
name: b2c-custom-api-development
description: Develop Custom SCAPI REST endpoints with api.json routes, schema.yaml definitions, and OAuth scope configuration. Use this skill whenever the user needs to create a custom API on the Commerce platform, define OpenAPI 3.0 schemas for request/response, structure the rest-apis cartridge folder, or debug endpoint registration and 404 issues. Also use when building headless commerce integrations, choosing between Shopper (`ShopperToken`) and Admin (`AmOAuth2`) APIs, or troubleshooting why a Custom API endpoint isn't appearing or returning 404 in `b2c scapi custom status` — even if they just say 'custom REST endpoint', 'expose my script as an API', or 'my admin custom API isn't registering'.
---

# Custom API Development Skill

This skill guides you through developing Custom APIs for Salesforce B2C Commerce. Custom APIs let you expose custom script code as REST endpoints under the SCAPI framework.

> **Tip:** If `b2c` CLI is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli code deploy`).

## Overview

A Custom API URL has this structure:

```
https://{shortCode}.api.commercecloud.salesforce.com/custom/{apiName}/{apiVersion}/organizations/{organizationId}/{endpointPath}
```

Three components are required to create a Custom API:

1. **API Contract** - An OAS 3.0 schema file (YAML)
2. **API Implementation** - A script using the B2C Commerce Script API
3. **API Mapping** - An `api.json` file binding endpoints to implementations

## Cartridge Structure

```
/my-cartridge
    /cartridge
        package.json
        /rest-apis
            /my-api-name              # API name (lowercase alphanumeric and hyphens only)
                api.json              # Mapping file
                schema.yaml           # OAS 3.0 contract
                script.js             # Implementation
```

**Important:** API directory names can only contain alphanumeric lowercase characters and hyphens.

## Component 1: API Contract (schema.yaml)

Minimal example:

```yaml
openapi: 3.0.0
info:
  version: 1.0.0
  title: My Custom API
components:
  securitySchemes:
    ShopperToken:
      type: oauth2
      flows:
        clientCredentials:
          tokenUrl: https://{shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/{organizationId}/oauth2/token
          scopes:
            c_my_scope: My custom scope
  parameters:
    siteId:
      name: siteId
      in: query
      required: true
      schema:
        type: string
        minLength: 1
paths:
  /my-endpoint:
    get:
      operationId: getMyData
      parameters:
        - $ref: '#/components/parameters/siteId'
      responses:
        '200':
          description: Success
security:
  - ShopperToken: ['c_my_scope']
```

**Key requirements:**
- Use `ShopperToken` for Shopper APIs (requires siteId), `AmOAuth2` for Admin APIs
- Custom scopes must start with `c_`, max 25 chars
- Custom parameters must have `c_` prefix

### Cartridge path requirements (where the platform looks up your `rest-apis/` folder)

| Call shape | Cartridge path searched |
|---|---|
| Shopper API (`ShopperToken`) — always site-scoped | The **storefront site's** cartridge path (the site that issued the SLAS token) |
| Admin API (`AmOAuth2`) with `siteId=<storefront-site>` | That **storefront site's** cartridge path |
| Admin API (`AmOAuth2`) with `siteId=Sites-Site` (the special BM/organization site) | The **Business Manager** cartridge path |
| Admin API (`AmOAuth2`) with `siteId` omitted | The **Business Manager** cartridge path |

Admin APIs can be invoked in either site or organization context — the `siteId` parameter is optional, and one special value addresses the org context explicitly:

- Passing a real storefront site ID (e.g. `siteId=RefArch`) runs the call in that site's context and resolves the cartridge against that site's cartridge path.
- Passing `siteId=Sites-Site` is the literal way to invoke the Admin API against the **Business Manager / organization site**. `Sites-Site` is not a real storefront — it's the system-defined site that represents BM/org-level operations. The platform resolves the cartridge through the BM cartridge path.
- Omitting `siteId` entirely is equivalent to org context and also resolves through the BM cartridge path.

The BM cartridge path is the common gotcha: if your Admin API is intended for org-level operations (called with `siteId=Sites-Site` or with `siteId` omitted), the cartridge containing `rest-apis/` **must** be on the BM cartridge path. A typical symptom is "registers fine when called with a storefront `siteId` but 404s in org context," or never appears in `b2c scapi custom status` for the org context.

Manage cartridge paths with the CLI (no BM clicks needed):

```bash
# Inspect the current BM cartridge path
b2c sites cartridges list --bm

# Add a cartridge to BM for org-context Admin APIs
b2c sites cartridges add my_admin_api_cartridge --bm --position first

# Add a cartridge to a storefront site (for Shopper APIs or site-scoped Admin APIs)
b2c sites cartridges add my_api_cartridge --site-id RefArch --position first
```

After updating any cartridge path, re-activate the code version (`b2c code deploy --reload` or `b2c code activate <version>`) so the platform re-registers the endpoints.

To set the BM cartridge path manually in Business Manager: **Administration > Sites > Manage Sites > Business Manager (link in the header) > Settings > Cartridges**.

See [Contract Reference](references/CONTRACT.md) for full schema examples and Shopper vs Admin API differences.

## Component 2: Implementation (script.js)

```javascript
var RESTResponseMgr = require('dw/system/RESTResponseMgr');

exports.getMyData = function() {
    var myParam = request.getHttpParameterMap().get('c_my_param').getStringValue();
    var result = { data: 'my data', param: myParam };
    RESTResponseMgr.createSuccess(result).render();
};
exports.getMyData.public = true;  // Required
```

**Key requirements:**
- Mark exported functions with `.public = true`
- Use `RESTResponseMgr.createSuccess()` for responses
- Use `RESTResponseMgr.createError()` for error responses (RFC 9457 format)

See [Implementation Reference](references/IMPLEMENTATION.md) for caching, remote includes, and external service calls.

## Component 3: Mapping (api.json)

```json
{
  "endpoints": [
    {
      "endpoint": "getMyData",
      "schema": "schema.yaml",
      "implementation": "script"
    }
  ]
}
```

**Important:** Implementation name must NOT include file extension.

## Development Workflow

1. Create cartridge with `rest-apis/{api-name}/` structure
2. Define contract (schema.yaml) with endpoints and security
3. Implement logic (script.js) with exported functions
4. Create mapping (api.json) binding endpoints to implementation
5. Deploy and **activate** the code version (`--reload`) to register endpoints — required on first registration and any contract (`schema.yaml` / `api.json`) change
6. Check registration status and test
7. For subsequent edits to `script.js` of an already-registered endpoint, redeploy without `--reload` — re-activation isn't needed for implementation-only changes

### Deployment

```bash
# Deploy and activate to (re-)register endpoints
b2c code deploy ./my-cartridge --reload

# Deploy without re-activation (fine for implementation-only edits to already-registered endpoints)
b2c code deploy ./my-cartridge

# Check registration status
b2c scapi custom status --tenant-id zzpq_013

# Show failed registrations with error reasons
b2c scapi custom status --tenant-id zzpq_013 --status not_registered --columns apiName,endpointPath,errorReason
```

#### When you need to re-activate the code version (`--reload`)

Custom API endpoint registration is rebuilt on **code-version activation**, not on every file upload. That means:

| Change | Re-activation required? |
|---|---|
| New endpoint, new API, or first-time registration | Yes |
| Edits to `schema.yaml` (paths, params, security, scopes, request/response shapes) | Yes |
| Edits to `api.json` (endpoint → implementation mapping) | Yes |
| Adding/removing the cartridge from a site or BM cartridge path | Yes |
| Edits to `script.js` (or any implementation/library code) for an **already-registered** endpoint | **No** — the new code is picked up live; just deploy without `--reload` |

So during normal iteration on the *implementation* of an endpoint that's already registered, you can deploy repeatedly without paying the re-activation cost. Reach for `--reload` (or `b2c code activate <version>`) only when the *contract* changes or when an endpoint isn't registering yet.

## Authentication Setup

### For Shopper APIs

1. Create a SLAS client with your custom scope(s):
   ```bash
   b2c slas client create --default-scopes --scopes "c_my_scope"
   ```
2. Obtain token via SLAS client credentials
3. Include `siteId` in all requests

### For Admin APIs

1. Configure custom scope in Account Manager
2. Obtain token via Account Manager OAuth
3. Omit `siteId` from requests

See [Testing Reference](references/TESTING.md) for curl examples and authentication setup.

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Invalid/unknown params | Define all params in schema |
| 401 Unauthorized | Invalid token | Check token validity |
| 403 Forbidden | Missing scope | Verify scope in token |
| 404 Not Found | Not registered | Check `b2c scapi custom status` |
| 500 Internal Error | Script error | Check `b2c logs get --level ERROR` |
| 503 Service Unavailable | Circuit breaker open | Fix errors, wait for reset |

### Registration Issues

- **Shopper-API endpoint not appearing:** verify the cartridge is on the **site's** cartridge path (`b2c sites cartridges list --site-id <site>`), then re-activate the code version.
- **Admin-API endpoint called with a storefront `siteId`:** verify the cartridge is on **that site's** cartridge path.
- **Admin-API endpoint called with `siteId=Sites-Site` (or with `siteId` omitted) returns 404 / never registers:** the cartridge must be on the **Business Manager cartridge path**. Check with `b2c sites cartridges list --bm` and add it via `b2c sites cartridges add <cartridge> --bm --position first`. Re-activate the code version after. See [Cartridge path requirements](#cartridge-path-requirements-where-the-platform-looks-up-your-rest-apis-folder) above.
- **Check logs:** Use `b2c logs get` or filter Log Center with `CustomApiRegistry`

## Related Skills

- `b2c-cli:b2c-code` - Deploying cartridges and activating code versions
- `b2c-cli:b2c-scapi-custom` - Checking Custom API registration status
- `b2c-cli:b2c-slas` - Creating SLAS clients for testing Shopper APIs
- `b2c:b2c-webservices` - Service configuration for external calls

## Reference Documentation

- [Contract Reference](references/CONTRACT.md) - Full schema.yaml examples, Shopper vs Admin APIs
- [Implementation Reference](references/IMPLEMENTATION.md) - script.js patterns, caching, remote includes
- [Testing Reference](references/TESTING.md) - Authentication setup, curl examples
