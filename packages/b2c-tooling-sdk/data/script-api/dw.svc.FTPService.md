<!-- prettier-ignore-start -->
# Class FTPService

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.svc.Service](dw.svc.Service.md)
    - [dw.svc.FTPService](dw.svc.FTPService.md)

Represents an FTP or SFTP Service.


There are two basic styles of configuration for this service.


In the first style, `createRequest` is implemented to call the setOperation method on the Service. This
will cause the single operation to be performed and returned as the data object in the `parseResponse`
method. Any error status is set automatically based on the returned value of the operation.


In the second style, `execute` is implemented to perform one or more operations using the serviceClient
available on the Service object. This serviceClient will be either an [FTPClient](dw.net.FTPClient.md) or an
[SFTPClient](dw.net.SFTPClient.md). The return value of execute will be passed as the data object in the
`parseResponse` method.


Note that the use of the FTP client is deprecated, and SFTP should be used instead.



## Property Summary

| Property | Description |
| --- | --- |
| [autoDisconnect](#autodisconnect): [Boolean](TopLevel.Boolean.md) | Returns the status of whether the underlying FTP connection will be disconnected after the service call. |
| [client](#client): [Object](TopLevel.Object.md) `(read-only)` | Returns the underlying client object. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getClient](dw.svc.FTPService.md#getclient)() | Returns the underlying client object. |
| [isAutoDisconnect](dw.svc.FTPService.md#isautodisconnect)() | Returns the status of whether the underlying FTP connection will be disconnected after the service call. |
| [setAutoDisconnect](dw.svc.FTPService.md#setautodisconnectboolean)([Boolean](TopLevel.Boolean.md)) | Sets the auto-disconnect flag. |
| [setOperation](dw.svc.FTPService.md#setoperationstring-object)([String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Sets a single operation to perform during the execute phase of the service. |

### Methods inherited from class Service

[call](dw.svc.Service.md#callobject), [getConfiguration](dw.svc.Service.md#getconfiguration), [getCredentialID](dw.svc.Service.md#getcredentialid), [getRequestData](dw.svc.Service.md#getrequestdata), [getResponse](dw.svc.Service.md#getresponse), [getURL](dw.svc.Service.md#geturl), [isMock](dw.svc.Service.md#ismock), [isThrowOnError](dw.svc.Service.md#isthrowonerror), [setCredentialID](dw.svc.Service.md#setcredentialidstring), [setMock](dw.svc.Service.md#setmock), [setThrowOnError](dw.svc.Service.md#setthrowonerror), [setURL](dw.svc.Service.md#seturlstring)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### autoDisconnect
- autoDisconnect: [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether the underlying FTP connection will be disconnected after the service call.


---

### client
- client: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns the underlying client object.
      
      
      This is either an [FTPClient](dw.net.FTPClient.md) or [SFTPClient](dw.net.SFTPClient.md), depending on the protocol.



---

## Method Details

### getClient()
- getClient(): [Object](TopLevel.Object.md)
  - : Returns the underlying client object.
      
      
      This is either an [FTPClient](dw.net.FTPClient.md) or [SFTPClient](dw.net.SFTPClient.md), depending on the protocol.


    **Returns:**
    - (S)FTP Client object.


---

### isAutoDisconnect()
- isAutoDisconnect(): [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether the underlying FTP connection will be disconnected after the service call.

    **Returns:**
    - The auto-disconnect flag.


---

### setAutoDisconnect(Boolean)
- setAutoDisconnect(b: [Boolean](TopLevel.Boolean.md)): [FTPService](dw.svc.FTPService.md)
  - : Sets the auto-disconnect flag.
      
      
      If true, the underlying FTP connection will be disconnected after the service call. If false then it will remain
      open. The default value is true.


    **Parameters:**
    - b - true to enable auto-disconnect, false otherwise.

    **Returns:**
    - this FTP or SFTP Service.


---

### setOperation(String, Object...)
- setOperation(name: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [FTPService](dw.svc.FTPService.md)
  - : Sets a single operation to perform during the execute phase of the service.
      
      
      The given arguments make up a method name and arguments on the underlying [getClient()](dw.svc.FTPService.md#getclient) object. This
      method will be invoked during execution, with the result passed into the callback's parseResponse method.
      
      
      This is required unless the callback defines an execute method.


    **Parameters:**
    - name - Method name.
    - args - Method arguments.

    **Returns:**
    - this FTP or SFTP Service.


---

<!-- prettier-ignore-end -->
