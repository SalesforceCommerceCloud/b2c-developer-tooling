<!-- prettier-ignore-start -->
# Class Content

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.content.Content](dw.content.Content.md)

Class representing a Content asset in Commerce Cloud Digital.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the content asset. |
| [classificationFolder](#classificationfolder): [Folder](dw.content.Folder.md) `(read-only)` | Returns the Folder associated with this Content. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the description in the current locale or null. |
| [folders](#folders): [Collection](dw.util.Collection.md) `(read-only)` | Returns all folders to which this content is assigned. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the content asset. |
| [online](#online): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the online status of the content. |
| [onlineFlag](#onlineflag): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the online status flag of the content. |
| [page](#page): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns if the content is a [Page](dw.experience.Page.md) or not. |
| [pageDescription](#pagedescription): [String](TopLevel.String.md) `(read-only)` | Returns the page description for the content in the current locale  or null if there is no page description. |
| [pageKeywords](#pagekeywords): [String](TopLevel.String.md) `(read-only)` | Returns the page keywords for the content in the current locale  or null if there is no page title. |
| [pageMetaTags](#pagemetatags): [Array](TopLevel.Array.md) `(read-only)` | Returns all page meta tags, defined for this instance for which content can be generated. |
| [pageTitle](#pagetitle): [String](TopLevel.String.md) `(read-only)` | Returns the page title for the content in the current locale  or null if there is no page title. |
| [pageURL](#pageurl): [String](TopLevel.String.md) `(read-only)` | Returns the page URL for the content in the current locale  or null if there is no page URL. |
| [searchable](#searchable): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the search status of the content. |
| [searchableFlag](#searchableflag): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the online status flag of the content. |
| [siteMapChangeFrequency](#sitemapchangefrequency): [String](TopLevel.String.md) `(read-only)` | Returns the contents change frequency needed for the sitemap creation. |
| [siteMapIncluded](#sitemapincluded): [Number](TopLevel.Number.md) `(read-only)` | Returns the status if the content is included into the sitemap. |
| [siteMapPriority](#sitemappriority): [Number](TopLevel.Number.md) `(read-only)` | Returns the contents priority needed for the sitemap creation. |
| [template](#template): [String](TopLevel.String.md) `(read-only)` | Returns the value of attribute 'template'. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getClassificationFolder](dw.content.Content.md#getclassificationfolder)() | Returns the Folder associated with this Content. |
| [getDescription](dw.content.Content.md#getdescription)() | Returns the description in the current locale or null. |
| [getFolders](dw.content.Content.md#getfolders)() | Returns all folders to which this content is assigned. |
| [getID](dw.content.Content.md#getid)() | Returns the ID of the content asset. |
| [getName](dw.content.Content.md#getname)() | Returns the name of the content asset. |
| [getOnlineFlag](dw.content.Content.md#getonlineflag)() | Returns the online status flag of the content. |
| [getPageDescription](dw.content.Content.md#getpagedescription)() | Returns the page description for the content in the current locale  or null if there is no page description. |
| [getPageKeywords](dw.content.Content.md#getpagekeywords)() | Returns the page keywords for the content in the current locale  or null if there is no page title. |
| [getPageMetaTag](dw.content.Content.md#getpagemetatagstring)([String](TopLevel.String.md)) | Returns the page meta tag for the specified id. |
| [getPageMetaTags](dw.content.Content.md#getpagemetatags)() | Returns all page meta tags, defined for this instance for which content can be generated. |
| [getPageTitle](dw.content.Content.md#getpagetitle)() | Returns the page title for the content in the current locale  or null if there is no page title. |
| [getPageURL](dw.content.Content.md#getpageurl)() | Returns the page URL for the content in the current locale  or null if there is no page URL. |
| [getSearchableFlag](dw.content.Content.md#getsearchableflag)() | Returns the online status flag of the content. |
| [getSiteMapChangeFrequency](dw.content.Content.md#getsitemapchangefrequency)() | Returns the contents change frequency needed for the sitemap creation. |
| [getSiteMapIncluded](dw.content.Content.md#getsitemapincluded)() | Returns the status if the content is included into the sitemap. |
| [getSiteMapPriority](dw.content.Content.md#getsitemappriority)() | Returns the contents priority needed for the sitemap creation. |
| [getTemplate](dw.content.Content.md#gettemplate)() | Returns the value of attribute 'template'. |
| [isOnline](dw.content.Content.md#isonline)() | Returns the online status of the content. |
| [isPage](dw.content.Content.md#ispage)() | Returns if the content is a [Page](dw.experience.Page.md) or not. |
| [isSearchable](dw.content.Content.md#issearchable)() | Returns the search status of the content. |
| [toPage](dw.content.Content.md#topage)() | Converts the content into the [Page](dw.experience.Page.md) representation if [isPage()](dw.content.Content.md#ispage) yields true. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the content asset.


---

### classificationFolder
- classificationFolder: [Folder](dw.content.Folder.md) `(read-only)`
  - : Returns the Folder associated with this Content. The folder is
      used to determine the classification of the content.



---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the description in the current locale or null.


---

### folders
- folders: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all folders to which this content is assigned.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the content asset.


---

### online
- online: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the online status of the content.


---

### onlineFlag
- onlineFlag: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the online status flag of the content.


---

### page
- page: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns if the content is a [Page](dw.experience.Page.md) or not.


---

### pageDescription
- pageDescription: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page description for the content in the current locale
      or null if there is no page description.



---

### pageKeywords
- pageKeywords: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page keywords for the content in the current locale
      or null if there is no page title.



---

### pageMetaTags
- pageMetaTags: [Array](TopLevel.Array.md) `(read-only)`
  - : Returns all page meta tags, defined for this instance for which content can be generated.
      
      
      The meta tag content is generated based on the content detail page meta tag context and rules.
      The rules are obtained from the current content or inherited from the default folder,
      up to the root folder.



---

### pageTitle
- pageTitle: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page title for the content in the current locale
      or null if there is no page title.



---

### pageURL
- pageURL: [String](TopLevel.String.md) `(read-only)`
  - : Returns the page URL for the content in the current locale
      or null if there is no page URL.



---

### searchable
- searchable: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the search status of the content.


---

### searchableFlag
- searchableFlag: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the online status flag of the content.


---

### siteMapChangeFrequency
- siteMapChangeFrequency: [String](TopLevel.String.md) `(read-only)`
  - : Returns the contents change frequency needed for the sitemap creation.


---

### siteMapIncluded
- siteMapIncluded: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the status if the content is included into the sitemap.


---

### siteMapPriority
- siteMapPriority: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the contents priority needed for the sitemap creation.
      If no priority is defined, the method returns 0.0.



---

### template
- template: [String](TopLevel.String.md) `(read-only)`
  - : Returns the value of attribute 'template'.


---

## Method Details

### getClassificationFolder()
- getClassificationFolder(): [Folder](dw.content.Folder.md)
  - : Returns the Folder associated with this Content. The folder is
      used to determine the classification of the content.


    **Returns:**
    - the classification Folder.


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the description in the current locale or null.

    **Returns:**
    - the description in the current locale or null.


---

### getFolders()
- getFolders(): [Collection](dw.util.Collection.md)
  - : Returns all folders to which this content is assigned.

    **Returns:**
    - Collection of Folder objects.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the content asset.

    **Returns:**
    - the ID of the content asset.


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the content asset.

    **Returns:**
    - the name of the content asset.


---

### getOnlineFlag()
- getOnlineFlag(): [Boolean](TopLevel.Boolean.md)
  - : Returns the online status flag of the content.

    **Returns:**
    - true if the content is online, false otherwise.


---

### getPageDescription()
- getPageDescription(): [String](TopLevel.String.md)
  - : Returns the page description for the content in the current locale
      or null if there is no page description.


    **Returns:**
    - the page description for the content in the current locale
      or null if there is no page description.



---

### getPageKeywords()
- getPageKeywords(): [String](TopLevel.String.md)
  - : Returns the page keywords for the content in the current locale
      or null if there is no page title.


    **Returns:**
    - the page keywords for the content in the current locale
      or null if there is no page title.



---

### getPageMetaTag(String)
- getPageMetaTag(id: [String](TopLevel.String.md)): [PageMetaTag](dw.web.PageMetaTag.md)
  - : Returns the page meta tag for the specified id.
      
      
      The meta tag content is generated based on the content detail page meta tag context and rule.
      The rule is obtained from the current content or inherited from the default folder,
      up to the root folder.
      
      
      Null will be returned if the meta tag is undefined on the current instance, or if no rule can be found for the
      current context, or if the rule resolves to an empty string.


    **Parameters:**
    - id - the ID to get the page meta tag for

    **Returns:**
    - page meta tag containing content generated based on rules


---

### getPageMetaTags()
- getPageMetaTags(): [Array](TopLevel.Array.md)
  - : Returns all page meta tags, defined for this instance for which content can be generated.
      
      
      The meta tag content is generated based on the content detail page meta tag context and rules.
      The rules are obtained from the current content or inherited from the default folder,
      up to the root folder.


    **Returns:**
    - page meta tags defined for this instance, containing content generated based on rules


---

### getPageTitle()
- getPageTitle(): [String](TopLevel.String.md)
  - : Returns the page title for the content in the current locale
      or null if there is no page title.


    **Returns:**
    - the page title for the content in the current locale
      or null if there is no page title.



---

### getPageURL()
- getPageURL(): [String](TopLevel.String.md)
  - : Returns the page URL for the content in the current locale
      or null if there is no page URL.


    **Returns:**
    - the page URL for the content in the current locale
      or null if there is no page URL.



---

### getSearchableFlag()
- getSearchableFlag(): [Boolean](TopLevel.Boolean.md)
  - : Returns the online status flag of the content.

    **Returns:**
    - true if the content is searchable, false otherwise.


---

### getSiteMapChangeFrequency()
- getSiteMapChangeFrequency(): [String](TopLevel.String.md)
  - : Returns the contents change frequency needed for the sitemap creation.

    **Returns:**
    - The contents sitemap change frequency.


---

### getSiteMapIncluded()
- getSiteMapIncluded(): [Number](TopLevel.Number.md)
  - : Returns the status if the content is included into the sitemap.

    **Returns:**
    - the value of the attribute 'siteMapIncluded'


---

### getSiteMapPriority()
- getSiteMapPriority(): [Number](TopLevel.Number.md)
  - : Returns the contents priority needed for the sitemap creation.
      If no priority is defined, the method returns 0.0.


    **Returns:**
    - The contents sitemap priority.


---

### getTemplate()
- getTemplate(): [String](TopLevel.String.md)
  - : Returns the value of attribute 'template'.

    **Returns:**
    - the value of the attribute 'template'


---

### isOnline()
- isOnline(): [Boolean](TopLevel.Boolean.md)
  - : Returns the online status of the content.

    **Returns:**
    - true if the content is online, false otherwise.


---

### isPage()
- isPage(): [Boolean](TopLevel.Boolean.md)
  - : Returns if the content is a [Page](dw.experience.Page.md) or not.

    **Returns:**
    - true if the content is a [Page](dw.experience.Page.md), false otherwise.


---

### isSearchable()
- isSearchable(): [Boolean](TopLevel.Boolean.md)
  - : Returns the search status of the content.

    **Returns:**
    - true if the content is searchable, false otherwise.


---

### toPage()
- toPage(): [Page](dw.experience.Page.md)
  - : Converts the content into the [Page](dw.experience.Page.md) representation if [isPage()](dw.content.Content.md#ispage) yields true.

    **Returns:**
    - the [Page](dw.experience.Page.md) representation of the content if it is a page, `null` otherwise.

    **See Also:**
    - [PageMgr.getPage(String)](dw.experience.PageMgr.md#getpagestring)


---

<!-- prettier-ignore-end -->
