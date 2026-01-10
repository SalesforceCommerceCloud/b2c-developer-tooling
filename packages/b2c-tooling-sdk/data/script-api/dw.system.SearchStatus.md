<!-- prettier-ignore-start -->
# Class SearchStatus

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.SearchStatus](dw.system.SearchStatus.md)

A SearchStatus is used for communicating a Search API status back to a client. A status consists of status code and
description. More information about search API call can be fetched by using SearchStatus class method getStatusCode
and getDescription, which can be used by clients to perform different operations.



## Constant Summary

| Constant | Description |
| --- | --- |
| [EMPTY_QUERY](#empty_query): [Number](TopLevel.Number.md) = 6 | EMPTY\_QUERY search result status code 6, this indicates that search has been made with empty query. |
| [ERROR](#error): [Number](TopLevel.Number.md) = 9 | ERROR search result status code 9, this indicates that internal server error has been occurred. |
| [LIMITED](#limited): [Number](TopLevel.Number.md) = 2 | LIMITED search result status code 2, this indicates that limitations on search result have been applied and  full search result is not returned. |
| [NOT_EXECUTED](#not_executed): [Number](TopLevel.Number.md) = 0 | NOT\_EXECUTED search result status code 0, this indicates that search API call has not been made on SearchModel. |
| [NO_CATALOG](#no_catalog): [Number](TopLevel.Number.md) = 4 | NO\_CATALOG search result status code 4, this indicates that there is no catalog associated for search query. |
| [NO_CATEGORY](#no_category): [Number](TopLevel.Number.md) = 5 | NO\_CATEGORY search result status code 5, this indicates that there is no category associated for search query. |
| [NO_INDEX](#no_index): [Number](TopLevel.Number.md) = 8 | NO\_INDEX search result status code 8, this indicates that there is no active search index available. |
| [OFFLINE_CATEGORY](#offline_category): [Number](TopLevel.Number.md) = 7 | OFFLINE\_CATEGORY search result status code 7, this indicates that the category associated with search query  is offline. |
| [ROOT_SEARCH](#root_search): [Number](TopLevel.Number.md) = 3 | ROOT\_SEARCH search result status code 3, this indicates that search result is returned for ROOT search. |
| [SUCCESSFUL](#successful): [Number](TopLevel.Number.md) = 1 | SUCCESSFUL search result status code 1, this indicates that search API call is executed without any issue. |

## Property Summary

| Property | Description |
| --- | --- |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns status code description of search result, it provides more details about search API call status. |
| [statusCode](#statuscode): [Number](TopLevel.Number.md) `(read-only)` | Returns status code of search result, by default it will return 0 which means that search has not been executed  on SearchModel. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getDescription](dw.system.SearchStatus.md#getdescription)() | Returns status code description of search result, it provides more details about search API call status. |
| [getStatusCode](dw.system.SearchStatus.md#getstatuscode)() | Returns status code of search result, by default it will return 0 which means that search has not been executed  on SearchModel. |
| [toString](dw.system.SearchStatus.md#tostring)() | Returns string values of status code and description. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### EMPTY_QUERY

- EMPTY_QUERY: [Number](TopLevel.Number.md) = 6
  - : EMPTY\_QUERY search result status code 6, this indicates that search has been made with empty query.


---

### ERROR

- ERROR: [Number](TopLevel.Number.md) = 9
  - : ERROR search result status code 9, this indicates that internal server error has been occurred.


---

### LIMITED

- LIMITED: [Number](TopLevel.Number.md) = 2
  - : LIMITED search result status code 2, this indicates that limitations on search result have been applied and
      full search result is not returned.



---

### NOT_EXECUTED

- NOT_EXECUTED: [Number](TopLevel.Number.md) = 0
  - : NOT\_EXECUTED search result status code 0, this indicates that search API call has not been made on SearchModel.


---

### NO_CATALOG

- NO_CATALOG: [Number](TopLevel.Number.md) = 4
  - : NO\_CATALOG search result status code 4, this indicates that there is no catalog associated for search query.


---

### NO_CATEGORY

- NO_CATEGORY: [Number](TopLevel.Number.md) = 5
  - : NO\_CATEGORY search result status code 5, this indicates that there is no category associated for search query.


---

### NO_INDEX

- NO_INDEX: [Number](TopLevel.Number.md) = 8
  - : NO\_INDEX search result status code 8, this indicates that there is no active search index available.


---

### OFFLINE_CATEGORY

- OFFLINE_CATEGORY: [Number](TopLevel.Number.md) = 7
  - : OFFLINE\_CATEGORY search result status code 7, this indicates that the category associated with search query
      is offline.



---

### ROOT_SEARCH

- ROOT_SEARCH: [Number](TopLevel.Number.md) = 3
  - : ROOT\_SEARCH search result status code 3, this indicates that search result is returned for ROOT search.


---

### SUCCESSFUL

- SUCCESSFUL: [Number](TopLevel.Number.md) = 1
  - : SUCCESSFUL search result status code 1, this indicates that search API call is executed without any issue.


---

## Property Details

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns status code description of search result, it provides more details about search API call status.


---

### statusCode
- statusCode: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns status code of search result, by default it will return 0 which means that search has not been executed
      on SearchModel.



---

## Method Details

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns status code description of search result, it provides more details about search API call status.

    **Returns:**
    - search status description


---

### getStatusCode()
- getStatusCode(): [Number](TopLevel.Number.md)
  - : Returns status code of search result, by default it will return 0 which means that search has not been executed
      on SearchModel.


    **Returns:**
    - search status code


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns string values of status code and description.

    **Returns:**
    - search status string


---

<!-- prettier-ignore-end -->
