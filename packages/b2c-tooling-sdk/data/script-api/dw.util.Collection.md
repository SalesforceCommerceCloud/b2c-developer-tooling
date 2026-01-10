<!-- prettier-ignore-start -->
# Class Collection

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Collection](dw.util.Collection.md)

Represents a collection of objects.


## All Known Subclasses
[ArrayList](dw.util.ArrayList.md), [FilteringCollection](dw.util.FilteringCollection.md), [HashSet](dw.util.HashSet.md), [LinkedHashSet](dw.util.LinkedHashSet.md), [List](dw.util.List.md), [Set](dw.util.Set.md), [SortedSet](dw.util.SortedSet.md)
## Property Summary

| Property | Description |
| --- | --- |
| [empty](#empty): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if the collection is empty. |
| [length](#length): [Number](TopLevel.Number.md) `(read-only)` | Returns the length of the collection. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [add](dw.util.Collection.md#addobject)([Object...](TopLevel.Object.md)) | Adds the specified objects to the collection. |
| [add1](dw.util.Collection.md#add1object)([Object](TopLevel.Object.md)) | The method adds a single object to the collection. |
| [addAll](dw.util.Collection.md#addallcollection)([Collection](dw.util.Collection.md)) | Adds the collection of objects to the collection. |
| [clear](dw.util.Collection.md#clear)() | Clears the collection. |
| [contains](dw.util.Collection.md#containsobject)([Object](TopLevel.Object.md)) | Returns true if the collection contains the specified object. |
| [containsAll](dw.util.Collection.md#containsallcollection)([Collection](dw.util.Collection.md)) | Returns true if the collection contains all of the objects  in the specified collection. |
| [getLength](dw.util.Collection.md#getlength)() | Returns the length of the collection. |
| [isEmpty](dw.util.Collection.md#isempty)() | Returns true if the collection is empty. |
| [iterator](dw.util.Collection.md#iterator)() | Returns an iterator that can be used to access  the members of the collection. |
| [remove](dw.util.Collection.md#removeobject)([Object](TopLevel.Object.md)) | Removes the specified object from the collection. |
| [removeAll](dw.util.Collection.md#removeallcollection)([Collection](dw.util.Collection.md)) | Removes all of object in the specified object from the collection. |
| [retainAll](dw.util.Collection.md#retainallcollection)([Collection](dw.util.Collection.md)) | Removes all of object in the collection that are not in the  specified collection. |
| [size](dw.util.Collection.md#size)() | Returns the size of the collection. |
| [toArray](dw.util.Collection.md#toarray)() | Returns all elements of this collection in a newly created array. |
| [toArray](dw.util.Collection.md#toarraynumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Returns a subset of the elements of this collection in a newly created array. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### empty
- empty: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if the collection is empty.


---

### length
- length: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the length of the collection. This is similar to
      to a ECMA array of 'products.length'.



---

## Method Details

### add(Object...)
- add(values: [Object...](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Adds the specified objects to the collection. The method can also
      be called with an ECMA array as argument.
      
      If called with a single ECMA array as argument the individual elements of
      that array are added to the collection. If the array object itself should
      be added use the method add1().


    **Parameters:**
    - values - the values to add.

    **Returns:**
    - true if the values were added, false otherwise.


---

### add1(Object)
- add1(object: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : The method adds a single object to the collection.

    **Parameters:**
    - object - the object to add.

    **Returns:**
    - true if the object was added, false otherwise.


---

### addAll(Collection)
- addAll(objs: [Collection](dw.util.Collection.md)): [Boolean](TopLevel.Boolean.md)
  - : Adds the collection of objects to the collection.

    **Parameters:**
    - objs - the objects to add.

    **Returns:**
    - true if the objects were added, false otherwise.


---

### clear()
- clear(): void
  - : Clears the collection.


---

### contains(Object)
- contains(obj: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the collection contains the specified object.

    **Parameters:**
    - obj - the object to locate in this collection.

    **Returns:**
    - true if the collection contains the specified object,
      false otherwise.



---

### containsAll(Collection)
- containsAll(objs: [Collection](dw.util.Collection.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the collection contains all of the objects
      in the specified collection.


    **Parameters:**
    - objs - the collection of objects to locate in this collection.

    **Returns:**
    - true if the collection contains all of the specified objects,
      false otherwise.



---

### getLength()
- getLength(): [Number](TopLevel.Number.md)
  - : Returns the length of the collection. This is similar to
      to a ECMA array of 'products.length'.


    **Returns:**
    - the length of the collection.


---

### isEmpty()
- isEmpty(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the collection is empty.

    **Returns:**
    - true if the collection is empty, false otherwise


---

### iterator()
- iterator(): [Iterator](dw.util.Iterator.md)
  - : Returns an iterator that can be used to access
      the members of the collection.


    **Returns:**
    - an iterator that can be used to access
      the members of the collection.



---

### remove(Object)
- remove(obj: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Removes the specified object from the collection.

    **Parameters:**
    - obj - the object to remove.

    **Returns:**
    - true if the specified object was removed,
      false otherwise.



---

### removeAll(Collection)
- removeAll(objs: [Collection](dw.util.Collection.md)): [Boolean](TopLevel.Boolean.md)
  - : Removes all of object in the specified object from the collection.

    **Parameters:**
    - objs - the collection of objects to remove.

    **Returns:**
    - true if the all of the specified objects were removed,
      false otherwise.



---

### retainAll(Collection)
- retainAll(objs: [Collection](dw.util.Collection.md)): [Boolean](TopLevel.Boolean.md)
  - : Removes all of object in the collection that are not in the
      specified collection.


    **Parameters:**
    - objs - the collection of objects to retain in the collection.

    **Returns:**
    - true if the collection retains all of the specified objects,
      false otherwise.



---

### size()
- size(): [Number](TopLevel.Number.md)
  - : Returns the size of the collection.

    **Returns:**
    - the size of the collection.


---

### toArray()
- toArray(): [Array](TopLevel.Array.md)
  - : Returns all elements of this collection in a newly created array. The returned array is independent of this collection and
      can be modified without changing the collection. The elements in the array are in the same order as they are returned when
      iterating over this collection.


    **Returns:**
    - a newly created array.


---

### toArray(Number, Number)
- toArray(start: [Number](TopLevel.Number.md), size: [Number](TopLevel.Number.md)): [Array](TopLevel.Array.md)
  - : Returns a subset of the elements of this collection in a newly created array. The returned array is independent of this collection and
      can be modified without changing the collection. The elements in the array are in the same order as they are returned when
      iterating over this collection.


    **Parameters:**
    - start - the number of elements to iterate before adding elements to             the array. Negative values are treated as 0.
    - size - the maximum number of elements to add to the array.             Nonpositive values always result in empty array.

    **Returns:**
    - a newly created array.


---

<!-- prettier-ignore-end -->
