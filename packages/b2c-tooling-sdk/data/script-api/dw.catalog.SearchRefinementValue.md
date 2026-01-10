<!-- prettier-ignore-start -->
# Class SearchRefinementValue

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.SearchRefinementValue](dw.catalog.SearchRefinementValue.md)

Represents the value of a product or content search refinement.


## All Known Subclasses
[ContentSearchRefinementValue](dw.content.ContentSearchRefinementValue.md), [ProductSearchRefinementValue](dw.catalog.ProductSearchRefinementValue.md)
## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the refinement value's ID. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the optional refinement value description in the current locale. |
| [displayValue](#displayvalue): [String](TopLevel.String.md) `(read-only)` | Returns the refinement display value. |
| [hitCount](#hitcount): [Number](TopLevel.Number.md) `(read-only)` | Returns the hit count value. |
| [presentationID](#presentationid): [String](TopLevel.String.md) `(read-only)` | Returns the optional presentation ID associated with this refinement  value. |
| [value](#value): [String](TopLevel.String.md) `(read-only)` | Returns the refinement value. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getDescription](dw.catalog.SearchRefinementValue.md#getdescription)() | Returns the optional refinement value description in the current locale. |
| [getDisplayValue](dw.catalog.SearchRefinementValue.md#getdisplayvalue)() | Returns the refinement display value. |
| [getHitCount](dw.catalog.SearchRefinementValue.md#gethitcount)() | Returns the hit count value. |
| [getID](dw.catalog.SearchRefinementValue.md#getid)() | Returns the refinement value's ID. |
| [getPresentationID](dw.catalog.SearchRefinementValue.md#getpresentationid)() | Returns the optional presentation ID associated with this refinement  value. |
| [getValue](dw.catalog.SearchRefinementValue.md#getvalue)() | Returns the refinement value. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the refinement value's ID. For attribute refinements, this will
      be the ID of the corresponding
      [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md). This ID is included in the
      querystring parameter names returned by the URL-generating methods of
      [SearchModel](dw.catalog.SearchModel.md). For price and category refinements, this
      value will be empty.



---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the optional refinement value description in the current locale.


---

### displayValue
- displayValue: [String](TopLevel.String.md) `(read-only)`
  - : Returns the refinement display value. For attribute refinements, this is
      the appropriate display value based on optional value display names
      within the object attribute definition. If no display name is defined,
      the value itself is returned. For category refinements, this is the
      display name of the category in the current locale. For price
      refinements, this is a string representation of the range appropriate for
      display.



---

### hitCount
- hitCount: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the hit count value.


---

### presentationID
- presentationID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the optional presentation ID associated with this refinement
      value. The presentation ID can be used, for example, to associate an ID
      with an HTML widget.



---

### value
- value: [String](TopLevel.String.md) `(read-only)`
  - : Returns the refinement value. For attribute refinements, this is the
      attribute value if the refinement values are unbucketed, or the bucket
      display name if the values are bucketed. This value is included in the
      querystring parameter values returned by the URL-generating methods of
      [SearchModel](dw.catalog.SearchModel.md). For price refinements, the value will be
      a string representation of the price range lower bound. For category
      refinements, the value will be a category ID.



---

## Method Details

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the optional refinement value description in the current locale.

    **Returns:**
    - the optional refinement value description in the current locale,
              or null if none is defined.



---

### getDisplayValue()
- getDisplayValue(): [String](TopLevel.String.md)
  - : Returns the refinement display value. For attribute refinements, this is
      the appropriate display value based on optional value display names
      within the object attribute definition. If no display name is defined,
      the value itself is returned. For category refinements, this is the
      display name of the category in the current locale. For price
      refinements, this is a string representation of the range appropriate for
      display.


    **Returns:**
    - the refinement display value in the current locale.


---

### getHitCount()
- getHitCount(): [Number](TopLevel.Number.md)
  - : Returns the hit count value.

    **Returns:**
    - the hit count value.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the refinement value's ID. For attribute refinements, this will
      be the ID of the corresponding
      [ObjectAttributeDefinition](dw.object.ObjectAttributeDefinition.md). This ID is included in the
      querystring parameter names returned by the URL-generating methods of
      [SearchModel](dw.catalog.SearchModel.md). For price and category refinements, this
      value will be empty.


    **Returns:**
    - the refinement value's ID.


---

### getPresentationID()
- getPresentationID(): [String](TopLevel.String.md)
  - : Returns the optional presentation ID associated with this refinement
      value. The presentation ID can be used, for example, to associate an ID
      with an HTML widget.


    **Returns:**
    - the presentation ID, or null if none is defined.


---

### getValue()
- getValue(): [String](TopLevel.String.md)
  - : Returns the refinement value. For attribute refinements, this is the
      attribute value if the refinement values are unbucketed, or the bucket
      display name if the values are bucketed. This value is included in the
      querystring parameter values returned by the URL-generating methods of
      [SearchModel](dw.catalog.SearchModel.md). For price refinements, the value will be
      a string representation of the price range lower bound. For category
      refinements, the value will be a category ID.


    **Returns:**
    - the refinement value.


---

<!-- prettier-ignore-end -->
