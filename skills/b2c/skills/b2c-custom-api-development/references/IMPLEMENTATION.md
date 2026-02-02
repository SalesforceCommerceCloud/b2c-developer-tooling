# Implementation Reference (script.js)

## Complete Implementation Example

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

Custom APIs have a circuit breaker that blocks requests when error rate exceeds 50%:

1. Circuit opens after 50+ errors in 100 requests
2. Requests return 503 for 60 seconds
3. Circuit enters half-open state, testing next 10 requests
4. If >5 fail, circuit reopens; otherwise closes

**Prevention:** Write robust code with error handling and avoid long-running remote calls.
