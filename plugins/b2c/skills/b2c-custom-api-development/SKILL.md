---
name: b2c-custom-api-development
description: Guide for developing SCAPI Custom APIs on Salesforce B2C Commerce
---

# Custom API Development Skill

This skill guides you through developing Custom APIs for Salesforce B2C Commerce. Custom APIs let you expose custom script code as REST endpoints under the SCAPI framework.

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

Custom APIs are defined within cartridges. Create a `rest-apis` folder in the cartridge directory with subdirectories for each API:

```
/my-cartridge
    /cartridge
        package.json
        /rest-apis
            /my-api-name              # API name (lowercase alphanumeric and hyphens only)
                api.json              # Mapping file
                schema.yaml           # OAS 3.0 contract
                script.js             # Implementation
        /scripts
        /controllers
```

**Important:** API directory names can only contain alphanumeric lowercase characters and hyphens.

## Component 1: API Contract (schema.yaml)

The API contract defines endpoints using OAS 3.0 format:

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

### Contract Requirements

- **Version:** Defined in `info.version`, transformed to URL version (e.g., `1.0.1` becomes `v1`)
- **Security Scheme:** Use `ShopperToken` for Shopper APIs or `AmOAuth2` for Admin APIs
- **Custom Scopes:** Must start with `c_`, contain only alphanumeric/hyphen/period/underscore, max 25 chars
- **Parameters:** All request parameters must be defined; custom params must have `c_` prefix
- **System Parameters:** `siteId` and `locale` must have `type: string` and `minLength: 1`
- **No additionalProperties:** The `additionalProperties` attribute is not allowed in request body schemas

### Shopper vs Admin APIs

| Aspect | Shopper API | Admin API |
|--------|-------------|-----------|
| Security Scheme | `ShopperToken` | `AmOAuth2` |
| `siteId` Parameter | Required | Must omit |
| Max Runtime | 10 seconds | 60 seconds |
| Max Request Body | 5 MiB | 20 MB |
| Activity Type | STOREFRONT | BUSINESS_MANAGER |

## Component 2: Implementation (script.js)

The implementation script exports functions matching `operationId` values:

```javascript
var RESTResponseMgr = require('dw/system/RESTResponseMgr');

exports.getMyData = function() {
    // Get query parameters
    var myParam = request.getHttpParameterMap().get('c_my_param').getStringValue();

    // Get path parameters (for paths like /items/{itemId})
    var itemId = request.getSCAPIPathParameters().get('itemId');

    // Get request body (for POST/PUT/PATCH)
    var requestBody = JSON.parse(request.httpParameterMap.requestBodyAsString);

    // Business logic here...
    var result = {
        data: 'my data',
        param: myParam
    };

    // Return success response
    RESTResponseMgr.createSuccess(result).render();
};
exports.getMyData.public = true;  // Required: mark function as public

// Error response example
exports.getMyDataWithError = function() {
    RESTResponseMgr
        .createError(404, 'not-found', 'Resource Not Found', 'The requested resource was not found.')
        .render();
};
exports.getMyDataWithError.public = true;
```

### Implementation Best Practices

- Always return JSON format responses
- Use RFC 9457 error format with at least the `type` field
- Mark all exported functions with `.public = true`
- Handle errors gracefully to avoid circuit breaker activation
- GET requests cannot commit transactions

### Caching Responses

Enable Page Caching for the site, then use:

```javascript
// Cache for 60 seconds
response.setExpires(Date.now() + 60000);

// Personalized caching
response.setVaryBy('price_promotion');
```

### Remote Includes

Include responses from other SCAPI endpoints:

```javascript
var include = dw.system.RESTResponseMgr.createScapiRemoteInclude(
    'custom', 'other-api', 'v1', 'endpointPath',
    dw.web.URLParameter('siteId', 'MySite')
);

var response = {
    data: 'my data',
    included: [include]
};
RESTResponseMgr.createSuccess(response).render();
```

## Component 3: Mapping (api.json)

The mapping file binds endpoints to implementations:

```json
{
  "endpoints": [
    {
      "endpoint": "getMyData",
      "schema": "schema.yaml",
      "implementation": "script"
    },
    {
      "endpoint": "getMyDataV2",
      "schema": "schema_v2.yaml",
      "implementation": "script_v2"
    }
  ]
}
```

**Important:**
- Implementation name must NOT include file extension
- Schema and implementation files must be in the same folder as api.json
- No relative paths allowed

## Endpoint Registration

Endpoints are registered when **activating the code version** containing the API definitions. After uploading your cartridge:

1. **Upload the cartridge** to your B2C instance
2. **Activate the code version** to trigger registration
3. **Check registration status** to verify endpoints are active

For Shopper APIs, the cartridge must be in the site's cartridge path. For Admin APIs, the cartridge must be in the Business Manager site's cartridge path.

## Circuit Breaker Protection

Custom APIs have a circuit breaker that blocks requests when error rate exceeds 50%:

1. Circuit opens after 50+ errors in 100 requests
2. Requests return 503 for 60 seconds
3. Circuit enters half-open state, testing next 10 requests
4. If >5 fail, circuit reopens; otherwise closes

**Prevention:** Write robust code with error handling and avoid long-running remote calls.

## Troubleshooting

When endpoints return 404 or fail to register:

1. **Check registration status** using the Custom API status report
2. **Review error reasons** in the status report for specific guidance
3. **Verify cartridge structure:** `rest-apis/{api-name}/` contains all files
4. **Check code version:** Ensure the active version contains your API
5. **Verify site assignment:** Cartridge must be in site's cartridge path
6. **Review logs** in Log Center with LCQL filter `CustomApiRegistry`

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Contract violation (unknown/invalid params) | Define all params in schema |
| 401 Unauthorized | Invalid/missing token | Check token validity and header |
| 403 Forbidden | Missing scope | Verify scope in token matches contract |
| 404 Not Found | Endpoint not registered | Check status report, verify structure |
| 500 Internal Error | Script error | Check logs for `CustomApiInvocationException` |
| 503 Service Unavailable | Circuit breaker open | Fix script errors, wait for reset |

## Authentication Setup

### For Shopper APIs (ShopperToken)

1. Configure custom scope in SLAS Admin UI
2. Obtain token via Shopper Login (SLAS)
3. Include `siteId` in requests

### For Admin APIs (AmOAuth2)

1. Configure custom scope in Account Manager
2. Obtain token via Account Manager OAuth
3. Omit `siteId` from requests

### Custom API Status Report Access

To query the Custom API status report, use an Account Manager token with scope:
- `sfcc.custom-apis` (read-only)
- `sfcc.custom-apis.rw` (read-write)

## Development Workflow

1. **Create cartridge** with `rest-apis/{api-name}/` structure
2. **Define contract** (schema.yaml) with endpoints and security
3. **Implement logic** (script.js) with exported functions
4. **Create mapping** (api.json) binding endpoints to implementation
5. **Upload cartridge** to your B2C instance
6. **Activate code version** to register endpoints
7. **Check status** to verify registration
8. **Test endpoints** with appropriate authentication
9. **Monitor logs** for errors during development
10. **Iterate** on implementation as needed

## HTTP Methods Supported

- GET (no transaction commits)
- POST
- PUT
- PATCH
- DELETE
- HEAD
- OPTIONS

## Limitations

- Maximum 50 remote includes per request
- Schema attribute `additionalProperties` is not allowed
- Only local `$ref` references supported in schemas (no remote/URL refs)
- Custom parameters must have `c_` prefix
- Custom scope names max 25 characters
