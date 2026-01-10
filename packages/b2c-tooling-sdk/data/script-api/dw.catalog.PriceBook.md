<!-- prettier-ignore-start -->
# Class PriceBook

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.PriceBook](dw.catalog.PriceBook.md)

Represents a price book.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the price book. |
| [currencyCode](#currencycode): [String](TopLevel.String.md) `(read-only)` | Returns the currency code of the price book. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the description of the price book. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the display name of the price book. |
| [online](#online): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the online status of the price book. |
| [onlineFlag](#onlineflag): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the online status flag of the price book. |
| [onlineFrom](#onlinefrom): [Date](TopLevel.Date.md) `(read-only)` | Returns the date from which the price book is online or valid. |
| [onlineTo](#onlineto): [Date](TopLevel.Date.md) `(read-only)` | Returns the date until which the price book is online or valid. |
| [parentPriceBook](#parentpricebook): [PriceBook](dw.catalog.PriceBook.md) `(read-only)` | Returns the parent price book. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCurrencyCode](dw.catalog.PriceBook.md#getcurrencycode)() | Returns the currency code of the price book. |
| [getDescription](dw.catalog.PriceBook.md#getdescription)() | Returns the description of the price book. |
| [getDisplayName](dw.catalog.PriceBook.md#getdisplayname)() | Returns the display name of the price book. |
| [getID](dw.catalog.PriceBook.md#getid)() | Returns the ID of the price book. |
| [getOnlineFlag](dw.catalog.PriceBook.md#getonlineflag)() | Returns the online status flag of the price book. |
| [getOnlineFrom](dw.catalog.PriceBook.md#getonlinefrom)() | Returns the date from which the price book is online or valid. |
| [getOnlineTo](dw.catalog.PriceBook.md#getonlineto)() | Returns the date until which the price book is online or valid. |
| [getParentPriceBook](dw.catalog.PriceBook.md#getparentpricebook)() | Returns the parent price book. |
| [isOnline](dw.catalog.PriceBook.md#isonline)() | Returns the online status of the price book. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the price book.


---

### currencyCode
- currencyCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the currency code of the price book.


---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the description of the price book.


---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name of the price book.


---

### online
- online: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the online status of the price book. The online status
      is calculated from the online status flag and the onlineFrom
      onlineTo dates defined for the price book.



---

### onlineFlag
- onlineFlag: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the online status flag of the price book.


---

### onlineFrom
- onlineFrom: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date from which the price book is online or valid.


---

### onlineTo
- onlineTo: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date until which the price book is online or valid.


---

### parentPriceBook
- parentPriceBook: [PriceBook](dw.catalog.PriceBook.md) `(read-only)`
  - : Returns the parent price book.


---

## Method Details

### getCurrencyCode()
- getCurrencyCode(): [String](TopLevel.String.md)
  - : Returns the currency code of the price book.

    **Returns:**
    - Currency code of the price book


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the description of the price book.

    **Returns:**
    - Currency code of the price book


---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the display name of the price book.

    **Returns:**
    - Display name of the price book


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the price book.

    **Returns:**
    - ID of the price book


---

### getOnlineFlag()
- getOnlineFlag(): [Boolean](TopLevel.Boolean.md)
  - : Returns the online status flag of the price book.

    **Returns:**
    - the online status flag of the price book.


---

### getOnlineFrom()
- getOnlineFrom(): [Date](TopLevel.Date.md)
  - : Returns the date from which the price book is online or valid.

    **Returns:**
    - the date from which the price book is online or valid.


---

### getOnlineTo()
- getOnlineTo(): [Date](TopLevel.Date.md)
  - : Returns the date until which the price book is online or valid.

    **Returns:**
    - the date until which the price book is online or valid.


---

### getParentPriceBook()
- getParentPriceBook(): [PriceBook](dw.catalog.PriceBook.md)
  - : Returns the parent price book.

    **Returns:**
    - Parent price book


---

### isOnline()
- isOnline(): [Boolean](TopLevel.Boolean.md)
  - : Returns the online status of the price book. The online status
      is calculated from the online status flag and the onlineFrom
      onlineTo dates defined for the price book.


    **Returns:**
    - The online status of the price book.


---

<!-- prettier-ignore-end -->
