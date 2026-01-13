<!-- prettier-ignore-start -->
# Class Library

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.content.Library](dw.content.Library.md)

Class representing a collection of [Content](dw.content.Content.md) assets, and a
[Folder](dw.content.Folder.md) hierarchy organizing these content assets.
Currently only one library is allowed per site. An instance of this library
can be obtained by calling [ContentMgr.getSiteLibrary()](dw.content.ContentMgr.md#getsitelibrary).



## Property Summary

| Property | Description |
| --- | --- |
| [CMSChannelID](#cmschannelid): [String](TopLevel.String.md) `(read-only)` | Returns the CMS channel of the library. |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of this library. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the display name for the library as known in the current  locale or null if it cannot be found. |
| [root](#root): [Folder](dw.content.Folder.md) `(read-only)` | Returns the root folder for this library. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCMSChannelID](dw.content.Library.md#getcmschannelid)() | Returns the CMS channel of the library. |
| [getDisplayName](dw.content.Library.md#getdisplayname)() | Returns the display name for the library as known in the current  locale or null if it cannot be found. |
| [getID](dw.content.Library.md#getid)() | Returns the ID of this library. |
| [getRoot](dw.content.Library.md#getroot)() | Returns the root folder for this library. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### CMSChannelID
- CMSChannelID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the CMS channel of the library.


---

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of this library.


---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name for the library as known in the current
      locale or null if it cannot be found.



---

### root
- root: [Folder](dw.content.Folder.md) `(read-only)`
  - : Returns the root folder for this library.


---

## Method Details

### getCMSChannelID()
- getCMSChannelID(): [String](TopLevel.String.md)
  - : Returns the CMS channel of the library.

    **Returns:**
    - the CMS channel of the library


---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the display name for the library as known in the current
      locale or null if it cannot be found.


    **Returns:**
    - the display name for the library as known in the current
      locale or null if it cannot be found.



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of this library.

    **Returns:**
    - the ID of this library.


---

### getRoot()
- getRoot(): [Folder](dw.content.Folder.md)
  - : Returns the root folder for this library.

    **Returns:**
    - the root Folder for this library.


---

<!-- prettier-ignore-end -->
