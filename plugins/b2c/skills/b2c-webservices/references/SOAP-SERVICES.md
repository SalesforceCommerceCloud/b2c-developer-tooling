# SOAP Services Reference

Patterns for implementing SOAP web service integrations using WSDL-generated stubs.

## SOAPService Methods

| Method | Description |
|--------|-------------|
| `setServiceClient(stub)` | Set the WSDL-generated service stub |
| `getServiceClient()` | Get the service stub |
| `setAuthentication(type)` | Set auth type ("BASIC" or "NONE") |

## SOAP Service Setup

### 1. Upload WSDL

Upload your WSDL file to Business Manager:
1. Go to **Administration > Development Setup**
2. Under **WebDAV** section, navigate to the cartridge
3. Upload WSDL to `webreferences2/` folder

### 2. Generate Stub

The stub is auto-generated from the WSDL. Access it via:

```javascript
var stub = webreferences2.MyServiceWSDL.getDefaultService();
```

### 3. Create Service Configuration

Configure in Business Manager:
1. **Service Type**: SOAP
2. **URL**: The SOAP endpoint URL
3. **Credential**: Authentication credentials

## Basic SOAP Service

```javascript
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var soapService = LocalServiceRegistry.createService('my.soap.service', {
    /**
     * Create the service client (stub)
     */
    initServiceClient: function (svc) {
        return webreferences2.MyServiceWSDL.getDefaultService();
    },

    /**
     * Configure the request
     */
    createRequest: function (svc, params) {
        // Create request object from WSDL-generated types
        var request = new webreferences2.MyServiceWSDL.MyRequest();
        request.setId(params.id);
        request.setName(params.name);
        return request;
    },

    /**
     * Execute the SOAP call
     */
    execute: function (svc, request) {
        var client = svc.serviceClient;
        return client.myOperation(request);
    },

    /**
     * Parse the response
     */
    parseResponse: function (svc, response) {
        return {
            status: response.getStatus(),
            result: response.getResult()
        };
    },

    filterLogMessage: function (msg) {
        // Filter sensitive data from SOAP envelope
        msg = msg.replace(/<password>[^<]+<\/password>/gi, '<password>***</password>');
        return msg;
    }
});

// Usage
var result = soapService.call({ id: '123', name: 'Test' });
if (result.ok) {
    var data = result.object;
}
```

## Alternative: Set Client in createRequest

```javascript
var soapService = LocalServiceRegistry.createService('my.soap.service', {
    createRequest: function (svc, params) {
        // Set the service client here instead of initServiceClient
        var stub = webreferences2.MyServiceWSDL.getDefaultService();
        svc.setServiceClient(stub);

        // Create request
        var request = new webreferences2.MyServiceWSDL.MyRequest();
        request.setId(params.id);
        return request;
    },

    execute: function (svc, request) {
        return svc.serviceClient.myOperation(request);
    },

    parseResponse: function (svc, response) {
        return response;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

## WS-Security

Use `WSUtil` for WS-Security headers:

```javascript
var WSUtil = require('dw/ws/WSUtil');

var secureService = LocalServiceRegistry.createService('my.secure.soap', {
    initServiceClient: function (svc) {
        return webreferences2.SecureServiceWSDL.getDefaultService();
    },

    createRequest: function (svc, params) {
        var stub = svc.serviceClient;

        // Add WS-Security UsernameToken
        var credential = svc.configuration.credential;
        WSUtil.setWSSecurityUsernameToken(
            stub,
            credential.user,
            credential.password,
            null  // nonce (optional)
        );

        var request = new webreferences2.SecureServiceWSDL.SecureRequest();
        request.setData(params.data);
        return request;
    },

    execute: function (svc, request) {
        return svc.serviceClient.secureOperation(request);
    },

    parseResponse: function (svc, response) {
        return response;
    },

    filterLogMessage: function (msg) {
        msg = msg.replace(/<wsse:Password[^>]*>[^<]+<\/wsse:Password>/gi, '<wsse:Password>***</wsse:Password>');
        return msg;
    }
});
```

### WSUtil Methods

| Method | Description |
|--------|-------------|
| `setWSSecurityUsernameToken(stub, user, pass, nonce)` | Add UsernameToken header |
| `setProperty(stub, property, value)` | Set SOAP property |
| `addSOAPHeader(stub, namespace, name, value)` | Add custom SOAP header |

### WS-Security with Timestamps

```javascript
var WSUtil = require('dw/ws/WSUtil');

var timestampService = LocalServiceRegistry.createService('my.timestamp.soap', {
    initServiceClient: function (svc) {
        return webreferences2.TimestampServiceWSDL.getDefaultService();
    },

    createRequest: function (svc, params) {
        var stub = svc.serviceClient;
        var credential = svc.configuration.credential;

        // Username token with timestamp
        WSUtil.setWSSecurityUsernameToken(
            stub,
            credential.user,
            credential.password,
            WSUtil.generateNonce()
        );

        // Set timestamp properties
        WSUtil.setProperty(stub, WSUtil.WS_ACTION, 'Timestamp UsernameToken');

        var request = new webreferences2.TimestampServiceWSDL.Request();
        request.setData(params.data);
        return request;
    },

    execute: function (svc, request) {
        return svc.serviceClient.operation(request);
    },

    parseResponse: function (svc, response) {
        return response;
    },

    filterLogMessage: function (msg) {
        return msg.replace(/<wsse:Password[^>]*>[^<]+<\/wsse:Password>/gi, '<wsse:Password>***</wsse:Password>');
    }
});
```

## Custom SOAP Headers

```javascript
var WSUtil = require('dw/ws/WSUtil');

var headerService = LocalServiceRegistry.createService('my.header.soap', {
    initServiceClient: function (svc) {
        return webreferences2.HeaderServiceWSDL.getDefaultService();
    },

    createRequest: function (svc, params) {
        var stub = svc.serviceClient;

        // Add custom SOAP header
        WSUtil.addSOAPHeader(
            stub,
            'http://example.com/ns',
            'CustomHeader',
            '<customValue>' + params.headerValue + '</customValue>'
        );

        var request = new webreferences2.HeaderServiceWSDL.Request();
        request.setData(params.data);
        return request;
    },

    execute: function (svc, request) {
        return svc.serviceClient.operation(request);
    },

    parseResponse: function (svc, response) {
        return response;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

## Handling Complex Types

WSDL-generated types provide setters and getters:

```javascript
var orderService = LocalServiceRegistry.createService('my.order.soap', {
    initServiceClient: function (svc) {
        return webreferences2.OrderServiceWSDL.getDefaultService();
    },

    createRequest: function (svc, order) {
        var request = new webreferences2.OrderServiceWSDL.CreateOrderRequest();

        // Set order header
        var header = new webreferences2.OrderServiceWSDL.OrderHeader();
        header.setOrderNumber(order.orderNo);
        header.setOrderDate(order.creationDate);
        header.setCurrency(order.currencyCode);
        request.setHeader(header);

        // Set line items (array)
        var lineItems = [];
        for (var i = 0; i < order.productLineItems.length; i++) {
            var pli = order.productLineItems[i];
            var lineItem = new webreferences2.OrderServiceWSDL.LineItem();
            lineItem.setSku(pli.productID);
            lineItem.setQuantity(pli.quantity.value);
            lineItem.setPrice(pli.price.value);
            lineItems.push(lineItem);
        }
        request.setLineItems(lineItems);

        // Set shipping address
        var address = new webreferences2.OrderServiceWSDL.Address();
        var shipAddr = order.defaultShipment.shippingAddress;
        address.setFirstName(shipAddr.firstName);
        address.setLastName(shipAddr.lastName);
        address.setAddress1(shipAddr.address1);
        address.setCity(shipAddr.city);
        address.setPostalCode(shipAddr.postalCode);
        address.setCountryCode(shipAddr.countryCode.value);
        request.setShippingAddress(address);

        return request;
    },

    execute: function (svc, request) {
        return svc.serviceClient.createOrder(request);
    },

    parseResponse: function (svc, response) {
        return {
            success: response.isSuccess(),
            externalOrderId: response.getExternalOrderId(),
            message: response.getMessage()
        };
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

## Error Handling

```javascript
var robustSoapService = LocalServiceRegistry.createService('my.robust.soap', {
    initServiceClient: function (svc) {
        return webreferences2.RobustServiceWSDL.getDefaultService();
    },

    createRequest: function (svc, params) {
        var request = new webreferences2.RobustServiceWSDL.Request();
        request.setData(params);
        return request;
    },

    execute: function (svc, request) {
        try {
            return svc.serviceClient.operation(request);
        } catch (e) {
            // Handle SOAP faults
            var faultMessage = '';
            if (e.faultString) {
                faultMessage = e.faultString;
            } else if (e.message) {
                faultMessage = e.message;
            }
            throw new Error('SOAP Fault: ' + faultMessage);
        }
    },

    parseResponse: function (svc, response) {
        if (!response) {
            return { success: false, error: 'No response received' };
        }

        return {
            success: response.getStatus() === 'SUCCESS',
            data: response.getData(),
            errorCode: response.getErrorCode(),
            errorMessage: response.getErrorMessage()
        };
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

## Mock SOAP Services

```javascript
var mockSoapService = LocalServiceRegistry.createService('my.mock.soap', {
    initServiceClient: function (svc) {
        return webreferences2.MockServiceWSDL.getDefaultService();
    },

    createRequest: function (svc, params) {
        var request = new webreferences2.MockServiceWSDL.Request();
        request.setId(params.id);
        return request;
    },

    execute: function (svc, request) {
        return svc.serviceClient.getData(request);
    },

    parseResponse: function (svc, response) {
        return {
            id: response.getId(),
            name: response.getName(),
            status: response.getStatus()
        };
    },

    /**
     * Mock the execute phase
     */
    mockCall: function (svc, request) {
        // Return mock response object
        return {
            getId: function () { return request.getId(); },
            getName: function () { return 'Mock Name'; },
            getStatus: function () { return 'ACTIVE'; }
        };
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
```

## Multiple Operations

```javascript
var multiOpService = LocalServiceRegistry.createService('my.multi.soap', {
    initServiceClient: function (svc) {
        return webreferences2.MultiOpWSDL.getDefaultService();
    },

    createRequest: function (svc, params) {
        // Store operation type for execute
        svc.operationType = params.operation;

        var request;
        switch (params.operation) {
            case 'create':
                request = new webreferences2.MultiOpWSDL.CreateRequest();
                request.setData(params.data);
                break;
            case 'update':
                request = new webreferences2.MultiOpWSDL.UpdateRequest();
                request.setId(params.id);
                request.setData(params.data);
                break;
            case 'delete':
                request = new webreferences2.MultiOpWSDL.DeleteRequest();
                request.setId(params.id);
                break;
        }
        return request;
    },

    execute: function (svc, request) {
        var client = svc.serviceClient;
        switch (svc.operationType) {
            case 'create':
                return client.create(request);
            case 'update':
                return client.update(request);
            case 'delete':
                return client.delete(request);
        }
    },

    parseResponse: function (svc, response) {
        return {
            success: response.isSuccess(),
            message: response.getMessage()
        };
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage
var createResult = multiOpService.call({
    operation: 'create',
    data: { name: 'New Item' }
});

var updateResult = multiOpService.call({
    operation: 'update',
    id: '123',
    data: { name: 'Updated Item' }
});
```

## Setting SOAP Endpoint

Override the endpoint URL at runtime:

```javascript
var dynamicEndpointService = LocalServiceRegistry.createService('my.dynamic.soap', {
    initServiceClient: function (svc) {
        return webreferences2.DynamicWSDL.getDefaultService();
    },

    createRequest: function (svc, params) {
        // Override endpoint if specified
        if (params.endpoint) {
            svc.setURL(params.endpoint);
        }

        var request = new webreferences2.DynamicWSDL.Request();
        request.setData(params.data);
        return request;
    },

    execute: function (svc, request) {
        return svc.serviceClient.operation(request);
    },

    parseResponse: function (svc, response) {
        return response;
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});

// Usage with custom endpoint
var result = dynamicEndpointService.call({
    endpoint: 'https://custom-endpoint.example.com/soap',
    data: { key: 'value' }
});
```

## MTOM/Attachments

For SOAP services with binary attachments:

```javascript
var WSUtil = require('dw/ws/WSUtil');

var mtomService = LocalServiceRegistry.createService('my.mtom.soap', {
    initServiceClient: function (svc) {
        var stub = webreferences2.MTOMServiceWSDL.getDefaultService();

        // Enable MTOM
        WSUtil.setProperty(stub, WSUtil.WS_MTOM_ENABLED, true);

        return stub;
    },

    createRequest: function (svc, params) {
        var request = new webreferences2.MTOMServiceWSDL.UploadRequest();
        request.setFileName(params.fileName);
        request.setFileData(params.fileData); // byte array
        return request;
    },

    execute: function (svc, request) {
        return svc.serviceClient.upload(request);
    },

    parseResponse: function (svc, response) {
        return {
            success: response.isSuccess(),
            fileId: response.getFileId()
        };
    },

    filterLogMessage: function (msg) {
        // Don't log binary data
        return msg.replace(/<fileData>[^<]*<\/fileData>/gi, '<fileData>***BINARY***</fileData>');
    }
});
```
