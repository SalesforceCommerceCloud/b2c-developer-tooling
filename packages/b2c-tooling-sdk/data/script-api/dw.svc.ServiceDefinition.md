<!-- prettier-ignore-start -->
# Class ServiceDefinition

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.svc.ServiceDefinition](dw.svc.ServiceDefinition.md)

Base class of Service Definitions.


A service definition represents configuration that is shared across all [Service](dw.svc.Service.md) instances.


**Deprecated:**
:::warning
This class is only used with the deprecated [ServiceRegistry](dw.svc.ServiceRegistry.md). Use the [LocalServiceRegistry](dw.svc.LocalServiceRegistry.md)
            instead, which allows configuration on the [Service](dw.svc.Service.md) directly.

:::
**API Version:**
:::note
No longer available as of version 19.10.
:::

## All Known Subclasses
[FTPServiceDefinition](dw.svc.FTPServiceDefinition.md), [HTTPFormServiceDefinition](dw.svc.HTTPFormServiceDefinition.md), [HTTPServiceDefinition](dw.svc.HTTPServiceDefinition.md), [SOAPServiceDefinition](dw.svc.SOAPServiceDefinition.md)
## Property Summary

| Property | Description |
| --- | --- |
| [configuration](#configuration): [ServiceConfig](dw.svc.ServiceConfig.md) `(read-only)` | Returns the Service Configuration stored in the database. |
| [mock](#mock): [Boolean](TopLevel.Boolean.md) | Returns the status of whether mock mode is enabled for all instances of this definition. |
| [serviceName](#servicename): [String](TopLevel.String.md) `(read-only)` | Returns the name of this service. |
| [throwOnError](#throwonerror): [Boolean](TopLevel.Boolean.md) | Returns the status of whether the shared throwOnError flag is set. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [configure](dw.svc.ServiceDefinition.md#configureobject)([Object](TopLevel.Object.md)) | Register a callback to handle custom portions of the service. |
| [getConfiguration](dw.svc.ServiceDefinition.md#getconfiguration)() | Returns the Service Configuration stored in the database. |
| [getServiceName](dw.svc.ServiceDefinition.md#getservicename)() | Returns the name of this service. |
| [isMock](dw.svc.ServiceDefinition.md#ismock)() | Returns the status of whether mock mode is enabled for all instances of this definition. |
| [isThrowOnError](dw.svc.ServiceDefinition.md#isthrowonerror)() | Returns the status of whether the shared throwOnError flag is set. |
| [setMock](dw.svc.ServiceDefinition.md#setmock)() | Sets the mock mode for all Service instances that use this definition. |
| [setThrowOnError](dw.svc.ServiceDefinition.md#setthrowonerror)() | Sets the throwOnError flag to true for all Service instances that use this definition. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### configuration
- configuration: [ServiceConfig](dw.svc.ServiceConfig.md) `(read-only)`
  - : Returns the Service Configuration stored in the database.


---

### mock
- mock: [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether mock mode is enabled for all instances of this definition.


---

### serviceName
- serviceName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of this service.


---

### throwOnError
- throwOnError: [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether the shared throwOnError flag is set.


---

## Method Details

### configure(Object)
- configure(config: [Object](TopLevel.Object.md)): [ServiceDefinition](dw.svc.ServiceDefinition.md)
  - : Register a callback to handle custom portions of the service.
      
      
      This callback may declare multiple methods:
      
      
      ```
      {
        initServiceClient: function() {
            // Create and return the internal service client object.
            // This is usually optional, except in the case of SOAP services.
        },
      
        // svc is the call-specific Service instance. For example, it may be an HTTPService or FTPService.
        // params are the arguments passed to the call method (if any).
        createRequest: function(svc:Service, params) {
             // Perform any required call-time configuration.
             // Optionally return a Service-specific object
        },
      
        // svc is the call-specific Service instance.
        // arg is the output of createRequest.
        execute: function(svc:Service, arg:Object) {
             // Execute the service call and return a result
             // This method is not used by default for HTTP-related services unless executeOverride is set.
        },
      
        // Use the execute function if it is present. This is only required to use the functionality with HTTP services.
        executeOverride: true,
      
        // svc is the call-specific Service instance.
        // response is the output of execute.
        parseResponse: function(svc:Service, response: Object) {
             // Process the response object as needed.
             // The return value of this method will be the return value of the outer call method.
        },
      
        // svc is the call-specific Service instance.
        // arg is the output of createRequest.
        mockCall: function(svc:Service, arg:Object) {
             // This method takes the place of the 'execute' phase when mocking is enabled.
             // Note initServiceClient, createRequest, and parseResponse still invoked.
        },
      
        // svc is the call-specific Service instance.
        // params are the arguments passed to the call method (if any).
        mockFull: function(svc:Service, params) {
             // This method takes the place of the entire service call when mocking is enabled.
             // No other callbacks are invoked. The output of this method becomes the output of call.
        }
      
      }
      ```


    **Parameters:**
    - config - Callback object.

    **Returns:**
    - this


---

### getConfiguration()
- getConfiguration(): [ServiceConfig](dw.svc.ServiceConfig.md)
  - : Returns the Service Configuration stored in the database.

    **Returns:**
    - Service Configuration.


---

### getServiceName()
- getServiceName(): [String](TopLevel.String.md)
  - : Returns the name of this service.

    **Returns:**
    - Service name.


---

### isMock()
- isMock(): [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether mock mode is enabled for all instances of this definition.

    **Returns:**
    - true for mock mode, false otherwise.


---

### isThrowOnError()
- isThrowOnError(): [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether the shared throwOnError flag is set.

    **Returns:**
    - throwOnError flag.


---

### setMock()
- setMock(): [ServiceDefinition](dw.svc.ServiceDefinition.md)
  - : Sets the mock mode for all Service instances that use this definition.

    **Returns:**
    - this Service Definition.


---

### setThrowOnError()
- setThrowOnError(): [ServiceDefinition](dw.svc.ServiceDefinition.md)
  - : Sets the throwOnError flag to true for all Service instances that use this definition.

    **Returns:**
    - this Service Definition.


---

<!-- prettier-ignore-end -->
