<!-- prettier-ignore-start -->
# Class StoreGroup

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.StoreGroup](dw.catalog.StoreGroup.md)

Represents a store group. Store groups can be used to group the stores for different marketing purposes.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the store group. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the store group. |
| [stores](#stores): [Collection](dw.util.Collection.md) `(read-only)` | Returns all the stores that are assigned to the store group. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getID](dw.catalog.StoreGroup.md#getid)() | Returns the ID of the store group. |
| [getName](dw.catalog.StoreGroup.md#getname)() | Returns the name of the store group. |
| [getStores](dw.catalog.StoreGroup.md#getstores)() | Returns all the stores that are assigned to the store group. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the store group.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the store group.


---

### stores
- stores: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all the stores that are assigned to the store group.


---

## Method Details

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the store group.

    **Returns:**
    - ID of the store group


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the store group.

    **Returns:**
    - name of the store group


---

### getStores()
- getStores(): [Collection](dw.util.Collection.md)
  - : Returns all the stores that are assigned to the store group.

    **Returns:**
    - collection of the stores


---

<!-- prettier-ignore-end -->
