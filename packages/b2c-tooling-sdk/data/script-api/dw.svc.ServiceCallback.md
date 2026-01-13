<!-- prettier-ignore-start -->
# Class ServiceCallback

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.svc.ServiceCallback](dw.svc.ServiceCallback.md)

Defines callbacks for use with the [LocalServiceRegistry](dw.svc.LocalServiceRegistry.md).


Note this class itself is not used directly, and is present only for documentation of the available callback methods.


These methods are called in sequence when a service is called:

1. [initServiceClient(Service)](dw.svc.ServiceCallback.md#initserviceclientservice)-- Creates the underlying client that will be used to make the call. This is   intended for SOAP Services and optionally for setting configuration options on the HTTP client. Other client types   will be created automatically.      2. [createRequest(Service, Object...)](dw.svc.ServiceCallback.md#createrequestservice-object)-- Given arguments to the [Service.call(Object...)](dw.svc.Service.md#callobject), configure      the actual service request. This may include setting request headers, defining the message body, etc.            3. [execute(Service, Object)](dw.svc.ServiceCallback.md#executeservice-object)-- Perform the actual request. At this point the client has been configured         with the relevant credentials, so the call should be made. This is required for SOAP services.                  4. [parseResponse(Service, Object)](dw.svc.ServiceCallback.md#parseresponseservice-object)-- Convert the result of the call into an object to be returned from the            [Service.call(Object...)](dw.svc.Service.md#callobject)method.            If the service is mocked (see [Service.isMock()](dw.svc.Service.md#ismock)), then [mockFull(Service, Object...)](dw.svc.ServiceCallback.md#mockfullservice-object)takes the place            of this entire sequence. If that is not implemented, then [mockCall(Service, Object)](dw.svc.ServiceCallback.md#mockcallservice-object)takes the place of just            the [execute(Service, Object)](dw.svc.ServiceCallback.md#executeservice-object)method.            
The URL, request, and response objects may be logged. To avoid logging sensitive data,            [filterLogMessage(String)](dw.svc.ServiceCallback.md#filterlogmessagestring)and/or [getRequestLogMessage(Object)](dw.svc.ServiceCallback.md#getrequestlogmessageobject)and            [getResponseLogMessage(Object)](dw.svc.ServiceCallback.md#getresponselogmessageobject)must be implemented. If they are not implemented then this logging will not be            done on Production environments.            
There are some special considerations for the combination of service type and callback:             |     | Service Type | initServiceClient | createRequest | execute | parseResponse |
| --- |--- |--- |--- |--- |--- |
| HTTP | This is only required to use non-default options. It must return either a [HTTPClient](dw.net.HTTPClient.md) or a Map  containing the [HTTPClient.HTTPClient(Object)](dw.net.HTTPClient.md#httpclientobject) options. | Required unless execute is provided. The return value is expected to be either a String or array of  [HTTPRequestPart](dw.net.HTTPRequestPart.md), which will be used as the request body | Not called unless a boolean "executeOverride:true" is set on the callback. This is a temporary limitation, a  future release will always call this callback if it is present | Required unless execute is provided. |
| HTTPForm | Not normally implemented. Must return a [HTTPClient](dw.net.HTTPClient.md) | Not normally implemented. Default behavior constructs an "application/x-www-form-urlencoded" request based on a  Map given as an argument. | Not normally implemented. The same limitations as HTTP regarding the "executeOverride" flag apply here. | Optional. Default behavior is to return the response body as a String. |
| SOAP | Optional. This must return the Webservice stub or port | Required. If initServiceClient was not provided, then this function must call  [SOAPService.setServiceClient(Object)](dw.svc.SOAPService.md#setserviceclientobject) with the stub or port | Required. A typical implementation will call the webservice via a method on the service client | Optional. Default behavior returns the output of execute |
| FTP | Not normally implemented. Must return a [FTPClient](dw.net.FTPClient.md) or [SFTPClient](dw.net.SFTPClient.md) | Required unless execute is defined. If present, it should call  [FTPService.setOperation(String, Object...)](dw.svc.FTPService.md#setoperationstring-object) | Optional. An implementation may call any required methods on the given client. The default implementation calls  the Operation that was set up and returns the result. | Optional. Default behavior returns the output of execute |
| GENERIC | Optional. | Optional. | Required. The GENERIC type allows any code to be wrapped in the service framework layer, and it's up to this  execute method to define what that logic is. | Optional. |



## Property Summary

| Property | Description |
| --- | --- |
| [URL](#url): [String](TopLevel.String.md) `(read-only)` | Allows overriding the URL provided by the service configuration. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [createRequest](dw.svc.ServiceCallback.md#createrequestservice-object)([Service](dw.svc.Service.md), [Object...](TopLevel.Object.md)) | Creates a request object to be used when calling the service. |
| [execute](dw.svc.ServiceCallback.md#executeservice-object)([Service](dw.svc.Service.md), [Object](TopLevel.Object.md)) | Provides service-specific execution logic. |
| [filterLogMessage](dw.svc.ServiceCallback.md#filterlogmessagestring)([String](TopLevel.String.md)) | Allows filtering communication URL, request, and response log messages. |
| [getRequestLogMessage](dw.svc.ServiceCallback.md#getrequestlogmessageobject)([Object](TopLevel.Object.md)) | Creates a communication log message for the given request. |
| [getResponseLogMessage](dw.svc.ServiceCallback.md#getresponselogmessageobject)([Object](TopLevel.Object.md)) | Creates a response log message for the given request. |
| [getURL](dw.svc.ServiceCallback.md#geturl)() | Allows overriding the URL provided by the service configuration. |
| [initServiceClient](dw.svc.ServiceCallback.md#initserviceclientservice)([Service](dw.svc.Service.md)) | Creates a protocol-specific client object. |
| [mockCall](dw.svc.ServiceCallback.md#mockcallservice-object)([Service](dw.svc.Service.md), [Object](TopLevel.Object.md)) | Override this method to mock the remote portion of the service call. |
| [mockFull](dw.svc.ServiceCallback.md#mockfullservice-object)([Service](dw.svc.Service.md), [Object...](TopLevel.Object.md)) | Override this method to mock the entire service call, including the createRequest, execute, and parseResponse phases. |
| [parseResponse](dw.svc.ServiceCallback.md#parseresponseservice-object)([Service](dw.svc.Service.md), [Object](TopLevel.Object.md)) | Creates a response object from a successful service call. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### URL
- URL: [String](TopLevel.String.md) `(read-only)`
  - : Allows overriding the URL provided by the service configuration.
      
      
      It is usually better to call [Service.setURL(String)](dw.svc.Service.md#seturlstring) within [createRequest(Service, Object...)](dw.svc.ServiceCallback.md#createrequestservice-object)
      because that allows you to modify the existing URL based on call parameters.



---

## Method Details

### createRequest(Service, Object...)
- createRequest(service: [Service](dw.svc.Service.md), params: [Object...](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Creates a request object to be used when calling the service.
      
      
      The type of the object expected is dependent on the service. For example, the [HTTPService](dw.svc.HTTPService.md) expects the
      HTTP request body to be returned.
      
      
      This is required unless the execute method is implemented.
      
      
      It is not recommended to have a service accept a single array or list as a parameter, since doing so requires
      some extra work when actually calling the service. See [Service.call(Object...)](dw.svc.Service.md#callobject) for more details.


    **Parameters:**
    - service - Service being executed.
    - params - Parameters given to the call method.

    **Returns:**
    - Request object to give to the execute method.


---

### execute(Service, Object)
- execute(service: [Service](dw.svc.Service.md), request: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Provides service-specific execution logic.
      
      
      This can be overridden to execute a chain of FTP commands in the [FTPService](dw.svc.FTPService.md), or perform the actual remote
      call on a webservice stub in the [SOAPService](dw.svc.SOAPService.md).


    **Parameters:**
    - service - Service being executed.
    - request - Request object returned by [createRequest(Service, Object...)](dw.svc.ServiceCallback.md#createrequestservice-object).

    **Returns:**
    - Response from the underlying call, to be sent to [parseResponse(Service, Object)](dw.svc.ServiceCallback.md#parseresponseservice-object).

    **Throws:**
    - Exception - 


---

### filterLogMessage(String)
- filterLogMessage(msg: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Allows filtering communication URL, request, and response log messages.
      
      
      If not implemented, then no filtering will be performed and the message will be logged as-is.


    **Parameters:**
    - msg - Original log message.

    **Returns:**
    - Message to be logged.


---

### getRequestLogMessage(Object)
- getRequestLogMessage(request: [Object](TopLevel.Object.md)): [String](TopLevel.String.md)
  - : Creates a communication log message for the given request.
      
      
      If not implemented then the default logic will be used to convert the request into a log message.


    **Parameters:**
    - request - Request object.

    **Returns:**
    - Log message, or null to create and use the default message.


---

### getResponseLogMessage(Object)
- getResponseLogMessage(response: [Object](TopLevel.Object.md)): [String](TopLevel.String.md)
  - : Creates a response log message for the given request.
      
      
      If not implemented then the default logic will be used to convert the response into a log message.


    **Parameters:**
    - response - Response object.

    **Returns:**
    - Log message, or null to create and use the default message.


---

### getURL()
- getURL(): [String](TopLevel.String.md)
  - : Allows overriding the URL provided by the service configuration.
      
      
      It is usually better to call [Service.setURL(String)](dw.svc.Service.md#seturlstring) within [createRequest(Service, Object...)](dw.svc.ServiceCallback.md#createrequestservice-object)
      because that allows you to modify the existing URL based on call parameters.


    **Returns:**
    - URL to use. The default behavior is to use the URL from the service configuration.


---

### initServiceClient(Service)
- initServiceClient(service: [Service](dw.svc.Service.md)): [Object](TopLevel.Object.md)
  - : Creates a protocol-specific client object.
      
      
      This does not normally need to be implemented, except in the case of SOAP services.
      
      
      It may also be used for HTTP services to override the default configuration.
      
      
      
      
      Example SOAP service:
      
      ```
      initServiceClient: function( svc ) {
          return webreferences2.MyWSDL.getDefaultService();
      }
      ```
      
      Example configuration override for an HTTP service:
      
      ```
      initServiceClient: function( svc ) {
          return { allowHTTP2: true };
      }
      ```


    **Parameters:**
    - service - the Service object.

    **Returns:**
    - Client object

    **Throws:**
    - Exception - 


---

### mockCall(Service, Object)
- mockCall(service: [Service](dw.svc.Service.md), requestObj: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Override this method to mock the remote portion of the service call.
      
      
      Other callbacks like createRequest and parseResponse are still called.


    **Parameters:**
    - service - Service being executed.
    - requestObj - Request object returned by [createRequest(Service, Object...)](dw.svc.ServiceCallback.md#createrequestservice-object).

    **Returns:**
    - Mock response, to be sent to [parseResponse(Service, Object)](dw.svc.ServiceCallback.md#parseresponseservice-object).

    **Throws:**
    - Exception - 


---

### mockFull(Service, Object...)
- mockFull(service: [Service](dw.svc.Service.md), args: [Object...](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Override this method to mock the entire service call, including the createRequest, execute, and parseResponse phases.

    **Parameters:**
    - service - Service being executed.
    - args - Arguments from the Service call method.

    **Returns:**
    - Object to return in the service call's [Result](dw.svc.Result.md).

    **Throws:**
    - Exception - 


---

### parseResponse(Service, Object)
- parseResponse(service: [Service](dw.svc.Service.md), response: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Creates a response object from a successful service call.
      
      
      This response object will be the output object of the call method's Result.


    **Parameters:**
    - service - Service being executed.
    - response - Service-specific response object. For example, the [HTTPService](dw.svc.HTTPService.md) service provides             the underlying [HTTPClient](dw.net.HTTPClient.md) object that made the HTTP call.

    **Returns:**
    - Object to return in the service call's [Result](dw.svc.Result.md).


---

<!-- prettier-ignore-end -->
