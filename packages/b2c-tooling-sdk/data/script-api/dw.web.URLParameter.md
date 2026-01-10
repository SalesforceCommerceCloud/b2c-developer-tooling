<!-- prettier-ignore-start -->
# Class URLParameter

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.URLParameter](dw.web.URLParameter.md)

This class represents a key-value-pair for URL parameters.


## Constructor Summary

| Constructor | Description |
| --- | --- |
| [URLParameter](#urlparameterstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs the parameter using the specified name and value and endocded  in the form "name=value". |
| [URLParameter](#urlparameterstring-string-boolean)([String](TopLevel.String.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md)) | Constructs the parameter using the specified name and value. |

## Method Summary

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### URLParameter(String, String)
- URLParameter(aName: [String](TopLevel.String.md), aValue: [String](TopLevel.String.md))
  - : Constructs the parameter using the specified name and value and endocded
      in the form "name=value".


    **Parameters:**
    - aName - the name
    - aValue - the value


---

### URLParameter(String, String, Boolean)
- URLParameter(aName: [String](TopLevel.String.md), aValue: [String](TopLevel.String.md), encodeName: [Boolean](TopLevel.Boolean.md))
  - : Constructs the parameter using the specified name and value. If the "encodeName" is set to true,
      the parameter is encoded in the form "name=value". Otherwise, it only
      contains the "value" (needed for URL patterns).


    **Parameters:**
    - aName - the name
    - aValue - the value
    - encodeName - if true, the name will be part of the string form


---

<!-- prettier-ignore-end -->
