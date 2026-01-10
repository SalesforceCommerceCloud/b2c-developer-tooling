<!-- prettier-ignore-start -->
# Class Map

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Map](TopLevel.Map.md)

Map objects are collections of key/value pairs where both the keys and values may be arbitrary ECMAScript language
values. A distinct key value may only occur in one key/value pair within the Map's collection. Key/value pairs are stored
and iterated in insertion order.


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
| [Map](#map)() | Creates an empty map. |
| [Map](#mapiterable)([Iterable](TopLevel.Iterable.md)) | If the passed value is null or undefined then an empty map is constructed. |

## Method Summary

| Method | Description |
| --- | --- |
| [clear](TopLevel.Map.md#clear)() | Removes all key/value pairs from this map. |
| [delete](TopLevel.Map.md#deleteobject)([Object](TopLevel.Object.md)) | Removes the entry for the given key. |
| [entries](TopLevel.Map.md#entries)() | Returns an iterator containing all key/value pairs of this map. |
| [forEach](TopLevel.Map.md#foreachfunction)([Function](TopLevel.Function.md)) | Runs the provided callback function once for each key/value pair present in this map. |
| [forEach](TopLevel.Map.md#foreachfunction-object)([Function](TopLevel.Function.md), [Object](TopLevel.Object.md)) | Runs the provided callback function once for each key/value pair present in this map. |
| [get](TopLevel.Map.md#getobject)([Object](TopLevel.Object.md)) | Returns the value associated with the given key. |
| [has](TopLevel.Map.md#hasobject)([Object](TopLevel.Object.md)) | Returns if this map has value associated with the given key. |
| [keys](TopLevel.Map.md#keys)() | Returns an iterator containing all keys of this map. |
| [set](TopLevel.Map.md#setobject-object)([Object](TopLevel.Object.md), [Object](TopLevel.Object.md)) | Adds or updates a key/value pair to the map. |
| [values](TopLevel.Map.md#values)() | Returns an iterator containing all values of this map. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### size
- size: [Number](TopLevel.Number.md)
  - : Number of key/value pairs stored in this map.


---

## Constructor Details

### Map()
- Map()
  - : Creates an empty map.


---

### Map(Iterable)
- Map(values: [Iterable](TopLevel.Iterable.md))
  - : If the passed value is null or undefined then an empty map is constructed. Else an iterator object is expected
      that produces a two element array-like object whose first element is a value that will be used as a Map key and
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

### entries()
- entries(): [ES6Iterator](TopLevel.ES6Iterator.md)
  - : Returns an iterator containing all key/value pairs of this map.
      The iterator produces a series of two-element arrays with the first element as the key and the second element as the value.



---

### forEach(Function)
- forEach(callback: [Function](TopLevel.Function.md)): void
  - : Runs the provided callback function once for each key/value pair present in this map.

    **Parameters:**
    - callback - The function to call, which is invoked with three  arguments: the value of the element, the key of the element, and the  Map object being iterated.


---

### forEach(Function, Object)
- forEach(callback: [Function](TopLevel.Function.md), thisObject: [Object](TopLevel.Object.md)): void
  - : Runs the provided callback function once for each key/value pair present in this map.

    **Parameters:**
    - callback - The function to call, which is invoked with three  arguments: the value of the element, the key of the element, and the  Map object being iterated.
    - thisObject - The Object to use as 'this' when executing callback.


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

### keys()
- keys(): [ES6Iterator](TopLevel.ES6Iterator.md)
  - : Returns an iterator containing all keys of this map.


---

### set(Object, Object)
- set(key: [Object](TopLevel.Object.md), value: [Object](TopLevel.Object.md)): [Map](TopLevel.Map.md)
  - : Adds or updates a key/value pair to the map. 
      
      You can't use JavaScript bracket notation to access map entries. JavaScript bracket notation accesses only
      properties for Map objects, not map entries.


    **Parameters:**
    - key - The key object.
    - value - The value to be associated with the key.

    **Returns:**
    - This map object.


---

### values()
- values(): [ES6Iterator](TopLevel.ES6Iterator.md)
  - : Returns an iterator containing all values of this map.


---

<!-- prettier-ignore-end -->
