<!-- prettier-ignore-start -->
# Class WebReference2

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.ws.WebReference2](dw.ws.WebReference2.md)

Represents a web service defined in a WSDL file. The implementation is backed by a JAX-WS framework.


This implementation does not support `RPC/encoded` WSDLs. Such a WSDL must be migrated to a
supported encoding such as `Document/literal` to work with this API.


To create an instance of a WebReference2, you put a web service WSDL file in the `webreferences2`
directory and reference the WSDL file in a B2C Commerce Script. You then request the service [Port](dw.ws.Port.md)
using one of the get service methods. For example, if your WSDL file is `MyWSDL.wsdl`,
here is how you create an instance of WebReference2 and access the [Port](dw.ws.Port.md):



```
var webref : WebReference2 = webreferences2.MyWSDL;
var port : Port = webref.getDefaultService();
```


Note that all script classes representing your WSDL file are placed in the `webreferences2`
package. To use classes in the `webreferences2` package, you do not need to use the `importPackage`
statement in your B2C Commerce Script file.



The generated API may be customized via a property file named `<WSDLFile>.properties`.
For example, if your WSDL file is `MyWSDL.wsdl`, the property file name is `MyWSDL.wsdl.properties`.
Supported properties include:

| Name | Type | Description |
| --- |--- |--- |
| `namespace` | `boolean` | If the WSDL contains different types with the same name a compilation error may occur. Set this to `true` to      generate a namespace-aware [Port](dw.ws.Port.md), which will have classes separated into packages based on their associated namespace.      The default value is `false` |
| `underscoreBinding` | `string` | If you have elements in a WSDL schema that contain the underscore character, code generation may fail. Set this property      to `asCharInWord` to resolve the problem. The default value is `asWordSeparator`. |
| `collectionType` | `string` | The generated API will use array types instead of List types for collections when this value is set to      `indexed`. This results in code that is more compatible with older `webreferences`-based      implementations. The default behavior is to generate Lists. |
| `enableWrapperStyle` | `boolean` | The generated API will use "bare" methods when this is `false`. When this is `true`,      "wrapped" methods may be generated instead. The default value is `true`, but a `false`      value is more  compatible with older `webreferences`-based implementations. |


The messages sent to and from the remote server are logged at DEBUG level on sandboxes, and not logged at all on production.
The custom log category used is derived from the WSDL name and message type. For example, the custom log categories for the file
`MyWSDL.wsdl` are `webreferences2.MyWSDL.request` and `webreferences2.MyWSDL.response`. This
logging is controlled by the following in the WSDL properties:

| Name | Type | Description |
| --- |--- |--- |
| `logging.enabled` | `boolean` | `true` to explicitly allow logging, `false` to disallow. Default is `true` on Sandboxes      and `false` on all other instance types |
| `logging.level` | `string` | The logging level to use (`TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`).       Default is `DEBUG`. |
| `logging.pretty` | `boolean` | `true` to pretty-print the SOAP XML. Default is `false` to log the actual message body. |
| `logging.verbose` | `boolean` | `true` to log HTTP headers and other message information. Default is `false` to only log the      message body |
| `logging.filter.elements` | comma-separated `string` | List of element tag names containing sensitive information. These will be filtered out of the message. All properties with      this prefix will be used. For example `logging.filter.elements=Password,Token` is equivalent to two different properties      `logging.filter.elements.01=Token` and `logging.filter.elements.02=Token` |
| `logging.filter.headers` | comma-separated `string` | List of message header names containing sensitive information. These will be filtered out of the message. All properties with      this prefix will be used. For example `logging.filter.headers=Authorization,Token` is equivalent to two different properties      `logging.filter.headers.01=Authorization` and `logging.filter.headers.02=Token` |


**See Also:**
- [Port](dw.ws.Port.md)
- [WebReference](dw.rpc.WebReference.md)


## Property Summary

| Property | Description |
| --- | --- |
| [defaultService](#defaultservice): [Port](dw.ws.Port.md) `(read-only)` | Returns the default service endpoint interface port of the web reference. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [WebReference2](#webreference2)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| [getDefaultService](dw.ws.WebReference2.md#getdefaultservice)() | Returns the default service endpoint interface port of the web reference. |
| [getService](dw.ws.WebReference2.md#getservicestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns a specific service from this web reference. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### defaultService
- defaultService: [Port](dw.ws.Port.md) `(read-only)`
  - : Returns the default service endpoint interface port of the web reference. The default service is
      determined as the first service based on the alphabetic order of the service name, and within
      the service the first SOAP port based on the alphabetic order of the port name.



---

## Constructor Details

### WebReference2()
- WebReference2()
  - : 


---

## Method Details

### getDefaultService()
- getDefaultService(): [Port](dw.ws.Port.md)
  - : Returns the default service endpoint interface port of the web reference. The default service is
      determined as the first service based on the alphabetic order of the service name, and within
      the service the first SOAP port based on the alphabetic order of the port name.


    **Returns:**
    - the default service of the web reference.


---

### getService(String, String)
- getService(service: [String](TopLevel.String.md), portName: [String](TopLevel.String.md)): [Port](dw.ws.Port.md)
  - : Returns a specific service from this web reference.

    **Parameters:**
    - service - the service to locate.
    - portName - the name of the port to use.

    **Returns:**
    - a specific service from this web reference.


---

<!-- prettier-ignore-end -->
