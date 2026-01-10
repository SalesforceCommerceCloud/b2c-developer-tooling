<!-- prettier-ignore-start -->
# Class ServiceRegistry

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.svc.ServiceRegistry](dw.svc.ServiceRegistry.md)

The ServiceRegistry is responsible for managing Service definitions and their instances.


Typical usage involves several steps:

1. The service is defined in the Business Manager and configured with necessary credentials.
2. The service callback is configured once during cartridge initialization:      
   ```
   ServiceRegistry.configure("MyFTPService", {    mockExec : function(svc:FTPService, params) {        return [            { "name": "file1", "timestamp": new Date(2011, 02, 21)},            { "name": "file2", "timestamp": new Date(2012, 02, 21)},            { "name": "file3", "timestamp": new Date(2013, 02, 21)}        ];    },    createRequest: function(svc:FTPService, params) {        svc.setOperation("list", "/");    },    parseResponse : function(svc:FTPService, listOutput) {        var x : Array = [];        var resp : Array = listOutput;        for(var i = 0; i <resp.length; i++) {            var f = resp[i];            x.push( { "name": f['name'], "timestamp": f['timestamp'] } );        }        return x;    }});
   ```

3. A new service instance is created and called in order to perform the operation:      
   ```
   var result : Result = ServiceRegistry.get("MyFTPService").call();if(result.status == 'OK') {    // The result.object is the object returned by the 'after' callback.} else {    // Handle the error. See result.error for more information.}
   ```



See [ServiceCallback](dw.svc.ServiceCallback.md) for all the callback options, and individual [ServiceDefinition](dw.svc.ServiceDefinition.md)
classes for customization specific to a service type.


**Deprecated:**
:::warning
It is recommended to use the [LocalServiceRegistry](dw.svc.LocalServiceRegistry.md) instead of this class.
:::
**API Version:**
:::note
No longer available as of version 19.10.
:::

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [configure](dw.svc.ServiceRegistry.md#configurestring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Configure the given serviceId with a callback. |
| static [get](dw.svc.ServiceRegistry.md#getstring)([String](TopLevel.String.md)) | Constructs a new instance of the given service. |
| static [getDefinition](dw.svc.ServiceRegistry.md#getdefinitionstring)([String](TopLevel.String.md)) | Gets a Service Definition. |
| static [isConfigured](dw.svc.ServiceRegistry.md#isconfiguredstring)([String](TopLevel.String.md)) | Returns the status of whether the given service has been configured with a callback. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### configure(String, Object)
- static configure(serviceID: [String](TopLevel.String.md), configObj: [Object](TopLevel.Object.md)): [ServiceDefinition](dw.svc.ServiceDefinition.md)
  - : Configure the given serviceId with a callback.
      
      
      If the service is already configured, the given callback will replace any existing one.


    **Parameters:**
    - serviceID - Unique Service ID.
    - configObj - Configuration callback. See [ServiceCallback](dw.svc.ServiceCallback.md) for a description of available callback methods.

    **Returns:**
    - Associated [ServiceDefinition](dw.svc.ServiceDefinition.md), which can be used for further protocol-specific
              configuration.



---

### get(String)
- static get(serviceID: [String](TopLevel.String.md)): [Service](dw.svc.Service.md)
  - : Constructs a new instance of the given service.

    **Parameters:**
    - serviceID - Unique Service ID.

    **Returns:**
    - Service instance.


---

### getDefinition(String)
- static getDefinition(serviceID: [String](TopLevel.String.md)): [ServiceDefinition](dw.svc.ServiceDefinition.md)
  - : Gets a Service Definition.
      
      
      This Service Definition is shared across all Service instances returned by [get(String)](dw.svc.ServiceRegistry.md#getstring).


    **Parameters:**
    - serviceID - Unique Service ID.

    **Returns:**
    - ServiceDefinition


---

### isConfigured(String)
- static isConfigured(serviceID: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether the given service has been configured with a callback.

    **Parameters:**
    - serviceID - Unique Service ID.

    **Returns:**
    - true if configure has already been called, false otherwise.


---

<!-- prettier-ignore-end -->
