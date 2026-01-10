<!-- prettier-ignore-start -->
# Class List

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Collection](dw.util.Collection.md)
    - [dw.util.List](dw.util.List.md)

An ordered collection of objects. The user of a List has precise control over
where in the list each element is inserted. The user can access elements by
their integer index (position in the list), and search for elements in the
list. Lists are zero based similar to arrays. Unlike sets, lists allow
duplicate elements.



## All Known Subclasses
[ArrayList](dw.util.ArrayList.md)
## Property Summary

| Property | Description |
| --- | --- |
| [EMPTY_LIST](#empty_list): [List](dw.util.List.md) | Convenience variable, for an empty and immutable list. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [addAt](dw.util.List.md#addatnumber-object)([Number](TopLevel.Number.md), [Object](TopLevel.Object.md)) | Adds the specified object into the list at the specified index. |
| [concat](dw.util.List.md#concatobject)([Object...](TopLevel.Object.md)) | Creates and returns a new List that is the result of concatenating this  list with each of the specified values. |
| [fill](dw.util.List.md#fillobject)([Object](TopLevel.Object.md)) | Replaces all of the elements in the list with the given object. |
| [get](dw.util.List.md#getnumber)([Number](TopLevel.Number.md)) | Returns the object at the specified index. |
| [indexOf](dw.util.List.md#indexofobject)([Object](TopLevel.Object.md)) | Returns the index of the first occurrence of the specified element in  this list, or -1 if this list does not contain the element. |
| [join](dw.util.List.md#join)() | Converts all elements of the list to a string by calling the toString()  method and then concatenates them together, with a comma between  elements. |
| [join](dw.util.List.md#joinstring)([String](TopLevel.String.md)) | Converts all elements of the list to a string by calling the toString()  method and then concatenates them together, with the separator string  between elements. |
| [lastIndexOf](dw.util.List.md#lastindexofobject)([Object](TopLevel.Object.md)) | Returns the index of the last occurrence of the specified element in this  list, or -1 if this list does not contain the element. |
| [pop](dw.util.List.md#pop)() | Removes and returns the last element from the list. |
| [push](dw.util.List.md#pushobject)([Object...](TopLevel.Object.md)) | Appends the specified values to the end of the list in order. |
| [removeAt](dw.util.List.md#removeatnumber)([Number](TopLevel.Number.md)) | Removes the object at the specified index. |
| [replaceAll](dw.util.List.md#replaceallobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Replaces all occurrences of oldValue with newValue. |
| [reverse](dw.util.List.md#reverse)() | Reverses the order of the elements in the list. |
| [rotate](dw.util.List.md#rotatenumber)([Number](TopLevel.Number.md)) | Rotates the elements in the list by the specified distance. |
| [set](dw.util.List.md#setnumber-object)([Number](TopLevel.Number.md), [Object](TopLevel.Object.md)) | Replaces the object at the specified index in this list with the specified object. |
| [shift](dw.util.List.md#shift)() | Removes and returns the first element of the list. |
| [shuffle](dw.util.List.md#shuffle)() | Randomly permutes the elements in the list. |
| [size](dw.util.List.md#size)() | Returns the size of this list. |
| [slice](dw.util.List.md#slicenumber)([Number](TopLevel.Number.md)) | Returns a slice, or sublist, of this list. |
| [slice](dw.util.List.md#slicenumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Returns a slice, or sublist, of this list. |
| [sort](dw.util.List.md#sort)() | Sorts the elements of the list based on their natural  order. |
| [sort](dw.util.List.md#sortobject)([Object](TopLevel.Object.md)) | Sorts the elements of a list. |
| [subList](dw.util.List.md#sublistnumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Returns a list containing the elements in this list identified  by the specified arguments. |
| [swap](dw.util.List.md#swapnumber-number)([Number](TopLevel.Number.md), [Number](TopLevel.Number.md)) | Swaps the elements at the specified positions in the list. |
| [unshift](dw.util.List.md#unshiftobject)([Object...](TopLevel.Object.md)) | Inserts values at the beginning of the list. |

### Methods inherited from class Collection

[add](dw.util.Collection.md#addobject), [add1](dw.util.Collection.md#add1object), [addAll](dw.util.Collection.md#addallcollection), [clear](dw.util.Collection.md#clear), [contains](dw.util.Collection.md#containsobject), [containsAll](dw.util.Collection.md#containsallcollection), [getLength](dw.util.Collection.md#getlength), [isEmpty](dw.util.Collection.md#isempty), [iterator](dw.util.Collection.md#iterator), [remove](dw.util.Collection.md#removeobject), [removeAll](dw.util.Collection.md#removeallcollection), [retainAll](dw.util.Collection.md#retainallcollection), [size](dw.util.Collection.md#size), [toArray](dw.util.Collection.md#toarray), [toArray](dw.util.Collection.md#toarraynumber-number)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### EMPTY_LIST
- EMPTY_LIST: [List](dw.util.List.md)
  - : Convenience variable, for an empty and immutable list.


---

## Method Details

### addAt(Number, Object)
- addAt(index: [Number](TopLevel.Number.md), value: [Object](TopLevel.Object.md)): void
  - : Adds the specified object into the list at the specified index.

    **Parameters:**
    - index - the index to use.
    - value - the object to insert.


---

### concat(Object...)
- concat(values: [Object...](TopLevel.Object.md)): [List](dw.util.List.md)
  - : Creates and returns a new List that is the result of concatenating this
      list with each of the specified values. This list itself is unmodified.
      If any of the specified values is itself an array or a Collection, then
      the elements of that Collection or array are appended to the new list
      rather than the object itself.


    **Parameters:**
    - values - one or more objects to concatenate.

    **Returns:**
    - a new List that is the result of concatenating this
      list with each of the specified values.



---

### fill(Object)
- fill(obj: [Object](TopLevel.Object.md)): void
  - : Replaces all of the elements in the list with the given object.

    **Parameters:**
    - obj - the object to use during replacement.


---

### get(Number)
- get(index: [Number](TopLevel.Number.md)): [Object](TopLevel.Object.md)
  - : Returns the object at the specified index.

    **Parameters:**
    - index - the index to use.

    **Returns:**
    - the object at the specified index.


---

### indexOf(Object)
- indexOf(value: [Object](TopLevel.Object.md)): [Number](TopLevel.Number.md)
  - : Returns the index of the first occurrence of the specified element in
      this list, or -1 if this list does not contain the element.


    **Parameters:**
    - value - the element to use.

    **Returns:**
    - the index of the specified object or -1 if the passed object is
              not found in the list.



---

### join()
- join(): [String](TopLevel.String.md)
  - : Converts all elements of the list to a string by calling the toString()
      method and then concatenates them together, with a comma between
      elements.


    **Returns:**
    - The string that results from converting each element of the list
              to a string and then concatenating them together, with a comma
              between elements.



---

### join(String)
- join(separator: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Converts all elements of the list to a string by calling the toString()
      method and then concatenates them together, with the separator string
      between elements. If null is passed, then the comma character is used as
      a separator.


    **Parameters:**
    - separator - The separator string. May be null in which case the             comma character is used.

    **Returns:**
    - The string that results from converting each element of the list
              to a string and then concatenating them together, with the
              separator string between elements.



---

### lastIndexOf(Object)
- lastIndexOf(value: [Object](TopLevel.Object.md)): [Number](TopLevel.Number.md)
  - : Returns the index of the last occurrence of the specified element in this
      list, or -1 if this list does not contain the element.


    **Parameters:**
    - value - the element to use.

    **Returns:**
    - the last index of the specified object or -1 if the passed object
              is not found in the list.



---

### pop()
- pop(): [Object](TopLevel.Object.md)
  - : Removes and returns the last element from the list.

    **Returns:**
    - The last element of the list or null if the list is already
              empty.



---

### push(Object...)
- push(values: [Object...](TopLevel.Object.md)): [Number](TopLevel.Number.md)
  - : Appends the specified values to the end of the list in order.

    **Parameters:**
    - values - One or more values to be appended to the end of the list.

    **Returns:**
    - The new length of the list, after the specified values are
              appended to it.



---

### removeAt(Number)
- removeAt(index: [Number](TopLevel.Number.md)): [Object](TopLevel.Object.md)
  - : Removes the object at the specified index.

    **Parameters:**
    - index - the index to use.

    **Returns:**
    - the object that was removed.


---

### replaceAll(Object, Object)
- replaceAll(oldValue: [Object](TopLevel.Object.md), newValue: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Replaces all occurrences of oldValue with newValue.

    **Parameters:**
    - oldValue - the old object.
    - newValue - the new object.

    **Returns:**
    - true if one or more elements were replaced, false otherwise.


---

### reverse()
- reverse(): void
  - : Reverses the order of the elements in the list.


---

### rotate(Number)
- rotate(distance: [Number](TopLevel.Number.md)): void
  - : Rotates the elements in the list by the specified distance.

    **Parameters:**
    - distance - the distance to use.


---

### set(Number, Object)
- set(index: [Number](TopLevel.Number.md), value: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Replaces the object at the specified index in this list with the specified object.

    **Parameters:**
    - index - the index to use.
    - value - the object to use when replacing the existing object.

    **Returns:**
    - the replaced object.


---

### shift()
- shift(): [Object](TopLevel.Object.md)
  - : Removes and returns the first element of the list. If the list is already
      empty, this method simply returns null.


    **Returns:**
    - The former first element of the list, or null is list is already
              empty.



---

### shuffle()
- shuffle(): void
  - : Randomly permutes the elements in the list.


---

### size()
- size(): [Number](TopLevel.Number.md)
  - : Returns the size of this list.

    **Returns:**
    - the size of this list.


---

### slice(Number)
- slice(from: [Number](TopLevel.Number.md)): [List](dw.util.List.md)
  - : Returns a slice, or sublist, of this list. The returned list contains the
      element specified by `from` and all subsequent elements up to
      the end of this list.


    **Parameters:**
    - from - The index at which the slice is to begin. If negative, this             argument specifies a position measured from the end of this             list. That, -1 indicates the last element, -2 indicates the             next from the last element, and so on.

    **Returns:**
    - A new List that contains the elements of this list from the
              element specified by `from` up to the end of this
              list.



---

### slice(Number, Number)
- slice(from: [Number](TopLevel.Number.md), to: [Number](TopLevel.Number.md)): [List](dw.util.List.md)
  - : Returns a slice, or sublist, of this list. The returned list contains the
      element specified by `from` and all subsequent elements up to,
      but not including, the element specified by `to`.


    **Parameters:**
    - from - The index at which the slice is to begin. If negative, this             argument specifies a position measured from the end of this             list. That, -1 indicates the last element, -2 indicates the             next from the last element, and so on.
    - to - The index immediately after the end of the slice. If this             argument is negative, it specifies an element measured from             the end of this list.

    **Returns:**
    - A new List that contains the elements of this list from the
              element specified by `from` up to, but not including,
              the element specified by `to`.



---

### sort()
- sort(): void
  - : Sorts the elements of the list based on their natural
      order.
      
      
      This sort is guaranteed to be _stable_:  equal elements will
      not be reordered as a result of the sort.



---

### sort(Object)
- sort(comparator: [Object](TopLevel.Object.md)): void
  - : Sorts the elements of a list. The order of the elements is
      determined with a comparator (see PropertyComparator) or with the help
      of the given function. The function must take two parameters and return
      a value <0 if the first parameter is smaller than the second, a value
      of 0 if both are equal and a value if >0 if the first one is greater
      than the second parameter.
      
      
      This sort is guaranteed to be _stable_:  equal elements will
      not be reordered as a result of the sort.


    **Parameters:**
    - comparator - an instance of a PropertyComparator or a comparison function


---

### subList(Number, Number)
- subList(from: [Number](TopLevel.Number.md), to: [Number](TopLevel.Number.md)): [List](dw.util.List.md)
  - : Returns a list containing the elements in this list identified
      by the specified arguments.


    **Parameters:**
    - from - the beginning index of the elements to move to the new list.
    - to - the ending index of the elements to move to the new list.

    **Returns:**
    - the new list containing the elements.


---

### swap(Number, Number)
- swap(i: [Number](TopLevel.Number.md), j: [Number](TopLevel.Number.md)): void
  - : Swaps the elements at the specified positions in the list.

    **Parameters:**
    - i - the first element to swap.
    - j - the second element to swap.


---

### unshift(Object...)
- unshift(values: [Object...](TopLevel.Object.md)): [Number](TopLevel.Number.md)
  - : Inserts values at the beginning of the list.  The first argument
      becomes the new element 0;  the second argument becomes element 1;
      and so on.


    **Parameters:**
    - values - The values to insert into the list.

    **Returns:**
    - The new length of the lest.


---

<!-- prettier-ignore-end -->
