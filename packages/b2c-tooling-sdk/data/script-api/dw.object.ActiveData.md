<!-- prettier-ignore-start -->
# Class ActiveData

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.object.ActiveData](dw.object.ActiveData.md)

Represents the active data for an object in Commerce Cloud Digital.


## All Known Subclasses
[CustomerActiveData](dw.customer.CustomerActiveData.md), [ProductActiveData](dw.catalog.ProductActiveData.md)
## Property Summary

| Property | Description |
| --- | --- |
| [custom](#custom): [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)` | Returns the custom attributes for this object. |
| [empty](#empty): [Boolean](TopLevel.Boolean.md) `(read-only)` | Return true if the ActiveData doesn't exist for the object |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCustom](dw.object.ActiveData.md#getcustom)() | Returns the custom attributes for this object. |
| [isEmpty](dw.object.ActiveData.md#isempty)() | Return true if the ActiveData doesn't exist for the object |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### custom
- custom: [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)`
  - : Returns the custom attributes for this object. The returned object can
      only be used for retrieving attribute values, not storing them. See
      [CustomAttributes](dw.object.CustomAttributes.md) for a detailed example of the syntax for
      working with custom attributes.



---

### empty
- empty: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Return true if the ActiveData doesn't exist for the object


---

## Method Details

### getCustom()
- getCustom(): [CustomAttributes](dw.object.CustomAttributes.md)
  - : Returns the custom attributes for this object. The returned object can
      only be used for retrieving attribute values, not storing them. See
      [CustomAttributes](dw.object.CustomAttributes.md) for a detailed example of the syntax for
      working with custom attributes.


    **Returns:**
    - the custom attributes for this object.


---

### isEmpty()
- isEmpty(): [Boolean](TopLevel.Boolean.md)
  - : Return true if the ActiveData doesn't exist for the object

    **Returns:**
    - true if ActiveData is empty, false otherwise


---

<!-- prettier-ignore-end -->
