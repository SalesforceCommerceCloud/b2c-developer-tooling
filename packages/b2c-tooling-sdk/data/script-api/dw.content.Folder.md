<!-- prettier-ignore-start -->
# Class Folder

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.content.Folder](dw.content.Folder.md)

Class representing a folder for organizing content assets in Commerce Cloud Digital.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the folder. |
| [content](#content): [Collection](dw.util.Collection.md) `(read-only)` | Returns the content objects for this folder, sorted by position. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the description for the folder as known in the current  locale or null if it cannot be found. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the display name for the folder as known in the current  locale or null if it cannot be found. |
| [online](#online): [Boolean](TopLevel.Boolean.md) `(read-only)` | Indicates if the folder is set online or  offline. |
| [onlineContent](#onlinecontent): [Collection](dw.util.Collection.md) `(read-only)` | Returns the online content objects for this folder, sorted by position. |
| [onlineSubFolders](#onlinesubfolders): [Collection](dw.util.Collection.md) `(read-only)` | Returns the online subfolders of this folder, sorted by position. |
| [pageDescription](#pagedescription): [String](TopLevel.String.md) `(read-only)` | Returns the page description for this folder using the value in  the current locale, or returns null if no value was found. |
| [pageKeywords](#pagekeywords): [String](TopLevel.String.md) `(read-only)` | Returns the page keywords for this folder using the value in  the current locale, or returns null if no value was found. |
| [pageTitle](#pagetitle): [String](TopLevel.String.md) `(read-only)` | Returns the page title for this folder using the value in  the current locale, or returns null if no value was found. |
| [pageURL](#pageurl): [String](TopLevel.String.md) `(read-only)` | Returns the page URL for this folder using the value in  the current locale, or returns null if no value was found. |
| [parent](#parent): [Folder](dw.content.Folder.md) `(read-only)` | Returns the parent folder of this folder. |
| [root](#root): [Boolean](TopLevel.Boolean.md) `(read-only)` | Indicates if this is the root folder. |
| [siteMapChangeFrequency](#sitemapchangefrequency): [String](TopLevel.String.md) `(read-only)` | Returns the folder's sitemap change frequency. |
| [siteMapIncluded](#sitemapincluded): [Number](TopLevel.Number.md) `(read-only)` | Returns the folder's sitemap inclusion. |
| [siteMapPriority](#sitemappriority): [Number](TopLevel.Number.md) `(read-only)` | Returns the folder's sitemap priority. |
| [subFolders](#subfolders): [Collection](dw.util.Collection.md) `(read-only)` | Returns the subfolders of this folder, sorted by position. |
| [template](#template): [String](TopLevel.String.md) `(read-only)` | Returns the name of the template used to render the folder  in the store front. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getContent](dw.content.Folder.md#getcontent)() | Returns the content objects for this folder, sorted by position. |
| [getDescription](dw.content.Folder.md#getdescription)() | Returns the description for the folder as known in the current  locale or null if it cannot be found. |
| [getDisplayName](dw.content.Folder.md#getdisplayname)() | Returns the display name for the folder as known in the current  locale or null if it cannot be found. |
| [getID](dw.content.Folder.md#getid)() | Returns the ID of the folder. |
| [getOnlineContent](dw.content.Folder.md#getonlinecontent)() | Returns the online content objects for this folder, sorted by position. |
| [getOnlineSubFolders](dw.content.Folder.md#getonlinesubfolders)() | Returns the online subfolders of this folder, sorted by position. |
| [getPageDescription](dw.content.Folder.md#getpagedescription)() | Returns the page description for this folder using the value in  the current locale, or returns null if no value was found. |
| [getPageKeywords](dw.content.Folder.md#getpagekeywords)() | Returns the page keywords for this folder using the value in  the current locale, or returns null if no value was found. |
| [getPageTitle](dw.content.Folder.md#getpagetitle)() | Returns the page title for this folder using the value in  the current locale, or returns null if no value was found. |
| [getPageURL](dw.content.Folder.md#getpageurl)() | Returns the page URL for this folder using the value in  the current locale, or returns null if no value was found. |
| [getParent](dw.content.Folder.md#getparent)() | Returns the parent folder of this folder. |
| [getSiteMapChangeFrequency](dw.content.Folder.md#getsitemapchangefrequency)() | Returns the folder's sitemap change frequency. |
| [getSiteMapIncluded](dw.content.Folder.md#getsitemapincluded)() | Returns the folder's sitemap inclusion. |
| [getSiteMapPriority](dw.content.Folder.md#getsitemappriority)() | Returns the folder's sitemap priority. |
| [getSubFolders](dw.content.Folder.md#getsubfolders)() | Returns the subfolders of this folder, sorted by position. |
| [getTemplate](dw.content.Folder.md#gettemplate)() | Returns the name of the template used to render the folder  in the store front. |
| [isOnline](dw.content.Folder.md#isonline)() | Indicates if the folder is set online or  offline. |
| [isRoot](dw.content.Folder.md#isroot)() | Indicates if this is the root folder. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the folder. The ID can be used to uniquely
      identify a folder within any given library. This folder ID provides
      an alternative lookup mechanism for folders frequently used in
      the storefront.



---

### content
- content: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the content objects for this folder, sorted by position.


---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the description for the folder as known in the current
      locale or null if it cannot be found.



---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the display name for the folder as known in the current
      locale or null if it cannot be found.



---

### online
- online: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Indicates if the folder is set online or
      offline. Initially, all folders are set online.



---

### onlineContent
- onlineContent: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the online content objects for this folder, sorted by position.


---

### onlineSubFolders
- onlineSubFolders: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the online subfolders of this folder, sorted by position.


---

### pageDescription
- pageDescription: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page description for this folder using the value in
      the current locale, or returns null if no value was found.



---

### pageKeywords
- pageKeywords: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page keywords for this folder using the value in
      the current locale, or returns null if no value was found.



---

### pageTitle
- pageTitle: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page title for this folder using the value in
      the current locale, or returns null if no value was found.



---

### pageURL
- pageURL: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page URL for this folder using the value in
      the current locale, or returns null if no value was found.



---

### parent
- parent: [Folder](dw.content.Folder.md) `(read-only)`
  - : Returns the parent folder of this folder.


---

### root
- root: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Indicates if this is the root folder.


---

### siteMapChangeFrequency
- siteMapChangeFrequency: [String](TopLevel.String.md) `(read-only)`
  - : Returns the folder's sitemap change frequency.


---

### siteMapIncluded
- siteMapIncluded: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the folder's sitemap inclusion.


---

### siteMapPriority
- siteMapPriority: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the folder's sitemap priority.


---

### subFolders
- subFolders: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the subfolders of this folder, sorted by position.


---

### template
- template: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the template used to render the folder
      in the store front.



---

## Method Details

### getContent()
- getContent(): [Collection](dw.util.Collection.md)
  - : Returns the content objects for this folder, sorted by position.

    **Returns:**
    - the content objects for this folder, sorted by position.


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the description for the folder as known in the current
      locale or null if it cannot be found.


    **Returns:**
    - the description for the folder as known in the current
      locale or null if it cannot be found.



---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the display name for the folder as known in the current
      locale or null if it cannot be found.


    **Returns:**
    - the display name for the folder as known in the current
      locale or null if it cannot be found.



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the folder. The ID can be used to uniquely
      identify a folder within any given library. This folder ID provides
      an alternative lookup mechanism for folders frequently used in
      the storefront.


    **Returns:**
    - the ID of the folder.


---

### getOnlineContent()
- getOnlineContent(): [Collection](dw.util.Collection.md)
  - : Returns the online content objects for this folder, sorted by position.

    **Returns:**
    - the online content objects for this folder, sorted by position.


---

### getOnlineSubFolders()
- getOnlineSubFolders(): [Collection](dw.util.Collection.md)
  - : Returns the online subfolders of this folder, sorted by position.

    **Returns:**
    - the online subfolders of this folder, sorted by position.


---

### getPageDescription()
- getPageDescription(): [String](TopLevel.String.md)
  - : Returns the page description for this folder using the value in
      the current locale, or returns null if no value was found.


    **Returns:**
    - the page description for this folder using the value in
      the current locale, or returns null if no value was found.



---

### getPageKeywords()
- getPageKeywords(): [String](TopLevel.String.md)
  - : Returns the page keywords for this folder using the value in
      the current locale, or returns null if no value was found.


    **Returns:**
    - the page keywords for this folder using the value in
      the current locale, or returns null if no value was found.



---

### getPageTitle()
- getPageTitle(): [String](TopLevel.String.md)
  - : Returns the page title for this folder using the value in
      the current locale, or returns null if no value was found.


    **Returns:**
    - the page title for this folder using the value in
      the current locale, or returns null if no value was found.



---

### getPageURL()
- getPageURL(): [String](TopLevel.String.md)
  - : Returns the page URL for this folder using the value in
      the current locale, or returns null if no value was found.


    **Returns:**
    - the page URL for this folder using the value in
      the current locale, or returns null if no value was found.



---

### getParent()
- getParent(): [Folder](dw.content.Folder.md)
  - : Returns the parent folder of this folder.

    **Returns:**
    - the parent folder of this folder.


---

### getSiteMapChangeFrequency()
- getSiteMapChangeFrequency(): [String](TopLevel.String.md)
  - : Returns the folder's sitemap change frequency.

    **Returns:**
    - the value of the attribute 'siteMapChangeFrequency'.


---

### getSiteMapIncluded()
- getSiteMapIncluded(): [Number](TopLevel.Number.md)
  - : Returns the folder's sitemap inclusion.

    **Returns:**
    - the value of the attribute 'siteMapIncluded'.


---

### getSiteMapPriority()
- getSiteMapPriority(): [Number](TopLevel.Number.md)
  - : Returns the folder's sitemap priority.

    **Returns:**
    - the value of the attribute 'siteMapPriority'.


---

### getSubFolders()
- getSubFolders(): [Collection](dw.util.Collection.md)
  - : Returns the subfolders of this folder, sorted by position.

    **Returns:**
    - the subfolders of this folder, sorted by position.


---

### getTemplate()
- getTemplate(): [String](TopLevel.String.md)
  - : Returns the name of the template used to render the folder
      in the store front.


    **Returns:**
    - the name of the template used to render the folder.


---

### isOnline()
- isOnline(): [Boolean](TopLevel.Boolean.md)
  - : Indicates if the folder is set online or
      offline. Initially, all folders are set online.


    **Returns:**
    - true if the folder is online, false otherwise.


---

### isRoot()
- isRoot(): [Boolean](TopLevel.Boolean.md)
  - : Indicates if this is the root folder.

    **Returns:**
    - true if this is the root folder, false otherwise.


---

<!-- prettier-ignore-end -->
