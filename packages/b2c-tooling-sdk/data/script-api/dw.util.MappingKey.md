<!-- prettier-ignore-start -->
# Class MappingKey

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.util.MappingKey](dw.util.MappingKey.md)

Encapsulates the key for a mapping read in with the ImportKeyValueMapping job step. Can be either single or compound keys. For example, a
single string (e.g. product id) or multiple string components (e.g. product id and site).



## Property Summary

| Property | Description |
| --- | --- |
| [keyComponents](#keycomponents): [String\[\]](TopLevel.String.md) `(read-only)` | Gets the (possible compound) key. |
| [singleComponentKey](#singlecomponentkey): [String](TopLevel.String.md) `(read-only)` | Gets a key that contains only a single key component (i.e. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [MappingKey](#mappingkeystring)([String...](TopLevel.String.md)) | Instantiates a new key using compound key components. |

## Method Summary

| Method | Description |
| --- | --- |
| [getKeyComponents](dw.util.MappingKey.md#getkeycomponents)() | Gets the (possible compound) key. |
| [getSingleComponentKey](dw.util.MappingKey.md#getsinglecomponentkey)() | Gets a key that contains only a single key component (i.e. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### keyComponents
- keyComponents: [String\[\]](TopLevel.String.md) `(read-only)`
  - : Gets the (possible compound) key. If the key consists of only of a single value, the string array
      will simply contain a single element.



---

### singleComponentKey
- singleComponentKey: [String](TopLevel.String.md) `(read-only)`
  - : Gets a key that contains only a single key component (i.e. that is not a compound key). Returns null if this is
      not a single component key.



---

## Constructor Details

### MappingKey(String...)
- MappingKey(keyComponents: [String...](TopLevel.String.md))
  - : Instantiates a new key using compound key components. A key can consist of a single string (e.g. product id) or
      multiple string components (e.g. product id and site). Ctor accepts single string or multiple components for a
      compound key.


    **Parameters:**
    - keyComponents - the key components


---

## Method Details

### getKeyComponents()
- getKeyComponents(): [String\[\]](TopLevel.String.md)
  - : Gets the (possible compound) key. If the key consists of only of a single value, the string array
      will simply contain a single element.


    **Returns:**
    - the key


---

### getSingleComponentKey()
- getSingleComponentKey(): [String](TopLevel.String.md)
  - : Gets a key that contains only a single key component (i.e. that is not a compound key). Returns null if this is
      not a single component key.


    **Returns:**
    - the single key


---

<!-- prettier-ignore-end -->
