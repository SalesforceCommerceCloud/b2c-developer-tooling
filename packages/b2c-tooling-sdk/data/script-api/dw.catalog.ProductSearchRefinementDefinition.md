<!-- prettier-ignore-start -->
# Class ProductSearchRefinementDefinition

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.SearchRefinementDefinition](dw.catalog.SearchRefinementDefinition.md)
        - [dw.catalog.ProductSearchRefinementDefinition](dw.catalog.ProductSearchRefinementDefinition.md)

This class provides an interface to refinement options for the product search.


## Property Summary

| Property | Description |
| --- | --- |
| [categoryRefinement](#categoryrefinement): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this is a category refinement. |
| [priceRefinement](#pricerefinement): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this is a price refinement. |
| [promotionRefinement](#promotionrefinement): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this is a promotion refinement. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [isCategoryRefinement](dw.catalog.ProductSearchRefinementDefinition.md#iscategoryrefinement)() | Identifies if this is a category refinement. |
| [isPriceRefinement](dw.catalog.ProductSearchRefinementDefinition.md#ispricerefinement)() | Identifies if this is a price refinement. |
| [isPromotionRefinement](dw.catalog.ProductSearchRefinementDefinition.md#ispromotionrefinement)() | Identifies if this is a promotion refinement. |

### Methods inherited from class SearchRefinementDefinition

[getAttributeID](dw.catalog.SearchRefinementDefinition.md#getattributeid), [getCutoffThreshold](dw.catalog.SearchRefinementDefinition.md#getcutoffthreshold), [getDisplayName](dw.catalog.SearchRefinementDefinition.md#getdisplayname), [getValueTypeCode](dw.catalog.SearchRefinementDefinition.md#getvaluetypecode), [isAttributeRefinement](dw.catalog.SearchRefinementDefinition.md#isattributerefinement)
### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### categoryRefinement
- categoryRefinement: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this is a category refinement.


---

### priceRefinement
- priceRefinement: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this is a price refinement.


---

### promotionRefinement
- promotionRefinement: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this is a promotion refinement.


---

## Method Details

### isCategoryRefinement()
- isCategoryRefinement(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this is a category refinement.

    **Returns:**
    - true if this is a category refinement, false otherwise.


---

### isPriceRefinement()
- isPriceRefinement(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this is a price refinement.

    **Returns:**
    - true if this is a price refinement, false otherwise.


---

### isPromotionRefinement()
- isPromotionRefinement(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this is a promotion refinement.

    **Returns:**
    - true if this is a promotion refinement, false otherwise.


---

<!-- prettier-ignore-end -->
