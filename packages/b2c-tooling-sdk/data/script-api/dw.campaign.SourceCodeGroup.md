<!-- prettier-ignore-start -->
# Class SourceCodeGroup

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.campaign.SourceCodeGroup](dw.campaign.SourceCodeGroup.md)

A source code group defines a collection of source codes. Source code groups
are generally pattern based and any source code satisfying the pattern
belongs to the group. In this way, merchants may define a large set of source
codes which qualify a customer for site experiences (different prices, for
example), which customers without that source code do not receive.
The class [SourceCodeInfo](dw.campaign.SourceCodeInfo.md) represents an individual source
code.



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | The ID of the SourceCodeGroup. |
| [priceBooks](#pricebooks): [Collection](dw.util.Collection.md) `(read-only)` | Returns a Collection of PriceBooks the SourceCodeGroup is assigned to. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getID](dw.campaign.SourceCodeGroup.md#getid)() | The ID of the SourceCodeGroup. |
| [getPriceBooks](dw.campaign.SourceCodeGroup.md#getpricebooks)() | Returns a Collection of PriceBooks the SourceCodeGroup is assigned to. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : The ID of the SourceCodeGroup.


---

### priceBooks
- priceBooks: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a Collection of PriceBooks the SourceCodeGroup is assigned to.


---

## Method Details

### getID()
- getID(): [String](TopLevel.String.md)
  - : The ID of the SourceCodeGroup.

    **Returns:**
    - the ID.


---

### getPriceBooks()
- getPriceBooks(): [Collection](dw.util.Collection.md)
  - : Returns a Collection of PriceBooks the SourceCodeGroup is assigned to.

    **Returns:**
    - Collection of PriceBooks the SourceCodeGroup is assigned to.


---

<!-- prettier-ignore-end -->
