<!-- prettier-ignore-start -->
# Class SortedMap

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.Map](dw.util.Map.md)
    - [dw.util.SortedMap](dw.util.SortedMap.md)

A map that further guarantees that it will be in ascending key order,
sorted according to the natural ordering of its keys,
or by a comparator provided at sorted map creation time. This order is reflected
when iterating over the sorted map's collection views (returned by the entrySet,
keySet and values methods).
Note that sorting by natural order is only supported for Number,
String, Date, Money and Quantity as key.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SortedMap](#sortedmap)() | Constructor to create a new SortedMap. |
| [SortedMap](#sortedmapobject)([Object](TopLevel.Object.md)) | Constructor to create a new SortedMap. |

## Method Summary

| Method | Description |
| --- | --- |
| [clone](dw.util.SortedMap.md#clone)() | Returns a shallow copy of this map. |
| [firstKey](dw.util.SortedMap.md#firstkey)() | Returns the first (lowest) key currently in this sorted map. |
| [headMap](dw.util.SortedMap.md#headmapobject)([Object](TopLevel.Object.md)) | Returns a view of the portion of this map whose keys are strictly less than toKey. |
| [lastKey](dw.util.SortedMap.md#lastkey)() | Returns the last (highest) key currently in this sorted map. |
| [subMap](dw.util.SortedMap.md#submapobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Returns a view of the portion of this map whose keys range from fromKey, inclusive,  to toKey, exclusive. |
| [tailMap](dw.util.SortedMap.md#tailmapobject)([Object](TopLevel.Object.md)) | Returns a view of the portion of this map whose keys are greater than or equal  to fromKey. |

### Methods inherited from class Map

[clear](dw.util.Map.md#clear), [containsKey](dw.util.Map.md#containskeyobject), [containsValue](dw.util.Map.md#containsvalueobject), [entrySet](dw.util.Map.md#entryset), [get](dw.util.Map.md#getobject), [getLength](dw.util.Map.md#getlength), [isEmpty](dw.util.Map.md#isempty), [keySet](dw.util.Map.md#keyset), [put](dw.util.Map.md#putobject-object), [putAll](dw.util.Map.md#putallmap), [remove](dw.util.Map.md#removeobject), [size](dw.util.Map.md#size), [values](dw.util.Map.md#values---variant-1), [values](dw.util.Map.md#values---variant-2)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### SortedMap()
- SortedMap()
  - : Constructor to create a new SortedMap.


---

### SortedMap(Object)
- SortedMap(comparator: [Object](TopLevel.Object.md))
  - : Constructor to create a new SortedMap.
      
      The constructor takes a compare function as additional parameter. This comparator
      determines identity and the order of the element keys for this map.
      The order of the elements is determined with a comparator (see [PropertyComparator](dw.util.PropertyComparator.md))
      or with the help of the given function. The function must take two parameters
      and return a value <=-1 if the first parameter is smaller than the second,
      a value if >=1 if the first one is greater than the second parameter
      and a value in between like 0 if both are equal.


    **Parameters:**
    - comparator - an instance of a PropertyComparator or a comparison function


---

## Method Details

### clone()
- clone(): [SortedMap](dw.util.SortedMap.md)
  - : Returns a shallow copy of this map.

    **Returns:**
    - a shallow copy of this map.


---

### firstKey()
- firstKey(): [Object](TopLevel.Object.md)
  - : Returns the first (lowest) key currently in this sorted map.

    **Returns:**
    - the first (lowest) key currently in this sorted map.


---

### headMap(Object)
- headMap(key: [Object](TopLevel.Object.md)): [SortedMap](dw.util.SortedMap.md)
  - : Returns a view of the portion of this map whose keys are strictly less than toKey.

    **Parameters:**
    - key - high endpoint (exclusive) of the headMap.

    **Returns:**
    - a view of the portion of this map whose keys are strictly less than toKey.


---

### lastKey()
- lastKey(): [Object](TopLevel.Object.md)
  - : Returns the last (highest) key currently in this sorted map.

    **Returns:**
    - the last (highest) key currently in this sorted map.


---

### subMap(Object, Object)
- subMap(from: [Object](TopLevel.Object.md), to: [Object](TopLevel.Object.md)): [SortedMap](dw.util.SortedMap.md)
  - : Returns a view of the portion of this map whose keys range from fromKey, inclusive,
      to toKey, exclusive. (If fromKey and toKey are equal, the returned sorted map is empty.)


    **Parameters:**
    - from - low endpoint (inclusive) of the subMap.
    - to - high endpoint (exclusive) of the subMap.

    **Returns:**
    - a view of the portion of this map whose keys range from fromKey, inclusive, to toKey, exclusive.


---

### tailMap(Object)
- tailMap(key: [Object](TopLevel.Object.md)): [SortedMap](dw.util.SortedMap.md)
  - : Returns a view of the portion of this map whose keys are greater than or equal
      to fromKey. The returned sorted map is backed by this map, so changes in the
      returned sorted map are reflected in this map, and vice-versa. The returned
      sorted map supports all optional map operations.


    **Parameters:**
    - key - low endpoint (inclusive) of the tailMap.

    **Returns:**
    - a view of the portion of this map whose keys are greater than or equal to fromKey.


---

<!-- prettier-ignore-end -->
