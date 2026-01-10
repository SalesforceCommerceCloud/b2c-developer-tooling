<!-- prettier-ignore-start -->
# Class Map

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Map](dw.util.Map.md)

Represents a Map of objects.


## All Known Subclasses
[HashMap](dw.util.HashMap.md), [LinkedHashMap](dw.util.LinkedHashMap.md), [SortedMap](dw.util.SortedMap.md)
## Property Summary

| Property | Description |
| --- | --- |
| [EMPTY_MAP](#empty_map): [Map](dw.util.Map.md) | Convenience variable, for an empty and immutable list. |
| [empty](#empty): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this map is empty. |
| [length](#length): [Number](TopLevel.Number.md) `(read-only)` | REturns the size of the map. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [clear](dw.util.Map.md#clear)() | Clears the map of all objects. |
| [containsKey](dw.util.Map.md#containskeyobject)([Object](TopLevel.Object.md)) | Identifies if this map contains an element identfied  by the specified key. |
| [containsValue](dw.util.Map.md#containsvalueobject)([Object](TopLevel.Object.md)) | Identifies if this map contains an element identfied  by the specified value. |
| [entrySet](dw.util.Map.md#entryset)() | Returns a set of the map's entries. |
| [get](dw.util.Map.md#getobject)([Object](TopLevel.Object.md)) | Returns the object associated with the key or null. |
| [getLength](dw.util.Map.md#getlength)() | REturns the size of the map. |
| [isEmpty](dw.util.Map.md#isempty)() | Identifies if this map is empty. |
| [keySet](dw.util.Map.md#keyset)() | Returns a set of the map's keys. |
| [put](dw.util.Map.md#putobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Puts the specified value into the map using the  specified key to identify it. |
| [putAll](dw.util.Map.md#putallmap)([Map](dw.util.Map.md)) | Copies all of the objects inside the specified map  into this map. |
| [remove](dw.util.Map.md#removeobject)([Object](TopLevel.Object.md)) | Removes the object from the map that is identified by the key. |
| [size](dw.util.Map.md#size)() | Returns the size of the map. |
| [values](dw.util.Map.md#values---variant-1)() | Returns a collection of the values contained in this map. |
| [values](dw.util.Map.md#values---variant-2)() | Returns a collection of the values contained in this map. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### EMPTY_MAP
- EMPTY_MAP: [Map](dw.util.Map.md)
  - : Convenience variable, for an empty and immutable list.


---

### empty
- empty: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this map is empty.


---

### length
- length: [Number](TopLevel.Number.md) `(read-only)`
  - : REturns the size of the map. This is a bean attribute method and
      supports the access to the collections
      length similar to a ECMA array, such as 'products.length'.



---

## Method Details

### clear()
- clear(): void
  - : Clears the map of all objects.


---

### containsKey(Object)
- containsKey(key: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this map contains an element identfied
      by the specified key.


    **Parameters:**
    - key - the key to use.

    **Returns:**
    - true if this map contains an element whose key is
      equal to the specified key.



---

### containsValue(Object)
- containsValue(value: [Object](TopLevel.Object.md)): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this map contains an element identfied
      by the specified value.


    **Parameters:**
    - value - the value to use.

    **Returns:**
    - true if this map contains an element whose value is
      equal to the specified value.



---

### entrySet()
- entrySet(): [Set](dw.util.Set.md)
  - : Returns a set of the map's entries. The returned set is actually a view to the entries of this map.

    **Returns:**
    - a set of the map's entries.


---

### get(Object)
- get(key: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Returns the object associated with the key or null.

    **Parameters:**
    - key - the key to use.

    **Returns:**
    - the object associated with the key or null.


---

### getLength()
- getLength(): [Number](TopLevel.Number.md)
  - : REturns the size of the map. This is a bean attribute method and
      supports the access to the collections
      length similar to a ECMA array, such as 'products.length'.


    **Returns:**
    - the number of objects in the map.


---

### isEmpty()
- isEmpty(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this map is empty.

    **Returns:**
    - true if the map is empty, false otherwise.


---

### keySet()
- keySet(): [Set](dw.util.Set.md)
  - : Returns a set of the map's keys. The returned set is actually a view to the keys of this map.

    **Returns:**
    - a set of the map's keys.


---

### put(Object, Object)
- put(key: [Object](TopLevel.Object.md), value: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Puts the specified value into the map using the
      specified key to identify it.


    **Parameters:**
    - key - the key to use to identify the value.
    - value - the object to put into the map.

    **Returns:**
    - previous value associated with specified key, or null if there was no mapping for key.


---

### putAll(Map)
- putAll(other: [Map](dw.util.Map.md)): void
  - : Copies all of the objects inside the specified map
      into this map.


    **Parameters:**
    - other - the map whose contents are copied into this map.


---

### remove(Object)
- remove(key: [Object](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Removes the object from the map that is identified by the key.

    **Parameters:**
    - key - the key that identifies the object to remove.

    **Returns:**
    - the removed object or null.


---

### size()
- size(): [Number](TopLevel.Number.md)
  - : Returns the size of the map.

    **Returns:**
    - the number of objects in the map.


---

### values() - Variant 1
- values(): [Collection](dw.util.Collection.md)
  - : Returns a collection of the values contained in this map.

    **Returns:**
    - a collection of the values contained in this map

    **API Version:**
:::note
No longer available as of version 16.1.
Returns an independent modifiable collection holding all values.
:::

---

### values() - Variant 2
- values(): [Collection](dw.util.Collection.md)
  - : Returns a collection of the values contained in this map.

    **Returns:**
    - a collection of the values contained in this map

    **API Version:**
:::note
Available from version 16.1.
Returns a view on the values of this map like keySet() and entrySet() do. Former version returned a shallow copy of this.
:::

---

<!-- prettier-ignore-end -->
