<!-- prettier-ignore-start -->
# Class SOAPService

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.svc.Service](dw.svc.Service.md)
    - [dw.svc.SOAPService](dw.svc.SOAPService.md)

Represents a SOAP WebService.


## Property Summary

| Property | Description |
| --- | --- |
| [authentication](#authentication): [String](TopLevel.String.md) | Returns the authentication type. |
| [serviceClient](#serviceclient): [Object](TopLevel.Object.md) | Returns the serviceClient object. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAuthentication](dw.svc.SOAPService.md#getauthentication)() | Returns the authentication type. |
| [getServiceClient](dw.svc.SOAPService.md#getserviceclient)() | Returns the serviceClient object. |
| [setAuthentication](dw.svc.SOAPService.md#setauthenticationstring)([String](TopLevel.String.md)) | Sets the type of authentication. |
| [setServiceClient](dw.svc.SOAPService.md#setserviceclientobject)([Object](TopLevel.Object.md)) | Sets the serviceClient object. |

### Methods inherited from class Service

[call](dw.svc.Service.md#callobject), [getConfiguration](dw.svc.Service.md#getconfiguration), [getCredentialID](dw.svc.Service.md#getcredentialid), [getRequestData](dw.svc.Service.md#getrequestdata), [getResponse](dw.svc.Service.md#getresponse), [getURL](dw.svc.Service.md#geturl), [isMock](dw.svc.Service.md#ismock), [isThrowOnError](dw.svc.Service.md#isthrowonerror), [setCredentialID](dw.svc.Service.md#setcredentialidstring), [setMock](dw.svc.Service.md#setmock), [setThrowOnError](dw.svc.Service.md#setthrowonerror), [setURL](dw.svc.Service.md#seturlstring)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### authentication
- authentication: [String](TopLevel.String.md)
  - : Returns the authentication type.


---

### serviceClient
- serviceClient: [Object](TopLevel.Object.md)
  - : Returns the serviceClient object.


---

## Method Details

### getAuthentication()
- getAuthentication(): [String](TopLevel.String.md)
  - : Returns the authentication type.

    **Returns:**
    - Authentication type.


---

### getServiceClient()
- getServiceClient(): [Object](TopLevel.Object.md)
  - : Returns the serviceClient object.

    **Returns:**
    - serviceClient object.


---

### setAuthentication(String)
- setAuthentication(authentication: [String](TopLevel.String.md)): [SOAPService](dw.svc.SOAPService.md)
  - : Sets the type of authentication. Valid values include "BASIC" and "NONE".
      
      
      The default value is BASIC.


    **Parameters:**
    - authentication - Type of authentication.

    **Returns:**
    - this SOAP WebService.


---

### setServiceClient(Object)
- setServiceClient(o: [Object](TopLevel.Object.md)): [SOAPService](dw.svc.SOAPService.md)
  - : Sets the serviceClient object. This must be set in the prepareCall method, prior to execute being called.

    **Parameters:**
    - o - serviceClient object.

    **Returns:**
    - this SOAP WebService.


---

<!-- prettier-ignore-end -->
