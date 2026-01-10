<!-- prettier-ignore-start -->
# Class ProductLink

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.ProductLink](dw.catalog.ProductLink.md)

The class represents a link between two products.


## Constant Summary

| Constant | Description |
| --- | --- |
| [LINKTYPE_ACCESSORY](#linktype_accessory): [Number](TopLevel.Number.md) = 4 | Represents an accessory product link. |
| [LINKTYPE_ALT_ORDERUNIT](#linktype_alt_orderunit): [Number](TopLevel.Number.md) = 6 | Represents an alternative order unit product link. |
| [LINKTYPE_CROSS_SELL](#linktype_cross_sell): [Number](TopLevel.Number.md) = 1 | Represents a cross-sell product link. |
| [LINKTYPE_NEWER_VERSION](#linktype_newer_version): [Number](TopLevel.Number.md) = 5 | Represents a newer verion link. |
| [LINKTYPE_OTHER](#linktype_other): [Number](TopLevel.Number.md) = 8 | Represents a miscellaneous product link. |
| [LINKTYPE_REPLACEMENT](#linktype_replacement): [Number](TopLevel.Number.md) = 2 | Represents a replacement product link. |
| [LINKTYPE_SPARE_PART](#linktype_spare_part): [Number](TopLevel.Number.md) = 7 | Represents a spare part product link. |
| [LINKTYPE_UP_SELL](#linktype_up_sell): [Number](TopLevel.Number.md) = 3 | Represents an up-sell product link. |

## Property Summary

| Property | Description |
| --- | --- |
| [sourceProduct](#sourceproduct): [Product](dw.catalog.Product.md) `(read-only)` | Returns the source product for this link. |
| [targetProduct](#targetproduct): [Product](dw.catalog.Product.md) `(read-only)` | Returns the target product for this link. |
| [typeCode](#typecode): [Number](TopLevel.Number.md) `(read-only)` | Returns the type of this link (see constants). |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getSourceProduct](dw.catalog.ProductLink.md#getsourceproduct)() | Returns the source product for this link. |
| [getTargetProduct](dw.catalog.ProductLink.md#gettargetproduct)() | Returns the target product for this link. |
| [getTypeCode](dw.catalog.ProductLink.md#gettypecode)() | Returns the type of this link (see constants). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### LINKTYPE_ACCESSORY

- LINKTYPE_ACCESSORY: [Number](TopLevel.Number.md) = 4
  - : Represents an accessory product link.


---

### LINKTYPE_ALT_ORDERUNIT

- LINKTYPE_ALT_ORDERUNIT: [Number](TopLevel.Number.md) = 6
  - : Represents an alternative order unit product link.


---

### LINKTYPE_CROSS_SELL

- LINKTYPE_CROSS_SELL: [Number](TopLevel.Number.md) = 1
  - : Represents a cross-sell product link.


---

### LINKTYPE_NEWER_VERSION

- LINKTYPE_NEWER_VERSION: [Number](TopLevel.Number.md) = 5
  - : Represents a newer verion link.


---

### LINKTYPE_OTHER

- LINKTYPE_OTHER: [Number](TopLevel.Number.md) = 8
  - : Represents a miscellaneous product link.


---

### LINKTYPE_REPLACEMENT

- LINKTYPE_REPLACEMENT: [Number](TopLevel.Number.md) = 2
  - : Represents a replacement product link.


---

### LINKTYPE_SPARE_PART

- LINKTYPE_SPARE_PART: [Number](TopLevel.Number.md) = 7
  - : Represents a spare part product link.


---

### LINKTYPE_UP_SELL

- LINKTYPE_UP_SELL: [Number](TopLevel.Number.md) = 3
  - : Represents an up-sell product link.


---

## Property Details

### sourceProduct
- sourceProduct: [Product](dw.catalog.Product.md) `(read-only)`
  - : Returns the source product for this link.


---

### targetProduct
- targetProduct: [Product](dw.catalog.Product.md) `(read-only)`
  - : Returns the target product for this link.


---

### typeCode
- typeCode: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the type of this link (see constants).


---

## Method Details

### getSourceProduct()
- getSourceProduct(): [Product](dw.catalog.Product.md)
  - : Returns the source product for this link.

    **Returns:**
    - the source product for this link.


---

### getTargetProduct()
- getTargetProduct(): [Product](dw.catalog.Product.md)
  - : Returns the target product for this link.

    **Returns:**
    - the target product for this link.


---

### getTypeCode()
- getTypeCode(): [Number](TopLevel.Number.md)
  - : Returns the type of this link (see constants).

    **Returns:**
    - the type of the link.


---

<!-- prettier-ignore-end -->
