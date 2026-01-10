<!-- prettier-ignore-start -->
# Class RESTErrorResponse

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.RESTErrorResponse](dw.system.RESTErrorResponse.md)

This class represents a REST error response that is compliant with
[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457). It can only be instantiated using the
`createError` methods in [RESTResponseMgr](dw.system.RESTResponseMgr.md).


Here is an example:


```

var error = RESTResponseMgr.createError(400);
error.custom.foo = "bar";
error.render();
```


The above script would result in an HTTP response with status code 400 and the following body:


```

{
    "type": "https://api.commercecloud.salesforce.com/documentation/error/v1/custom-errors/bad-request",
    "c_foo": "bar"
}
```


NOTE:

- Custom attributes are rendered with "c\_" prefix as shown in the example above.
- Rendering works as described in [JSON.stringify(Object)](TopLevel.JSON.md#stringifyobject).



## Property Summary

| Property | Description |
| --- | --- |
| [custom](#custom): [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)` | Returns all the custom attributes associated with the error response object. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCustom](dw.system.RESTErrorResponse.md#getcustom)() | Returns all the custom attributes associated with the error response object. |
| [render](dw.system.RESTErrorResponse.md#render)() | Sends the [RESTErrorResponse](dw.system.RESTErrorResponse.md) object as an HTTP error response to the client, adhering to  [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### custom
- custom: [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)`
  - : Returns all the custom attributes associated with the error response object. The attributes are stored for the
      lifetime of the error response object.



---

## Method Details

### getCustom()
- getCustom(): [CustomAttributes](dw.object.CustomAttributes.md)
  - : Returns all the custom attributes associated with the error response object. The attributes are stored for the
      lifetime of the error response object.


    **Returns:**
    - All the custom attributes associated with the error response object.


---

### render()
- render(): void
  - : Sends the [RESTErrorResponse](dw.system.RESTErrorResponse.md) object as an HTTP error response to the client, adhering to
      [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457). This method sets the "Content-Type" header to
      "application/problem+json", HTTP Status Code to statusCode attribute and constructs the body from type, title,
      detail and custom attributes of the object. Custom attributes are rendered with "c\_" prefix to the attribute
      name.


    **Throws:**
    - IllegalStateException - If the RESTErrorResponse object is already rendered.
    - Exception - If there is an error while serializing the RESTErrorResponse object.


---

<!-- prettier-ignore-end -->
