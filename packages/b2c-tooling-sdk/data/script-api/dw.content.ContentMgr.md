<!-- prettier-ignore-start -->
# Class ContentMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.content.ContentMgr](dw.content.ContentMgr.md)

Provides helper methods for getting content assets, library folders and the
content library of the current site.



## Constant Summary

| Constant | Description |
| --- | --- |
| [PRIVATE_LIBRARY](#private_library): [String](TopLevel.String.md) = "PrivateLibrary" | The input string to identify that the library is a private site library when invoking [getLibrary(String)](dw.content.ContentMgr.md#getlibrarystring). |

## Property Summary

| Property | Description |
| --- | --- |
| [siteLibrary](#sitelibrary): [Library](dw.content.Library.md) `(read-only)` | Returns the content library of the current site. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getContent](dw.content.ContentMgr.md#getcontentlibrary-string)([Library](dw.content.Library.md), [String](TopLevel.String.md)) | Returns the content with the corresponding identifier within the specified library. |
| static [getContent](dw.content.ContentMgr.md#getcontentstring)([String](TopLevel.String.md)) | Returns the content with the corresponding identifier within the current  site's site library. |
| static [getFolder](dw.content.ContentMgr.md#getfolderlibrary-string)([Library](dw.content.Library.md), [String](TopLevel.String.md)) | Returns the folder identified by the specified id within the specified library. |
| static [getFolder](dw.content.ContentMgr.md#getfolderstring)([String](TopLevel.String.md)) | Returns the folder identified by the specified id within the current  site's site library. |
| static [getLibrary](dw.content.ContentMgr.md#getlibrarystring)([String](TopLevel.String.md)) | Returns the content library specified by the given id. |
| static [getSiteLibrary](dw.content.ContentMgr.md#getsitelibrary)() | Returns the content library of the current site. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### PRIVATE_LIBRARY

- PRIVATE_LIBRARY: [String](TopLevel.String.md) = "PrivateLibrary"
  - : The input string to identify that the library is a private site library when invoking [getLibrary(String)](dw.content.ContentMgr.md#getlibrarystring).


---

## Property Details

### siteLibrary
- siteLibrary: [Library](dw.content.Library.md) `(read-only)`
  - : Returns the content library of the current site.


---

## Method Details

### getContent(Library, String)
- static getContent(library: [Library](dw.content.Library.md), id: [String](TopLevel.String.md)): [Content](dw.content.Content.md)
  - : Returns the content with the corresponding identifier within the specified library.

    **Parameters:**
    - library - the content library to look for the content in
    - id - the ID of the content asset to find.

    **Returns:**
    - the content if found, or null if not found.


---

### getContent(String)
- static getContent(id: [String](TopLevel.String.md)): [Content](dw.content.Content.md)
  - : Returns the content with the corresponding identifier within the current
      site's site library.


    **Parameters:**
    - id - the ID of the content asset to find.

    **Returns:**
    - the content if found, or null if not found.


---

### getFolder(Library, String)
- static getFolder(library: [Library](dw.content.Library.md), id: [String](TopLevel.String.md)): [Folder](dw.content.Folder.md)
  - : Returns the folder identified by the specified id within the specified library.

    **Parameters:**
    - library - the content library to look for the folder in
    - id - the ID of the folder to find.

    **Returns:**
    - the folder, or null if not found.


---

### getFolder(String)
- static getFolder(id: [String](TopLevel.String.md)): [Folder](dw.content.Folder.md)
  - : Returns the folder identified by the specified id within the current
      site's site library.


    **Parameters:**
    - id - the ID of the folder to find.

    **Returns:**
    - the folder, or null if not found.


---

### getLibrary(String)
- static getLibrary(libraryId: [String](TopLevel.String.md)): [Library](dw.content.Library.md)
  - : Returns the content library specified by the given id. If [PRIVATE_LIBRARY](dw.content.ContentMgr.md#private_library) is used, then the current
      site's private library will be returned.


    **Parameters:**
    - libraryId - the id of the library to return.

    **Returns:**
    - the library for the passed id. Returns null if there is no content library with that id.


---

### getSiteLibrary()
- static getSiteLibrary(): [Library](dw.content.Library.md)
  - : Returns the content library of the current site.

    **Returns:**
    - the content library of the current site, or null if there is not
              content library assigned to the current site.



---

<!-- prettier-ignore-end -->
