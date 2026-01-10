<!-- prettier-ignore-start -->
# Class Iterator

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Iterator](dw.util.Iterator.md)

The Iterator class allows you to access items in a collection.


## All Known Subclasses
[LoopIterator](dw.web.LoopIterator.md), [SeekableIterator](dw.util.SeekableIterator.md)
## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [asList](dw.util.Iterator.md#aslist)() | Convert the iterator into a list. |
| [asList](dw.util.Iterator.md#aslistnumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Converts a sub-sequence within the iterator into a list. |
| [hasNext](dw.util.Iterator.md#hasnext)() | Indicates if there are more elements. |
| [next](dw.util.Iterator.md#next)() | Returns the next element from the Iterator. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### asList()
- asList(): [List](dw.util.List.md)
  - : Convert the iterator into a list. After this conversion the
      iterator is empty and hasNext() will always return false.
      
      Note: This method should be used with care. For example a large database
      result is pulled into memory completely with this method and can cause
      an OutOfMemory situation.


    **Returns:**
    - the iterator as a list.


---

### asList(Number, Number)
- asList(start: [Number](TopLevel.Number.md), size: [Number](TopLevel.Number.md)): [List](dw.util.List.md)
  - : Converts a sub-sequence within the iterator into a list.
      
      Note: This method should be used with care. For example a large database
      result is pulled into memory completely with this method and can cause
      an OutOfMemory situation.


    **Parameters:**
    - start - the number of elements to iterate before adding elements to             the sublist. Negative values are treated as 0.
    - size - the maximum number of elements to add to the sublist.             Nonpositive values always result in empty list.

    **Returns:**
    - a sub-sequence within the iterator into a list.


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
