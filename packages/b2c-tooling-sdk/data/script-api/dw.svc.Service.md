<!-- prettier-ignore-start -->
# Class Service

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.svc.Service](dw.svc.Service.md)

Base class of Services.


A service represents a call-specific configuration. Any configuration set here is local to the currently executing
call.


**See Also:**
- [LocalServiceRegistry](dw.svc.LocalServiceRegistry.md)
- [ServiceCallback](dw.svc.ServiceCallback.md)


## All Known Subclasses
[FTPService](dw.svc.FTPService.md), [HTTPFormService](dw.svc.HTTPFormService.md), [HTTPService](dw.svc.HTTPService.md), [SOAPService](dw.svc.SOAPService.md)
## Property Summary

| Property | Description |
| --- | --- |
| [URL](#url): [String](TopLevel.String.md) | Returns the current URL, excluding any custom query parameters. |
| [configuration](#configuration): [ServiceConfig](dw.svc.ServiceConfig.md) `(read-only)` | Returns the Service Configuration. |
| [credentialID](#credentialid): [String](TopLevel.String.md) | Returns the ID of the currently associated Credential. |
| [mock](#mock): [Boolean](TopLevel.Boolean.md) | Returns the status of whether this service is executing in mock mode. |
| [requestData](#requestdata): [Object](TopLevel.Object.md) `(read-only)` | Returns the property that stores the object returned by createRequest. |
| [response](#response): [Object](TopLevel.Object.md) `(read-only)` | Returns the property that stores the object returned by the service. |
| [throwOnError](#throwonerror): [Boolean](TopLevel.Boolean.md) | Returns the status of whether this service will throw an error when encountering a problem. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [call](dw.svc.Service.md#callobject)([Object...](TopLevel.Object.md)) | Invokes the service. |
| [getConfiguration](dw.svc.Service.md#getconfiguration)() | Returns the Service Configuration. |
| [getCredentialID](dw.svc.Service.md#getcredentialid)() | Returns the ID of the currently associated Credential. |
| [getRequestData](dw.svc.Service.md#getrequestdata)() | Returns the property that stores the object returned by createRequest. |
| [getResponse](dw.svc.Service.md#getresponse)() | Returns the property that stores the object returned by the service. |
| [getURL](dw.svc.Service.md#geturl)() | Returns the current URL, excluding any custom query parameters. |
| [isMock](dw.svc.Service.md#ismock)() | Returns the status of whether this service is executing in mock mode. |
| [isThrowOnError](dw.svc.Service.md#isthrowonerror)() | Returns the status of whether this service will throw an error when encountering a problem. |
| [setCredentialID](dw.svc.Service.md#setcredentialidstring)([String](TopLevel.String.md)) | Override the Credential by the credential object with the given ID. |
| [setMock](dw.svc.Service.md#setmock)() | Forces the mock mode to be enabled. |
| [setThrowOnError](dw.svc.Service.md#setthrowonerror)() | Forces a Service to throw an error when there is a problem instead of returning a Result with non-OK status. |
| [setURL](dw.svc.Service.md#seturlstring)([String](TopLevel.String.md)) | Override the URL to the given value. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### URL
- URL: [String](TopLevel.String.md)
  - : Returns the current URL, excluding any custom query parameters.


---

### configuration
- configuration: [ServiceConfig](dw.svc.ServiceConfig.md) `(read-only)`
  - : Returns the Service Configuration.


---

### credentialID
- credentialID: [String](TopLevel.String.md)
  - : Returns the ID of the currently associated Credential.


---

### mock
- mock: [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether this service is executing in mock mode.


---

### requestData
- requestData: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns the property that stores the object returned by createRequest.


---

### response
- response: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns the property that stores the object returned by the service.
      
      
      This property is only useful after the service [call(Object...)](dw.svc.Service.md#callobject) completes, and is the same as the object
      inside the [Result](dw.svc.Result.md).



---

### throwOnError
- throwOnError: [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether this service will throw an error when encountering a problem.


---

## Method Details

### call(Object...)
- call(args: [Object...](TopLevel.Object.md)): [Result](dw.svc.Result.md)
  - : Invokes the service.

    **Parameters:**
    - args - Arguments to pass. If there is a single argument and that argument is an array, then each item in the             array will become a separate argument. For example, the following results in three separate arguments             to the service:              
```
            svc.call( [1,2,3] )
```
              and is functionally equivalent to              
```
            svc.call( 1, 2, 3 )
```
              This can be avoided by explicitly forming a [List](dw.util.List.md), enclosing the array in another             array, or by sending a second argument. The following will all send the array as a List in the first             argument.              
```
            svc.call( ArrayList([1,2,3]) )
```
              
```
            svc.call( [[1,2,3]] )
```
              
```
            svc.call( [1,2,3], "" )
```
              Another option is to change the definition of the associated             [ServiceCallback.createRequest(Service, Object...)](dw.svc.ServiceCallback.md#createrequestservice-object) to accept an object instead, and pass the             array as a field of that object:              
```
            svc.call( { 'data': [1,2,3] } )
```


    **Returns:**
    - Result of the service.


---

### getConfiguration()
- getConfiguration(): [ServiceConfig](dw.svc.ServiceConfig.md)
  - : Returns the Service Configuration.

    **Returns:**
    - Service Configuration.


---

### getCredentialID()
- getCredentialID(): [String](TopLevel.String.md)
  - : Returns the ID of the currently associated Credential.

    **Returns:**
    - Credential Name.


---

### getRequestData()
- getRequestData(): [Object](TopLevel.Object.md)
  - : Returns the property that stores the object returned by createRequest.

    **Returns:**
    - Object returned by createRequest.


---

### getResponse()
- getResponse(): [Object](TopLevel.Object.md)
  - : Returns the property that stores the object returned by the service.
      
      
      This property is only useful after the service [call(Object...)](dw.svc.Service.md#callobject) completes, and is the same as the object
      inside the [Result](dw.svc.Result.md).


    **Returns:**
    - Object returned by the service.


---

### getURL()
- getURL(): [String](TopLevel.String.md)
  - : Returns the current URL, excluding any custom query parameters.

    **Returns:**
    - URL.


---

### isMock()
- isMock(): [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether this service is executing in mock mode.

    **Returns:**
    - true for mock mode, false otherwise.


---

### isThrowOnError()
- isThrowOnError(): [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether this service will throw an error when encountering a problem.

    **Returns:**
    - true to throw an error, false otherwise.


---

### setCredentialID(String)
- setCredentialID(id: [String](TopLevel.String.md)): [Service](dw.svc.Service.md)
  - : Override the Credential by the credential object with the given ID.
      
      
      If the URL is also overridden, that URL will continue to override the URL in this credential.


    **Parameters:**
    - id - Credential ID. It must exist.

    **Returns:**
    - this Service.


---

### setMock()
- setMock(): [Service](dw.svc.Service.md)
  - : Forces the mock mode to be enabled.

    **Returns:**
    - this Service.


---

### setThrowOnError()
- setThrowOnError(): [Service](dw.svc.Service.md)
  - : Forces a Service to throw an error when there is a problem instead of returning a Result with non-OK status.

    **Returns:**
    - this Service.


---

### setURL(String)
- setURL(url: [String](TopLevel.String.md)): [Service](dw.svc.Service.md)
  - : Override the URL to the given value. Any query parameters (if applicable) will be appended to this URL.

    **Parameters:**
    - url - Force the URL to the given value.

    **Returns:**
    - this Service.


---

<!-- prettier-ignore-end -->
