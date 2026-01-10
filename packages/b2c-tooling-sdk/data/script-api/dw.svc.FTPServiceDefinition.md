<!-- prettier-ignore-start -->
# Class FTPServiceDefinition

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.svc.ServiceDefinition](dw.svc.ServiceDefinition.md)
    - [dw.svc.FTPServiceDefinition](dw.svc.FTPServiceDefinition.md)

Represents an FTP or SFTP Service Definition.


There are two basic styles of configuration for this service.


In the first style, `createRequest` is implemented to call the setOperation method on the Service. This
will cause the single operation to be performed and returned as the data object in the `parseResponse`
method. Any error status is set automatically based on the returned value of the operation.


In the second style, `execute` is implemented to perform one or more operations using the serviceClient
available on the Service object. This serviceClient will be either an [FTPClient](dw.net.FTPClient.md) or an
[SFTPClient](dw.net.SFTPClient.md). The return value of execute will be passed as the data object in the
`parseResponse` method.


**Deprecated:**
:::warning
This class is only used with the deprecated [ServiceRegistry](dw.svc.ServiceRegistry.md). Use the [LocalServiceRegistry](dw.svc.LocalServiceRegistry.md)
            instead, which allows configuration on the [FTPService](dw.svc.FTPService.md) directly.

:::
**API Version:**
:::note
No longer available as of version 19.10.
:::

## Property Summary

| Property | Description |
| --- | --- |
| [autoDisconnect](#autodisconnect): [Boolean](TopLevel.Boolean.md) | Returns the status of whether the underlying FTP connection will be disconnected after the service call. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [isAutoDisconnect](dw.svc.FTPServiceDefinition.md#isautodisconnect)() | Returns the status of whether the underlying FTP connection will be disconnected after the service call. |
| [setAutoDisconnect](dw.svc.FTPServiceDefinition.md#setautodisconnectboolean)([Boolean](TopLevel.Boolean.md)) | Sets the auto-disconnect flag. |

### Methods inherited from class ServiceDefinition

[configure](dw.svc.ServiceDefinition.md#configureobject), [getConfiguration](dw.svc.ServiceDefinition.md#getconfiguration), [getServiceName](dw.svc.ServiceDefinition.md#getservicename), [isMock](dw.svc.ServiceDefinition.md#ismock), [isThrowOnError](dw.svc.ServiceDefinition.md#isthrowonerror), [setMock](dw.svc.ServiceDefinition.md#setmock), [setThrowOnError](dw.svc.ServiceDefinition.md#setthrowonerror)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### autoDisconnect
- autoDisconnect: [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether the underlying FTP connection will be disconnected after the service call.


---

## Method Details

### isAutoDisconnect()
- isAutoDisconnect(): [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether the underlying FTP connection will be disconnected after the service call.

    **Returns:**
    - The auto-disconnect flag.


---

### setAutoDisconnect(Boolean)
- setAutoDisconnect(b: [Boolean](TopLevel.Boolean.md)): [FTPServiceDefinition](dw.svc.FTPServiceDefinition.md)
  - : Sets the auto-disconnect flag.
      
      
      If true, the underlying FTP connection will be disconnected after the service call. If false then it will remain
      open. The default value is true.


    **Parameters:**
    - b - true to enable auto-disconnect, false otherwise.

    **Returns:**
    - this FTP or SFTP Service Definition.


---

<!-- prettier-ignore-end -->
