<!-- prettier-ignore-start -->
# Class SortedSet

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Collection](dw.util.Collection.md)
    - [dw.util.Set](dw.util.Set.md)
      - [dw.util.SortedSet](dw.util.SortedSet.md)

A set that further guarantees that its iterator
will traverse the set in ascending element order,
sorted according to the natural ordering of its
elements (only supported for Number, String,
Date, Money and Quantity), or by a comparator
provided at sorted set creation time.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SortedSet](#sortedset)() | Constructor to create a new SortedSet. |
| [SortedSet](#sortedsetobject)([Object](TopLevel.Object.md)) | Constructor to create a new SortedSet. |
| [SortedSet](#sortedsetcollection)([Collection](dw.util.Collection.md)) | Constructor for a new SortedSet. |

## Method Summary

| Method | Description |
| --- | --- |
| [clone](dw.util.SortedSet.md#clone)() | Returns a shallow copy of this set. |
| [first](dw.util.SortedSet.md#first)() | Returns the first (lowest) element currently in this sorted set. |
| [headSet](dw.util.SortedSet.md#headsetobject)([Object](TopLevel.Object.md)) | Returns a view of the portion of this sorted set whose elements  are strictly less than toElement. |
| [last](dw.util.SortedSet.md#last)() | Returns the last (highest) element currently in this sorted set. |
| [subSet](dw.util.SortedSet.md#subsetobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Returns a view of the portion of this sorted set whose elements  range from fromElement, inclusive, to toElement, exclusive. |
| [tailSet](dw.util.SortedSet.md#tailsetobject)([Object](TopLevel.Object.md)) | Returns a view of the portion of this sorted set whose elements  are greater than or equal to fromElement. |

### Methods inherited from class Collection

[add](dw.util.Collection.md#addobject), [add1](dw.util.Collection.md#add1object), [addAll](dw.util.Collection.md#addallcollection), [clear](dw.util.Collection.md#clear), [contains](dw.util.Collection.md#containsobject), [containsAll](dw.util.Collection.md#containsallcollection), [getLength](dw.util.Collection.md#getlength), [isEmpty](dw.util.Collection.md#isempty), [iterator](dw.util.Collection.md#iterator), [remove](dw.util.Collection.md#removeobject), [removeAll](dw.util.Collection.md#removeallcollection), [retainAll](dw.util.Collection.md#retainallcollection), [size](dw.util.Collection.md#size), [toArray](dw.util.Collection.md#toarray), [toArray](dw.util.Collection.md#toarraynumber-number)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### SortedSet()
- SortedSet()
  - : Constructor to create a new SortedSet.


---

### SortedSet(Object)
- SortedSet(comparator: [Object](TopLevel.Object.md))
  - : Constructor to create a new SortedSet.
      
      The constructor takes a compare function as additional parameter. This comparator
      determines identity and the order of the elements for this set.
      The order of the elements is determined with a comparator (see [PropertyComparator](dw.util.PropertyComparator.md))
      or with the help of the given function. The function must take two parameters
      and return a value <=-1 if the first parameter is smaller than the second,
      a value if >=1 if the first one is greater than the second parameter
      and a value in between like 0 if both are equal.


    **Parameters:**
    - comparator - an instance of a PropertyComparator or a comparison function


---

### SortedSet(Collection)
- SortedSet(collection: [Collection](dw.util.Collection.md))
  - : Constructor for a new SortedSet. The constructor
      initializes the SortedSet with the elements of the
      given collection.


    **Parameters:**
    - collection - the collection of objects that are  inserted into the set.


---

## Method Details

### clone()
- clone(): [SortedSet](dw.util.SortedSet.md)
  - : Returns a shallow copy of this set.

    **Returns:**
    - a shallow copy of this set.


---

### first()
- first(): [Object](TopLevel.Object.md)
  - : Returns the first (lowest) element currently in this sorted set.

    **Returns:**
    - the first (lowest) element currently in this sorted set.


---

### headSet(Object)
- headSet(key: [Object](TopLevel.Object.md)): [SortedSet](dw.util.SortedSet.md)
  - : Returns a view of the portion of this sorted set whose elements
      are strictly less than toElement. The returned sorted set is
      backed by this sorted set, so changes in the returned sorted
      set are reflected in this sorted set, and vice-versa. The returned
      sorted set supports all optional set operations.


    **Parameters:**
    - key - high endpoint (exclusive) of the headSet.

    **Returns:**
    - a view of the specified initial range of this sorted set.


---

### last()
- last(): [Object](TopLevel.Object.md)
  - : Returns the last (highest) element currently in this sorted set.

    **Returns:**
    - the last (highest) element currently in this sorted set.


---

### subSet(Object, Object)
- subSet(from: [Object](TopLevel.Object.md), to: [Object](TopLevel.Object.md)): [SortedSet](dw.util.SortedSet.md)
  - : Returns a view of the portion of this sorted set whose elements
      range from fromElement, inclusive, to toElement, exclusive. (If
      fromElement and toElement are equal, the returned sorted set is empty.)
      The returned sorted set is backed by this sorted set, so changes in
      the returned sorted set are reflected in this sorted set, and vice-versa.
      The returned sorted set supports all optional set operations that this
      sorted set supports.


    **Parameters:**
    - from - low endpoint (inclusive) of the subSet.
    - to - high endpoint (exclusive) of the subSet.

    **Returns:**
    - a view of the specified range within this sorted set.


---

### tailSet(Object)
- tailSet(key: [Object](TopLevel.Object.md)): [SortedSet](dw.util.SortedSet.md)
  - : Returns a view of the portion of this sorted set whose elements
      are greater than or equal to fromElement. The returned sorted set
      is backed by this sorted set, so changes in the returned sorted
      set are reflected in this sorted set, and vice-versa. The returned
      sorted set supports all optional set operations.


    **Parameters:**
    - key - low endpoint (inclusive) of the tailSet.

    **Returns:**
    - a view of the specified final range of this sorted set.


---

<!-- prettier-ignore-end -->
