<!-- prettier-ignore-start -->
# Class SearchModel

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.SearchModel](dw.catalog.SearchModel.md)

Common search model base class.


## All Known Subclasses
[ContentSearchModel](dw.content.ContentSearchModel.md), [ProductSearchModel](dw.catalog.ProductSearchModel.md)
## Constant Summary

| Constant | Description |
| --- | --- |
| [SEARCH_PHRASE_PARAMETER](#search_phrase_parameter): [String](TopLevel.String.md) = "q" | URL Parameter for the Search Phrase |
| [SORT_DIRECTION_ASCENDING](#sort_direction_ascending): [Number](TopLevel.Number.md) = 1 | Sorting parameter ASCENDING |
| [SORT_DIRECTION_DESCENDING](#sort_direction_descending): [Number](TopLevel.Number.md) = 2 | Sorting parameter DESCENDING |
| [SORT_DIRECTION_NONE](#sort_direction_none): [Number](TopLevel.Number.md) = 0 | Sorting parameter NO\_SORT - will remove a sorting condition |

## Property Summary

| Property | Description |
| --- | --- |
| [count](#count): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of search results found by this search. |
| [emptyQuery](#emptyquery): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the query is emtpy when no search term, search parameter or  refinement was specified for the search. |
| [refinedByAttribute](#refinedbyattribute): [Boolean](TopLevel.Boolean.md) `(read-only)` | The method returns true, if this search is refined by at least one  attribute. |
| [refinedSearch](#refinedsearch): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this was a refined search. |
| [searchPhrase](#searchphrase): [String](TopLevel.String.md) | Returns the search phrase used in this search. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [addRefinementValues](dw.catalog.SearchModel.md#addrefinementvaluesstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Adds a refinement. |
| [canRelax](dw.catalog.SearchModel.md#canrelax)() | Identifies if the search can be relaxed without creating a search for all  searchable items. |
| [getCount](dw.catalog.SearchModel.md#getcount)() | Returns the number of search results found by this search. |
| [getRefinementMaxValue](dw.catalog.SearchModel.md#getrefinementmaxvaluestring)([String](TopLevel.String.md)) | Returns the maximum refinement value selected in the query for the specific  attribute, or null if there is no maximum refinement value or no refinement for that attribute. |
| [getRefinementMinValue](dw.catalog.SearchModel.md#getrefinementminvaluestring)([String](TopLevel.String.md)) | Returns the minimum refinement value selected in the query for the specific  attribute, or null if there is no minimum refinement value or no refinement for that attribute. |
| ~~[getRefinementValue](dw.catalog.SearchModel.md#getrefinementvaluestring)([String](TopLevel.String.md))~~ | Returns the refinement value selected in the query for the specific  attribute, or null if there is no refinement for that attribute. |
| [getRefinementValues](dw.catalog.SearchModel.md#getrefinementvaluesstring)([String](TopLevel.String.md)) | Returns the list of selected refinement values for the given attribute as  used in the search. |
| [getSearchPhrase](dw.catalog.SearchModel.md#getsearchphrase)() | Returns the search phrase used in this search. |
| static [getSearchRedirect](dw.catalog.SearchModel.md#getsearchredirectstring)([String](TopLevel.String.md)) | Returns an URLRedirect object for a search phrase. |
| [getSortingCondition](dw.catalog.SearchModel.md#getsortingconditionstring)([String](TopLevel.String.md)) | Returns the sorting condition for a given attribute name. |
| [isEmptyQuery](dw.catalog.SearchModel.md#isemptyquery)() | Identifies if the query is emtpy when no search term, search parameter or  refinement was specified for the search. |
| [isRefinedByAttribute](dw.catalog.SearchModel.md#isrefinedbyattribute)() | The method returns true, if this search is refined by at least one  attribute. |
| [isRefinedByAttribute](dw.catalog.SearchModel.md#isrefinedbyattributestring)([String](TopLevel.String.md)) | Identifies if this search has been refined on the given attribute. |
| [isRefinedByAttributeValue](dw.catalog.SearchModel.md#isrefinedbyattributevaluestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Identifies if this search has been refined on the given attribute and  value. |
| [isRefinedSearch](dw.catalog.SearchModel.md#isrefinedsearch)() | Identifies if this was a refined search. |
| [isRefinementByValueRange](dw.catalog.SearchModel.md#isrefinementbyvaluerangestring)([String](TopLevel.String.md)) | Identifies if this search has been refined on the given attribute. |
| [isRefinementByValueRange](dw.catalog.SearchModel.md#isrefinementbyvaluerangestring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Identifies if this search has been refined on the given attribute and range values. |
| [removeRefinementValues](dw.catalog.SearchModel.md#removerefinementvaluesstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Removes a refinement. |
| [search](dw.catalog.SearchModel.md#search)() | Execute the search. |
| [setRefinementValueRange](dw.catalog.SearchModel.md#setrefinementvaluerangestring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Sets a refinement value range for an attribute. |
| [setRefinementValues](dw.catalog.SearchModel.md#setrefinementvaluesstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Sets refinement values for an attribute. |
| [setSearchPhrase](dw.catalog.SearchModel.md#setsearchphrasestring)([String](TopLevel.String.md)) | Sets the search phrase used in this search. |
| [setSortingCondition](dw.catalog.SearchModel.md#setsortingconditionstring-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Sets or removes a sorting condition for the specified attribute. |
| [url](dw.catalog.SearchModel.md#urlurl)([URL](dw.web.URL.md)) | Constructs an URL that you can use to re-execute the exact same query. |
| [url](dw.catalog.SearchModel.md#urlstring)([String](TopLevel.String.md)) | Constructs an URL that you can use to re-execute the exact same query. |
| [urlDefaultSort](dw.catalog.SearchModel.md#urldefaultsorturl)([URL](dw.web.URL.md)) | Constructs an URL that you can use to re-execute the query with a default  sorting. |
| [urlDefaultSort](dw.catalog.SearchModel.md#urldefaultsortstring)([String](TopLevel.String.md)) | Constructs an URL that you can use to re-execute the query with a default  sorting. |
| [urlRefineAttribute](dw.catalog.SearchModel.md#urlrefineattributeurl-string-string)([URL](dw.web.URL.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs an URL that you can use to re-execute the query with an  additional refinement. |
| [urlRefineAttribute](dw.catalog.SearchModel.md#urlrefineattributestring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs an URL that you can use to re-execute the query with an  additional refinement. |
| [urlRefineAttributeValue](dw.catalog.SearchModel.md#urlrefineattributevalueurl-string-string)([URL](dw.web.URL.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs an URL that you can use to re-execute the query with an  additional refinement value for a given refinement attribute. |
| [urlRefineAttributeValue](dw.catalog.SearchModel.md#urlrefineattributevaluestring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs an URL that you can use to re-execute the query with an  additional refinement value for a given refinement attribute. |
| [urlRefineAttributeValueRange](dw.catalog.SearchModel.md#urlrefineattributevaluerangestring-string-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs an URL that you can use to re-execute the query with an additional refinement value range for a given refinement attribute. |
| [urlRelaxAttribute](dw.catalog.SearchModel.md#urlrelaxattributeurl-string)([URL](dw.web.URL.md), [String](TopLevel.String.md)) | Constructs an URL that you can use to re-execute the query without the  specified refinement. |
| [urlRelaxAttribute](dw.catalog.SearchModel.md#urlrelaxattributestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs an URL that you can use to re-execute the query without the  specified refinement. |
| [urlRelaxAttributeValue](dw.catalog.SearchModel.md#urlrelaxattributevalueurl-string-string)([URL](dw.web.URL.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs an URL that you can use to re-execute the query without the  specified refinement value. |
| [urlRelaxAttributeValue](dw.catalog.SearchModel.md#urlrelaxattributevaluestring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Constructs an URL that you can use to re-execute the query without the  specified refinement. |
| [urlSort](dw.catalog.SearchModel.md#urlsorturl-string-number)([URL](dw.web.URL.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Constructs an URL that you can use to re-execute the query with a  specific sorting criteria. |
| [urlSort](dw.catalog.SearchModel.md#urlsortstring-string-number)([String](TopLevel.String.md), [String](TopLevel.String.md), [Number](TopLevel.Number.md)) | Constructs an URL that you can use to re-execute the query with a  specific sorting criteria. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### SEARCH_PHRASE_PARAMETER

- SEARCH_PHRASE_PARAMETER: [String](TopLevel.String.md) = "q"
  - : URL Parameter for the Search Phrase


---

### SORT_DIRECTION_ASCENDING

- SORT_DIRECTION_ASCENDING: [Number](TopLevel.Number.md) = 1
  - : Sorting parameter ASCENDING


---

### SORT_DIRECTION_DESCENDING

- SORT_DIRECTION_DESCENDING: [Number](TopLevel.Number.md) = 2
  - : Sorting parameter DESCENDING


---

### SORT_DIRECTION_NONE

- SORT_DIRECTION_NONE: [Number](TopLevel.Number.md) = 0
  - : Sorting parameter NO\_SORT - will remove a sorting condition


---

## Property Details

### count
- count: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of search results found by this search.


---

### emptyQuery
- emptyQuery: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the query is emtpy when no search term, search parameter or
      refinement was specified for the search. In case also no result is
      returned. This "empty" is different to a query with a specified query and
      with an empty result.



---

### refinedByAttribute
- refinedByAttribute: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : The method returns true, if this search is refined by at least one
      attribute.



---

### refinedSearch
- refinedSearch: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this was a refined search. A search is a refined search if
      at least one refinement is part of the query.



---

### searchPhrase
- searchPhrase: [String](TopLevel.String.md)
  - : Returns the search phrase used in this search.


---

## Method Details

### addRefinementValues(String, String)
- addRefinementValues(attributeID: [String](TopLevel.String.md), values: [String](TopLevel.String.md)): void
  - : Adds a refinement. The method can be called to add an additional query
      parameter specified as name-value pair. The values string may encode
      multiple values delimited by the pipe symbol ('|').


    **Parameters:**
    - attributeID - The ID of the refinement attribute.
    - values - the refinement value to set


---

### canRelax()
- canRelax(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the search can be relaxed without creating a search for all
      searchable items.


    **Returns:**
    - true if the search can be relaxed without creating a search for
              all searchable items, false otherwise.



---

### getCount()
- getCount(): [Number](TopLevel.Number.md)
  - : Returns the number of search results found by this search.

    **Returns:**
    - the number of search results found by this search.


---

### getRefinementMaxValue(String)
- getRefinementMaxValue(attributeID: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the maximum refinement value selected in the query for the specific
      attribute, or null if there is no maximum refinement value or no refinement for that attribute.


    **Parameters:**
    - attributeID - the attribute whose refinement value is returned.

    **Returns:**
    - the maximum refinement value selected in the query for the specific
              attribute.



---

### getRefinementMinValue(String)
- getRefinementMinValue(attributeID: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the minimum refinement value selected in the query for the specific
      attribute, or null if there is no minimum refinement value or no refinement for that attribute.


    **Parameters:**
    - attributeID - the attribute whose refinement value is returned.

    **Returns:**
    - the minimum refinement value selected in the query for the specific
              attribute.



---

### getRefinementValue(String)
- ~~getRefinementValue(attributeID: [String](TopLevel.String.md)): [String](TopLevel.String.md)~~
  - : Returns the refinement value selected in the query for the specific
      attribute, or null if there is no refinement for that attribute.


    **Parameters:**
    - attributeID - the attribute whose refinement value is returned.

    **Returns:**
    - the refinement value selected in the query for the specific
              attribute.


    **Deprecated:**
:::warning
Use [getRefinementValues(String)](dw.catalog.SearchModel.md#getrefinementvaluesstring) to get the
            collection of refinement values.

:::

---

### getRefinementValues(String)
- getRefinementValues(attributeID: [String](TopLevel.String.md)): [Collection](dw.util.Collection.md)
  - : Returns the list of selected refinement values for the given attribute as
      used in the search.


    **Parameters:**
    - attributeID - The name of the refinement attribute.

    **Returns:**
    - A list of values currently selected for the refinement attribute.


---

### getSearchPhrase()
- getSearchPhrase(): [String](TopLevel.String.md)
  - : Returns the search phrase used in this search.

    **Returns:**
    - the search phrase used in this search.


---

### getSearchRedirect(String)
- static getSearchRedirect(searchPhrase: [String](TopLevel.String.md)): [URLRedirect](dw.web.URLRedirect.md)
  - : Returns an URLRedirect object for a search phrase.

    **Parameters:**
    - searchPhrase - a search phrase to lookup a URLRedirect for

    **Returns:**
    - URLRedirect containing the location and status code,
        null in case no redirect was found for the search phrase.



---

### getSortingCondition(String)
- getSortingCondition(attributeID: [String](TopLevel.String.md)): [Number](TopLevel.Number.md)
  - : Returns the sorting condition for a given attribute name. A value of 0
      indicates that no sorting condition is set.


    **Parameters:**
    - attributeID - the attribute name

    **Returns:**
    - zero if no sorting order set, or the sorting order


---

### isEmptyQuery()
- isEmptyQuery(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the query is emtpy when no search term, search parameter or
      refinement was specified for the search. In case also no result is
      returned. This "empty" is different to a query with a specified query and
      with an empty result.


    **Returns:**
    - true if the query is emtpy when no search term, search parameter
              or refinement was specified for the search.



---

### isRefinedByAttribute()
- isRefinedByAttribute(): [Boolean](TopLevel.Boolean.md)
  - : The method returns true, if this search is refined by at least one
      attribute.


    **Returns:**
    - true, if the search is refined by at least one attribute, false
              otherwise.



---

### isRefinedByAttribute(String)
- isRefinedByAttribute(attributeID: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this search has been refined on the given attribute.

    **Parameters:**
    - attributeID - The ID of the refinement attribute.

    **Returns:**
    - True if the search is refined on the attribute, false otherwise.


---

### isRefinedByAttributeValue(String, String)
- isRefinedByAttributeValue(attributeID: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this search has been refined on the given attribute and
      value.


    **Parameters:**
    - attributeID - The ID of the refinement attribute.
    - value - The value to be checked for inclusion in the refinement.

    **Returns:**
    - True if the search is refined on the attribute and value, false
              otherwise.



---

### isRefinedSearch()
- isRefinedSearch(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this was a refined search. A search is a refined search if
      at least one refinement is part of the query.


    **Returns:**
    - true if this is a refined search, false otherwise.


---

### isRefinementByValueRange(String)
- isRefinementByValueRange(attributeID: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this search has been refined on the given attribute.

    **Parameters:**
    - attributeID - The ID of the refinement attribute.

    **Returns:**
    - True if the search is refined on the attribute, false otherwise.


---

### isRefinementByValueRange(String, String, String)
- isRefinementByValueRange(attributeID: [String](TopLevel.String.md), minValue: [String](TopLevel.String.md), maxValue: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this search has been refined on the given attribute and range values.

    **Parameters:**
    - attributeID - The ID of the refinement attribute.
    - minValue - The minimum value to be checked for inclusion in the refinement.
    - maxValue - The maximum value to be checked for inclusion in the refinement.

    **Returns:**
    - True if the search is refined on the attribute and range values, false otherwise.


---

### removeRefinementValues(String, String)
- removeRefinementValues(attributeID: [String](TopLevel.String.md), values: [String](TopLevel.String.md)): void
  - : Removes a refinement. The method can be called to remove previously added
      refinement values. The values string may encode multiple values delimited
      by the pipe symbol ('|').


    **Parameters:**
    - attributeID - The ID of the refinement attribute.
    - values - the refinement value to remove or null to remove all values


---

### search()
- search(): [SearchStatus](dw.system.SearchStatus.md)
  - : Execute the search.

    **Returns:**
    - the searchStatus object with search status code and description of search result.


---

### setRefinementValueRange(String, String, String)
- setRefinementValueRange(attributeID: [String](TopLevel.String.md), minValue: [String](TopLevel.String.md), maxValue: [String](TopLevel.String.md)): void
  - : Sets a refinement value range for an attribute. The method can be called to set
      an additional range query parameter specified as name-range-value pair. The values
      string can contain only a range boundary.
      Existing refinement values for the attribute will be removed.


    **Parameters:**
    - attributeID - The ID of the refinement attribute.
    - minValue - the minimum refinement boundary value to set or null to remove the minimum boundary
    - maxValue - the maximum refinement boundary value to set or null to remove the maximum boundary


---

### setRefinementValues(String, String)
- setRefinementValues(attributeID: [String](TopLevel.String.md), values: [String](TopLevel.String.md)): void
  - : Sets refinement values for an attribute. The method can be called to set
      an additional query parameter specified as name-value pair. The value
      string may encode multiple values delimited by the pipe symbol ('|').
      Existing refinement values for the attribute will be removed.


    **Parameters:**
    - attributeID - The ID of the refinement attribute.
    - values - the refinement values to set (delimited by '|') or null to             remove all values


---

### setSearchPhrase(String)
- setSearchPhrase(phrase: [String](TopLevel.String.md)): void
  - : Sets the search phrase used in this search. The search query parser uses
      the following operators:
      
      
      - PHRASE operator (""), e.g. "cream cheese", "John Lennon"
      - NOT operator (-), e.g. -cargo (will not return results containing  "cargo")
      - WILDCARD operator (\*), e.g. sho\* (will return results containing  "shoulder", "shoes" and "shoot")


    **Parameters:**
    - phrase - the search phrase used in this search.


---

### setSortingCondition(String, Number)
- setSortingCondition(attributeID: [String](TopLevel.String.md), direction: [Number](TopLevel.Number.md)): void
  - : Sets or removes a sorting condition for the specified attribute. Specify
      either SORT\_DIRECTION\_ASCENDING or SORT\_DIRECTION\_DESCENDING to set a
      sorting condition. Specify SORT\_DIRECTION\_NONE to remove a sorting
      condition from the attribute.


    **Parameters:**
    - attributeID - the attribute ID
    - direction - SORT\_DIRECTION\_ASCENDING, SORT\_DIRECTION\_DESCENDING or             SORT\_DIRECTION\_NONE


---

### url(URL)
- url(url: [URL](dw.web.URL.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the exact same query.
      The search specific parameter are appended to the provided URL. The URL
      is typically generated with one of the URLUtils methods.


    **Parameters:**
    - url - the url to use.

    **Returns:**
    - a new url URL that can be used to re-execute the exact same
              query.



---

### url(String)
- url(action: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the exact same query.
      The provided parameter must be an action, e.g. 'Search-Show'.


    **Parameters:**
    - action - the pipeline action.

    **Returns:**
    - an URL that can be used to re-execute the exact same query.


---

### urlDefaultSort(URL)
- urlDefaultSort(url: [URL](dw.web.URL.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the query with a default
      sorting. The search specific parameters are appended to the provided URL.
      The URL is typically generated with one of the URLUtils methods.


    **Parameters:**
    - url - url or pipeline name

    **Returns:**
    - the new URL.


---

### urlDefaultSort(String)
- urlDefaultSort(url: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the query with a default
      sorting. The provided parameter must be an action, e.g. 'Search-Show'.


    **Parameters:**
    - url - url or pipeline name

    **Returns:**
    - the new URL.


---

### urlRefineAttribute(URL, String, String)
- urlRefineAttribute(url: [URL](dw.web.URL.md), attributeID: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the query with an
      additional refinement. The search specific parameters are appended to the
      provided URL. The URL is typically generated with one of the URLUtils
      methods.


    **Parameters:**
    - url - url
    - attributeID - the ID of the refinement attribute
    - value - value for the refinement attribute

    **Returns:**
    - the new URL.


---

### urlRefineAttribute(String, String, String)
- urlRefineAttribute(action: [String](TopLevel.String.md), attributeID: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the query with an
      additional refinement.


    **Parameters:**
    - action - the pipeline action.
    - attributeID - the ID of the refinement attribute.
    - value - the value for the refinement attribute.

    **Returns:**
    - the new URL.


---

### urlRefineAttributeValue(URL, String, String)
- urlRefineAttributeValue(url: [URL](dw.web.URL.md), attributeID: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the query with an
      additional refinement value for a given refinement attribute. The
      provided value will be added to the set of allowed values for the
      refinement attribute. This basically broadens the search result.
      
      The search specific parameters are appended to the provided URL. The URL
      is typically generated with one of the URLUtils methods.


    **Parameters:**
    - url - url
    - attributeID - ID of the refinement attribute
    - value - the additional value for the refinement attribute

    **Returns:**
    - the new URL.


---

### urlRefineAttributeValue(String, String, String)
- urlRefineAttributeValue(action: [String](TopLevel.String.md), attributeID: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the query with an
      additional refinement value for a given refinement attribute. The
      provided value will be added to the set of allowed values for the
      refinement attribute. This basically broadens the search result.


    **Parameters:**
    - action - the pipeline action.
    - attributeID - the ID of the refinement attribute.
    - value - the additional value for the refinement attribute.

    **Returns:**
    - the new URL.


---

### urlRefineAttributeValueRange(String, String, String, String)
- urlRefineAttributeValueRange(action: [String](TopLevel.String.md), attributeID: [String](TopLevel.String.md), minValue: [String](TopLevel.String.md), maxValue: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the query with an additional refinement value range for a given refinement attribute. The
      provided value range will be replace to the existing value range for the refinement attribute.
      
      The search specific parameters are appended to the provided URL. The URL is typically generated with one of the URLUtils methods.


    **Parameters:**
    - action - the pipeline action.
    - attributeID - ID of the refinement attribute
    - minValue - the min value for the refinement attribute
    - maxValue - the max value for the refinement attribute

    **Returns:**
    - the new URL.


---

### urlRelaxAttribute(URL, String)
- urlRelaxAttribute(url: [URL](dw.web.URL.md), attributeID: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the query without the
      specified refinement. The search specific parameters are appended to the
      provided URL. The URL is typically generated with one of the URLUtils
      methods.


    **Parameters:**
    - url - the url to use.
    - attributeID - the ID of the refinement attribute to be removed.

    **Returns:**
    - the new URL.


---

### urlRelaxAttribute(String, String)
- urlRelaxAttribute(action: [String](TopLevel.String.md), attributeID: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the query without the
      specified refinement. The value for the action parameter must be a
      pipeline action, e.g. 'Search-Show'.


    **Parameters:**
    - action - the pipeline action.
    - attributeID - ID of the refinement attribute to be removed

    **Returns:**
    - the new URL.


---

### urlRelaxAttributeValue(URL, String, String)
- urlRelaxAttributeValue(url: [URL](dw.web.URL.md), attributeID: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the query without the
      specified refinement value. The search specific parameters are appended
      to the provided URL. The URL is typically generated with one of the
      URLUtils methods.


    **Parameters:**
    - url - the url to use.
    - attributeID - the ID of the refinement attribute to relax the value for.
    - value - the value that should be removed from the list of refinement             values.

    **Returns:**
    - the new URL.


---

### urlRelaxAttributeValue(String, String, String)
- urlRelaxAttributeValue(action: [String](TopLevel.String.md), attributeID: [String](TopLevel.String.md), value: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the query without the
      specified refinement. The value for the action parameter must be a
      pipeline action, e.g. 'Search-Show'.


    **Parameters:**
    - action - the pipeline action.
    - attributeID - ID of the refinement attribute to be removed
    - value - the value that should be removed from the list of refinement             values.

    **Returns:**
    - the new URL.


---

### urlSort(URL, String, Number)
- urlSort(url: [URL](dw.web.URL.md), sortBy: [String](TopLevel.String.md), sortDir: [Number](TopLevel.Number.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the query with a
      specific sorting criteria. This criteria will overwrite all previous sort
      critiria. The search specific parameters are appended to the provided
      URL. The URL is typically generated with one of the URLUtils methods.


    **Parameters:**
    - url - URL
    - sortBy - ID of the sort attribute
    - sortDir - Sort direction. 1 - ASCENDING (default), 2 - DESCENDING

    **Returns:**
    - The new URL.


---

### urlSort(String, String, Number)
- urlSort(action: [String](TopLevel.String.md), sortBy: [String](TopLevel.String.md), sortDir: [Number](TopLevel.Number.md)): [URL](dw.web.URL.md)
  - : Constructs an URL that you can use to re-execute the query with a
      specific sorting criteria. This criteria will overwrite all previous sort
      critiria. The provided parameter must be an action, e.g. 'Search-Show'.


    **Parameters:**
    - action - Pipeline action
    - sortBy - ID of the sort attribute
    - sortDir - Sort direction. 1 - ASCENDING (default), 2 - DESCENDING

    **Returns:**
    - The new URL.


---

<!-- prettier-ignore-end -->
