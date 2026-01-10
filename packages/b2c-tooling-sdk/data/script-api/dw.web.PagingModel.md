<!-- prettier-ignore-start -->
# Class PagingModel

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.PagingModel](dw.web.PagingModel.md)

A page model is a helper class to apply a pages to a collection of
elements or an iterator of elements and supports creating URLs for
continued paging through the elements.

The page model is intended to be initialized with the collection or
iterator, than the paging position is applyed and than the elements are
extracted with getPageElements().

In case the page model is initialized with a collection the page model
can be reused multiple times.



## Constant Summary

| Constant | Description |
| --- | --- |
| [DEFAULT_PAGE_SIZE](#default_page_size): [Number](TopLevel.Number.md) = 10 | The default page size. |
| [MAX_PAGE_SIZE](#max_page_size): [Number](TopLevel.Number.md) = 2000 | The maximum supported page size. |
| [PAGING_SIZE_PARAMETER](#paging_size_parameter): [String](TopLevel.String.md) = "sz" | The URL Parameter used for the page size. |
| [PAGING_START_PARAMETER](#paging_start_parameter): [String](TopLevel.String.md) = "start" | The URL parameter used for the start position. |

## Property Summary

| Property | Description |
| --- | --- |
| [count](#count): [Number](TopLevel.Number.md) `(read-only)` | Returns the count of the number of items in the model. |
| [currentPage](#currentpage): [Number](TopLevel.Number.md) `(read-only)` | Returns the index number of the current page. |
| [empty](#empty): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the model is empty. |
| [end](#end): [Number](TopLevel.Number.md) `(read-only)` | Returns the index of the last element on the current page. |
| [maxPage](#maxpage): [Number](TopLevel.Number.md) `(read-only)` | Returns the maximum possible page number. |
| [pageCount](#pagecount): [Number](TopLevel.Number.md) `(read-only)` | Returns the total page count. |
| [pageElements](#pageelements): [Iterator](dw.util.Iterator.md) `(read-only)` | Returns an iterator that can be used to iterate through the elements of  the current page. |
| [pageSize](#pagesize): [Number](TopLevel.Number.md) | Returns the size of the page. |
| [start](#start): [Number](TopLevel.Number.md) | Returns the current start position from which iteration will start. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [PagingModel](#pagingmodeliterator-number)([Iterator](dw.util.Iterator.md), [Number](TopLevel.Number.md)) | Constructs the PagingModel using the specified iterator and count value. |
| [PagingModel](#pagingmodelcollection)([Collection](dw.util.Collection.md)) | Constructs the PagingModel using the specified collection. |

## Method Summary

| Method | Description |
| --- | --- |
| static [appendPageSize](dw.web.PagingModel.md#appendpagesizeurl-number)([URL](dw.web.URL.md), [Number](TopLevel.Number.md)) | Returns an URL containing the page size parameter appended to the  specified url. |
| [appendPaging](dw.web.PagingModel.md#appendpagingurl)([URL](dw.web.URL.md)) | Returns an URL by appending the current page start position and the  current page size to the URL. |
| [appendPaging](dw.web.PagingModel.md#appendpagingurl-number)([URL](dw.web.URL.md), [Number](TopLevel.Number.md)) | Returns an URL by appending the paging parameters for a desired  page start position and the current page size to the specified url. |
| [getCount](dw.web.PagingModel.md#getcount)() | Returns the count of the number of items in the model. |
| [getCurrentPage](dw.web.PagingModel.md#getcurrentpage)() | Returns the index number of the current page. |
| [getEnd](dw.web.PagingModel.md#getend)() | Returns the index of the last element on the current page. |
| [getMaxPage](dw.web.PagingModel.md#getmaxpage)() | Returns the maximum possible page number. |
| [getPageCount](dw.web.PagingModel.md#getpagecount)() | Returns the total page count. |
| [getPageElements](dw.web.PagingModel.md#getpageelements)() | Returns an iterator that can be used to iterate through the elements of  the current page. |
| [getPageSize](dw.web.PagingModel.md#getpagesize)() | Returns the size of the page. |
| [getStart](dw.web.PagingModel.md#getstart)() | Returns the current start position from which iteration will start. |
| [isEmpty](dw.web.PagingModel.md#isempty)() | Identifies if the model is empty. |
| [setPageSize](dw.web.PagingModel.md#setpagesizenumber)([Number](TopLevel.Number.md)) | Sets the size of the page. |
| [setStart](dw.web.PagingModel.md#setstartnumber)([Number](TopLevel.Number.md)) | Sets the current start position from which iteration will start. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### DEFAULT_PAGE_SIZE

- DEFAULT_PAGE_SIZE: [Number](TopLevel.Number.md) = 10
  - : The default page size.


---

### MAX_PAGE_SIZE

- MAX_PAGE_SIZE: [Number](TopLevel.Number.md) = 2000
  - : The maximum supported page size.


---

### PAGING_SIZE_PARAMETER

- PAGING_SIZE_PARAMETER: [String](TopLevel.String.md) = "sz"
  - : The URL Parameter used for the page size.


---

### PAGING_START_PARAMETER

- PAGING_START_PARAMETER: [String](TopLevel.String.md) = "start"
  - : The URL parameter used for the start position.


---

## Property Details

### count
- count: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the count of the number of items in the model.


---

### currentPage
- currentPage: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the index number of the current page. The page
      counting starts with 0. The method also works with a miss-aligned
      start. In that case the start is always treated as the start of
      a page.



---

### empty
- empty: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the model is empty.


---

### end
- end: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the index of the last element on the current page.


---

### maxPage
- maxPage: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the maximum possible page number. Counting for pages starts
      with 0.  The method also works with a miss-aligned start. In that case
      the returned number might be higher than ((count-1) / pageSize).



---

### pageCount
- pageCount: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the total page count. The method also works
      with a miss-aligned start. In that case the returned number might
      be higher than (count / pageSize).



---

### pageElements
- pageElements: [Iterator](dw.util.Iterator.md) `(read-only)`
  - : Returns an iterator that can be used to iterate through the elements of
      the current page.
      
      In case of a collection as the page models source, the method can be
      called multiple times. Each time a fresh iterator is returned.
      
      In case of an iterator as the page models source, the method must be
      called only once. The method will always return the same iterator,
      which means the method amy return an exhausted iterator.



---

### pageSize
- pageSize: [Number](TopLevel.Number.md)
  - : Returns the size of the page.


---

### start
- start: [Number](TopLevel.Number.md)
  - : Returns the current start position from which iteration will start.


---

## Constructor Details

### PagingModel(Iterator, Number)
- PagingModel(elements: [Iterator](dw.util.Iterator.md), count: [Number](TopLevel.Number.md))
  - : Constructs the PagingModel using the specified iterator and count value.
      Count must not be negative.
      
      Note: A valid count must be provided. The PageModel class can not be used
      if the number of elements is unknown. Without knowning the number of
      elements it still would be possible to return the elements of a particular
      page, but it would be not possible to calculate data like the total number
      of pages or to construct an URL to jump to a particular page.


    **Parameters:**
    - elements - the iterator containing the model elements.
    - count - the count of elements.


---

### PagingModel(Collection)
- PagingModel(elements: [Collection](dw.util.Collection.md))
  - : Constructs the PagingModel using the specified collection.

    **Parameters:**
    - elements - the collection containing the model elements.


---

## Method Details

### appendPageSize(URL, Number)
- static appendPageSize(url: [URL](dw.web.URL.md), pageSize: [Number](TopLevel.Number.md)): [URL](dw.web.URL.md)
  - : Returns an URL containing the page size parameter appended to the
      specified url. The name of the page size parameter is 'sz' (see
      PAGE\_SIZE\_PARAMETER). The start position parameter is not appended to the
      returned URL.


    **Parameters:**
    - url - the URL to append the page size parameter to.
    - pageSize - the page size

    **Returns:**
    - an URL that contains the page size parameter.


---

### appendPaging(URL)
- appendPaging(url: [URL](dw.web.URL.md)): [URL](dw.web.URL.md)
  - : Returns an URL by appending the current page start position and the
      current page size to the URL.


    **Parameters:**
    - url - the URL to append the current paging position to.

    **Returns:**
    - an URL containing the current paging position.


---

### appendPaging(URL, Number)
- appendPaging(url: [URL](dw.web.URL.md), position: [Number](TopLevel.Number.md)): [URL](dw.web.URL.md)
  - : Returns an URL by appending the paging parameters for a desired
      page start position and the current page size to the specified url. The name of
      the page start position parameter is 'start' (see PAGING\_START\_PARAMETER)
      and the page size parameter is 'sz' (see PAGE\_SIZE\_PARAMETER).


    **Parameters:**
    - url - the URL to append the paging parameter to.
    - position - the start position.

    **Returns:**
    - an URL that contains the paging parameters.


---

### getCount()
- getCount(): [Number](TopLevel.Number.md)
  - : Returns the count of the number of items in the model.

    **Returns:**
    - the count of the number of items in the model.


---

### getCurrentPage()
- getCurrentPage(): [Number](TopLevel.Number.md)
  - : Returns the index number of the current page. The page
      counting starts with 0. The method also works with a miss-aligned
      start. In that case the start is always treated as the start of
      a page.


    **Returns:**
    - the index number of the current page.


---

### getEnd()
- getEnd(): [Number](TopLevel.Number.md)
  - : Returns the index of the last element on the current page.

    **Returns:**
    - the index of the last element on the current page.


---

### getMaxPage()
- getMaxPage(): [Number](TopLevel.Number.md)
  - : Returns the maximum possible page number. Counting for pages starts
      with 0.  The method also works with a miss-aligned start. In that case
      the returned number might be higher than ((count-1) / pageSize).


    **Returns:**
    - the maximum possible page number.


---

### getPageCount()
- getPageCount(): [Number](TopLevel.Number.md)
  - : Returns the total page count. The method also works
      with a miss-aligned start. In that case the returned number might
      be higher than (count / pageSize).


    **Returns:**
    - the total page count.


---

### getPageElements()
- getPageElements(): [Iterator](dw.util.Iterator.md)
  - : Returns an iterator that can be used to iterate through the elements of
      the current page.
      
      In case of a collection as the page models source, the method can be
      called multiple times. Each time a fresh iterator is returned.
      
      In case of an iterator as the page models source, the method must be
      called only once. The method will always return the same iterator,
      which means the method amy return an exhausted iterator.


    **Returns:**
    - an iterator that you use to iterate through
      the elements of the current page.



---

### getPageSize()
- getPageSize(): [Number](TopLevel.Number.md)
  - : Returns the size of the page.

    **Returns:**
    - the size of the page.


---

### getStart()
- getStart(): [Number](TopLevel.Number.md)
  - : Returns the current start position from which iteration will start.

    **Returns:**
    - the current start position from which iteration will start.


---

### isEmpty()
- isEmpty(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the model is empty.

    **Returns:**
    - true if the model is empty, false otherwise.


---

### setPageSize(Number)
- setPageSize(pageSize: [Number](TopLevel.Number.md)): void
  - : Sets the size of the page. The page size must be greater or
      equal to 1.


    **Parameters:**
    - pageSize - the size of the page.


---

### setStart(Number)
- setStart(start: [Number](TopLevel.Number.md)): void
  - : Sets the current start position from which iteration will start.

    **Parameters:**
    - start - the current start position from which iteration will start.


---

<!-- prettier-ignore-end -->
