<!-- prettier-ignore-start -->
# Class CategoryLink

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.CategoryLink](dw.catalog.CategoryLink.md)

A CategoryLink represents a directed relationship between two catalog
categories.  Merchants create category links in order to market similar or
related groups of products.



## Constant Summary

| Constant | Description |
| --- | --- |
| [LINKTYPE_ACCESSORY](#linktype_accessory): [Number](TopLevel.Number.md) = 2 | Represents an accessory category link. |
| [LINKTYPE_CROSS_SELL](#linktype_cross_sell): [Number](TopLevel.Number.md) = 4 | Represents a cross-sell category link. |
| [LINKTYPE_OTHER](#linktype_other): [Number](TopLevel.Number.md) = 1 | Represents a miscellaneous category link. |
| [LINKTYPE_SPARE_PART](#linktype_spare_part): [Number](TopLevel.Number.md) = 6 | Represents a spare part category link. |
| [LINKTYPE_UP_SELL](#linktype_up_sell): [Number](TopLevel.Number.md) = 5 | Represents an up-sell category link. |

## Property Summary

| Property | Description |
| --- | --- |
| [sourceCategory](#sourcecategory): [Category](dw.catalog.Category.md) `(read-only)` | Returns the object for the relation 'sourceCategory'. |
| [targetCategory](#targetcategory): [Category](dw.catalog.Category.md) `(read-only)` | Returns the object for the relation 'targetCategory'. |
| [typeCode](#typecode): [Number](TopLevel.Number.md) `(read-only)` | Returns the type of this category link (see constants). |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getSourceCategory](dw.catalog.CategoryLink.md#getsourcecategory)() | Returns the object for the relation 'sourceCategory'. |
| [getTargetCategory](dw.catalog.CategoryLink.md#gettargetcategory)() | Returns the object for the relation 'targetCategory'. |
| [getTypeCode](dw.catalog.CategoryLink.md#gettypecode)() | Returns the type of this category link (see constants). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### LINKTYPE_ACCESSORY

- LINKTYPE_ACCESSORY: [Number](TopLevel.Number.md) = 2
  - : Represents an accessory category link.


---

### LINKTYPE_CROSS_SELL

- LINKTYPE_CROSS_SELL: [Number](TopLevel.Number.md) = 4
  - : Represents a cross-sell category link.


---

### LINKTYPE_OTHER

- LINKTYPE_OTHER: [Number](TopLevel.Number.md) = 1
  - : Represents a miscellaneous category link.


---

### LINKTYPE_SPARE_PART

- LINKTYPE_SPARE_PART: [Number](TopLevel.Number.md) = 6
  - : Represents a spare part category link.


---

### LINKTYPE_UP_SELL

- LINKTYPE_UP_SELL: [Number](TopLevel.Number.md) = 5
  - : Represents an up-sell category link.


---

## Property Details

### sourceCategory
- sourceCategory: [Category](dw.catalog.Category.md) `(read-only)`
  - : Returns the object for the relation 'sourceCategory'.


---

### targetCategory
- targetCategory: [Category](dw.catalog.Category.md) `(read-only)`
  - : Returns the object for the relation 'targetCategory'.


---

### typeCode
- typeCode: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the type of this category link (see constants).


---

## Method Details

### getSourceCategory()
- getSourceCategory(): [Category](dw.catalog.Category.md)
  - : Returns the object for the relation 'sourceCategory'.

    **Returns:**
    - the object for the relation 'sourceCategory'


---

### getTargetCategory()
- getTargetCategory(): [Category](dw.catalog.Category.md)
  - : Returns the object for the relation 'targetCategory'.

    **Returns:**
    - the object for the relation 'targetCategory'


---

### getTypeCode()
- getTypeCode(): [Number](TopLevel.Number.md)
  - : Returns the type of this category link (see constants).

    **Returns:**
    - the type of the link.


---

<!-- prettier-ignore-end -->
