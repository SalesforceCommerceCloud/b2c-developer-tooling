<!-- prettier-ignore-start -->
# Class LocalServiceRegistry

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.svc.LocalServiceRegistry](dw.svc.LocalServiceRegistry.md)

The LocalServiceRegistry is responsible for managing Service instances.


Typical usage involves several steps:

1. The service is defined in the Business Manager and configured with necessary credentials.
2. An instance of the service is created and configured in a script:      
   ```
   var myFTPService = LocalServiceRegistry.createService("MyFTPService", {    mockExec : function(svc:FTPService, params) {        return [            { "name": "file1", "timestamp": new Date(2011, 02, 21)},            { "name": "file2", "timestamp": new Date(2012, 02, 21)},            { "name": "file3", "timestamp": new Date(2013, 02, 21)}        ];    },    createRequest: function(svc:FTPService, params) {        svc.setOperation("list", "/");    },    parseResponse : function(svc:FTPService, listOutput) {        var x : Array = [];        var resp : Array = listOutput;        for(var i = 0; i <resp.length; i++) {            var f = resp[i];            x.push( { "name": f['name'], "timestamp": f['timestamp'] } );        }        return x;    }});
   ```

3. The service is called in order to perform the operation:      
   ```
   var result : Result = myFTPService.call();if(result.status == 'OK') {    // The result.object is the object returned by the 'after' callback.} else {    // Handle the error. See result.error for more information.}
   ```



Unlike [ServiceRegistry](dw.svc.ServiceRegistry.md), the configured service is local to the current script call,
so this deals directly with [Service](dw.svc.Service.md) instances rather than the intermediate [ServiceDefinition](dw.svc.ServiceDefinition.md).
This means that a cartridge-level initialization script (and the package.json) is no longer needed.


See [ServiceCallback](dw.svc.ServiceCallback.md) for all the callback options, and individual [Service](dw.svc.Service.md)
classes for customization specific to a service type.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [createService](dw.svc.LocalServiceRegistry.md#createservicestring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Constructs and configures a service with a callback. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### createService(String, Object)
- static createService(serviceID: [String](TopLevel.String.md), configObj: [Object](TopLevel.Object.md)): [Service](dw.svc.Service.md)
  - : Constructs and configures a service with a callback.

    **Parameters:**
    - serviceID - Unique Service ID.
    - configObj - Configuration callback. See [ServiceCallback](dw.svc.ServiceCallback.md) for a description of available callback methods.

    **Returns:**
    - Associated [Service](dw.svc.Service.md), which can be used for further protocol-specific configuration.


---

<!-- prettier-ignore-end -->
