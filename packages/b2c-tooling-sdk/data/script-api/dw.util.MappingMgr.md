<!-- prettier-ignore-start -->
# Class MappingMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.MappingMgr](dw.util.MappingMgr.md)

Used to manage and interface with mappings loaded into the system via the ImportKeyValueMapping job step. Class can be
used to retrieve values for known keys, iterate over all keys known in a mapping or list all known mappings.


Mappings are read into the system using the ImportKeyValueMapping job step.


Generic mapping capability enables you to map keys to values, with the mapping stored in a high-performance data
store that is independent of the database. This supports large datasets, with high performance for lookup. An example
of using this feature is to map SKUs from a backend system to Commerce Cloud Digital SKUs on-the-fly in Digital script, so
that interaction with the backend system is transparent and does not require adding Digital SKUs to the third
party system.



## Property Summary

| Property | Description |
| --- | --- |
| [mappingNames](#mappingnames): [Collection](dw.util.Collection.md) `(read-only)` | List all known mappings. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [get](dw.util.MappingMgr.md#getstring-mappingkey)([String](TopLevel.String.md), [MappingKey](dw.util.MappingKey.md)) | Returns a map containing value(s) associated to the specified key for the specified mapping. |
| static [getFirst](dw.util.MappingMgr.md#getfirststring-mappingkey)([String](TopLevel.String.md), [MappingKey](dw.util.MappingKey.md)) | Gets the first string value of a mapping by name and key. |
| static [getMappingNames](dw.util.MappingMgr.md#getmappingnames)() | List all known mappings. |
| static [keyIterator](dw.util.MappingMgr.md#keyiteratorstring)([String](TopLevel.String.md)) | Key iterator over known mapping keys by mapping name. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### mappingNames
- mappingNames: [Collection](dw.util.Collection.md) `(read-only)`
  - : List all known mappings.


---

## Method Details

### get(String, MappingKey)
- static get(mappingName: [String](TopLevel.String.md), key: [MappingKey](dw.util.MappingKey.md)): [Map](dw.util.Map.md)
  - : Returns a map containing value(s) associated to the specified key for the specified mapping.

    **Parameters:**
    - mappingName - the mapping name
    - key - the key

    **Throws:**
    - IllegalArgumentException - if mappingName is unknown


---

### getFirst(String, MappingKey)
- static getFirst(mappingName: [String](TopLevel.String.md), key: [MappingKey](dw.util.MappingKey.md)): [String](TopLevel.String.md)
  - : Gets the first string value of a mapping by name and key. Ordering is determined by the input CSV file. Throws an
      exception if mappingName does not exist.


    **Parameters:**
    - mappingName - the mapping name
    - key - the key

    **Returns:**
    - the value if a single value. The first value sequentially if a compound value.

    **Throws:**
    - IllegalArgumentException - if mappingName is unknown


---

### getMappingNames()
- static getMappingNames(): [Collection](dw.util.Collection.md)
  - : List all known mappings.

    **Returns:**
    - the collection of mapping names


---

### keyIterator(String)
- static keyIterator(mappingName: [String](TopLevel.String.md)): [SeekableIterator](dw.util.SeekableIterator.md)
  - : Key iterator over known mapping keys by mapping name. Throws an exception if mappingName does not exist.

    **Parameters:**
    - mappingName - the mapping name

    **Returns:**
    - the seekable iterator

    **Throws:**
    - IllegalArgumentException - if mappingName is unknown


---

<!-- prettier-ignore-end -->
