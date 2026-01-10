<!-- prettier-ignore-start -->
# Class WeakSet

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.WeakSet](TopLevel.WeakSet.md)

The WeakSet is set whose elements are subject to garbage collection if there are no more references to the elements.
Only objects (no primitives) can be stored. Elements can't be iterated.


**API Version:**
:::note
Available from version 21.2.
:::

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [WeakSet](#weakset)() | Creates an empty Set. |
| [WeakSet](#weaksetiterable)([Iterable](TopLevel.Iterable.md)) | If the passed value is null or undefined then an empty set is constructed. |

## Method Summary

| Method | Description |
| --- | --- |
| [add](TopLevel.WeakSet.md#addobject)([Object](TopLevel.Object.md)) | Adds an element to the set. |
| [delete](TopLevel.WeakSet.md#deleteobject)([Object](TopLevel.Object.md)) | Removes the element from the set. |
| [has](TopLevel.WeakSet.md#hasobject)([Object](TopLevel.Object.md)) | Returns if this set contains the given object. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### WeakSet()
- WeakSet()
  - : Creates an empty Set.


---

### WeakSet(Iterable)
- WeakSet(values: [Iterable](TopLevel.Iterable.md))
  - : If the passed value is null or undefined then an empty set is constructed. Else an iterable object is expected
      that delivers the initial set entries.


    **Parameters:**
    - values - The initial set entries.


---

## Method Details

### add(Object)
- add(object: [Object](TopLevel.Object.md)): [WeakSet](TopLevel.WeakSet.md)
  - : Adds an element to the set. Does nothing if the set already contains the element.

    **Parameters:**
    - object - The object to add.

    **Returns:**
    - This set object.


---

### delete(Object)
- delete(object: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Removes the element from the set.

    **Parameters:**
    - object - The object to be removed.

    **Returns:**
    - `true` if the set contained the object that was removed. Else `false` is returned.


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
