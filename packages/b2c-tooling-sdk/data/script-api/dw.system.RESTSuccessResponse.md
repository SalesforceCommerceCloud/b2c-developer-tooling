<!-- prettier-ignore-start -->
# Class RESTSuccessResponse

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.RESTSuccessResponse](dw.system.RESTSuccessResponse.md)

This class represents a REST success response that is compliant with the RFC standards. It can only be instantiated
using the `createSuccess` methods in [RESTResponseMgr](dw.system.RESTResponseMgr.md).


Here is an example: 

`
 var body = {"hello": "world"} 

 var success = RESTResponseMgr.createSuccess(body); 

 success.render(); 

 ` 

The above script would result in an HTTP response with status code 200 and the following body:

`
 {

 &emsp;"hello": "world" 

 } 

 ` 



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [render](dw.system.RESTSuccessResponse.md#render)() | Sends the [RESTSuccessResponse](dw.system.RESTSuccessResponse.md) object as an HTTP response to the client. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### render()
- render(): void
  - : Sends the [RESTSuccessResponse](dw.system.RESTSuccessResponse.md) object as an HTTP response to the client. This sets the "Content-Type"
      header to "application/json" and expects the body to be a valid JavaScript JSON object.


    **Throws:**
    - IllegalStateException - If the RESTSuccessResponse object is already rendered.
    - Exception - If there is an error while serializing the body.


---

<!-- prettier-ignore-end -->
