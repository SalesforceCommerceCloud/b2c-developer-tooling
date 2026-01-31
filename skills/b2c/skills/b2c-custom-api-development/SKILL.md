---
name: b2c-custom-api-development
description: Develop Custom SCAPI endpoints for B2C Commerce. Use when creating REST APIs, defining api.json routes, writing schema.yaml (OAS 3.0), or building headless commerce integrations. Covers cartridge structure, endpoint implementation, and OAuth scope configuration.
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
5. Deploy and activate to register endpoints
6. Check registration status and test

### Deployment

```bash
# Deploy and activate to register endpoints
b2c code deploy ./my-cartridge --reload

# Check registration status
b2c scapi custom status --tenant-id zzpq_013

# Show failed registrations with error reasons
b2c scapi custom status --tenant-id zzpq_013 --status not_registered --columns apiName,endpointPath,errorReason
```

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

- **Endpoint not appearing:** Verify cartridge is in site's cartridge path, re-activate code version
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
