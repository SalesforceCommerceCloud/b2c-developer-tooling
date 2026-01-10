<!-- prettier-ignore-start -->
# Class Set

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Set](TopLevel.Set.md)

A Set can store any kind of element and ensures that no duplicates exist.
Objects are stored and iterated in insertion order.


**API Version:**
:::note
Available from version 21.2.
:::

## Property Summary

| Property | Description |
| --- | --- |
| [size](#size): [Number](TopLevel.Number.md) | Number of elements stored in this set. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Set](#set)() | Creates an empty Set. |
| [Set](#setiterable)([Iterable](TopLevel.Iterable.md)) | If the passed value is null or undefined then an empty set is constructed. |

## Method Summary

| Method | Description |
| --- | --- |
| [add](TopLevel.Set.md#addobject)([Object](TopLevel.Object.md)) | Adds an element to the set. |
| [clear](TopLevel.Set.md#clear)() | Removes all elements from this set. |
| [delete](TopLevel.Set.md#deleteobject)([Object](TopLevel.Object.md)) | Removes the element from the set. |
| [entries](TopLevel.Set.md#entries)() | Returns an iterator containing all elements of this set. |
| [forEach](TopLevel.Set.md#foreachfunction)([Function](TopLevel.Function.md)) | Runs the provided callback function once for each element present in this set. |
| [forEach](TopLevel.Set.md#foreachfunction-object)([Function](TopLevel.Function.md), [Object](TopLevel.Object.md)) | Runs the provided callback function once for each element present in this set. |
| [has](TopLevel.Set.md#hasobject)([Object](TopLevel.Object.md)) | Returns if this set contains the given object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### size
- size: [Number](TopLevel.Number.md)
  - : Number of elements stored in this set.


---

## Constructor Details

### Set()
- Set()
  - : Creates an empty Set.


---

### Set(Iterable)
- Set(values: [Iterable](TopLevel.Iterable.md))
  - : If the passed value is null or undefined then an empty set is constructed. Else an iterable object is expected
      that delivers the initial set entries.


    **Parameters:**
    - values - The initial set entries.


---

## Method Details

### add(Object)
- add(object: [Object](TopLevel.Object.md)): [Set](TopLevel.Set.md)
  - : Adds an element to the set. Does nothing if the set already contains the element.

    **Parameters:**
    - object - The object to add.

    **Returns:**
    - This set object.


---

### clear()
- clear(): void
  - : Removes all elements from this set.


---

### delete(Object)
- delete(object: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Removes the element from the set.

    **Parameters:**
    - object - The object to be removed.

    **Returns:**
    - `true` if the set contained the object that was removed. Else `false` is returned.


---

### entries()
- entries(): [ES6Iterator](TopLevel.ES6Iterator.md)
  - : Returns an iterator containing all elements of this set.


---

### forEach(Function)
- forEach(callback: [Function](TopLevel.Function.md)): void
  - : Runs the provided callback function once for each element present in this set.

    **Parameters:**
    - callback - The function to call, which is invoked with three  arguments: the element (as value), the element (as index), and the  Set object being iterated.


---

### forEach(Function, Object)
- forEach(callback: [Function](TopLevel.Function.md), thisObject: [Object](TopLevel.Object.md)): void
  - : Runs the provided callback function once for each element present in this set.

    **Parameters:**
    - callback - The function to call, which is invoked with three  arguments: the element (as value), the element (as index), and the  Set object being iterated.
    - thisObject - The Object to use as 'this' when executing callback.


---

### has(Object)
- has(object: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns if this set contains the given object.

    **Parameters:**
    - object - The object to look for.

    **Returns:**
    - `true` if the set contains the object else `false` is returned.


---

<!-- prettier-ignore-end -->
