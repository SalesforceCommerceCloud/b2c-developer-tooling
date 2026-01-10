<!-- prettier-ignore-start -->
# Class WeakMap

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.WeakMap](TopLevel.WeakMap.md)

The WeakMap is map whose entries are subject to garbage collection if there are no more references to the keys.
Keys must be objects (no primitives). Elements can't be iterated.


**API Version:**
:::note
Available from version 21.2.
:::

## Property Summary

| Property | Description |
| --- | --- |
| [size](#size): [Number](TopLevel.Number.md) | Number of key/value pairs stored in this map. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [WeakMap](#weakmap)() | Creates an empty map. |
| [WeakMap](#weakmapiterable)([Iterable](TopLevel.Iterable.md)) | If the passed value is null or undefined then an empty map is constructed. |

## Method Summary

| Method | Description |
| --- | --- |
| [clear](TopLevel.WeakMap.md#clear)() | Removes all key/value pairs from this map. |
| [delete](TopLevel.WeakMap.md#deleteobject)([Object](TopLevel.Object.md)) | Removes the entry for the given key. |
| [get](TopLevel.WeakMap.md#getobject)([Object](TopLevel.Object.md)) | Returns the value associated with the given key. |
| [has](TopLevel.WeakMap.md#hasobject)([Object](TopLevel.Object.md)) | Returns if this map has value associated with the given key. |
| [set](TopLevel.WeakMap.md#setobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Adds or updates a key/value pair to the map. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### size
- size: [Number](TopLevel.Number.md)
  - : Number of key/value pairs stored in this map.


---

## Constructor Details

### WeakMap()
- WeakMap()
  - : Creates an empty map.


---

### WeakMap(Iterable)
- WeakMap(values: [Iterable](TopLevel.Iterable.md))
  - : If the passed value is null or undefined then an empty map is constructed. Else an iterator object is expected
      that produces a two-element array-like object whose first element is a value that will be used as a Map key and
      whose second element is the value to associate with that key.


    **Parameters:**
    - values - The initial map values


---

## Method Details

### clear()
- clear(): void
  - : Removes all key/value pairs from this map.


---

### delete(Object)
- delete(key: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Removes the entry for the given key.

    **Parameters:**
    - key - The key of the key/value pair to be removed from the map.

    **Returns:**
    - `true` if the map contained an entry for the passed key that was removed. Else `false` is returned.


---

### get(Object)
- get(key: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Returns the value associated with the given key.

    **Parameters:**
    - key - The key to look for.

    **Returns:**
    - The value associated with the given key if an entry with the key exists else `undefined` is returned.


---

### has(Object)
- has(key: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Returns if this map has value associated with the given key.

    **Parameters:**
    - key - The key to look for.

    **Returns:**
    - `true` if an entry with the key exists else `false` is returned.


---

### set(Object, Object)
- set(key: [Object](TopLevel.Object.md), value: [Object](TopLevel.Object.md)): [WeakMap](TopLevel.WeakMap.md)
  - : Adds or updates a key/value pair to the map.

    **Parameters:**
    - key - The key object.
    - value - The value to be associate with the key.

    **Returns:**
    - This map object.


---

<!-- prettier-ignore-end -->
