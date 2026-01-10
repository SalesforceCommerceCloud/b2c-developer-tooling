<!-- prettier-ignore-start -->
# Class Store

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.Store](dw.catalog.Store.md)

Represents a store in Commerce Cloud Digital.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the store. |
| [address1](#address1): [String](TopLevel.String.md) `(read-only)` | Returns the address1 of the store. |
| [address2](#address2): [String](TopLevel.String.md) `(read-only)` | Returns the address2 of the store. |
| [city](#city): [String](TopLevel.String.md) `(read-only)` | Returns the city of the store. |
| [countryCode](#countrycode): [EnumValue](dw.value.EnumValue.md) `(read-only)` | Returns the countryCode of the store. |
| ~~[demandwarePosEnabled](#demandwareposenabled): [Boolean](TopLevel.Boolean.md)~~ `(read-only)` | Returns the demandwarePosEnabled flag for the store. |
| [email](#email): [String](TopLevel.String.md) `(read-only)` | Returns the email of the store. |
| [fax](#fax): [String](TopLevel.String.md) `(read-only)` | Returns the fax of the store. |
| [image](#image): [MediaFile](dw.content.MediaFile.md) `(read-only)` | Returns the store image. |
| [inventoryList](#inventorylist): [ProductInventoryList](dw.catalog.ProductInventoryList.md) `(read-only)` | Returns the inventory list the store is associated with. |
| [inventoryListID](#inventorylistid): [String](TopLevel.String.md) `(read-only)` | Returns the inventory list id the store is associated with. |
| [latitude](#latitude): [Number](TopLevel.Number.md) `(read-only)` | Returns the latitude of the store. |
| [longitude](#longitude): [Number](TopLevel.Number.md) `(read-only)` | Returns the longitude of the store. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the store. |
| [phone](#phone): [String](TopLevel.String.md) `(read-only)` | Returns the phone of the store. |
| [posEnabled](#posenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the posEnabled flag for the Store. |
| [postalCode](#postalcode): [String](TopLevel.String.md) `(read-only)` | Returns the postalCode of the store. |
| [stateCode](#statecode): [String](TopLevel.String.md) `(read-only)` | Returns the stateCode of the store. |
| [storeEvents](#storeevents): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the storeEvents of the store. |
| [storeGroups](#storegroups): [Collection](dw.util.Collection.md) `(read-only)` | Returns all the store groups this store belongs to. |
| [storeHours](#storehours): [MarkupText](dw.content.MarkupText.md) `(read-only)` | Returns the storeHours of the store. |
| [storeLocatorEnabled](#storelocatorenabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the storeLocatorEnabled flag for the store. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAddress1](dw.catalog.Store.md#getaddress1)() | Returns the address1 of the store. |
| [getAddress2](dw.catalog.Store.md#getaddress2)() | Returns the address2 of the store. |
| [getCity](dw.catalog.Store.md#getcity)() | Returns the city of the store. |
| [getCountryCode](dw.catalog.Store.md#getcountrycode)() | Returns the countryCode of the store. |
| [getEmail](dw.catalog.Store.md#getemail)() | Returns the email of the store. |
| [getFax](dw.catalog.Store.md#getfax)() | Returns the fax of the store. |
| [getID](dw.catalog.Store.md#getid)() | Returns the ID of the store. |
| [getImage](dw.catalog.Store.md#getimage)() | Returns the store image. |
| [getInventoryList](dw.catalog.Store.md#getinventorylist)() | Returns the inventory list the store is associated with. |
| [getInventoryListID](dw.catalog.Store.md#getinventorylistid)() | Returns the inventory list id the store is associated with. |
| [getLatitude](dw.catalog.Store.md#getlatitude)() | Returns the latitude of the store. |
| [getLongitude](dw.catalog.Store.md#getlongitude)() | Returns the longitude of the store. |
| [getName](dw.catalog.Store.md#getname)() | Returns the name of the store. |
| [getPhone](dw.catalog.Store.md#getphone)() | Returns the phone of the store. |
| [getPostalCode](dw.catalog.Store.md#getpostalcode)() | Returns the postalCode of the store. |
| [getStateCode](dw.catalog.Store.md#getstatecode)() | Returns the stateCode of the store. |
| [getStoreEvents](dw.catalog.Store.md#getstoreevents)() | Returns the storeEvents of the store. |
| [getStoreGroups](dw.catalog.Store.md#getstoregroups)() | Returns all the store groups this store belongs to. |
| [getStoreHours](dw.catalog.Store.md#getstorehours)() | Returns the storeHours of the store. |
| ~~[isDemandwarePosEnabled](dw.catalog.Store.md#isdemandwareposenabled)()~~ | Returns the demandwarePosEnabled flag for the store. |
| [isPosEnabled](dw.catalog.Store.md#isposenabled)() | Returns the posEnabled flag for the Store. |
| [isStoreLocatorEnabled](dw.catalog.Store.md#isstorelocatorenabled)() | Returns the storeLocatorEnabled flag for the store. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the store.


---

### address1
- address1: [String](TopLevel.String.md) `(read-only)`
  - : Returns the address1 of the store.


---

### address2
- address2: [String](TopLevel.String.md) `(read-only)`
  - : Returns the address2 of the store.


---

### city
- city: [String](TopLevel.String.md) `(read-only)`
  - : Returns the city of the store.


---

### countryCode
- countryCode: [EnumValue](dw.value.EnumValue.md) `(read-only)`
  - : Returns the countryCode of the store.


---

### demandwarePosEnabled
- ~~demandwarePosEnabled: [Boolean](TopLevel.Boolean.md)~~ `(read-only)`
  - : Returns the demandwarePosEnabled flag for the store.
      Indicates that this store uses Commerce Cloud Store for point-of-sale.


    **Deprecated:**
:::warning
Use [isPosEnabled()](dw.catalog.Store.md#isposenabled) instead
:::

---

### email
- email: [String](TopLevel.String.md) `(read-only)`
  - : Returns the email of the store.


---

### fax
- fax: [String](TopLevel.String.md) `(read-only)`
  - : Returns the fax of the store.


---

### image
- image: [MediaFile](dw.content.MediaFile.md) `(read-only)`
  - : Returns the store image.


---

### inventoryList
- inventoryList: [ProductInventoryList](dw.catalog.ProductInventoryList.md) `(read-only)`
  - : Returns the inventory list the store is associated with. If the
      store is not associated with a inventory list, or the inventory list does not
      exist, the method returns null.



---

### inventoryListID
- inventoryListID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the inventory list id the store is associated with. If the
      store is not associated with a inventory list, or the inventory list does not
      exist, the method returns null.



---

### latitude
- latitude: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the latitude of the store.


---

### longitude
- longitude: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the longitude of the store.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the store.


---

### phone
- phone: [String](TopLevel.String.md) `(read-only)`
  - : Returns the phone of the store.


---

### posEnabled
- posEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the posEnabled flag for the Store.
      Indicates that this store uses Commerce Cloud Store for point-of-sale.



---

### postalCode
- postalCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the postalCode of the store.


---

### stateCode
- stateCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the stateCode of the store.


---

### storeEvents
- storeEvents: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the storeEvents of the store.


---

### storeGroups
- storeGroups: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all the store groups this store belongs to.


---

### storeHours
- storeHours: [MarkupText](dw.content.MarkupText.md) `(read-only)`
  - : Returns the storeHours of the store.


---

### storeLocatorEnabled
- storeLocatorEnabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the storeLocatorEnabled flag for the store.


---

## Method Details

### getAddress1()
- getAddress1(): [String](TopLevel.String.md)
  - : Returns the address1 of the store.

    **Returns:**
    - address1 of the store


---

### getAddress2()
- getAddress2(): [String](TopLevel.String.md)
  - : Returns the address2 of the store.

    **Returns:**
    - address2 of the store


---

### getCity()
- getCity(): [String](TopLevel.String.md)
  - : Returns the city of the store.

    **Returns:**
    - city of the store


---

### getCountryCode()
- getCountryCode(): [EnumValue](dw.value.EnumValue.md)
  - : Returns the countryCode of the store.

    **Returns:**
    - countryCode of the store


---

### getEmail()
- getEmail(): [String](TopLevel.String.md)
  - : Returns the email of the store.

    **Returns:**
    - email of the store


---

### getFax()
- getFax(): [String](TopLevel.String.md)
  - : Returns the fax of the store.

    **Returns:**
    - fax of the store


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the store.

    **Returns:**
    - ID of the store


---

### getImage()
- getImage(): [MediaFile](dw.content.MediaFile.md)
  - : Returns the store image.

    **Returns:**
    - the store image.


---

### getInventoryList()
- getInventoryList(): [ProductInventoryList](dw.catalog.ProductInventoryList.md)
  - : Returns the inventory list the store is associated with. If the
      store is not associated with a inventory list, or the inventory list does not
      exist, the method returns null.


    **Returns:**
    - ProductInventoryList or null


---

### getInventoryListID()
- getInventoryListID(): [String](TopLevel.String.md)
  - : Returns the inventory list id the store is associated with. If the
      store is not associated with a inventory list, or the inventory list does not
      exist, the method returns null.


    **Returns:**
    - the inventory list id


---

### getLatitude()
- getLatitude(): [Number](TopLevel.Number.md)
  - : Returns the latitude of the store.

    **Returns:**
    - latitude of the store


---

### getLongitude()
- getLongitude(): [Number](TopLevel.Number.md)
  - : Returns the longitude of the store.

    **Returns:**
    - longitude of the store


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the store.

    **Returns:**
    - name of the store


---

### getPhone()
- getPhone(): [String](TopLevel.String.md)
  - : Returns the phone of the store.

    **Returns:**
    - phone of the store


---

### getPostalCode()
- getPostalCode(): [String](TopLevel.String.md)
  - : Returns the postalCode of the store.

    **Returns:**
    - postalCode of the store


---

### getStateCode()
- getStateCode(): [String](TopLevel.String.md)
  - : Returns the stateCode of the store.

    **Returns:**
    - stateCode of the store


---

### getStoreEvents()
- getStoreEvents(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the storeEvents of the store.

    **Returns:**
    - storeEvents of the store


---

### getStoreGroups()
- getStoreGroups(): [Collection](dw.util.Collection.md)
  - : Returns all the store groups this store belongs to.

    **Returns:**
    - collection of store groups


---

### getStoreHours()
- getStoreHours(): [MarkupText](dw.content.MarkupText.md)
  - : Returns the storeHours of the store.

    **Returns:**
    - storeHours of the store


---

### isDemandwarePosEnabled()
- ~~isDemandwarePosEnabled(): [Boolean](TopLevel.Boolean.md)~~
  - : Returns the demandwarePosEnabled flag for the store.
      Indicates that this store uses Commerce Cloud Store for point-of-sale.


    **Returns:**
    - the demandwarePosEnabled flag

    **Deprecated:**
:::warning
Use [isPosEnabled()](dw.catalog.Store.md#isposenabled) instead
:::

---

### isPosEnabled()
- isPosEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns the posEnabled flag for the Store.
      Indicates that this store uses Commerce Cloud Store for point-of-sale.


    **Returns:**
    - the posEnabled flag


---

### isStoreLocatorEnabled()
- isStoreLocatorEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns the storeLocatorEnabled flag for the store.

    **Returns:**
    - the storeLocatorEnabled flag


---

<!-- prettier-ignore-end -->
