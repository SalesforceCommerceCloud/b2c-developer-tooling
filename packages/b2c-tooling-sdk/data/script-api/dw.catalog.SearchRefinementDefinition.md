<!-- prettier-ignore-start -->
# Class SearchRefinementDefinition

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.SearchRefinementDefinition](dw.catalog.SearchRefinementDefinition.md)

Common search refinement definition base class.


## All Known Subclasses
[ContentSearchRefinementDefinition](dw.content.ContentSearchRefinementDefinition.md), [ProductSearchRefinementDefinition](dw.catalog.ProductSearchRefinementDefinition.md)
## Property Summary

| Property | Description |
| --- | --- |
| [attributeID](#attributeid): [String](TopLevel.String.md) `(read-only)` | Returns the attribute ID. |
| [attributeRefinement](#attributerefinement): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this is an attribute refinement. |
| [cutoffThreshold](#cutoffthreshold): [Number](TopLevel.Number.md) `(read-only)` | Returns the cut-off threshold. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the display name. |
| [valueTypeCode](#valuetypecode): [Number](TopLevel.Number.md) `(read-only)` | Returns a code for the data type used for this search refinement definition. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAttributeID](dw.catalog.SearchRefinementDefinition.md#getattributeid)() | Returns the attribute ID. |
| [getCutoffThreshold](dw.catalog.SearchRefinementDefinition.md#getcutoffthreshold)() | Returns the cut-off threshold. |
| [getDisplayName](dw.catalog.SearchRefinementDefinition.md#getdisplayname)() | Returns the display name. |
| [getValueTypeCode](dw.catalog.SearchRefinementDefinition.md#getvaluetypecode)() | Returns a code for the data type used for this search refinement definition. |
| [isAttributeRefinement](dw.catalog.SearchRefinementDefinition.md#isattributerefinement)() | Identifies if this is an attribute refinement. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### attributeID
- attributeID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the attribute ID. If the refinement definition is not an
      attribute refinement, the method returns an empty string.



---

### attributeRefinement
- attributeRefinement: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this is an attribute refinement.


---

### cutoffThreshold
- cutoffThreshold: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the cut-off threshold.


---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name.


---

### valueTypeCode
- valueTypeCode: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns a code for the data type used for this search refinement definition. See constants
      defined in ObjectAttributeDefinition.



---

## Method Details

### getAttributeID()
- getAttributeID(): [String](TopLevel.String.md)
  - : Returns the attribute ID. If the refinement definition is not an
      attribute refinement, the method returns an empty string.


    **Returns:**
    - the attribute ID.


---

### getCutoffThreshold()
- getCutoffThreshold(): [Number](TopLevel.Number.md)
  - : Returns the cut-off threshold.

    **Returns:**
    - the cut-off threshold.


---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the display name.

    **Returns:**
    - the display name.


---

### getValueTypeCode()
- getValueTypeCode(): [Number](TopLevel.Number.md)
  - : Returns a code for the data type used for this search refinement definition. See constants
      defined in ObjectAttributeDefinition.


    **Returns:**
    - a code for the data type used for this search refinement definition. See constants
      defined in ObjectAttributeDefinition.



---

### isAttributeRefinement()
- isAttributeRefinement(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this is an attribute refinement.

    **Returns:**
    - true if this is an attribute refinement, false otherwise.


---

<!-- prettier-ignore-end -->
