<!-- prettier-ignore-start -->
# Class SearchRefinements

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.SearchRefinements](dw.catalog.SearchRefinements.md)

Common search refinements base class.


## All Known Subclasses
[ContentSearchRefinements](dw.content.ContentSearchRefinements.md), [ProductSearchRefinements](dw.catalog.ProductSearchRefinements.md)
## Constant Summary

| Constant | Description |
| --- | --- |
| [ASCENDING](#ascending): [Number](TopLevel.Number.md) = 0 | Flag for an ascending sort. |
| [DESCENDING](#descending): [Number](TopLevel.Number.md) = 1 | Flag for a descending sort. |
| [SORT_VALUE_COUNT](#sort_value_count): [Number](TopLevel.Number.md) = 1 | Flag for sorting on value count. |
| [SORT_VALUE_NAME](#sort_value_name): [Number](TopLevel.Number.md) = 0 | Flag for sorting on value name. |

## Property Summary

| Property | Description |
| --- | --- |
| [allRefinementDefinitions](#allrefinementdefinitions): [Collection](dw.util.Collection.md) `(read-only)` | Returns a sorted list of refinement definitions that are appropriate for  the deepest common category (or deepest common folder) of the search  result. |
| [refinementDefinitions](#refinementdefinitions): [Collection](dw.util.Collection.md) `(read-only)` | Returns a sorted list of refinement definitions that are appropriate for  the deepest common category (or deepest common folder) of the search  result. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAllRefinementDefinitions](dw.catalog.SearchRefinements.md#getallrefinementdefinitions)() | Returns a sorted list of refinement definitions that are appropriate for  the deepest common category (or deepest common folder) of the search  result. |
| [getAllRefinementValues](dw.catalog.SearchRefinements.md#getallrefinementvaluesstring)([String](TopLevel.String.md)) | Returns a sorted collection of refinement values for the given refinement  attribute. |
| [getAllRefinementValues](dw.catalog.SearchRefinements.md#getallrefinementvaluesstring-number-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Returns a sorted collection of refinement values for the given refinement  attribute. |
| [getRefinementDefinitions](dw.catalog.SearchRefinements.md#getrefinementdefinitions)() | Returns a sorted list of refinement definitions that are appropriate for  the deepest common category (or deepest common folder) of the search  result. |
| [getRefinementValues](dw.catalog.SearchRefinements.md#getrefinementvaluesstring-number-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Returns a collection of refinement values for the given refinement  attribute, sorting mode and sorting direction. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ASCENDING

- ASCENDING: [Number](TopLevel.Number.md) = 0
  - : Flag for an ascending sort.


---

### DESCENDING

- DESCENDING: [Number](TopLevel.Number.md) = 1
  - : Flag for a descending sort.


---

### SORT_VALUE_COUNT

- SORT_VALUE_COUNT: [Number](TopLevel.Number.md) = 1
  - : Flag for sorting on value count.


---

### SORT_VALUE_NAME

- SORT_VALUE_NAME: [Number](TopLevel.Number.md) = 0
  - : Flag for sorting on value name.


---

## Property Details

### allRefinementDefinitions
- allRefinementDefinitions: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a sorted list of refinement definitions that are appropriate for
      the deepest common category (or deepest common folder) of the search
      result. The method concatenates the sorted refinement definitions per
      category starting at the root category until reaching the deepest common
      category.
      
      The method does not filter out refinement definitions that do
      not provide values for the current search result and can therefore also
      be used on empty search results.



---

### refinementDefinitions
- refinementDefinitions: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a sorted list of refinement definitions that are appropriate for
      the deepest common category (or deepest common folder) of the search
      result. The method concatenates the sorted refinement definitions per category
      starting at the root category until reaching the deepest common category.
      
      The method also filters out refinement definitions that do not provide
      any values for the current search result.



---

## Method Details

### getAllRefinementDefinitions()
- getAllRefinementDefinitions(): [Collection](dw.util.Collection.md)
  - : Returns a sorted list of refinement definitions that are appropriate for
      the deepest common category (or deepest common folder) of the search
      result. The method concatenates the sorted refinement definitions per
      category starting at the root category until reaching the deepest common
      category.
      
      The method does not filter out refinement definitions that do
      not provide values for the current search result and can therefore also
      be used on empty search results.


    **Returns:**
    - A sorted list of refinement definitions appropriate for the
              search result (based on its deepest common category)



---

### getAllRefinementValues(String)
- getAllRefinementValues(attributeName: [String](TopLevel.String.md)): [Collection](dw.util.Collection.md)
  - : Returns a sorted collection of refinement values for the given refinement
      attribute. The returned collection includes all refinement values for
      which the hit count is greater than 0 within the search result when the
      passed attribute is excluded from filtering the search hits but all other
      refinement filters are still applied. This method is useful for rendering
      broadening options for attributes that the search is currently refined
      by. This method does NOT return refinement values independent of the
      search result.
      
      
      For product search refinements, this method may return slightly different
      results based on the "value set" property of the refinement definition.
      See
      [ProductSearchRefinements.getAllRefinementValues(ProductSearchRefinementDefinition)](dw.catalog.ProductSearchRefinements.md#getallrefinementvaluesproductsearchrefinementdefinition)
      for details.


    **Parameters:**
    - attributeName - The name of the attribute to return refinement values             for.

    **Returns:**
    - The collection of SearchRefinementValue instances, sorted
              according to the settings of the refinement definition, or null
              if there is no refinement definition for the passed attribute
              name.



---

### getAllRefinementValues(String, Number, Number)
- getAllRefinementValues(attributeName: [String](TopLevel.String.md), sortMode: [Number](TopLevel.Number.md), sortDirection: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns a sorted collection of refinement values for the given refinement
      attribute. In general, the returned collection includes all refinement
      values for which hit count is greater than 0 within the search result
      assuming that:
      
      
      - The passed refinement attribute is NOT used to filter the search  hits.
      - All other refinements are still applied.
      
      
      This is useful for rendering broadening options for the refinement
      definitions that the search is already refined by. It is important to
      note that this method does NOT return refinement values independent of
      the search result.
      
      
      For product search refinements, this method may return slightly different
      results based on the "value set" of the refinement definition. See
      [ProductSearchRefinements.getAllRefinementValues(ProductSearchRefinementDefinition)](dw.catalog.ProductSearchRefinements.md#getallrefinementvaluesproductsearchrefinementdefinition)
      for details.


    **Parameters:**
    - attributeName - The name of the attribute to return refinement values             for.
    - sortMode - The sort mode to use to control how the collection is             sorted.
    - sortDirection - The sort direction to use.

    **Returns:**
    - The collection of SearchRefinementValue instances, sorted
              according to the passed parameters.



---

### getRefinementDefinitions()
- getRefinementDefinitions(): [Collection](dw.util.Collection.md)
  - : Returns a sorted list of refinement definitions that are appropriate for
      the deepest common category (or deepest common folder) of the search
      result. The method concatenates the sorted refinement definitions per category
      starting at the root category until reaching the deepest common category.
      
      The method also filters out refinement definitions that do not provide
      any values for the current search result.


    **Returns:**
    - A sorted list of refinement definitions appropriate for the
              search result (based on its deepest common category)



---

### getRefinementValues(String, Number, Number)
- getRefinementValues(attributeName: [String](TopLevel.String.md), sortMode: [Number](TopLevel.Number.md), sortDirection: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns a collection of refinement values for the given refinement
      attribute, sorting mode and sorting direction.


    **Parameters:**
    - attributeName - The attribute name to use when collection refinement values.
    - sortMode - The sort mode to use to control how the collection is sorted.
    - sortDirection - The sort direction to use.

    **Returns:**
    - The collection of refinement values.


---

<!-- prettier-ignore-end -->
