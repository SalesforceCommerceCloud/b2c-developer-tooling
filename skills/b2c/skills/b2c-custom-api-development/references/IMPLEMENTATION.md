# Implementation Reference (script.js)

## Complete Implementation Example

> Illustrative Script API integration; confirm current Custom API request handling, path parameter access, and response patterns with `b2c docs read commerce-api/custom-api-components-references` and Script API docs for `dw.system.Request`.

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

## Best Practices

- Always return JSON format responses
- Use RFC 9457 error format with at least the `type` field
- Mark all exported functions with `.public = true`
- Handle errors gracefully to avoid circuit breaker activation
- GET requests cannot commit transactions

## Caching Responses

Enable Page Caching for the site, then use:

```javascript
// Cache for 60 seconds
response.setExpires(Date.now() + 60000);

// Personalized caching
response.setVaryBy('price_promotion');
```

## Remote Includes

Include responses from other SCAPI endpoints, including another endpoint of the same Custom API. The platform resolves and caches each include separately, which makes includes a good fit for slow or third-party data that should be cached on its own TTL:

```javascript
var RESTResponseMgr = require('dw/system/RESTResponseMgr');
var Site = require('dw/system/Site');
var URLParameter = require('dw/web/URLParameter');

exports.getProductDetails = function () {
    var productId = request.getSCAPIPathParameters().get('productId');
    var params = [URLParameter('siteId', Site.current.ID), URLParameter('c_productId', productId)];
    // Forward the caller's locale as sent (e.g. en-US); request.locale (en_US) is rejected by SCAPI
    var locale = request.httpParameterMap.get('locale').stringValue;
    if (locale) {
        params.push(URLParameter('locale', locale));
    }
    var include = RESTResponseMgr.createScapiRemoteInclude.apply(
        null, ['custom', 'product-details', 'v1', 'enrichment'].concat(params)
    );

    response.setExpires(Date.now() + 5 * 60 * 1000);
    RESTResponseMgr.createSuccess({id: productId, enrichment: include}).render();
};

exports.getProductEnrichment = function () {
    // Path parameters are unavailable inside an include; read the declared c_ query parameter
    var productId = request.httpParameterMap.get('c_productId').stringValue;
    var enrichment = fetchEnrichment(productId);

    // Soft-fail with 200: an error status from the include fails the parent request
    response.setExpires(Date.now() + (enrichment.available ? 60 : 5) * 60 * 1000);
    RESTResponseMgr.createSuccess(enrichment).render();
};
```

**Request context inside an include target** (observed on a sandbox; confirm with `commerce-api/custom-api-remote-includes`):

- `request.isIncludeRequest()` is `true`.
- `request.getSCAPIPathParameters()` returns `null` and `request.httpPath` is the **parent's** path. Give include targets a path without path parameters (`/enrichment`, not `/products/{productId}/enrichment`) and pass inputs as `c_` query parameters declared in `schema.yaml`.
- `request.httpQueryString` and `request.httpParameterMap` are the include's **own** parameters.
- Pass `locale` in SCAPI form (`en-US`). `request.locale` returns `en_US` (or `default`), which SCAPI rejects with 400 `invalid-locale`. Forward the caller's raw `locale` parameter only when present.

**Failure and caching behavior:**

- When an include returns an error status (a 400 from a bad `locale`, a 500 from a script error), the parent responds with 500. Keep include targets returning 200 with an `available: false`-style flag for soft failures such as provider timeouts.
- The parent and each include are cached independently, so set `response.setExpires()` in both. A parent cache hit still resolves its includes from their own cache entries.
- Include target failures show up in error logs under the parent's path, with `include` in the request type (e.g. `.../products/p1|GET|include|...`). Search logs for `WAInclude` to find include-level errors.

## External Service Calls

When calling external services via `LocalServiceRegistry.createService()`, configure the service in Business Manager or import via site archive:

```javascript
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var service = LocalServiceRegistry.createService('my.external.api', {
    createRequest: function(svc, args) {
        svc.setRequestMethod('GET');
        svc.addHeader('Authorization', 'Bearer ' + args.token);
        return null;
    },
    parseResponse: function(svc, client) {
        return JSON.parse(client.text);
    }
});

var result = service.call({ token: 'my-token' });
```

See `b2c:b2c-webservices` skill for service configuration and services.xml format.

## services.xml Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<services xmlns="http://www.demandware.com/xml/impex/services/2014-09-26">

    <service-credential service-credential-id="my.external.api">
        <url>https://api.example.com/v1</url>
    </service-credential>

    <service-profile service-profile-id="my.external.api.profile">
        <timeout-millis>5000</timeout-millis>
        <rate-limit-enabled>false</rate-limit-enabled>
        <cb-enabled>true</cb-enabled>
        <cb-calls>5</cb-calls>
        <cb-millis>10000</cb-millis>
    </service-profile>

    <service service-id="my.external.api">
        <service-type>HTTP</service-type>
        <enabled>true</enabled>
        <log-prefix>MYAPI</log-prefix>
        <comm-log-enabled>true</comm-log-enabled>
        <profile-id>my.external.api.profile</profile-id>
        <credential-id>my.external.api</credential-id>
    </service>

</services>
```

Import with: `b2c job import ./my-services-folder`

## HTTP Methods Supported

- GET (no transaction commits)
- POST
- PUT
- PATCH
- DELETE
- HEAD
- OPTIONS

## Circuit Breaker Protection

> Illustrative thresholds; confirm current circuit breaker behavior, error rate calculations, and timeout values with `b2c docs read commerce-api/custom-api-circuit-breaker`.

Custom APIs have a circuit breaker that blocks requests when error rate exceeds 50%:

1. Circuit opens after 50+ errors in 100 requests
2. Requests return 503 for 60 seconds
3. Circuit enters half-open state, testing next 10 requests
4. If >5 fail, circuit reopens; otherwise closes

**Prevention:** Write robust code with error handling and avoid long-running remote calls.
