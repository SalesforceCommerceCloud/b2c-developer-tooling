<!-- prettier-ignore-start -->
# Class SeekableIterator

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Iterator](dw.util.Iterator.md)
    - [dw.util.SeekableIterator](dw.util.SeekableIterator.md)

A special Iterator, which is returned by the system to iterate through large
sets of data. The iterator supports seeking forward to a random position.
This is a typical action when paging forward in a result set. The Iterator is
primarily returned from search operations.


Starting with API version 10.6, these iterators can only
be iterated once to avoid possible memory problems for really large
result sets. Putting them into the pipeline dictionary and trying to loop them
multiple times is no longer possible because this would require buffering the
iterated elements internally.


Prior to 10.6, and for all customers still running API version 10.4
(compatibility mode), SeekableIterator instances stored in the pipeline
dictionary could be iterated multiple times (for example, by several loop
nodes).



## Property Summary

| Property | Description |
| --- | --- |
| [count](#count): [Number](TopLevel.Number.md) `(read-only)` | Returns the total element count for this iterator. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [asList](dw.util.SeekableIterator.md#aslistnumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Returns a list representing a subsequence within the iterator. |
| [close](dw.util.SeekableIterator.md#close)() | Closes all system resources associated with this iterator. |
| [first](dw.util.SeekableIterator.md#first)() | Returns the first element of this iterator and closes it. |
| [forward](dw.util.SeekableIterator.md#forwardnumber)([Number](TopLevel.Number.md)) | Seeks forward by the given number of elements. |
| [forward](dw.util.SeekableIterator.md#forwardnumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Seeks forward by the given number of elements and limits the  iteration to the given number of elements. |
| [getCount](dw.util.SeekableIterator.md#getcount)() | Returns the total element count for this iterator. |
| [hasNext](dw.util.SeekableIterator.md#hasnext)() | Indicates if there are more elements. |
| [next](dw.util.SeekableIterator.md#next)() | Returns the next element from the Iterator. |

### Methods inherited from class Iterator

[asList](dw.util.Iterator.md#aslist), [asList](dw.util.Iterator.md#aslistnumber-number), [hasNext](dw.util.Iterator.md#hasnext), [next](dw.util.Iterator.md#next)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### count
- count: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the total element count for this iterator. The
      method returns -1, if the total count is not known.



---

## Method Details

### asList(Number, Number)
- asList(start: [Number](TopLevel.Number.md), size: [Number](TopLevel.Number.md)): [List](dw.util.List.md)
  - : Returns a list representing a subsequence within the iterator. The underlying
      system resources of the iterator will be closed at the end. The start
      position must be 0 or a positive number.


    **Parameters:**
    - start - the position from which to start the subsequence.
    - size - the number of items to collect.

    **Returns:**
    - the list containing the subsequence.


---

### close()
- close(): void
  - : Closes all system resources associated with this iterator.
      
      
      Calling this method is strongly recommended if not all elements of this iterator are
      retrieved. This will allow the system to release system resources immediately.
      The `SeekableIterator` is closed automatically if all elements are retrieved.
      Then calling method `close()` is optional.



---

### first()
- first(): [Object](TopLevel.Object.md)
  - : Returns the first element of this iterator and closes it.
      
      
      If the iterator does not contain another element `null` is returned.
      If any of the methods next(), forward(int) or forward(int,int) have been called before
      `null` is returned.
      This method is useful if only the first element of an iterator is needed.
      
      
      A possible example for the use of first() is:
      
      `OrderMgr.queryOrders("queryString", "sortString", args).first()`


    **Returns:**
    - the first element of an iterator and closes the iterator
      or returns `null` if the iterator doesn't have another element
      or the methods next(), forward(int) or forward(int,int) have already been called.



---

### forward(Number)
- forward(n: [Number](TopLevel.Number.md)): void
  - : Seeks forward by the given number of elements. The number of
      seek steps must be 0 or a positive number.


    **Parameters:**
    - n - the number of elements to seek forward.


---

### forward(Number, Number)
- forward(n: [Number](TopLevel.Number.md), size: [Number](TopLevel.Number.md)): void
  - : Seeks forward by the given number of elements and limits the
      iteration to the given number of elements. The method is typically
      used to position and trim an iterator for paging. The getCount()
      method will still return the total count of the underlying data
      collection.


    **Parameters:**
    - n - the number of elements to seek forward.
    - size - the maximum number of elements return from the iterator


---

### getCount()
- getCount(): [Number](TopLevel.Number.md)
  - : Returns the total element count for this iterator. The
      method returns -1, if the total count is not known.


    **Returns:**
    - the total element count for this iterator or -1.


---

### hasNext()
- hasNext(): [Boolean](TopLevel.Boolean.md)
  - : Indicates if there are more elements.

    **Returns:**
    - true if there are more elements,
      false otherwise.



---

### next()
- next(): [Object](TopLevel.Object.md)
  - : Returns the next element from the Iterator.

    **Returns:**
    - the next element from the Iterator.


---

<!-- prettier-ignore-end -->
