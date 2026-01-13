# HTTP Services Reference

Patterns for implementing HTTP and REST API integrations.

## HTTPService Methods

| Method | Description |
|--------|-------------|
| `setRequestMethod(method)` | Set HTTP method (GET, POST, PUT, DELETE, PATCH) |
| `addHeader(name, value)` | Add request header |
| `addParam(name, value)` | Add URL query parameter |
| `setURL(url)` | Override the service URL |
| `setAuthentication(type)` | Set auth type ("BASIC" or "NONE") |
| `setEncoding(encoding)` | Set request body encoding (default: UTF-8) |
| `setOutFile(file)` | Write response to file |
| `setCachingTTL(seconds)` | Enable response caching |
| `setIdentity(keyRef)` | Set mTLS client certificate |
| `setHostNameVerification(bool)` | Enable/disable hostname verification |

## HTTPClient Properties (in parseResponse)

The `client` parameter in `parseResponse` is an `HTTPClient`:

| Property | Description |
|----------|-------------|
| `text` | Response body as string |
| `statusCode` | HTTP status code |
| `statusMessage` | HTTP status message |
| `responseHeaders` | Response headers |
| `errorText` | Error response body |

## REST API Examples

### GET Request

```javascript
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var productService = LocalServiceRegistry.createService('my.product.api', {
    createRequest: function (svc, productId) {
        svc.setRequestMethod('GET');
        svc.addHeader('Accept', 'application/json');
        svc.setURL(svc.URL + '/products/' + productId);
        return null; // GET has no body
    },

    parseResponse: function (svc, client) {
        if (client.statusCode === 200) {
            return JSON.parse(client.text);
        }
        return null;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage
var result = productService.call('SKU123');
if (result.ok) {
    var product = result.object;
}
```

### POST with JSON Body

```javascript
var orderService = LocalServiceRegistry.createService('my.order.api', {
    createRequest: function (svc, orderData) {
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/json');
        svc.addHeader('Accept', 'application/json');
        return JSON.stringify(orderData);
    },

    parseResponse: function (svc, client) {
        var response = {
            statusCode: client.statusCode,
            success: client.statusCode >= 200 && client.statusCode < 300
        };

        if (response.success) {
            response.data = JSON.parse(client.text);
        } else {
            response.error = client.errorText || client.text;
        }

        return response;
    },

    filterLogMessage: function (msg) {
        // Filter credit card numbers
        msg = msg.replace(/\b\d{13,16}\b/g, '****');
        return msg;
    }
});

// Usage
var result = orderService.call({
    orderNumber: 'ORD123',
    items: [{ sku: 'PROD1', qty: 2 }]
});
```

### PUT Request

```javascript
var updateService = LocalServiceRegistry.createService('my.update.api', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('PUT');
        svc.addHeader('Content-Type', 'application/json');
        svc.setURL(svc.URL + '/items/' + params.id);
        return JSON.stringify(params.data);
    },

    parseResponse: function (svc, client) {
        return {
            success: client.statusCode === 200,
            data: client.statusCode === 200 ? JSON.parse(client.text) : null
        };
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

### DELETE Request

```javascript
var deleteService = LocalServiceRegistry.createService('my.delete.api', {
    createRequest: function (svc, resourceId) {
        svc.setRequestMethod('DELETE');
        svc.setURL(svc.URL + '/resources/' + resourceId);
        return null;
    },

    parseResponse: function (svc, client) {
        return {
            success: client.statusCode === 204 || client.statusCode === 200
        };
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

### GET with Query Parameters

```javascript
var searchService = LocalServiceRegistry.createService('my.search.api', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('GET');
        svc.addHeader('Accept', 'application/json');

        // Add query parameters
        if (params.query) {
            svc.addParam('q', params.query);
        }
        if (params.limit) {
            svc.addParam('limit', params.limit.toString());
        }
        if (params.offset) {
            svc.addParam('offset', params.offset.toString());
        }

        return null;
    },

    parseResponse: function (svc, client) {
        return JSON.parse(client.text);
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage: /search?q=shoes&limit=10&offset=0
var result = searchService.call({
    query: 'shoes',
    limit: 10,
    offset: 0
});
```

## Authentication Patterns

### Basic Authentication

Basic auth uses credentials from Business Manager:

```javascript
var basicAuthService = LocalServiceRegistry.createService('my.basic.auth.api', {
    createRequest: function (svc, params) {
        // Authentication is automatic if credential has user/password
        svc.setAuthentication('BASIC');
        svc.setRequestMethod('GET');
        return null;
    },

    parseResponse: function (svc, client) {
        return JSON.parse(client.text);
    },

    filterLogMessage: function (msg) {
        // Filter Authorization header
        return msg.replace(/Authorization:\s*Basic\s+[^\r\n]+/gi, 'Authorization: Basic ***');
    }
});
```

### Bearer Token (OAuth)

```javascript
var oauthService = LocalServiceRegistry.createService('my.oauth.api', {
    createRequest: function (svc, params) {
        var token = params.accessToken;
        svc.setAuthentication('NONE'); // Don't use basic auth
        svc.setRequestMethod('GET');
        svc.addHeader('Authorization', 'Bearer ' + token);
        return null;
    },

    parseResponse: function (svc, client) {
        return JSON.parse(client.text);
    },

    filterLogMessage: function (msg) {
        return msg.replace(/Bearer\s+[^\s\r\n]+/gi, 'Bearer ***');
    }
});
```

### API Key Authentication

```javascript
var apiKeyService = LocalServiceRegistry.createService('my.apikey.api', {
    createRequest: function (svc, params) {
        var credential = svc.configuration.credential;
        svc.setAuthentication('NONE');
        svc.setRequestMethod('GET');
        // API key in header
        svc.addHeader('X-API-Key', credential.password);
        return null;
    },

    parseResponse: function (svc, client) {
        return JSON.parse(client.text);
    },

    filterLogMessage: function (msg) {
        return msg.replace(/X-API-Key:\s*[^\r\n]+/gi, 'X-API-Key: ***');
    }
});
```

### OAuth 2.0 Client Credentials Flow

```javascript
// Token service
var tokenService = LocalServiceRegistry.createService('my.oauth.token', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');

        var credential = svc.configuration.credential;
        var body = 'grant_type=client_credentials';
        body += '&client_id=' + encodeURIComponent(credential.user);
        body += '&client_secret=' + encodeURIComponent(credential.password);

        return body;
    },

    parseResponse: function (svc, client) {
        return JSON.parse(client.text);
    },

    filterLogMessage: function (msg) {
        msg = msg.replace(/client_secret=[^&\s]+/gi, 'client_secret=***');
        msg = msg.replace(/"access_token"\s*:\s*"[^"]+"/gi, '"access_token":"***"');
        return msg;
    }
});

// Get token and use it
function callApiWithOAuth(params) {
    // Get access token
    var tokenResult = tokenService.call();
    if (!tokenResult.ok) {
        throw new Error('Failed to get access token');
    }

    var accessToken = tokenResult.object.access_token;

    // Call API with token
    var apiService = LocalServiceRegistry.createService('my.protected.api', {
        createRequest: function (svc, params) {
            svc.setAuthentication('NONE');
            svc.addHeader('Authorization', 'Bearer ' + accessToken);
            svc.setRequestMethod('GET');
            return null;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        },
        filterLogMessage: function (msg) {
            return msg.replace(/Bearer\s+[^\s\r\n]+/gi, 'Bearer ***');
        }
    });

    return apiService.call(params);
}
```

## Form Submissions (HTTPForm)

For `application/x-www-form-urlencoded` submissions:

```javascript
var formService = LocalServiceRegistry.createService('my.form.api', {
    // HTTPForm automatically handles form encoding
    // Pass a Map or Object as the call parameter
    parseResponse: function (svc, client) {
        return client.text;
    },

    filterLogMessage: function (msg) {
        return msg.replace(/password=[^&]+/gi, 'password=***');
    }
});

// Usage - pass a Map for form data
var HashMap = require('dw/util/HashMap');
var formData = new HashMap();
formData.put('username', 'user@example.com');
formData.put('action', 'subscribe');

var result = formService.call(formData);
```

## Multipart Form Data

For file uploads:

```javascript
var HTTPRequestPart = require('dw/net/HTTPRequestPart');

var uploadService = LocalServiceRegistry.createService('my.upload.api', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('POST');

        var parts = [];

        // Text field
        parts.push(new HTTPRequestPart('description', params.description));

        // File field
        parts.push(new HTTPRequestPart(
            'file',
            params.file,
            params.filename,
            params.contentType
        ));

        return parts; // Array of HTTPRequestPart triggers multipart
    },

    parseResponse: function (svc, client) {
        return JSON.parse(client.text);
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage
var File = require('dw/io/File');
var file = new File(File.IMPEX + '/src/upload.csv');
var result = uploadService.call({
    description: 'Product import',
    file: file,
    filename: 'products.csv',
    contentType: 'text/csv'
});
```

## Downloading Files

```javascript
var File = require('dw/io/File');

var downloadService = LocalServiceRegistry.createService('my.download.api', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('GET');
        svc.setURL(svc.URL + '/files/' + params.fileId);

        // Write response directly to file
        var outFile = new File(File.IMPEX + '/src/' + params.filename);
        svc.setOutFile(outFile);

        return null;
    },

    parseResponse: function (svc, client) {
        return {
            success: client.statusCode === 200,
            file: svc.outFile
        };
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

## Response Caching

Enable caching for GET requests:

```javascript
var cachedService = LocalServiceRegistry.createService('my.cached.api', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('GET');
        // Cache for 5 minutes
        svc.setCachingTTL(300);
        return null;
    },

    parseResponse: function (svc, client) {
        return JSON.parse(client.text);
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

Caching restrictions:
- Only GET requests
- Only 2xx status codes
- Response < 50KB
- Response not written to file

## Custom HTTP Client Configuration

Override HTTP client options:

```javascript
var customService = LocalServiceRegistry.createService('my.custom.api', {
    initServiceClient: function (svc) {
        // Return configuration options
        return {
            allowHTTP2: true
        };
    },

    createRequest: function (svc, params) {
        svc.setRequestMethod('GET');
        return null;
    },

    parseResponse: function (svc, client) {
        return JSON.parse(client.text);
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

## Mutual TLS (mTLS)

For client certificate authentication:

```javascript
var KeyRef = require('dw/crypto/KeyRef');

var mtlsService = LocalServiceRegistry.createService('my.mtls.api', {
    createRequest: function (svc, params) {
        // Set client certificate
        svc.setIdentity(new KeyRef('my-client-cert'));
        svc.setRequestMethod('GET');
        return null;
    },

    parseResponse: function (svc, client) {
        return JSON.parse(client.text);
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

## XML API Example

```javascript
var xmlService = LocalServiceRegistry.createService('my.xml.api', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/xml');
        svc.addHeader('Accept', 'application/xml');

        var xml = new XML('<request/>');
        xml.@id = params.id;
        xml.name = params.name;

        return xml.toXMLString();
    },

    parseResponse: function (svc, client) {
        var responseXml = new XML(client.text);
        return {
            status: responseXml.status.toString(),
            message: responseXml.message.toString()
        };
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

## Error Response Handling

```javascript
var robustService = LocalServiceRegistry.createService('my.robust.api', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/json');
        return JSON.stringify(params);
    },

    parseResponse: function (svc, client) {
        var response = {
            statusCode: client.statusCode,
            success: false,
            data: null,
            errors: []
        };

        if (client.statusCode >= 200 && client.statusCode < 300) {
            response.success = true;
            try {
                response.data = JSON.parse(client.text);
            } catch (e) {
                response.data = client.text;
            }
        } else {
            // Try to parse error response
            var errorBody = client.errorText || client.text;
            try {
                var errorData = JSON.parse(errorBody);
                response.errors = errorData.errors || [errorData.message];
            } catch (e) {
                response.errors = [errorBody || 'Unknown error'];
            }
        }

        return response;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```
